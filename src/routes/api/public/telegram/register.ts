import { createFileRoute } from "@tanstack/react-router";

import { callBotApi, deriveWebhookSecret, miniAppBaseUrl, safeEqual } from "@/lib/telegram/bot.server";
import { COMMANDS } from "@/lib/telegram/commands";

/**
 * One-shot setup endpoint: registers the webhook and the command menu.
 * Authorised by presenting the bot token itself, which only the bot owner holds.
 */
export const Route = createFileRoute("/api/public/telegram/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) return new Response("Not configured", { status: 503 });

        const presented = request.headers.get("X-Bot-Token") ?? "";
        if (!safeEqual(presented, botToken)) return new Response("Unauthorized", { status: 401 });

        const origin = new URL(request.url).origin;
        const webhookUrl = `${origin}/api/public/telegram/webhook`;

        await callBotApi(botToken, "setWebhook", {
          url: webhookUrl,
          secret_token: deriveWebhookSecret(botToken),
          allowed_updates: ["message"],
        });
        await callBotApi(botToken, "setMyCommands", {
          commands: COMMANDS.map((c) => ({ command: c.command, description: c.description })),
        });
        await callBotApi(botToken, "setChatMenuButton", {
          menu_button: { type: "web_app", text: "Play H.C.C", web_app: { url: miniAppBaseUrl() } },
        });

        return Response.json({ ok: true, webhookUrl, commands: COMMANDS.length });
      },
    },
  },
});
