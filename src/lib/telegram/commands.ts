import type { TabId } from "@/lib/hcc/types";

export type BotCommand =
  | "start"
  | "play"
  | "help"
  | "profile"
  | "stats"
  | "shop"
  | "cases"
  | "targets"
  | "inventory"
  | "mining"
  | "paysupport";

export type CommandSpec = {
  readonly command: BotCommand;
  /** short description shown in the Telegram command menu */
  readonly description: string;
  /** H.C.C tab the Mini App should open on */
  readonly tab: TabId;
  /** chat copy sent alongside the launch button */
  readonly text: string;
  /** label of the web_app button */
  readonly button: string;
  /** when true the bot replies with text only — no Mini App launch button */
  readonly replyOnly?: boolean;
};

export const COMMANDS: readonly CommandSpec[] = [
  {
    command: "start",
    description: "Launch H.C.C — Hunting Cyber Criminals",
    tab: "command",
    text: "H.C.C online. Hunt cyber criminals, build your rig, run the farm.\n\nTap below to open the console.",
    button: "Launch H.C.C",
  },
  {
    command: "play",
    description: "Open the H.C.C console",
    tab: "command",
    text: "Console standing by, operator.",
    button: "Play H.C.C",
  },
  {
    command: "help",
    description: "Open the field manual",
    tab: "guide",
    text: "The field manual explains every tool, the heat system, mining and the shop.",
    button: "Open field manual",
  },
  {
    command: "profile",
    description: "View your operator profile",
    tab: "command",
    text: "Your operator profile — rank, credits and trace heat — lives on the command deck.",
    button: "Open profile",
  },
  {
    command: "stats",
    description: "View rig and takedown stats",
    tab: "command",
    text: "Takedowns, intel and rig telemetry are on the command deck.",
    button: "Open stats",
  },
  {
    command: "shop",
    description: "Browse hardware and upgrades",
    tab: "shop",
    text: "Hardware, tools, perks and mining parts are in stock.",
    button: "Open shop",
  },
  {
    command: "cases",
    description: "Review your case files",
    tab: "case",
    text: "Evidence collected so far is filed in your case folder.",
    button: "Open case files",
  },
  {
    command: "targets",
    description: "See active criminal targets",
    tab: "targets",
    text: "Active dossiers are waiting for a hunter.",
    button: "Open targets",
  },
  {
    command: "inventory",
    description: "Inspect your rig loadout",
    tab: "rig",
    text: "Your installed loadout is rendered on the rig deck.",
    button: "Open rig",
  },
  {
    command: "mining",
    description: "Manage your mining farm",
    tab: "mining",
    text: "Farm status: hash rate, power draw and coin allocation.",
    button: "Open mining farm",
  },
  {
    command: "paysupport",
    description: "Help with Telegram Stars purchases",
    tab: "shop",
    text:
      "H.C.C payment support\n\n" +
      "Telegram Stars purchases are digital in-game items credited to your H.C.C operator automatically, usually within a few seconds of payment.\n\n" +
      "If credits did not arrive:\n" +
      "1. Reopen the Mini App — pending purchases are applied on launch.\n" +
      "2. Make sure you are opening H.C.C from the same Telegram account that paid.\n" +
      "3. Still missing after a few minutes? Reply here with the date and the item, and we will review the charge.\n\n" +
      "Refunds for Stars are handled by Telegram support (Settings → My Stars). Purchased in-game items are consumable and non-transferable.",
    button: "Open shop",
    replyOnly: true,
  },
];

const BY_NAME = new Map(COMMANDS.map((c) => [c.command, c]));

/** Extracts a supported command from raw message text, tolerating /cmd@BotName and args. */
export function parseCommand(text: string | undefined | null): CommandSpec | null {
  if (!text) return null;
  const first = text.trim().split(/\s+/)[0] ?? "";
  if (!first.startsWith("/")) return null;
  const name = first.slice(1).split("@")[0]?.toLowerCase() ?? "";
  return BY_NAME.get(name as BotCommand) ?? null;
}

export function miniAppUrl(baseUrl: string, tab: TabId): string {
  const url = new URL(baseUrl);
  url.searchParams.set("tab", tab);
  return url.toString();
}

export const UNKNOWN_COMMAND_TEXT =
  "Unknown command. Try /play, /help, /shop, /targets, /cases, /inventory, /mining or /paysupport.";
