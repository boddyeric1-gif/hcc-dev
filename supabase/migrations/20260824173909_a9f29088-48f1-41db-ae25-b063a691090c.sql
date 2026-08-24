ALTER TABLE public.hcc_profile
  ADD COLUMN IF NOT EXISTS mining_allowance numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.hcc_settle_mining(
  _user_id bigint,
  _rate_per_sec numeric,
  _max_seconds integer,
  _claimed_credits bigint,
  _idempotency_key text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _profile public.hcc_profile%ROWTYPE;
  _elapsed numeric;
  _allowance numeric;
  _granted bigint;
  _result jsonb;
BEGIN
  PERFORM public.hcc_ensure_account(_user_id);
  SELECT * INTO _profile FROM public.hcc_profile
    WHERE telegram_user_id = _user_id FOR UPDATE;

  _elapsed := LEAST(GREATEST(extract(epoch from (now() - _profile.last_settled_at)), 0), _max_seconds);
  _allowance := _profile.mining_allowance + (GREATEST(_rate_per_sec, 0) * _elapsed);
  _granted := GREATEST(0, LEAST(COALESCE(_claimed_credits, 0), floor(_allowance)::bigint));

  UPDATE public.hcc_profile
     SET mining_allowance = GREATEST(_allowance - _granted, 0),
         last_settled_at = now()
   WHERE telegram_user_id = _user_id;

  IF _granted = 0 THEN
    RETURN jsonb_build_object('applied', false, 'granted', 0, 'allowance', _allowance,
      'clamped', COALESCE(_claimed_credits, 0) > 0,
      'balance', (SELECT balance FROM public.hcc_wallet WHERE telegram_user_id = _user_id));
  END IF;

  _result := public.hcc_apply(_user_id, _granted, 'mining_reward', 'Mining settlement',
    _idempotency_key, NULL,
    jsonb_build_object('claimed', COALESCE(_claimed_credits, 0), 'elapsed', _elapsed));

  RETURN _result || jsonb_build_object('granted', _granted,
    'clamped', COALESCE(_claimed_credits, 0) > _granted);
END; $$;

REVOKE EXECUTE ON FUNCTION public.hcc_settle_mining(bigint, numeric, integer, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hcc_settle_mining(bigint, numeric, integer, bigint, text) TO service_role;