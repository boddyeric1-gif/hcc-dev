import type { Coin, Item, Slot } from "./types";

export const CATALOG: readonly Item[] = [
  // ── rig hardware ────────────────────────────────────────────────────────
  { id: "cpu-1", name: "Salvage Xeon E3", category: "hardware", slot: "cpu", tier: 1, price: 0, blurb: "Pulled from a decommissioned rack. It boots.", stats: { crack: 0, scan: 1 } },
  { id: "cpu-2", name: "Ryzen 9 Blackline", category: "hardware", slot: "cpu", tier: 2, price: 1800, blurb: "Sixteen cores of patient brute force.", stats: { crack: 0.08, scan: 1.4 } },
  { id: "cpu-3", name: "Threadripper HALO", category: "hardware", slot: "cpu", tier: 3, price: 5400, blurb: "Cracks that used to take a night take a coffee.", stats: { crack: 0.16, scan: 2.1 }, rank: 2 },
  { id: "cpu-4", name: "EPYC Nightfall 96C", category: "hardware", slot: "cpu", tier: 4, price: 14200, blurb: "Datacentre silicon under a desk. Obscene.", stats: { crack: 0.26, scan: 3.2 }, rank: 4 },

  { id: "gpu-1", name: "GTX 1060 (used)", category: "hardware", slot: "gpu", tier: 1, price: 0, blurb: "Fan bearing sings at load.", stats: { crack: 0, miningMul: 1 } },
  { id: "gpu-2", name: "RTX 4070 Ti", category: "hardware", slot: "gpu", tier: 2, price: 2600, blurb: "Quiet, cold, and fast enough to matter.", stats: { crack: 0.06, miningMul: 1.15 } },
  { id: "gpu-3", name: "RTX 5090 Founders", category: "hardware", slot: "gpu", tier: 3, price: 7800, blurb: "Three slots of vapour chamber and ambition.", stats: { crack: 0.12, miningMul: 1.35 }, rank: 2 },
  { id: "gpu-4", name: "Quadro OBSIDIAN 96", category: "hardware", slot: "gpu", tier: 4, price: 18600, blurb: "Not sold to individuals. You are not an individual.", stats: { crack: 0.2, miningMul: 1.6 }, rank: 4 },

  { id: "ram-1", name: "16GB DDR4", category: "hardware", slot: "ram", tier: 1, price: 0, blurb: "Two sticks, mismatched timings.", stats: { scan: 0 } },
  { id: "ram-2", name: "64GB DDR5 ECC", category: "hardware", slot: "ram", tier: 2, price: 1200, blurb: "Room to hold a whole index in memory.", stats: { scan: 1.2, crack: 0.03 } },
  { id: "ram-3", name: "256GB DDR5 RDIMM", category: "hardware", slot: "ram", tier: 3, price: 4400, blurb: "Nothing ever touches disk again.", stats: { scan: 2.4, crack: 0.07 }, rank: 3 },

  { id: "sto-1", name: "1TB SATA SSD", category: "hardware", slot: "storage", tier: 1, price: 0, blurb: "Half full of things you should have deleted.", stats: {} },
  { id: "sto-2", name: "4TB NVMe Gen5", category: "hardware", slot: "storage", tier: 2, price: 1100, blurb: "Evidence archives written faster than they arrive.", stats: { scan: 0.8 } },
  { id: "sto-3", name: "16TB Encrypted Array", category: "hardware", slot: "storage", tier: 3, price: 3900, blurb: "Full-disk crypto with a key only you hold.", stats: { scan: 1.6, dissipation: 2 }, rank: 2 },

  { id: "cool-1", name: "Stock Air Cooler", category: "hardware", slot: "cooling", tier: 1, price: 0, blurb: "Loud in a way you stopped hearing.", stats: { dissipation: 2 } },
  { id: "cool-2", name: "360mm AIO Loop", category: "hardware", slot: "cooling", tier: 2, price: 900, blurb: "Cold plate, cold nerves.", stats: { dissipation: 6, coolingWatts: 400 } },
  { id: "cool-3", name: "Custom Hardline Loop", category: "hardware", slot: "cooling", tier: 3, price: 3200, blurb: "Clear tubing, dyed coolant, zero throttling.", stats: { dissipation: 12, coolingWatts: 900 }, rank: 2 },
  { id: "cool-4", name: "Sub-Ambient Chiller", category: "hardware", slot: "cooling", tier: 4, price: 9600, blurb: "The room gets warm so the silicon does not.", stats: { dissipation: 20, coolingWatts: 2000 }, rank: 4 },

  { id: "psu-1", name: "550W Bronze", category: "hardware", slot: "psu", tier: 1, price: 0, blurb: "Adequate, barely, on a good day.", stats: {} },
  { id: "psu-2", name: "1200W Platinum", category: "hardware", slot: "psu", tier: 2, price: 800, blurb: "Headroom is a kind of safety.", stats: { miningMul: 1.05 } },
  { id: "psu-3", name: "2000W Titanium", category: "hardware", slot: "psu", tier: 3, price: 2600, blurb: "Efficiency you can read on the meter.", stats: { miningMul: 1.12 }, rank: 2 },

  { id: "mon-1", name: "Single 24\" 1080p", category: "hardware", slot: "monitors", tier: 1, price: 0, blurb: "One window at a time. Painful.", stats: { scan: 0 } },
  { id: "mon-2", name: "Dual 27\" QHD", category: "hardware", slot: "monitors", tier: 2, price: 1400, blurb: "Terminal left, evidence right.", stats: { scan: 1.1, crack: 0.03 } },
  { id: "mon-3", name: "Triple 32\" 4K Stack", category: "hardware", slot: "monitors", tier: 3, price: 4200, blurb: "A wall of the network, all at once.", stats: { scan: 2.2, crack: 0.06 }, rank: 2 },
  { id: "mon-4", name: "Curved 57\" + Overhead", category: "hardware", slot: "monitors", tier: 4, price: 9800, blurb: "Peripheral vision becomes a feature.", stats: { scan: 3.4, crack: 0.1 }, rank: 3 },

  { id: "desk-1", name: "Particle Board Desk", category: "hardware", slot: "desk", tier: 1, price: 0, blurb: "One leg shimmed with a paperback.", stats: {} },
  { id: "desk-2", name: "Steel Frame Standing Desk", category: "hardware", slot: "desk", tier: 2, price: 700, blurb: "Rock solid at any height.", stats: { dissipation: 1 } },
  { id: "desk-3", name: "Walnut Command Bench", category: "hardware", slot: "desk", tier: 3, price: 2800, blurb: "Cable trays, wireless charging, quiet grain.", stats: { dissipation: 2 }, rank: 2 },

  { id: "chair-1", name: "Kitchen Chair", category: "hardware", slot: "chair", tier: 1, price: 0, blurb: "Your spine keeps a record.", stats: {} },
  { id: "chair-2", name: "Mesh Ergonomic", category: "hardware", slot: "chair", tier: 2, price: 600, blurb: "Long nights cost less.", stats: { crack: 0.02 } },
  { id: "chair-3", name: "Herman-grade Recliner", category: "hardware", slot: "chair", tier: 3, price: 2200, blurb: "You can think in it.", stats: { crack: 0.05 }, rank: 2 },

  { id: "rt-1", name: "ISP Router", category: "hardware", slot: "router", tier: 1, price: 0, blurb: "Logs everything to someone else.", stats: { dissipation: 0 } },
  { id: "rt-2", name: "Hardened Relay Box", category: "hardware", slot: "router", tier: 2, price: 1500, blurb: "Seven hops before your traffic exists.", stats: { dissipation: 5 } },
  { id: "rt-3", name: "Multi-WAN Ghost Relay", category: "hardware", slot: "router", tier: 3, price: 4800, blurb: "Rotates exit paths mid-session.", stats: { dissipation: 11 }, rank: 3 },

  { id: "cpu-5", name: "Xeon VOIDCORE 192C", category: "hardware", slot: "cpu", tier: 5, price: 39000, blurb: "A rack's worth of threads under one lid.", stats: { crack: 0.34, scan: 4.4 }, rank: 4 },
  { id: "gpu-5", name: "TITAN ERIS 256", category: "hardware", slot: "gpu", tier: 5, price: 52000, blurb: "Prototype silicon with no consumer driver.", stats: { crack: 0.26, miningMul: 1.85 }, rank: 4 },
  { id: "ram-4", name: "1TB DDR5 RDIMM", category: "hardware", slot: "ram", tier: 4, price: 12800, blurb: "The whole leak, resident.", stats: { scan: 3.4, crack: 0.11 }, rank: 3 },
  { id: "ram-5", name: "2TB CXL Memory Pool", category: "hardware", slot: "ram", tier: 5, price: 31000, blurb: "Memory that behaves like storage used to.", stats: { scan: 4.6, crack: 0.15 }, rank: 4 },
  { id: "sto-4", name: "64TB NVMe Vault", category: "hardware", slot: "storage", tier: 4, price: 11400, blurb: "Every archive, mirrored twice.", stats: { scan: 2.6, dissipation: 5 }, rank: 3 },
  { id: "sto-5", name: "256TB Blacksite Array", category: "hardware", slot: "storage", tier: 5, price: 28500, blurb: "Self-shredding on the wrong key.", stats: { scan: 3.8, dissipation: 9 }, rank: 4 },
  { id: "cool-5", name: "Cryo Immersion Bay", category: "hardware", slot: "cooling", tier: 5, price: 26000, blurb: "The rig lives in fluid. It never sweats.", stats: { dissipation: 30, coolingWatts: 4200 }, rank: 4 },
  { id: "psu-4", name: "3200W Redundant Pair", category: "hardware", slot: "psu", tier: 4, price: 7400, blurb: "Two supplies, one uninterrupted night.", stats: { miningMul: 1.18 }, rank: 3 },
  { id: "psu-5", name: "Substation Rectifier", category: "hardware", slot: "psu", tier: 5, price: 19800, blurb: "Grid-side conversion. Almost nothing is lost.", stats: { miningMul: 1.26 }, rank: 4 },
  { id: "mon-5", name: "Wraparound Wall Array", category: "hardware", slot: "monitors", tier: 5, price: 24500, blurb: "The network surrounds you, literally.", stats: { scan: 4.8, crack: 0.14 }, rank: 4 },
  { id: "desk-4", name: "Faraday Command Console", category: "hardware", slot: "desk", tier: 4, price: 8600, blurb: "Shielded shell, nothing leaks out of the room.", stats: { dissipation: 6 }, rank: 3 },
  { id: "desk-5", name: "Blacksite Operations Pod", category: "hardware", slot: "desk", tier: 5, price: 22000, blurb: "A workstation you could survive a siege in.", stats: { dissipation: 11, scan: 0.8 }, rank: 4 },
  { id: "chair-4", name: "Zero-G Operator Seat", category: "hardware", slot: "chair", tier: 4, price: 6200, blurb: "Sessions stop ending because your back does.", stats: { crack: 0.08 }, rank: 3 },
  { id: "chair-5", name: "Neural Posture Rig", category: "hardware", slot: "chair", tier: 5, price: 15400, blurb: "It adjusts before you notice you needed it.", stats: { crack: 0.11, scan: 0.5 }, rank: 4 },
  { id: "rt-4", name: "Satellite Uplink Relay", category: "hardware", slot: "router", tier: 4, price: 12600, blurb: "Your traffic leaves the continent first.", stats: { dissipation: 18 }, rank: 3 },
  { id: "rt-5", name: "Phantom Mesh Backbone", category: "hardware", slot: "router", tier: 5, price: 29500, blurb: "A hundred exits, none of them yours.", stats: { dissipation: 28 }, rank: 4 },

  // ── field tools ─────────────────────────────────────────────────────────
  { id: "tool-crack", name: "Cracker Suite v2", category: "tools", tier: 2, price: 1600, blurb: "Better dictionaries, better guesses.", stats: { crack: 0.1 } },
  { id: "tool-crack3", name: "Cracker Suite v3", category: "tools", tier: 3, price: 5200, blurb: "GPU-assisted rotation attacks.", stats: { crack: 0.16 }, rank: 3 },
  { id: "tool-proxy", name: "Proxy Layer Pack", category: "tools", tier: 2, price: 1300, blurb: "Three more hops between you and them.", stats: { dissipation: 8 } },
  { id: "tool-scrub", name: "Log Scrubber Daemon", category: "tools", tier: 3, price: 3400, blurb: "Rewrites your traces continuously.", stats: { dissipation: 14 }, rank: 2 },
  { id: "tool-sock", name: "Social Dossier Engine", category: "tools", tier: 2, price: 2100, blurb: "Pretexts written from real behavioural data.", stats: { crack: 0.05, scan: 0.6 } },
  { id: "tool-split", name: "Split-Session Daemon", category: "tools", tier: 2, price: 4200, blurb: "Hold a second case warm on its own channel.", stats: { opSlots: 1 } },
  { id: "tool-orches", name: "Op Orchestrator", category: "tools", tier: 3, price: 9800, blurb: "A third parallel channel, scheduled and logged.", stats: { opSlots: 1, scan: 0.8 }, rank: 2 },
  { id: "tool-swarm", name: "Swarm Controller", category: "tools", tier: 4, price: 21000, blurb: "Two more channels. Four cases, one operator.", stats: { opSlots: 2, crack: 0.04 }, rank: 3 },

  { id: "tool-hive", name: "Hive Mesh Controller", category: "tools", tier: 5, price: 46000, blurb: "A fifth channel and faster sweeps across all of them.", stats: { opSlots: 1, scan: 1.4, crack: 0.05 }, rank: 4 },

  // ── perks ───────────────────────────────────────────────────────────────
  { id: "perk-cold", name: "Cold Hands", category: "perks", tier: 2, price: 2400, blurb: "Failed operations cost half the usual heat.", stats: { failHeatMul: 0.5 } },
  { id: "perk-fence", name: "Fence Contact", category: "perks", tier: 2, price: 3000, blurb: "Bounties pay 20% more on delivery.", stats: { bounty: 0.2 } },
  { id: "perk-insider", name: "Agency Insider", category: "perks", tier: 3, price: 6500, blurb: "Bounties pay 45% more. Do not ask her name.", stats: { bounty: 0.45 }, rank: 3 },
  { id: "perk-thermal", name: "Thermal Discipline", category: "perks", tier: 3, price: 5800, blurb: "Mining hardware runs 25% cooler.", stats: { miningHeatMul: 0.75 }, rank: 2 },
  { id: "perk-quant", name: "Quant Instinct", category: "perks", tier: 4, price: 11000, blurb: "Mining yield up 30%. You feel the market.", stats: { miningMul: 1.3 }, rank: 4 },
  { id: "perk-taskforce", name: "Task Force Liaison", category: "perks", tier: 4, price: 16500, blurb: "One more parallel case and warmer bounties.", stats: { opSlots: 1, bounty: 0.15 }, rank: 4 },

  { id: "perk-ghost", name: "Ghost Protocol", category: "perks", tier: 5, price: 42000, blurb: "Failures barely register and traces cool on their own.", stats: { failHeatMul: 0.5, dissipation: 18 }, rank: 4 },
  { id: "perk-cartel", name: "Cartel Broker", category: "perks", tier: 5, price: 58000, blurb: "Bounties pay 70% more and the farm runs 20% hotter on yield.", stats: { bounty: 0.7, miningMul: 1.2 }, rank: 4 },

  // ── mining hardware ─────────────────────────────────────────────────────
  { id: "min-shelf", name: "Steel Mining Shelf", category: "mining", tier: 1, price: 450, blurb: "Holds six units off the floor.", stackable: true, mining: { kind: "shelf", hash: 0, watts: 0, heat: 0, slots: 6 } },
  { id: "min-gpu1", name: "GPU Rig — 6× 4060", category: "mining", tier: 1, price: 1900, blurb: "Open frame, zip ties, honest work.", stackable: true, mining: { kind: "gpu", hash: 42, watts: 640, heat: 7 } },
  { id: "min-gpu2", name: "GPU Rig — 8× 5080", category: "mining", tier: 2, price: 6400, blurb: "Riser cables neat enough to photograph.", stackable: true, mining: { kind: "gpu", hash: 155, watts: 1850, heat: 18 }, rank: 2 },
  { id: "min-asic1", name: "ASIC S19 Pro", category: "mining", tier: 2, price: 4800, blurb: "A hairdryer that prints. Loud.", stackable: true, mining: { kind: "asic", hash: 240, watts: 3050, heat: 26 } },
  { id: "min-asic2", name: "ASIC S23 Hydro", category: "mining", tier: 3, price: 15400, blurb: "Water-cooled, rack-mounted, relentless.", stackable: true, mining: { kind: "asic", hash: 720, watts: 5300, heat: 30 }, rank: 3 },
  { id: "min-asic3", name: "ASIC BLACKSITE XM", category: "mining", tier: 4, price: 38000, blurb: "Immersion tank included. Do not open it.", stackable: true, mining: { kind: "asic", hash: 2100, watts: 11000, heat: 42 }, rank: 4 },
  { id: "min-gpu3", name: "GPU Rig — 12× 5090", category: "mining", tier: 3, price: 18900, blurb: "A wall of fans on a welded frame.", stackable: true, mining: { kind: "gpu", hash: 430, watts: 4200, heat: 27 }, rank: 3 },
  { id: "min-asic4", name: "ASIC OBSIDIAN TITAN", category: "mining", tier: 5, price: 96000, blurb: "Substation-grade. Ships on a pallet.", stackable: true, mining: { kind: "asic", hash: 5800, watts: 26000, heat: 74 }, rank: 4 },
  { id: "min-shelf2", name: "Datacentre Rack Frame", category: "mining", tier: 3, price: 3600, blurb: "Twenty slots, hot-aisle ready.", stackable: true, mining: { kind: "shelf", hash: 0, watts: 0, heat: 0, slots: 20 }, rank: 2 },
  { id: "min-fan", name: "Industrial Wall Fan", category: "mining", tier: 1, price: 380, blurb: "Moves the hot air somewhere else.", stackable: true, mining: { kind: "cooler", hash: 0, watts: 90, heat: -14 } },
  { id: "min-ac", name: "Ducted AC Unit", category: "mining", tier: 2, price: 2400, blurb: "Actual refrigeration for the room.", stackable: true, mining: { kind: "cooler", hash: 0, watts: 420, heat: -48 } },
  { id: "min-immersion", name: "Immersion Cooling Tank", category: "mining", tier: 4, price: 12800, blurb: "Dielectric fluid, silent, absurd.", stackable: true, mining: { kind: "cooler", hash: 0, watts: 300, heat: -140 }, rank: 3 },

  { id: "min-cryo", name: "Cryogenic Loop Plant", category: "mining", tier: 5, price: 44000, blurb: "Industrial refrigeration for an industrial problem.", stackable: true, mining: { kind: "cooler", hash: 0, watts: 900, heat: -420 }, rank: 4 },

  // ── power contracts ─────────────────────────────────────────────────────
  { id: "pow-1", name: "Residential Meter", category: "mining", tier: 1, price: 0, blurb: "7 kW ceiling, brutal peak pricing, no exit fee.", mining: { kind: "contract", hash: 0, watts: 0, heat: 0, capacityKw: 7, pricePerKwh: 0.34, peakMul: 1.9, offPeakMul: 0.9, overageMul: 3.5, switchFee: 0, demandPerKw: 0 } },
  { id: "pow-2", name: "Small Business Line", category: "mining", tier: 2, price: 3200, blurb: "22 kW, flatter peak curve, small exit fee.", mining: { kind: "contract", hash: 0, watts: 0, heat: 0, capacityKw: 22, pricePerKwh: 0.21, peakMul: 1.45, offPeakMul: 0.82, overageMul: 3, switchFee: 400, demandPerKw: 0.4 } },
  { id: "pow-3", name: "Industrial Feed", category: "mining", tier: 3, price: 11500, blurb: "80 kW. Demand charges, gentle peaks.", mining: { kind: "contract", hash: 0, watts: 0, heat: 0, capacityKw: 80, pricePerKwh: 0.12, peakMul: 1.2, offPeakMul: 0.75, overageMul: 2.4, switchFee: 1800, demandPerKw: 1.2 }, rank: 3 },
  { id: "pow-4", name: "Hydro Substation Lease", category: "mining", tier: 4, price: 34000, blurb: "250 kW of meltwater. Flat rate, heavy exit fee.", mining: { kind: "contract", hash: 0, watts: 0, heat: 0, capacityKw: 250, pricePerKwh: 0.05, peakMul: 1.05, offPeakMul: 0.95, overageMul: 2, switchFee: 6000, demandPerKw: 2.2 }, rank: 4 },

  { id: "pow-5", name: "Reactor Interconnect", category: "mining", tier: 5, price: 120000, blurb: "900 kW straight off the bus. Nothing throttles.", mining: { kind: "contract", hash: 0, watts: 0, heat: 0, capacityKw: 900, pricePerKwh: 0.03, peakMul: 1, offPeakMul: 1, overageMul: 1.8, switchFee: 18000, demandPerKw: 3.1 }, rank: 4 },

  // ── Stars-tier equipment ────────────────────────────────────────────────
  // Sold through the premium shop. Dual-priced: buyable with credits too, at a
  // grind price calibrated against endgame farm output.
  { id: "gpu-x", name: "TITAN ERIS-X Blacksite Core", category: "hardware", slot: "gpu", tier: 5, price: 4_500_000, blurb: "Stars-tier silicon. There are eleven of these.", stats: { crack: 0.32, miningMul: 2.2 }, rank: 4 },
  { id: "min-quantum", name: "QUANTUM LATTICE ASIC", category: "mining", tier: 5, price: 2_000_000, blurb: "Stars-tier miner. Coherence-locked, absurdly fast.", stackable: true, mining: { kind: "asic", hash: 9800, watts: 24000, heat: 60 }, rank: 4 },
  { id: "min-zeropoint", name: "ZERO-POINT THERMAL SINK", category: "mining", tier: 5, price: 1_200_000, blurb: "Stars-tier cooling. The room gets colder as the farm grows.", stackable: true, mining: { kind: "cooler", hash: 0, watts: 1500, heat: -1200 }, rank: 4 },
  { id: "tool-oracle", name: "Oracle Mesh Array", category: "tools", tier: 5, price: 6_000_000, blurb: "Stars-tier tooling. Two more channels and near-instant sweeps.", stats: { opSlots: 2, scan: 2.2, crack: 0.08 }, rank: 4 },
  { id: "perk-immunity", name: "Diplomatic Immunity", category: "perks", tier: 5, price: 5_000_000, blurb: "Stars-tier perk. Bounties pay double and nothing sticks to you.", stats: { bounty: 1, failHeatMul: 0.4, dissipation: 25 }, rank: 4 },

  // ── customization ───────────────────────────────────────────────────────
  { id: "light-cyan", name: "Lighting — Ice Cyan", category: "custom", slot: "lighting", tier: 1, price: 240, blurb: "Cold light on brushed aluminium." },
  { id: "light-crimson", name: "Lighting — Crimson Alert", category: "custom", slot: "lighting", tier: 1, price: 240, blurb: "The room looks like a warning." },
  { id: "light-green", name: "Lighting — Terminal Green", category: "custom", slot: "lighting", tier: 1, price: 240, blurb: "Phosphor nostalgia." },
  { id: "light-violet", name: "Lighting — Deep Violet", category: "custom", slot: "lighting", tier: 2, price: 480, blurb: "Expensive-looking in every photograph." },
  { id: "mat-1", name: "Deskmat — Charcoal Weave", category: "custom", slot: "deskmat", tier: 1, price: 120, blurb: "Quiet under the hands." },
  { id: "mat-2", name: "Deskmat — Circuit Map", category: "custom", slot: "deskmat", tier: 2, price: 320, blurb: "A city seen from orbit." },
  { id: "post-1", name: "Poster — Rain City", category: "custom", slot: "poster", tier: 1, price: 180, blurb: "Neon on wet asphalt." },
  { id: "post-2", name: "Poster — Cascade", category: "custom", slot: "poster", tier: 2, price: 400, blurb: "Falling glyphs. You know the one." },

  // rig themes — restyle the whole workspace render
  { id: "rig-theme-blacksite", name: "Rig Theme — Blacksite", category: "custom", slot: "rigTheme", tier: 1, price: 0, blurb: "Matte black walls, cold cyan architecture. The default posture." },
  { id: "rig-theme-deepweb", name: "Rig Theme — Deep Web", category: "custom", slot: "rigTheme", tier: 1, price: 1800, blurb: "Phosphor green bleeding out of every seam." },
  { id: "rig-theme-corporate", name: "Rig Theme — Corporate Ghost", category: "custom", slot: "rigTheme", tier: 2, price: 4200, blurb: "Clean grey and white. Looks like nothing illegal happens here." },
  { id: "rig-theme-redline", name: "Rig Theme — Redline", category: "custom", slot: "rigTheme", tier: 2, price: 4800, blurb: "Everything is an alert. You stop noticing." },
  { id: "rig-theme-quantum", name: "Rig Theme — Quantum Lab", category: "custom", slot: "rigTheme", tier: 3, price: 12000, blurb: "Clinical blue. Filtered air you can almost smell.", rank: 2 },
  { id: "rig-theme-cyberpunk", name: "Rig Theme — Cyberpunk", category: "custom", slot: "rigTheme", tier: 3, price: 15000, blurb: "Amber and magenta on wet violet.", rank: 2 },
  { id: "rig-theme-neon", name: "Rig Theme — Neon Network", category: "custom", slot: "rigTheme", tier: 4, price: 0, blurb: "Stars-exclusive. Magenta grid lighting throughout." },
  { id: "rig-theme-classified", name: "Rig Theme — Classified", category: "custom", slot: "rigTheme", tier: 5, price: 0, blurb: "Stars-exclusive. Redacted black and warning amber." },

  // miner finishes — restyle every unit in the farm render
  { id: "miner-theme-industrial", name: "Miner Finish — Industrial", category: "custom", slot: "minerTheme", tier: 1, price: 0, blurb: "Bare steel and amber status LEDs." },
  { id: "miner-theme-tactical", name: "Miner Finish — Tactical", category: "custom", slot: "minerTheme", tier: 1, price: 2200, blurb: "Olive drab chassis, low-vis green indicators." },
  { id: "miner-theme-blacksite", name: "Miner Finish — Blacksite", category: "custom", slot: "minerTheme", tier: 2, price: 6400, blurb: "Anodised black with cyan telemetry." },
  { id: "miner-theme-quantum", name: "Miner Finish — Quantum", category: "custom", slot: "minerTheme", tier: 3, price: 16500, blurb: "Mirror-polished deep blue. Reflects the whole room.", rank: 2 },
  { id: "miner-theme-neon", name: "Miner Finish — Neon", category: "custom", slot: "minerTheme", tier: 4, price: 0, blurb: "Stars-exclusive. Magenta-lit violet shells." },
  { id: "miner-theme-experimental", name: "Miner Finish — Experimental", category: "custom", slot: "minerTheme", tier: 5, price: 0, blurb: "Stars-exclusive. Chrome and impossible teal." },

  // HUD themes — retint the console itself
  { id: "ui-theme-terminal", name: "HUD Theme — Terminal", category: "custom", slot: "uiTheme", tier: 1, price: 0, blurb: "Stock H.C.C console colours." },
  { id: "ui-theme-darkgrid", name: "HUD Theme — Dark Grid", category: "custom", slot: "uiTheme", tier: 1, price: 1500, blurb: "Desaturated, low-glare. Easier on a long night." },
  { id: "ui-theme-blacksite", name: "HUD Theme — Blacksite", category: "custom", slot: "uiTheme", tier: 2, price: 5200, blurb: "Task-force issue. Colder cyan, warmer amber." },
  { id: "ui-theme-cyberops", name: "HUD Theme — Cyber Ops", category: "custom", slot: "uiTheme", tier: 4, price: 0, blurb: "Stars-exclusive. Magenta command palette." },
  { id: "ui-theme-classified", name: "HUD Theme — Classified", category: "custom", slot: "uiTheme", tier: 5, price: 0, blurb: "Stars-exclusive. Warning amber across the whole console." },

  // operation badges — worn in the console header
  { id: "badge-rookie", name: "Badge — Rookie", category: "custom", slot: "badge", tier: 1, price: 0, blurb: "Everyone starts here." },
  { id: "badge-operator", name: "Badge — Operator", category: "custom", slot: "badge", tier: 1, price: 900, blurb: "You have filed a dossier that stuck." },
  { id: "badge-specialist", name: "Badge — Specialist", category: "custom", slot: "badge", tier: 2, price: 3600, blurb: "Called in for the ones nobody else can close." },
  { id: "badge-ghost", name: "Badge — Ghost", category: "custom", slot: "badge", tier: 3, price: 11000, blurb: "No record of you exists in any system.", rank: 2 },
  { id: "badge-blacksite", name: "Badge — Blacksite", category: "custom", slot: "badge", tier: 4, price: 34000, blurb: "Clearance that is not written down anywhere.", rank: 3 },
  { id: "badge-elite", name: "Badge — Elite", category: "custom", slot: "badge", tier: 5, price: 120000, blurb: "Top of the board. Everyone knows the handle.", rank: 4 },
  { id: "badge-apex", name: "Badge — Apex", category: "custom", slot: "badge", tier: 5, price: 0, blurb: "Stars-exclusive. There is no rank above this." },
];


export const itemById = (id: string | undefined | null): Item | undefined =>
  CATALOG.find((i) => i.id === id);

export const DEFAULT_INSTALLED: Partial<Record<Slot, string>> = {
  cpu: "cpu-1",
  gpu: "gpu-1",
  ram: "ram-1",
  storage: "sto-1",
  cooling: "cool-1",
  psu: "psu-1",
  monitors: "mon-1",
  desk: "desk-1",
  chair: "chair-1",
  router: "rt-1",
  lighting: "light-cyan",
  deskmat: "mat-1",
  rigTheme: "rig-theme-blacksite",
  minerTheme: "miner-theme-industrial",
  uiTheme: "ui-theme-terminal",
  badge: "badge-rookie",
};

export const STARTER_OWNED: readonly string[] = [
  ...Object.values(DEFAULT_INSTALLED),
  "pow-1",
];

export const SLOT_LABEL: Record<Slot, string> = {
  cpu: "Processor",
  gpu: "Graphics",
  ram: "Memory",
  storage: "Storage",
  cooling: "Cooling",
  psu: "Power supply",
  monitors: "Displays",
  desk: "Desk",
  chair: "Chair",
  router: "Relay",
  lighting: "Lighting",
  deskmat: "Deskmat",
  poster: "Wall art",
  rigTheme: "Rig theme",
  minerTheme: "Miner finish",
  uiTheme: "HUD theme",
  badge: "Badge",
};

export const COINS: Record<Coin, { name: string; perHash: number; base: number; vol: number }> = {
  BTC: { name: "Bitcoin", perHash: 0.0000000042, base: 96000, vol: 0.05 },
  ETH: { name: "Ethereum", perHash: 0.000000091, base: 4200, vol: 0.09 },
  GHST: { name: "Ghostcoin", perHash: 0.0000061, base: 62, vol: 0.28 },
};

export const LIGHT_HEX: Record<string, string> = {
  "light-cyan": "#38e1ff",
  "light-crimson": "#ff2f55",
  "light-green": "#39ff9e",
  "light-violet": "#a06bff",
};
