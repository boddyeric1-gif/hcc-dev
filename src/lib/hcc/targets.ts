import type { Target } from "./types";

export const TARGETS: readonly Target[] = [
  {
    id: "hollowmarket",
    codename: "HOLLOW MARKET",
    host: "hollow7xk.onion",
    tier: 1,
    crime: "Stolen credential bazaar",
    brief:
      "Sells bank logins harvested from retirees. Small crew, sloppy operational security, active since spring.",
    bounty: 900,
    rep: 12,
    ports: [
      { id: "22", service: "ssh (default keys)", difficulty: 0.15, evidence: "Shell history: bulk card dumps uploaded nightly." },
      { id: "80", service: "vendor storefront", difficulty: 0.25, evidence: "Storefront ledger: 4,102 victim records sold." },
      { id: "5432", service: "postgres", difficulty: 0.4, evidence: "Payouts table linked to a single cash-out wallet." },
    ],
    operator: {
      alias: "grifter_9",
      realName: "Dennis Warrick",
      location: "Tampa, Florida",
      note: "Reused the same wallet for his mother's rent transfers.",
    },
  },
  {
    id: "ashgrid",
    codename: "ASHGRID",
    host: "ashgrid-relay.onion",
    tier: 2,
    crime: "Ransomware affiliate hub",
    brief:
      "Rents encryption payloads to affiliates who hit clinics and school districts. Keeps a victim leak wall.",
    bounty: 2200,
    rep: 24,
    ports: [
      { id: "443", service: "leak wall (tls)", difficulty: 0.35, evidence: "Leak wall backups name 61 hospitals extorted." },
      { id: "6667", service: "affiliate irc", difficulty: 0.45, evidence: "Chat logs: affiliate payouts split 70/30 with core." },
      { id: "9001", service: "payload builder", difficulty: 0.55, evidence: "Builder signed with a cert tied to a shell company." },
      { id: "27017", service: "mongo (victims)", difficulty: 0.5, evidence: "Victim DB includes decryption keys never delivered." },
    ],
    operator: {
      alias: "vsp_kernel",
      realName: "Marta Ilyich",
      location: "Riga, Latvia",
      note: "Shell company registered under her own passport number.",
    },
  },
  {
    id: "pale_ferry",
    codename: "PALE FERRY",
    host: "paleferry.onion",
    tier: 2,
    crime: "Trafficking logistics board",
    brief:
      "Coordinates movement of people across three borders using coded freight listings. The worst room on the network.",
    bounty: 3400,
    rep: 40,
    ports: [
      { id: "22", service: "ssh (hardened)", difficulty: 0.5, evidence: "Root keys shared with two border-side handlers." },
      { id: "8080", service: "freight board", difficulty: 0.45, evidence: "Coded listings decode to routes and dates." },
      { id: "5060", service: "voip bridge", difficulty: 0.6, evidence: "Call records place handlers at three crossing points." },
      { id: "3306", service: "mysql (manifests)", difficulty: 0.6, evidence: "Manifests: 118 names, ages, and destinations." },
    ],
    operator: {
      alias: "ferryman",
      realName: "Oswin Blakely",
      location: "Rotterdam, Netherlands",
      note: "Signs manifests from a home IP behind a lapsed VPN subscription.",
    },
  },
  {
    id: "nullchoir",
    codename: "NULLCHOIR",
    host: "nullchoir.i2p",
    tier: 3,
    crime: "Botnet command network",
    brief:
      "Two million conscripted devices. Rents them to anyone with money. Hardened, patched, and watching for you.",
    bounty: 6000,
    rep: 70,
    ports: [
      { id: "53", service: "dns tunnel", difficulty: 0.6, evidence: "Tunnel traffic maps the full node hierarchy." },
      { id: "443", service: "c2 dashboard", difficulty: 0.7, evidence: "Dashboard: 2.1M infected devices, 40k in hospitals." },
      { id: "8443", service: "operator vpn", difficulty: 0.75, evidence: "VPN logs leak the operator's home exit node." },
      { id: "11211", service: "memcached", difficulty: 0.65, evidence: "Cached invoices for three separate state clients." },
    ],
    operator: {
      alias: "choirmaster",
      realName: "Peter Anand Roy",
      location: "Kuala Lumpur, Malaysia",
      note: "Kept an unencrypted backup of the entire ledger. Everyone slips once.",
    },
  },
] as const;

export const targetById = (id: string): Target | undefined =>
  TARGETS.find((t) => t.id === id || t.codename.toLowerCase().replace(/\s+/g, "_") === id);
