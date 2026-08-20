import { describe, expect, it, vi, beforeEach } from "vitest";
process.env["TELEGRAM_BOT_TOKEN"] = "123:TESTTOKEN";

import { Route } from "@/routes/api/public/telegram/webhook";
import { deriveWebhookSecret } from "@/lib/telegram/bot.server";
import { STAR_TEST_PRODUCT, buildInvoicePayload } from "@/lib/telegram/stars";

const recordStarPayment = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/lib/telegram/stars.server", () => ({ recordStarPayment }));

const handler = (Route.options as any).server.handlers.POST;
const post = (body: unknown) =>
  handler({
    request: new Request("http://x/api/public/telegram/webhook", {
      method: "POST",
      headers: { "X-Telegram-Bot-Api-Secret-Token": deriveWebhookSecret("123:TESTTOKEN") },
      body: JSON.stringify(body),
    }),
  });

describe("stars webhook", () => {
  beforeEach(() => {
    recordStarPayment.mockClear();
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, result: {} }), { status: 200 }),
    ) as any;
  });

  const lastBody = () => JSON.parse((global.fetch as any).mock.calls.at(-1)[1].body);

  it("approves a valid pre_checkout_query", async () => {
    await post({
      update_id: 1,
      pre_checkout_query: {
        id: "q1",
        from: { id: 7 },
        total_amount: STAR_TEST_PRODUCT.stars,
        invoice_payload: buildInvoicePayload(STAR_TEST_PRODUCT.id, 7),
      },
    });
    expect(lastBody().ok).toBe(true);
  });

  it("rejects a tampered pre_checkout_query", async () => {
    await post({
      update_id: 2,
      pre_checkout_query: {
        id: "q2",
        from: { id: 7 },
        total_amount: 1,
        invoice_payload: buildInvoicePayload(STAR_TEST_PRODUCT.id, 999),
      },
    });
    expect(lastBody().ok).toBe(false);
    expect(recordStarPayment).not.toHaveBeenCalled();
  });

  it("records a successful payment once", async () => {
    await post({
      update_id: 3,
      message: {
        chat: { id: 7, type: "private" },
        from: { id: 7 },
        successful_payment: {
          currency: "XTR",
          total_amount: 1,
          invoice_payload: buildInvoicePayload(STAR_TEST_PRODUCT.id, 7),
          telegram_payment_charge_id: "charge_1",
        },
      },
    });
    expect(recordStarPayment).toHaveBeenCalledWith(
      expect.objectContaining({ chargeId: "charge_1", telegramUserId: 7, credits: undefined ?? undefined }),
    );
  });

  it("ignores a payment whose buyer does not match the payload", async () => {
    await post({
      update_id: 4,
      message: {
        chat: { id: 8, type: "private" },
        from: { id: 8 },
        successful_payment: {
          currency: "XTR",
          total_amount: 1,
          invoice_payload: buildInvoicePayload(STAR_TEST_PRODUCT.id, 7),
          telegram_payment_charge_id: "charge_2",
        },
      },
    });
    expect(recordStarPayment).not.toHaveBeenCalled();
  });
});
