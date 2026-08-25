import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";

import { useTelegram } from "@/hooks/useTelegram";
import { beginSession, finishSession, recordAnalyticsEvents } from "./analytics.functions";
import { parseAttribution, readStartParam, type Attribution } from "./attribution";
import type { AnalyticsEvent, EventName, EventProps } from "./events";
import { APP_VERSION, clientPlatform } from "./version";

const FLUSH_MS = 5000;
const FLUSH_AT = 20;
const MAX_QUEUE = 100;
const ANON_KEY = "hcc.anon.v1";

/** View-type events are noisy; each is stored at most once per session. */
const DEDUPED: ReadonlySet<EventName> = new Set<EventName>([
  "shop_item_viewed",
  "upgrade_viewed",
  "stars_product_viewed",
  "tab_viewed",
]);

export type Tracker = (name: EventName, props?: EventProps) => void;

const AnalyticsContext = createContext<Tracker>(() => {});

function anonId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(ANON_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, fresh);
    return fresh;
  } catch {
    return "anon";
  }
}

/**
 * Fire-and-forget event queue. Nothing in the game ever awaits analytics: a
 * total outage costs at most a dropped batch and is invisible to the player.
 */
export function AnalyticsProvider({
  children,
  reservedStartParams,
}: {
  children: ReactNode;
  reservedStartParams?: ReadonlySet<string>;
}) {
  const { initData } = useTelegram();
  const initRef = useRef(initData);
  initRef.current = initData;

  const begin = useServerFn(beginSession);
  const finish = useServerFn(finishSession);
  const send = useServerFn(recordAnalyticsEvents);

  const queue = useRef<AnalyticsEvent[]>([]);
  const sessionId = useRef<string | null>(null);
  const seen = useRef(new Set<string>());
  const flushing = useRef(false);

  const flush = useCallback(async () => {
    if (flushing.current || queue.current.length === 0) return;
    const batch = queue.current;
    queue.current = [];
    flushing.current = true;
    try {
      await send({
        data: {
          initData: initRef.current,
          sessionId: sessionId.current,
          platform: clientPlatform(),
          appVersion: APP_VERSION,
          events: batch,
        },
      });
    } catch {
      // one retry, then the batch is dropped on purpose
      if (queue.current.length + batch.length <= MAX_QUEUE) queue.current = [...batch, ...queue.current];
    } finally {
      flushing.current = false;
    }
  }, [send]);

  const track = useCallback<Tracker>((name, props = {}) => {
    try {
      if (DEDUPED.has(name)) {
        const key = `${name}:${String(props["id"] ?? props["tab"] ?? props["product_id"] ?? "")}`;
        if (seen.current.has(key)) return;
        seen.current.add(key);
      }
      if (queue.current.length >= MAX_QUEUE) return;
      queue.current.push({ name, props, at: Date.now() });
    } catch {
      /* analytics must never throw into gameplay */
    }
  }, []);

  // open the session (and capture first-touch attribution) once per mount
  useEffect(() => {
    let cancelled = false;
    const attribution: Attribution = parseAttribution(readStartParam(), reservedStartParams);
    void begin({
      data: {
        initData: initData || undefined,
        anonId: anonId(),
        platform: clientPlatform(),
        appVersion: APP_VERSION,
        ...attribution,
      },
    })
      .then((res) => {
        if (cancelled) return;
        sessionId.current = res.sessionId;
        track("session_started", attribution.source ? { source: attribution.source } : {});
        track("app_opened", {});
      })
      .catch(() => {
        /* offline or blocked: keep playing */
      });
    return () => {
      cancelled = true;
    };
  }, [begin, initData, reservedStartParams, track]);

  // periodic + threshold flush
  useEffect(() => {
    const id = window.setInterval(() => {
      if (queue.current.length > 0) void flush();
    }, FLUSH_MS);
    return () => window.clearInterval(id);
  }, [flush]);

  useEffect(() => {
    const check = window.setInterval(() => {
      if (queue.current.length >= FLUSH_AT) void flush();
    }, 500);
    return () => window.clearInterval(check);
  }, [flush]);

  // last chance to persist on close
  useEffect(() => {
    const onHide = () => {
      track("session_ended", {});
      void flush().then(() => {
        if (sessionId.current) void finish({ data: { sessionId: sessionId.current } }).catch(() => {});
      });
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [finish, flush, track]);

  const value = useMemo(() => track, [track]);
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): Tracker {
  return useContext(AnalyticsContext);
}
