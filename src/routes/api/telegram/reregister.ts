import { createFileRoute } from "@tanstack/react-router";

import { callBotApi, deriveWebhookSecret } from "@/lib/telegram/bot.server";

export const Route = createFileRoute("/api/telegram/reregister")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { url } = (await request.json()) as { url?: string };
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!botToken) return new Response("Not configured", { status: 503 });
        const result = await callBotApi(botToken, "setWebhook", {
          url: `${url}/api/public/telegram/webhook`,
          secret_token: deriveWebhookSecret(botToken),
          allowed_updates: ["message", "pre_checkout_query"],
        });
        const info = await callBotApi(botToken, "getWebhookInfo", {});
        return Response.json({ result, info });
      },
    },
  },
});
