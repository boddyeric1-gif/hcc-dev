import { describe, expect, it } from "vitest";

import { HCC_CHANNEL_URL } from "./channel";
import { COMMANDS, miniAppUrl, parseCommand } from "./commands";

describe("parseCommand", () => {
  it("parses a plain command", () => {
    expect(parseCommand("/shop")?.tab).toBe("shop");
  });
  it("parses a command addressed to the bot with args", () => {
    expect(parseCommand("/Mining@HccBot now")?.tab).toBe("mining");
  });
  it("ignores non-commands and unknown commands", () => {
    expect(parseCommand("hello")).toBeNull();
    expect(parseCommand("/nope")).toBeNull();
    expect(parseCommand(undefined)).toBeNull();
  });
  it("covers every advertised command", () => {
    COMMANDS.forEach((c) => expect(parseCommand(`/${c.command}`)).toBe(c));
  });
});

describe("miniAppUrl", () => {
  it("appends the tab param", () => {
    expect(miniAppUrl("https://hcc-dev.lovable.app/", "case")).toBe(
      "https://hcc-dev.lovable.app/?tab=case",
    );
  });
});

describe("official channel wiring", () => {
  it("exposes /community as a reply-only command with a channel button", () => {
    const spec = parseCommand("/community");
    expect(spec?.replyOnly).toBe(true);
    expect(spec?.link?.url).toBe(HCC_CHANNEL_URL);
    expect(spec?.text).toContain("H.C.C. INC.");
  });

  it("offers the channel from /start without replacing the launch button", () => {
    const spec = parseCommand("/start");
    expect(spec?.replyOnly).toBeUndefined();
    expect(spec?.button).toBe("Launch H.C.C");
    expect(spec?.link?.url).toBe(HCC_CHANNEL_URL);
  });

  it("links the channel from exactly two commands", () => {
    const linked = COMMANDS.filter((c) => c.link?.url === HCC_CHANNEL_URL).map((c) => c.command);
    expect(linked).toEqual(["start", "community"]);
  });
});
