import { createFileRoute } from "@tanstack/react-router";

import { callBotApi, deriveWebhookSecret, miniAppBaseUrl, safeEqual } from "@/lib/telegram/bot.server";
import { UNKNOWN_COMMAND_TEXT, miniAppUrl, parseCommand } from "@/lib/telegram/commands";
import { parseInvoicePayload, starProductById } from "@/lib/telegram/stars";
import { recordStarPayment } from "@/lib/telegram/stars.server";

type SuccessfulPayment = {
  currency?: string;
  total_amount?: number;
  invoice_payload?: string;
  telegram_payment_charge_id?: string;
  provider_payment_charge_id?: string;
};

type TelegramMessage = {
  text?: string;
  chat?: { id?: number; type?: string };
  from?: { id?: number };
  successful_payment?: SuccessfulPayment;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  pre_checkout_query?: { id?: string; from?: { id?: number }; total_amount?: number; invoice_payload?: string };
};

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) {
          console.error("TELEGRAM_BOT_TOKEN is not configured");
          return new Response("Not configured", { status: 503 });
        }

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, deriveWebhookSecret(botToken))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as TelegramUpdate;

        // Stars checkout must be answered within 10s; we re-validate product and amount here.
        const pre = update.pre_checkout_query;
        if (pre?.id) {
          const parsed = parseInvoicePayload(pre.invoice_payload);
          const product = parsed ? starProductById(parsed.productId) : undefined;
          const valid =
            !!product && !!parsed && parsed.telegramUserId === pre.from?.id && pre.total_amount === product.stars;
          await callBotApi(botToken, "answerPreCheckoutQuery", {
            pre_checkout_query_id: pre.id,
            ok: valid,
            ...(valid ? {} : { error_message: "This invoice is no longer valid. Please try again." }),
          });
          return Response.json({ ok: true });
        }

        const message = update.message ?? update.edited_message;
        const chatId = message?.chat?.id;
        if (typeof chatId !== "number") return Response.json({ ok: true, ignored: true });

        const payment = message?.successful_payment;
        if (payment?.telegram_payment_charge_id) {
          const parsed = parseInvoicePayload(payment.invoice_payload);
          const product = parsed ? starProductById(parsed.productId) : undefined;
          const buyerId = message?.from?.id;
          if (product && parsed && buyerId === parsed.telegramUserId && payment.currency === "XTR") {
            const recorded = await recordStarPayment({
              chargeId: payment.telegram_payment_charge_id,
              providerChargeId: payment.provider_payment_charge_id ?? null,
              telegramUserId: parsed.telegramUserId,
              productId: product.id,
              stars: payment.total_amount ?? product.stars,
            });
            if (recorded) {
              await callBotApi(botToken, "sendMessage", {
                chat_id: chatId,
                text: `Payment confirmed. ${product.credits.toLocaleString("en-US")} credits are waiting — open H.C.C and they will be applied automatically.`,
              });
            }
          } else {
            console.error("Rejected successful_payment with unexpected payload", payment.invoice_payload);
          }
          return Response.json({ ok: true });
        }

        const spec = parseCommand(message?.text);
        if (!spec) {
          if (!message?.text?.trim().startsWith("/")) return Response.json({ ok: true, ignored: true });
          await callBotApi(botToken, "sendMessage", { chat_id: chatId, text: UNKNOWN_COMMAND_TEXT });
          return Response.json({ ok: true });
        }

        if (spec.replyOnly) {
          await callBotApi(botToken, "sendMessage", { chat_id: chatId, text: spec.text });
          return Response.json({ ok: true });
        }

        // web_app buttons are only valid in private chats; groups get a plain link.
        const url = miniAppUrl(miniAppBaseUrl(), spec.tab);
        const isPrivate = message?.chat?.type === "private";
        await callBotApi(botToken, "sendMessage", {
          chat_id: chatId,
          text: spec.text,
          reply_markup: {
            inline_keyboard: [[isPrivate ? { text: spec.button, web_app: { url } } : { text: spec.button, url }]],
          },
        });
        return Response.json({ ok: true });
      },
    },
  },
});
