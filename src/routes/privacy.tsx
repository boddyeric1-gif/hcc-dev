import { createFileRoute, Link } from "@tanstack/react-router";

const UPDATED = "August 20, 2026";
const CONTACT = "support@hcc-dev.lovable.app";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — H.C.C" },
      {
        name: "description",
        content:
          "How H.C.C (Hunting Cyber Criminals) handles Telegram user information, game progress, purchases, local storage and deletion requests.",
      },
      { property: "og:title", content: "Privacy Policy — H.C.C" },
      {
        property: "og:description",
        content:
          "What data the H.C.C game collects, how it is stored, third-party services used, and how to request deletion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-sm tracking-[0.22em] text-hud-cyan uppercase">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="safe-top safe-x mx-auto w-full max-w-2xl px-5 py-10 pb-16">
        <Link to="/" className="text-[10px] tracking-[0.24em] text-muted-foreground uppercase hover:text-hud-cyan">
          &larr; Back to console
        </Link>

        <h1 className="mt-6 font-display text-2xl tracking-[0.18em] text-foreground uppercase">Privacy Policy</h1>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          H.C.C — Hunting Cyber Criminals · Last updated {UPDATED}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          H.C.C is a fictional hacking simulation game. This policy explains what information the game handles, why, and
          how you can have it removed. We keep collection to the minimum needed to run the game.
        </p>

        <Section title="Telegram user information">
          <p>
            When you open H.C.C inside Telegram, the Telegram Web App SDK gives the game basic profile data: your
            Telegram user ID, first and last name, username, language code and profile photo URL, when you have made
            them available.
          </p>
          <p>
            We use this only to identify your game account and personalise the interface. We never receive your phone
            number, contacts, messages or chat history.
          </p>
        </Section>

        <Section title="Game and account data">
          <p>
            Your account consists of a game handle you choose and, when you play through Telegram, your Telegram user
            ID. No passwords, email addresses or payment card details are collected by the game.
          </p>
        </Section>

        <Section title="Game progress and purchases">
          <p>
            Progress data includes credits, rank and intel, case progress, rig and mining hardware, coin balances,
            settings and unlocked items. This is stored so your session can continue where you left off.
          </p>
          <p>
            Purchases made with Telegram Stars are processed entirely by Telegram. We receive only a confirmation that a
            purchase succeeded and the item it unlocks. We never see your payment method or billing details.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            The game does not use advertising or tracking cookies. It stores your save file and preferences in your
            browser&apos;s local storage on your own device. Clearing your browser or Telegram web app data deletes that
            save permanently.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>Services used to run and host the game:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Telegram — Web App platform, sign-in context and Stars payments.</li>
            <li>Lovable — application hosting and delivery.</li>
            <li>Lovable Cloud (Supabase) — database, authentication and storage for account and progress data.</li>
            <li>Google Fonts — web font delivery.</li>
          </ul>
          <p>Each service handles data under its own privacy policy. We do not sell or rent any data.</p>
        </Section>

        <Section title="Data retention and deletion">
          <p>
            Account and progress data is kept while your account is active. To delete it, either clear your local game
            data on your device, or email us from the Telegram account you play on and ask for deletion.
          </p>
          <p>
            Include your Telegram username or in-game handle. We will delete stored account and progress data within 30
            days and confirm by reply. Purchase records may be retained where required for accounting or by Telegram.
          </p>
        </Section>

        <Section title="Children">
          <p>
            H.C.C is not directed at children under 13. If you believe a child has provided data to us, contact us and
            we will remove it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes, the date at the top of this page is updated. Continued play after a change means you
            accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or deletion requests:{" "}
            <a href={`mailto:${CONTACT}`} className="text-hud-cyan underline underline-offset-4">
              {CONTACT}
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}
