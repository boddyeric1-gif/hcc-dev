import { useEffect, useState } from "react";

export interface TelegramUser {
  readonly id: number;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly username?: string;
  readonly photo_url?: string;
}

export interface TelegramMainButton {
  show: () => void;
  hide: () => void;
  setText: (text: string) => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  MainButton: TelegramMainButton;
  initDataUnsafe?: { user?: TelegramUser; start_param?: string };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const init = () => {
      const app = getTelegramWebApp();
      if (app) {
        app.ready();
        app.expand();
        if (!cancelled) setWebApp(app);
        return;
      }
      // the SDK script may still be loading on first paint
      if (tries++ < 20) window.setTimeout(init, 150);
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    webApp,
    isTelegram: webApp !== null,
    user: webApp?.initDataUnsafe?.user ?? null,
    MainButton: webApp?.MainButton ?? null,
  };
}
