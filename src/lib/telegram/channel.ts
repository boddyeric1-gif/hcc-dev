/**
 * Single source of truth for the official H.C.C. INC. Telegram channel so the
 * bot, the command menu and the Mini App all point at the same destination.
 */
export const HCC_CHANNEL_HANDLE = "@HCCinc";
export const HCC_CHANNEL_URL = "https://t.me/HCCinc";
export const HCC_CHANNEL_BUTTON = "🏢 JOIN H.C.C. INC.";
export const HCC_CHANNEL_SHORT_BUTTON = "🏢 H.C.C. INC.";

export const HCC_CHANNEL_TEXT =
  "🏢 H.C.C. INC. — Hunting Cyber Criminals\n\n" +
  "Welcome to the official H.C.C. INC. channel.\n\n" +
  "Get:\n" +
  "• Official H.C.C. announcements\n" +
  "• Game updates\n" +
  "• Development news\n" +
  "• Events and community activity\n" +
  "• Important notices\n\n" +
  `If the button does not open, search for ${HCC_CHANNEL_HANDLE} in Telegram.`;

/** Button descriptor used by the bot's inline keyboards. */
export const HCC_CHANNEL_LINK = { text: HCC_CHANNEL_BUTTON, url: HCC_CHANNEL_URL } as const;
