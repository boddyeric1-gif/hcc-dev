import type { Target } from "./types";

export const TARGETS: readonly Target[] = [
  {
    id: "silkbazaar",
    codename: "SilkBazaar",
    caseId: "SB-17",
    host: "10.77.23.91",
    threat: "HIGH",
    security: 72,
    allegation: "Contraband exchange and payment laundering",
    brief:
      "A members-only marketplace routing contraband payments through a fictional mixer. Sellers are vetted; the ledger is not.",
    bounty: 2400,
    intel: 320,
    ops: [
      { kind: "ports", label: "Network map", captured: "Sandbox ports 1, 3 and 5 answer to a stale beacon." },
      { kind: "pretext", label: "Identity correlation", captured: "Support pretext returned an internal case reference." },
      { kind: "cipher", label: "Transaction archive", captured: "Escrow archive decrypted — 4,118 fictional settlements." },
      { kind: "ledger", label: "Access ledger", captured: "Admin logins correlate to a single residential uplink." },
    ],
    operator: {
      alias: "silkhand",
      realName: "Rurik Vasel",
      location: "Kaliningrad",
      note: "Runs the escrow from a rented flat above a laundromat.",
    },
  },
  {
    id: "viperransom",
    codename: "ViperRansom",
    caseId: "VR-04",
    host: "172.19.88.44",
    threat: "SEVERE",
    security: 91,
    allegation: "Ransomware command and control network",
    brief:
      "Command node for a ransomware affiliate program. Hospitals and school districts, priced by bed count.",
    bounty: 3600,
    intel: 480,
    ops: [
      { kind: "ports", label: "Network map", captured: "C2 heartbeat exposed on a forgotten staging port." },
      { kind: "pretext", label: "Identity correlation", captured: "Affiliate onboarding chat leaked a recruiter handle." },
      { kind: "cipher", label: "Key vault", captured: "Victim key vault decrypted — every key recoverable." },
      { kind: "ledger", label: "Payout ledger", captured: "Affiliate payouts trace to one custodial wallet." },
    ],
    operator: {
      alias: "cottonmouth",
      realName: "Dmitri Ilyev",
      location: "Chisinau",
      note: "Pays affiliates on Fridays. Never misses a Friday.",
    },
  },
  {
    id: "deepdox",
    codename: "DeepDox",
    caseId: "DD-66",
    host: "192.0.2.66",
    threat: "HIGH",
    security: 78,
    allegation: "Stolen identity trafficking ring",
    brief:
      "Bulk identity packages sold by the thousand. Real people, indexed and searchable, sorted by credit score.",
    bounty: 2900,
    intel: 380,
    ops: [
      { kind: "ports", label: "Network map", captured: "Search index replica reachable without auth." },
      { kind: "pretext", label: "Identity correlation", captured: "Reseller support thread named the operator's timezone." },
      { kind: "cipher", label: "Record archive", captured: "Identity archive decrypted — 1.2M records, all fictional." },
      { kind: "ledger", label: "Access ledger", captured: "Uploads cluster around one static ASN." },
    ],
    operator: {
      alias: "archivist",
      realName: "Yara Kelm",
      location: "Tallinn",
      note: "Keeps immaculate backups. That is how she was found.",
    },
  },
  {
    id: "shadowbroker",
    codename: "ShadowBroker",
    caseId: "SH-12",
    host: "198.51.100.12",
    threat: "CRITICAL",
    security: 96,
    allegation: "Exploit marketplace and illegal access sales",
    brief:
      "Zero-day brokerage with a buyer list of state contractors and worse. The hardest room on the network.",
    bounty: 5200,
    intel: 700,
    ops: [
      { kind: "ports", label: "Network map", captured: "Broker relay answers on a rotating high port." },
      { kind: "pretext", label: "Identity correlation", captured: "Buyer vetting flow exposed a signing identity." },
      { kind: "cipher", label: "Exploit archive", captured: "Exploit archive decrypted — 61 fictional zero-days." },
      { kind: "ledger", label: "Settlement ledger", captured: "Broker fees settle through one long-lived wallet." },
    ],
    operator: {
      alias: "nullbroker",
      realName: "Anton Reiss",
      location: "Zug",
      note: "Registered three shell companies with his own middle name.",
    },
  },
];

export const targetById = (id: string | null | undefined): Target | undefined =>
  TARGETS.find((t) => t.id === id);
