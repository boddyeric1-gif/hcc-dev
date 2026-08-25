-- ============ analytics: players ============
CREATE TABLE public.hcc_player (
  telegram_user_id bigint PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  total_sessions integer NOT NULL DEFAULT 0,
  platform text NOT NULL DEFAULT 'telegram',
  app_version text,
  acquisition_source text,
  acquisition_campaign text,
  acquisition_creative text,
  acquisition_at timestamptz,
  referred_by_player_id bigint,
  rank_index integer NOT NULL DEFAULT 0,
  prestige integer NOT NULL DEFAULT 0,
  rig_tier integer NOT NULL DEFAULT 1,
  miner_tier integer NOT NULL DEFAULT 1,
  op_slots integer NOT NULL DEFAULT 1,
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  total_stars_spent bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hcc_player TO service_role;
ALTER TABLE public.hcc_player ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hcc_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint,
  anon_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  platform text NOT NULL DEFAULT 'telegram',
  app_version text,
  source text
);
GRANT ALL ON public.hcc_session TO service_role;
ALTER TABLE public.hcc_session ENABLE ROW LEVEL SECURITY;
CREATE INDEX hcc_session_user_started_idx ON public.hcc_session (telegram_user_id, started_at DESC);
CREATE INDEX hcc_session_started_idx ON public.hcc_session (started_at DESC);

CREATE TABLE public.hcc_event (
  id bigserial PRIMARY KEY,
  telegram_user_id bigint,
  session_id uuid,
  name text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  platform text NOT NULL DEFAULT 'telegram',
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hcc_event TO service_role;
ALTER TABLE public.hcc_event ENABLE ROW LEVEL SECURITY;
CREATE INDEX hcc_event_user_created_idx ON public.hcc_event (telegram_user_id, created_at DESC);
CREATE INDEX hcc_event_name_created_idx ON public.hcc_event (name, created_at DESC);

CREATE TABLE public.hcc_progression_milestone (
  telegram_user_id bigint NOT NULL,
  milestone text NOT NULL,
  reached_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (telegram_user_id, milestone)
);
GRANT ALL ON public.hcc_progression_milestone TO service_role;
ALTER TABLE public.hcc_progression_milestone ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER hcc_player_touch BEFORE UPDATE ON public.hcc_player
  FOR EACH ROW EXECUTE FUNCTION public.hcc_touch_updated_at();

-- ============ functions ============
-- Opens a session and upserts the player. Acquisition fields are first-touch:
-- they are only written while still null, so a later organic open never
-- overwrites the ad that originally brought the player in.
CREATE OR REPLACE FUNCTION public.hcc_start_session(
  _user_id bigint,
  _anon_id text,
  _platform text,
  _app_version text,
  _source text,
  _campaign text,
  _creative text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _session_id uuid;
BEGIN
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.hcc_player AS p (
      telegram_user_id, platform, app_version, total_sessions,
      acquisition_source, acquisition_campaign, acquisition_creative, acquisition_at)
    VALUES (
      _user_id, COALESCE(_platform, 'telegram'), _app_version, 1,
      _source, _campaign, _creative, CASE WHEN _source IS NULL THEN NULL ELSE now() END)
    ON CONFLICT (telegram_user_id) DO UPDATE SET
      last_seen_at = now(),
      total_sessions = p.total_sessions + 1,
      platform = COALESCE(EXCLUDED.platform, p.platform),
      app_version = COALESCE(EXCLUDED.app_version, p.app_version),
      acquisition_source = COALESCE(p.acquisition_source, EXCLUDED.acquisition_source),
      acquisition_campaign = COALESCE(p.acquisition_campaign, EXCLUDED.acquisition_campaign),
      acquisition_creative = COALESCE(p.acquisition_creative, EXCLUDED.acquisition_creative),
      acquisition_at = COALESCE(p.acquisition_at,
        CASE WHEN EXCLUDED.acquisition_source IS NULL THEN NULL ELSE now() END);
  END IF;

  INSERT INTO public.hcc_session (telegram_user_id, anon_id, platform, app_version, source)
  VALUES (_user_id, _anon_id, COALESCE(_platform, 'telegram'), _app_version, _source)
  RETURNING id INTO _session_id;

  RETURN _session_id;
END; $$;

CREATE OR REPLACE FUNCTION public.hcc_end_session(_session_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  UPDATE public.hcc_session SET ended_at = now()
   WHERE id = _session_id AND ended_at IS NULL;
$$;

-- Bulk insert of already-validated events. Cannot touch the wallet or ledger.
CREATE OR REPLACE FUNCTION public.hcc_record_events(
  _user_id bigint,
  _session_id uuid,
  _platform text,
  _app_version text,
  _events jsonb
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _count integer := 0;
BEGIN
  INSERT INTO public.hcc_event (telegram_user_id, session_id, name, props, platform, app_version, created_at)
  SELECT _user_id,
         _session_id,
         e->>'name',
         COALESCE(e->'props', '{}'::jsonb),
         COALESCE(_platform, 'telegram'),
         _app_version,
         COALESCE(to_timestamp((e->>'at')::double precision / 1000), now())
    FROM jsonb_array_elements(COALESCE(_events, '[]'::jsonb)) AS e
   WHERE e->>'name' IS NOT NULL;
  GET DIAGNOSTICS _count = ROW_COUNT;

  IF _user_id IS NOT NULL THEN
    UPDATE public.hcc_player SET last_seen_at = now() WHERE telegram_user_id = _user_id;
  END IF;
  RETURN _count;
END; $$;

CREATE OR REPLACE FUNCTION public.hcc_mark_milestone(_user_id bigint, _milestone text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _rows integer := 0;
BEGIN
  INSERT INTO public.hcc_progression_milestone (telegram_user_id, milestone)
  VALUES (_user_id, _milestone)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END; $$;

-- Cached progression snapshot. Observation only: never writes credits.
CREATE OR REPLACE FUNCTION public.hcc_sync_player_progress(
  _user_id bigint,
  _rank_index integer,
  _prestige integer,
  _rig_tier integer,
  _miner_tier integer,
  _op_slots integer
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.hcc_player SET
    rank_index = GREATEST(rank_index, COALESCE(_rank_index, 0)),
    prestige = GREATEST(prestige, COALESCE(_prestige, 0)),
    rig_tier = GREATEST(rig_tier, COALESCE(_rig_tier, 1)),
    miner_tier = GREATEST(miner_tier, COALESCE(_miner_tier, 1)),
    op_slots = GREATEST(op_slots, COALESCE(_op_slots, 1)),
    last_seen_at = now()
  WHERE telegram_user_id = _user_id;
END; $$;

-- Mirrors authoritative purchase records onto the player row (money still lives
-- in star_purchases; this is a denormalised read convenience only).
CREATE OR REPLACE FUNCTION public.hcc_sync_player_purchases(_user_id bigint)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.hcc_player p SET
    total_stars_spent = agg.total_stars,
    first_purchase_at = agg.first_at,
    last_purchase_at = agg.last_at
  FROM (
    SELECT COALESCE(SUM(stars), 0) AS total_stars, MIN(created_at) AS first_at, MAX(created_at) AS last_at
      FROM public.star_purchases WHERE telegram_user_id = _user_id
  ) agg
  WHERE p.telegram_user_id = _user_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.hcc_start_session(bigint, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_end_session(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_record_events(bigint, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_mark_milestone(bigint, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_sync_player_progress(bigint, integer, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hcc_sync_player_purchases(bigint) FROM PUBLIC, anon, authenticated;

-- ============ reporting views (service_role only) ============
CREATE VIEW public.hcc_metrics_daily AS
SELECT (s.started_at AT TIME ZONE 'UTC')::date AS day,
       COUNT(DISTINCT s.telegram_user_id) AS active_players,
       COUNT(*) AS sessions
  FROM public.hcc_session s
 GROUP BY 1;

CREATE VIEW public.hcc_metrics_funnel AS
SELECT e.name AS step,
       COUNT(DISTINCT e.telegram_user_id) AS players,
       COUNT(*) AS events
  FROM public.hcc_event e
 GROUP BY 1;

CREATE VIEW public.hcc_metrics_retention AS
WITH cohort AS (
  SELECT telegram_user_id,
         (COALESCE(acquisition_at, first_seen_at) AT TIME ZONE 'UTC')::date AS cohort_day
    FROM public.hcc_player
), active AS (
  SELECT DISTINCT telegram_user_id, (started_at AT TIME ZONE 'UTC')::date AS day
    FROM public.hcc_session WHERE telegram_user_id IS NOT NULL
)
SELECT c.cohort_day,
       COUNT(DISTINCT c.telegram_user_id) AS cohort_size,
       COUNT(DISTINCT a.telegram_user_id) FILTER (WHERE a.day = c.cohort_day + 1) AS d1,
       COUNT(DISTINCT a.telegram_user_id) FILTER (WHERE a.day = c.cohort_day + 3) AS d3,
       COUNT(DISTINCT a.telegram_user_id) FILTER (WHERE a.day = c.cohort_day + 7) AS d7,
       COUNT(DISTINCT a.telegram_user_id) FILTER (WHERE a.day = c.cohort_day + 14) AS d14,
       COUNT(DISTINCT a.telegram_user_id) FILTER (WHERE a.day = c.cohort_day + 30) AS d30
  FROM cohort c
  LEFT JOIN active a ON a.telegram_user_id = c.telegram_user_id
 GROUP BY c.cohort_day;

-- Revenue is derived from the authoritative payment table, never from events.
CREATE VIEW public.hcc_metrics_revenue AS
SELECT product_id,
       kind,
       COUNT(*) AS transactions,
       COUNT(DISTINCT telegram_user_id) AS paying_players,
       SUM(stars) AS total_stars
  FROM public.star_purchases
 GROUP BY product_id, kind;

GRANT SELECT ON public.hcc_metrics_daily TO service_role;
GRANT SELECT ON public.hcc_metrics_funnel TO service_role;
GRANT SELECT ON public.hcc_metrics_retention TO service_role;
GRANT SELECT ON public.hcc_metrics_revenue TO service_role;