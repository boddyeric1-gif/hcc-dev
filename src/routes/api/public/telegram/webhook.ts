import { createFileRoute } from "@tanstack/react-router";

import { callBotApi, deriveWebhookSecret, miniAppBaseUrl, safeEqual } from "@/lib/telegram/bot.server";
import { UNKNOWN_COMMAND_TEXT, miniAppUrl, parseCommand } from "@/lib/telegram/commands";

type TelegramUpdate = {
  update_id?: number;
  message?: { text?: string; chat?: { id?: number; type?: string } };
  edited_message?: { text?: string; chat?: { id?: number; type?: string } };
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
        const message = update.message ?? update.edited_message;
        const chatId = message?.chat?.id;
        if (typeof chatId !== "number") return Response.json({ ok: true, ignored: true });

        const spec = parseCommand(message?.text);
        if (!spec) {
          if (!message?.text?.trim().startsWith("/")) return Response.json({ ok: true, ignored: true });
          await callBotApi(botToken, "sendMessage", { chat_id: chatId, text: UNKNOWN_COMMAND_TEXT });
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
