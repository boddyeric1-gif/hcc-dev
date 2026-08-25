import { Building2 } from "lucide-react";

import { Panel } from "./ui";
import { audio } from "@/lib/hcc/audio";
import { getTelegramWebApp } from "@/hooks/useTelegram";
import { HCC_CHANNEL_HANDLE, HCC_CHANNEL_URL } from "@/lib/telegram/channel";

/**
 * Single in-app entry point to the official H.C.C. INC. channel. Uses the
 * Telegram native link opener when available and degrades to a plain anchor
 * (with the handle shown) everywhere else.
 */
export default function OfficialChannel() {
  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    audio.sfx("tab");
    const app = getTelegramWebApp();
    if (app?.openTelegramLink) {
      e.preventDefault();
      try {
        app.openTelegramLink(HCC_CHANNEL_URL);
      } catch {
        window.open(HCC_CHANNEL_URL, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <Panel label="OFFICIAL CHANNEL" className="p-3">
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 size-5 shrink-0 text-hud-cyan" strokeWidth={1.6} />
        <div className="min-w-0">
          <h3 className="font-display text-sm tracking-[0.2em] text-hud-cyan">H.C.C. INC.</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Announcements, game updates, development news and events from H.C.C. INC. —
            Hunting Cyber Criminals.
          </p>
          <a
            href={HCC_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={open}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-hud-cyan/50 bg-hud-cyan/10 px-3 py-1.5 text-[11px] tracking-[0.18em] text-hud-cyan transition-colors hover:bg-hud-cyan/20"
          >
            🏢 JOIN H.C.C. INC.
          </a>
          <p className="mt-2 text-[10px] tracking-[0.16em] text-muted-foreground">{HCC_CHANNEL_HANDLE}</p>
        </div>
      </div>
    </Panel>
  );
}
