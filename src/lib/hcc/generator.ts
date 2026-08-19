import type { Target, Threat } from "./types";

/**
 * Procedural target generator. Keeps the field queue alive forever: new cyber
 * criminals surface at random intervals, scaled to the operator's rank.
 */

const PREFIX = [
  "Null", "Ash", "Pale", "Hollow", "Iron", "Grave", "Cinder", "Vex", "Rot", "Silk",
  "Black", "Glass", "Wither", "Sable", "Crypt", "Mirror", "Hex", "Dust", "Frost", "Snare",
];
const SUFFIX = [
  "choir", "market", "ferry", "grid", "bazaar", "vault", "syndicate", "relay", "circuit",
  "harbour", "exchange", "cartel", "foundry", "cache", "broker", "lantern", "ledger",
];

const ALLEGATIONS: readonly { crime: string; brief: string }[] = [
  { crime: "Botnet rental and DDoS extortion", brief: "Rents a residential botnet by the hour. Clinics and small councils pay to stay online." },
  { crime: "Card skimming and dump resale", brief: "Skimmed card dumps sorted by issuing bank and sold in bundles of a thousand." },
  { crime: "Crypto drainer kit distribution", brief: "Sells wallet-drainer kits to affiliates and takes twenty percent off the top." },
  { crime: "Counterfeit document workshop", brief: "Prints passports and licences to order. Ships in hollowed-out textbooks." },
  { crime: "Ransomware negotiation front", brief: "Poses as a recovery firm while quietly taking a cut of every ransom paid." },
  { crime: "Stalkerware distribution network", brief: "Consumer spyware marketed as parental control. Victims never installed it." },
  { crime: "SIM-swap brokerage", brief: "Buys carrier insiders by the shift and resells account takeovers." },
  { crime: "Malvertising exploit chain", brief: "Buys ad inventory to serve exploit chains to unpatched browsers." },
  { crime: "Stolen credential clearinghouse", brief: "Aggregates breach dumps into a searchable index with a monthly subscription." },
  { crime: "Industrial control intrusion for hire", brief: "Sells access to water and utility control panels. Buyers unknown, intent worse." },
  { crime: "Deepfake extortion studio", brief: "Manufactures synthetic media to extort executives and teenagers alike." },
  { crime: "Money mule recruitment ring", brief: "Recruits students as mules with fake logistics jobs and clean-looking payslips." },
];

const FIRST = ["Rurik", "Yara", "Dmitri", "Anton", "Ilse", "Marek", "Nadia", "Ozan", "Petra", "Kaspar", "Lena", "Tobias", "Sasha", "Ines", "Bogdan", "Mira"];
const LAST = ["Vasel", "Kelm", "Ilyev", "Reiss", "Sarkis", "Novak", "Halden", "Berg", "Toma", "Krupa", "Vance", "Osei", "Falk", "Duran", "Weiss", "Renko"];
const CITY = ["Tallinn", "Chisinau", "Zug", "Belgrade", "Riga", "Odesa", "Almaty", "Sofia", "Tbilisi", "Bucharest", "Vilnius", "Nicosia", "Batumi", "Skopje"];
const NOTES = [
  "Pays for hosting with the same card used for a gym membership.",
  "Streams late-night chess under a barely different handle.",
  "Reuses one passphrase across six years of accounts.",
  "Books flights in a real name to see a real mother.",
  "Left EXIF data in a single screenshot in 2019.",
  "Uses the office printer's default hostname on the C2 box.",
  "Signs commits with a work email.",
  "Complains about the same landlord on two forums.",
];

const OPS_TEXT = {
  ports: [
    "Perimeter sweep found a staging port answering an old beacon.",
    "Admin panel replica exposed on an unfiltered high port.",
    "Backup service still listening with default credentials.",
  ],
  pretext: [
    "Support pretext returned an internal ticket reference.",
    "Onboarding chat leaked the recruiter's working hours.",
    "Billing desk confirmed the account holder's timezone.",
  ],
  cipher: [
    "Archive header decrypted — every transaction is now readable.",
    "Key vault decrypted; victim keys recoverable in bulk.",
    "Encrypted manifest opened — inventory matches the seizure list.",
  ],
  ledger: [
    "Settlements collapse to a single custodial wallet.",
    "Admin logins correlate to one residential uplink.",
    "Payout schedule traces to one long-lived exchange account.",
  ],
} as const;

const pick = <T,>(arr: readonly T[], r: number): T => arr[Math.floor(r * arr.length) % arr.length]!;

const ip = (r: () => number) =>
  `${10 + Math.floor(r() * 190)}.${Math.floor(r() * 256)}.${Math.floor(r() * 256)}.${1 + Math.floor(r() * 254)}`;

export type GenOptions = {
  /** operator rank index — pushes difficulty and rewards up over time */
  readonly rank: number;
  readonly seq: number;
};

export const generateTarget = (
  { rank, seq }: GenOptions,
  rng: () => number = Math.random,
): Target => {
  const codename = `${pick(PREFIX, rng())}${pick(SUFFIX, rng())}`;
  const a = pick(ALLEGATIONS, rng());
  const swing = rng();
  const security = Math.max(48, Math.min(99, Math.round(58 + rank * 8 + swing * 34)));
  const threat: Threat = security > 90 ? "CRITICAL" : security > 78 ? "SEVERE" : "HIGH";
  const scale = 1 + rank * 0.45 + swing * 0.6;
  const alias = `${pick(PREFIX, rng()).toLowerCase()}${pick(["hand", "wire", "fox", "byte", "moth", "kite", "ash"], rng())}`;
  return {
    id: `gen-${seq}-${Math.floor(rng() * 1e6).toString(36)}`,
    codename,
    caseId: `${codename.slice(0, 2).toUpperCase()}-${10 + Math.floor(rng() * 89)}`,
    host: ip(rng),
    threat,
    security,
    allegation: a.crime,
    brief: a.brief,
    bounty: Math.round((1600 + swing * 2600) * scale),
    intel: Math.round((220 + swing * 340) * scale),
    ops: [
      { kind: "ports", label: "Network map", captured: pick(OPS_TEXT.ports, rng()) },
      { kind: "pretext", label: "Identity correlation", captured: pick(OPS_TEXT.pretext, rng()) },
      { kind: "cipher", label: "Archive decryption", captured: pick(OPS_TEXT.cipher, rng()) },
      { kind: "ledger", label: "Settlement ledger", captured: pick(OPS_TEXT.ledger, rng()) },
    ],
    operator: {
      alias,
      realName: `${pick(FIRST, rng())} ${pick(LAST, rng())}`,
      location: pick(CITY, rng()),
      note: pick(NOTES, rng()),
    },
  };
};
