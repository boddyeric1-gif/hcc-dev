ALTER TABLE public.star_purchases
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'credits',
  ADD COLUMN IF NOT EXISTS item_ids text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sub_days integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS star_purchases_charge_uidx
  ON public.star_purchases (telegram_payment_charge_id);

CREATE INDEX IF NOT EXISTS star_purchases_user_unclaimed_idx
  ON public.star_purchases (telegram_user_id) WHERE claimed_at IS NULL;

CREATE TABLE IF NOT EXISTS public.premium_pass (
  telegram_user_id bigint PRIMARY KEY,
  expires_at timestamp with time zone NOT NULL,
  last_claim_on date,
  total_days_purchased integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.premium_pass TO service_role;
ALTER TABLE public.premium_pass ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.hcc_grant_premium(_user_id bigint, _days integer)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _expires timestamp with time zone;
BEGIN
  INSERT INTO public.premium_pass (telegram_user_id, expires_at, total_days_purchased)
  VALUES (_user_id, now() + make_interval(days => _days), _days)
  ON CONFLICT (telegram_user_id) DO UPDATE
    SET expires_at = GREATEST(public.premium_pass.expires_at, now()) + make_interval(days => _days),
        total_days_purchased = public.premium_pass.total_days_purchased + _days,
        updated_at = now()
  RETURNING expires_at INTO _expires;
  RETURN _expires;
END;
$$;

REVOKE ALL ON FUNCTION public.hcc_grant_premium(bigint, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.hcc_claim_daily(_user_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows integer := 0;
BEGIN
  UPDATE public.premium_pass
     SET last_claim_on = (now() AT TIME ZONE 'UTC')::date,
         updated_at = now()
   WHERE telegram_user_id = _user_id
     AND expires_at > now()
     AND (last_claim_on IS NULL OR last_claim_on < (now() AT TIME ZONE 'UTC')::date);
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.hcc_claim_daily(bigint) FROM PUBLIC, anon, authenticated;