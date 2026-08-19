import type { TabId } from "./types";

export type GuideStep = {
  readonly title: string;
  readonly body: string;
};

export type GuideChapter = {
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly tab?: TabId;
  readonly steps: readonly GuideStep[];
  readonly rules?: readonly string[];
};

export const GUIDE: readonly GuideChapter[] = [
  {
    id: "basics",
    title: "01 — The Job",
    tagline: "What H.C.C actually is, in one screen.",
    tab: "command",
    steps: [
      {
        title: "You hunt cyber criminals",
        body: "Each case is a dark-web operator. You gather four pieces of evidence on them, file the case, and the takedown pays out credits and intel (rank).",
      },
      {
        title: "The loop",
        body: "Pick a target in TARGETS → engage it → run the four operations in TOOLS → check the file in CASE → file the report. Repeat with harder targets.",
      },
      {
        title: "Two economies",
        body: "Bounties pay in bursts. Your MINING farm pays continuously, even while you work a case. Most players fund early rig upgrades with mining, then scale bounties.",
      },
      {
        title: "Everything saves",
        body: "Progress is stored on this device automatically. Closing the tab is safe; the farm settles its earnings from the last timestamp when you return.",
      },
    ],
    rules: [
      "Credits buy hardware. Intel raises rank, which unlocks higher-tier shop items.",
      "Rank also quietly lowers puzzle pressure — the game gets easier as you earn it.",
    ],
  },
  {
    id: "targets",
    title: "02 — Targets & Channels",
    tagline: "Choosing who to hunt and how many at once.",
    tab: "targets",
    steps: [
      {
        title: "Engage a case",
        body: "A target must be engaged to open a channel before its tools unlock. ENGAGE holds it; RELEASE drops it.",
      },
      {
        title: "Channel limit",
        body: "You start with one channel. Engaging past your limit forces the OLDEST case to go cold — it loses every piece of evidence you had collected. Release deliberately instead.",
      },
      {
        title: "More channels",
        body: "Split-Session Daemon, Op Orchestrator, Swarm Controller and Task Force Liaison each add a channel, up to five parallel cases.",
      },
      {
        title: "EFFORT bands",
        body: "ROUTINE → GUARDED → HARDENED → BLACKSITE. The band compares the target's security against your crack stat and rank. Higher bands mean fewer probes, more rounds, tighter timers — and much bigger payouts.",
      },
      {
        title: "New criminals appear",
        body: "The field queue keeps generating fresh operators at random intervals. A voice alert announces each detection and the case drops into your list marked NEW. Difficulty scales with your rank, so the queue never runs dry.",
      },
    ],
  },
  {
    id: "tools",
    title: "03 — The Four Tools",
    tagline: "Each one is a different puzzle, reseeded every attempt.",
    tab: "tools",
    steps: [
      {
        title: "PORT MAPPER — find the open port",
        body: "You get a limited number of probes. Each probe reports how close you are to the live service port. Narrow the range, then commit. Wasting probes ends the run and adds heat.",
      },
      {
        title: "PRETEXT — social engineering",
        body: "A multi-round conversation. Each round offers replies; only one holds the operator's trust. Read the mark's mood line — it tells you whether to press, reassure, or retreat. Wrong replies burn trust; run out and they hang up.",
      },
      {
        title: "CIPHER — break the key",
        body: "A rotated phrase and an unknown key. Turn the wheel until plaintext appears, then submit. Harder targets use longer phrases and fewer attempts.",
      },
      {
        title: "LEDGER TRACE — follow the money",
        body: "Hops flash across exchanges. Track the payload chain and pick the exit exchange. Higher security means more hops, more decoy exchanges and a faster flash.",
      },
      {
        title: "Nothing repeats",
        body: "Every attempt reseeds the puzzle: new ports, new shuffled pretext rounds, new phrase and key, new route. Memorising an answer will not work.",
      },
    ],
    rules: [
      "Success files one piece of evidence. Failure files nothing and raises heat.",
      "A better rig and a higher rank buy back probes, attempts and time — that is how progress feels.",
    ],
  },
  {
    id: "heat",
    title: "04 — Heat & Risk",
    tagline: "The clock that punishes sloppy work.",
    tab: "command",
    steps: [
      {
        title: "What raises heat",
        body: "Failed operations, aggressive probing and long uninterrupted sessions on one target.",
      },
      {
        title: "What happens at 100%",
        body: "Counter-intrusion finds your uplink: you lose 35% of your credits to an emergency relocation and heat resets to 22%.",
      },
      {
        title: "Cooling down",
        body: "Run SCRUB to shed heat. Dissipation hardware reduces how much heat every incident applies in the first place.",
      },
    ],
  },
  {
    id: "case",
    title: "05 — Case File & Reporting",
    tagline: "Turning evidence into a takedown.",
    tab: "case",
    steps: [
      {
        title: "The evidence chain",
        body: "Four slots, one per tool. Redacted lines fill in as you file each piece.",
      },
      {
        title: "Doxing the operator",
        body: "At 100% evidence the operator's real identity, location and infrastructure are unmasked.",
      },
      {
        title: "File the report",
        body: "Reporting hands the case to law enforcement: the case closes, you collect the bounty plus intel, and the target leaves your queue permanently.",
      },
    ],
  },
  {
    id: "rig",
    title: "06 — Your Rig",
    tagline: "The 3D desk is your stat sheet.",
    tab: "rig",
    steps: [
      {
        title: "Slots",
        body: "CPU, GPU, monitors, desk, cooling and peripherals each take one installed item. Buying an item does not install it — install it from the rig view.",
      },
      {
        title: "What the stats do",
        body: "Crack improves every puzzle budget. Scan reveals more before you commit. Dissipation cuts heat gain. Bounty raises payouts. Mining multiplier boosts farm output. Op slots add parallel cases.",
      },
      {
        title: "It is visual",
        body: "Every install shows up in the scene — new monitors, cooling loops, lighting. Use the brightness slider if the room reads too dark on your display.",
      },
    ],
  },
  {
    id: "mining",
    title: "07 — Mining & Market",
    tagline: "Passive income with real trade-offs.",
    tab: "mining",
    steps: [
      {
        title: "Buy units, then assign them",
        body: "GPU rigs and ASIC stacks are bought in the shop. In MINING you assign each unit to BTC, ETH or GHST with the +/− controls. Unassigned units fall back to your selected coin.",
      },
      {
        title: "Power and heat",
        body: "Every unit draws watts. Exceed your contract capacity and the farm throttles; exceed your cooling and thermal throttling cuts effective hashrate. Telemetry shows load, watts and heat.",
      },
      {
        title: "Contracts",
        body: "Power contracts differ in rate, capacity, surge windows and overage penalties. A cheap contract with a harsh overage fee can cost more than a premium one at scale.",
      },
      {
        title: "Coins differ",
        body: "Each coin has its own difficulty, volatility and bid/ask spread. Wide spreads punish frequent selling; volatile coins reward timing.",
      },
      {
        title: "MARKET WIRE",
        body: "News events and macro shocks temporarily bend price drift, volatility, spreads and energy rates. Read the wire before reassigning units or selling a balance.",
      },
      {
        title: "Selling",
        body: "Balances accrue per coin and convert to credits at the current bid, not the headline price.",
      },
    ],
  },
  {
    id: "shop",
    title: "08 — Shop & Progression",
    tagline: "Where credits become capability.",
    tab: "shop",
    steps: [
      {
        title: "Categories",
        body: "Hardware (rig slots), tools and perks (passive stats, always active once owned), mining gear, and power contracts.",
      },
      {
        title: "Rank gates",
        body: "Higher-tier items require intel rank. If an item is locked, close more cases rather than grinding credits.",
      },
      {
        title: "Suggested order",
        body: "Cooling and crack first (they make cases winnable), then a second channel, then mining scale. Cosmetics last.",
      },
    ],
  },
  {
    id: "audio",
    title: "09 — Comfort & Controls",
    tagline: "Sound, brightness, performance.",
    steps: [
      {
        title: "Audio",
        body: "The mute icon in the header silences the ambient bed — electrical hum, fans, relay clicks and telemetry beeps — plus the spoken detection alerts.",
      },
      {
        title: "Brightness",
        body: "The rig and mining scenes have a brightness slider. Raise it if hardware detail is hard to read.",
      },
      {
        title: "Quality",
        body: "Ultra / Balanced / Performance controls post-processing. Drop to Performance if the 3D scenes stutter on your device.",
      },
    ],
  },
];
