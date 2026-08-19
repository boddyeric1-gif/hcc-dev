/**
 * Synthesised audio for H.C.C — everything is generated with the Web Audio API,
 * so there are no asset files, no network fetches and no licensing concerns.
 */

export type SfxName =
  | "click"
  | "tab"
  | "key"
  | "buy"
  | "ok"
  | "fail"
  | "alert"
  | "unlock";

export type FarmAudio = {
  units: number;
  load: number; // 0..1 throttle-weighted activity
  heat: number; // 0..1
  online: boolean;
};

type Settings = { muted: boolean; music: number; sfx: number };

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));

class HccAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambBus: GainNode | null = null;

  private humGain: GainNode | null = null;
  private fanGain: GainNode | null = null;
  private fanFilter: BiquadFilterNode | null = null;
  private whineGain: GainNode | null = null;
  private whineOsc: OscillatorNode | null = null;

  private musicTimer: number | null = null;
  private step = 0;
  private settings: Settings = { muted: false, music: 0.5, sfx: 0.7 };
  private started = false;

  get ready(): boolean {
    return this.started;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start(): void {
    if (this.started) return;
    const Ctor: typeof AudioContext | undefined =
      typeof window === "undefined"
        ? undefined
        : window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    const mk = (v: number) => {
      const g = ctx.createGain();
      g.gain.value = v;
      g.connect(master);
      return g;
    };
    this.musicBus = mk(this.settings.music);
    this.sfxBus = mk(this.settings.sfx);
    this.ambBus = mk(0.9);

    this.buildAmbience();
    this.startMusic();
    this.started = true;
    this.applySettings();
    master.gain.setTargetAtTime(this.settings.muted ? 0 : 1, ctx.currentTime, 0.6);
  }

  resume(): void {
    void this.ctx?.resume();
  }

  setSettings(s: Settings): void {
    this.settings = s;
    this.applySettings();
  }

  private applySettings(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.muted ? 0 : 1, t, 0.15);
    this.musicBus?.gain.setTargetAtTime(clamp(this.settings.music), t, 0.2);
    this.sfxBus?.gain.setTargetAtTime(clamp(this.settings.sfx), t, 0.2);
  }

  // ── ambience: room hum + fan wash + coil whine ────────────────────────────
  private noiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  private buildAmbience(): void {
    const ctx = this.ctx!;
    const amb = this.ambBus!;

    // mains hum — 50 Hz plus a harmonic
    const hum = ctx.createGain();
    hum.gain.value = 0.0;
    hum.connect(amb);
    [50, 100, 150].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = [0.6, 0.18, 0.07][i]!;
      o.connect(g).connect(hum);
      o.start();
    });
    this.humGain = hum;

    // fan wash — filtered brown noise
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const fan = ctx.createGain();
    fan.gain.value = 0;
    src.connect(filter).connect(fan).connect(amb);
    src.start();
    this.fanGain = fan;
    this.fanFilter = filter;

    // coil whine — thin high tone that rises with load
    const whine = ctx.createOscillator();
    whine.type = "sawtooth";
    whine.frequency.value = 2400;
    const wf = ctx.createBiquadFilter();
    wf.type = "highpass";
    wf.frequency.value = 1800;
    const wg = ctx.createGain();
    wg.gain.value = 0;
    whine.connect(wf).connect(wg).connect(amb);
    whine.start();
    this.whineOsc = whine;
    this.whineGain = wg;
  }

  setFarm(f: FarmAudio): void {
    const ctx = this.ctx;
    if (!ctx || !this.humGain || !this.fanGain || !this.whineGain) return;
    const t = ctx.currentTime;
    const density = clamp(f.units / 8);
    const active = f.online ? 1 : 0.25;
    this.humGain.gain.setTargetAtTime(0.028 * (0.5 + density) * active, t, 1.2);
    this.fanGain.gain.setTargetAtTime(0.05 * (0.25 + density * 1.1) * active, t, 1.2);
    this.fanFilter?.frequency.setTargetAtTime(340 + f.load * 460 + f.heat * 300, t, 1.5);
    this.whineGain.gain.setTargetAtTime(f.online ? 0.0016 * (0.3 + f.load) : 0, t, 1.5);
    this.whineOsc?.frequency.setTargetAtTime(2100 + f.load * 900 + f.heat * 600, t, 1.5);
  }

  // ── music: slow sci-fi pad + sparse arpeggio ──────────────────────────────
  private startMusic(): void {
    if (this.musicTimer !== null) return;
    const ctx = this.ctx!;

    // drone pad
    const pad = ctx.createGain();
    pad.gain.value = 0.055;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 900;
    pad.connect(padFilter).connect(this.musicBus!);
    [110, 164.81, 220, 329.63].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.017;
      const lg = ctx.createGain();
      lg.gain.value = 0.9 + i;
      lfo.connect(lg).connect(o.frequency);
      lfo.start();
      const g = ctx.createGain();
      g.gain.value = 0.22 / (i + 1);
      o.connect(g).connect(pad);
      o.start();
    });

    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.settings.muted || this.settings.music <= 0.001) return;
      this.step += 1;
      if (this.step % 2 === 0 && Math.random() > 0.45) return;
      const note = scale[Math.floor(Math.random() * scale.length)]!;
      this.pluck(note * (Math.random() > 0.8 ? 2 : 1), 0.9, this.musicBus!);
      if (this.step % 8 === 0) this.pluck(note / 2, 2.4, this.musicBus!, 0.35);
    }, 640);
  }

  private pluck(freq: number, dur: number, bus: GainNode, amp = 0.16): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(600, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // ── one-shot effects ──────────────────────────────────────────────────────
  sfx(name: SfxName): void {
    const ctx = this.ctx;
    const bus = this.sfxBus;
    if (!ctx || !bus || this.settings.muted) return;
    const t = ctx.currentTime;

    const blip = (freq: number, dur: number, type: OscillatorType, amp: number, slide = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + dur + 0.02);
    };

    switch (name) {
      case "key":
        blip(1500 + Math.random() * 700, 0.035, "square", 0.045);
        break;
      case "click":
      case "tab":
        blip(880, 0.06, "square", 0.06, 340);
        break;
      case "buy":
        blip(520, 0.09, "triangle", 0.1, 380);
        window.setTimeout(() => blip(1040, 0.12, "triangle", 0.08), 70);
        break;
      case "ok":
        blip(660, 0.1, "sine", 0.11, 260);
        window.setTimeout(() => blip(990, 0.18, "sine", 0.09), 90);
        break;
      case "fail":
        blip(240, 0.28, "sawtooth", 0.09, -110);
        break;
      case "alert":
        blip(1200, 0.16, "square", 0.09, -520);
        window.setTimeout(() => blip(1200, 0.16, "square", 0.08, -520), 200);
        break;
      case "unlock":
        [330, 440, 660, 880].forEach((f, i) =>
          window.setTimeout(() => blip(f, 0.3, "triangle", 0.1), i * 110),
        );
        break;
    }
  }
}

export const audio = new HccAudio();
