import { describe, expect, it, vi, beforeAll } from "vitest";
process.env["TELEGRAM_BOT_TOKEN"] = "123:TESTTOKEN";
import { Route } from "@/routes/api/public/telegram/webhook";
import { deriveWebhookSecret } from "@/lib/telegram/bot.server";

const handler = (Route.options as any).server.handlers.POST;
const post = (headers: Record<string,string>, body: unknown) =>
  handler({ request: new Request("http://x/api/public/telegram/webhook", { method: "POST", headers, body: JSON.stringify(body) }) });

describe("webhook", () => {
  beforeAll(() => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, result: {} }), { status: 200 })) as any;
  });
  it("rejects bad secret", async () => {
    expect((await post({ "X-Telegram-Bot-Api-Secret-Token": "bad" }, {})).status).toBe(401);
  });
  it("answers /shop with a web_app button", async () => {
    const res = await post({ "X-Telegram-Bot-Api-Secret-Token": deriveWebhookSecret("123:TESTTOKEN") },
      { update_id: 1, message: { text: "/shop", chat: { id: 42, type: "private" } } });
    expect(res.status).toBe(200);
    const call = (global.fetch as any).mock.calls.at(-1);
    const body = JSON.parse(call[1].body);
    expect(call[0]).toContain("/sendMessage");
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toContain("tab=shop");
  });
});
