import { describe, expect, it } from "vitest";

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
