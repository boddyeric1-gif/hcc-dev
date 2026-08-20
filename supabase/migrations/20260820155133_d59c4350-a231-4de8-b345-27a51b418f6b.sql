CREATE TABLE public.star_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_payment_charge_id text NOT NULL UNIQUE,
  provider_payment_charge_id text,
  telegram_user_id bigint NOT NULL,
  product_id text NOT NULL,
  stars integer NOT NULL,
  credits integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz
);

CREATE INDEX idx_star_purchases_user_unclaimed ON public.star_purchases (telegram_user_id) WHERE claimed_at IS NULL;

GRANT ALL ON public.star_purchases TO service_role;

ALTER TABLE public.star_purchases ENABLE ROW LEVEL SECURITY;