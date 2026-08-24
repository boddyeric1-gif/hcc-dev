-- ============ wallet ============
CREATE TABLE public.hcc_wallet (
  telegram_user_id bigint PRIMARY KEY,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hcc_wallet TO service_role;
ALTER TABLE public.hcc_wallet ENABLE ROW LEVEL SECURITY;

-- ============ ledger ============
CREATE TABLE public.hcc_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint NOT NULL,
  amount bigint NOT NULL,
  tx_type text NOT NULL,
  reason text NOT NULL DEFAULT '',
  reference text,
  idempotency_key text UNIQUE,
  balance_after bigint NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hcc_ledger_user_created_idx ON public.hcc_ledger (telegram_user_id, created_at DESC);
GRANT ALL ON public.hcc_ledger TO service_role;
ALTER TABLE public.hcc_ledger ENABLE ROW LEVEL SECURITY;

-- ============ profile (server-owned entitlements + migration record) ============
CREATE TABLE public.hcc_profile (
  telegram_user_id bigint PRIMARY KEY,
  owned text[] NOT NULL DEFAULT '{}'::text[],
  installed jsonb NOT NULL DEFAULT '{}'::jsonb,
  miner_units jsonb NOT NULL DEFAULT '{}'::jsonb,
  contract text,
  prestige integer NOT NULL DEFAULT 0,
  last_settled_at timestamptz NOT NULL DEFAULT now(),
  migration_complete boolean NOT NULL DEFAULT false,
  migrated_at timestamptz,
  imported_balance bigint,
  migration_source text,
  migration_version integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hcc_profile TO service_role;
ALTER TABLE public.hcc_profile ENABLE ROW LEVEL SECURITY;

-- ============ shared timestamp trigger ============
CREATE OR REPLACE FUNCTION public.hcc_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER hcc_wallet_touch BEFORE UPDATE ON public.hcc_wallet
  FOR EACH ROW EXECUTE FUNCTION public.hcc_touch_updated_at();
CREATE TRIGGER hcc_profile_touch BEFORE UPDATE ON public.hcc_profile
  FOR EACH ROW EXECUTE FUNCTION public.hcc_touch_updated_at();

-- ============ ensure rows exist ============
CREATE OR REPLACE FUNCTION public.hcc_ensure_account(_user_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.hcc_wallet (telegram_user_id) VALUES (_user_id)
    ON CONFLICT (telegram_user_id) DO NOTHING;
  INSERT INTO public.hcc_profile (telegram_user_id) VALUES (_user_id)
    ON CONFLICT (telegram_user_id) DO NOTHING;
END; $$;

-- ============ atomic ledger apply ============
-- Positive amount credits, negative amount spends. Balance is locked for the
-- duration, so concurrent spends serialise and cannot overspend. A repeated
-- idempotency key returns the original outcome without moving any credits.
CREATE OR REPLACE FUNCTION public.hcc_apply(
  _user_id bigint,
  _amount bigint,
  _tx_type text,
  _reason text DEFAULT '',
  _idempotency_key text DEFAULT NULL,
  _reference text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _balance bigint;
  _existing public.hcc_ledger%ROWTYPE;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);

  IF _idempotency_key IS NOT NULL THEN
    SELECT * INTO _existing FROM public.hcc_ledger WHERE idempotency_key = _idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'applied', false, 'duplicate', true, 'amount', 0,
        'balance', _existing.balance_after, 'ledger_id', _existing.id);
    END IF;
  END IF;

  SELECT balance INTO _balance FROM public.hcc_wallet
    WHERE telegram_user_id = _user_id FOR UPDATE;

  IF _balance + _amount < 0 THEN
    RETURN jsonb_build_object(
      'applied', false, 'duplicate', false, 'reason', 'insufficient_funds',
      'amount', 0, 'balance', _balance);
  END IF;

  _balance := _balance + _amount;
  UPDATE public.hcc_wallet SET balance = _balance WHERE telegram_user_id = _user_id;

  INSERT INTO public.hcc_ledger
    (telegram_user_id, amount, tx_type, reason, reference, idempotency_key, balance_after, metadata)
  VALUES
    (_user_id, _amount, _tx_type, COALESCE(_reason, ''), _reference, _idempotency_key, _balance,
     COALESCE(_metadata, '{}'::jsonb))
  RETURNING * INTO _existing;

  RETURN jsonb_build_object(
    'applied', true, 'duplicate', false, 'amount', _amount,
    'balance', _balance, 'ledger_id', _existing.id);
EXCEPTION WHEN unique_violation THEN
  -- concurrent request with the same idempotency key won the race
  SELECT * INTO _existing FROM public.hcc_ledger WHERE idempotency_key = _idempotency_key;
  RETURN jsonb_build_object(
    'applied', false, 'duplicate', true, 'amount', 0,
    'balance', _existing.balance_after, 'ledger_id', _existing.id);
END; $$;

-- ============ atomic purchase: spend + entitlement in one transaction ============
CREATE OR REPLACE FUNCTION public.hcc_purchase(
  _user_id bigint,
  _item_id text,
  _price bigint,
  _stackable boolean,
  _slot text,
  _is_miner boolean,
  _is_contract boolean,
  _idempotency_key text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile public.hcc_profile%ROWTYPE;
  _result jsonb;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT * INTO _profile FROM public.hcc_profile
    WHERE telegram_user_id = _user_id FOR UPDATE;

  IF NOT _stackable AND _item_id = ANY(_profile.owned) THEN
    RETURN jsonb_build_object('applied', false, 'reason', 'already_owned',
      'balance', (SELECT balance FROM public.hcc_wallet WHERE telegram_user_id = _user_id));
  END IF;

  _result := public.hcc_apply(_user_id, -_price, 'purchase', _item_id, _idempotency_key, _item_id,
    jsonb_build_object('item_id', _item_id, 'price', _price));

  IF NOT (_result->>'applied')::boolean THEN
    RETURN _result;
  END IF;

  UPDATE public.hcc_profile SET
    owned = CASE WHEN _item_id = ANY(owned) THEN owned ELSE array_append(owned, _item_id) END,
    installed = CASE WHEN _slot IS NULL THEN installed
                     ELSE jsonb_set(installed, ARRAY[_slot], to_jsonb(_item_id), true) END,
    miner_units = CASE WHEN _is_miner THEN jsonb_set(miner_units, ARRAY[_item_id],
                         to_jsonb(COALESCE((miner_units->>_item_id)::int, 0) + 1), true)
                       ELSE miner_units END,
    contract = CASE WHEN _is_contract THEN _item_id ELSE contract END
  WHERE telegram_user_id = _user_id;

  RETURN _result || jsonb_build_object('item_id', _item_id);
END; $$;

-- ============ one-time legacy migration ============
-- Historical balances came from client-side storage and cannot be proven
-- legitimate, so the import is clamped and can only ever happen once.
CREATE OR REPLACE FUNCTION public.hcc_migrate_legacy(
  _user_id bigint,
  _claimed_balance bigint,
  _max_import bigint,
  _source text,
  _version integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile public.hcc_profile%ROWTYPE;
  _amount bigint;
  _result jsonb;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT * INTO _profile FROM public.hcc_profile
    WHERE telegram_user_id = _user_id FOR UPDATE;

  IF _profile.migration_complete THEN
    RETURN jsonb_build_object('migrated', false, 'already_migrated', true, 'imported', 0,
      'balance', (SELECT balance FROM public.hcc_wallet WHERE telegram_user_id = _user_id));
  END IF;

  _amount := GREATEST(0, LEAST(COALESCE(_claimed_balance, 0), _max_import));

  _result := public.hcc_apply(_user_id, _amount, 'legacy_migration',
    'One-time import of pre-ledger local balance',
    'legacy_migration:' || _user_id::text, NULL,
    jsonb_build_object('claimed', COALESCE(_claimed_balance, 0), 'clamped_to', _amount,
                       'source', _source, 'version', _version));

  UPDATE public.hcc_profile SET
    migration_complete = true,
    migrated_at = now(),
    imported_balance = _amount,
    migration_source = _source,
    migration_version = _version
  WHERE telegram_user_id = _user_id;

  RETURN jsonb_build_object('migrated', true, 'already_migrated', false,
    'imported', _amount, 'clamped', COALESCE(_claimed_balance, 0) > _amount,
    'balance', _result->'balance');
END; $$;

-- ============ read-only account snapshot ============
CREATE OR REPLACE FUNCTION public.hcc_account(_user_id bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile public.hcc_profile%ROWTYPE;
  _balance bigint;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT balance INTO _balance FROM public.hcc_wallet WHERE telegram_user_id = _user_id;
  SELECT * INTO _profile FROM public.hcc_profile WHERE telegram_user_id = _user_id;
  RETURN jsonb_build_object(
    'balance', _balance,
    'owned', to_jsonb(_profile.owned),
    'installed', _profile.installed,
    'minerUnits', _profile.miner_units,
    'contract', _profile.contract,
    'prestige', _profile.prestige,
    'lastSettledAt', extract(epoch from _profile.last_settled_at) * 1000,
    'migrationComplete', _profile.migration_complete,
    'now', extract(epoch from now()) * 1000
  );
END; $$;

-- ============ mining settlement window ============
-- Moves the settlement watermark forward atomically and reports the elapsed
-- window, so the same period can never be paid out twice.
CREATE OR REPLACE FUNCTION public.hcc_open_settlement(_user_id bigint, _max_seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _prev timestamptz;
  _elapsed double precision;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT last_settled_at INTO _prev FROM public.hcc_profile
    WHERE telegram_user_id = _user_id FOR UPDATE;
  _elapsed := LEAST(GREATEST(extract(epoch from (now() - _prev)), 0), _max_seconds);
  UPDATE public.hcc_profile SET last_settled_at = now() WHERE telegram_user_id = _user_id;
  RETURN jsonb_build_object('elapsedSeconds', _elapsed,
    'since', extract(epoch from _prev) * 1000,
    'now', extract(epoch from now()) * 1000);
END; $$;

-- ============ prestige (server-owned) ============
CREATE OR REPLACE FUNCTION public.hcc_set_prestige(_user_id bigint, _level integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cur integer;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT prestige INTO _cur FROM public.hcc_profile
    WHERE telegram_user_id = _user_id FOR UPDATE;
  IF _level > _cur THEN
    UPDATE public.hcc_profile SET prestige = _level WHERE telegram_user_id = _user_id;
    _cur := _level;
  END IF;
  RETURN _cur;
END; $$;

-- Only trusted server code (service role) may call these.
REVOKE EXECUTE ON FUNCTION public.hcc_apply(bigint, bigint, text, text, text, text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_purchase(bigint, text, bigint, boolean, text, boolean, boolean, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_migrate_legacy(bigint, bigint, bigint, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_account(bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_open_settlement(bigint, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_set_prestige(bigint, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_ensure_account(bigint) FROM anon, authenticated;