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
    this.startAmbience();
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

  // ── ambient bed: low electrical hum, occasional beeps, relay clicks ───────
  private startAmbience(): void {
    if (this.musicTimer !== null) return;
    const ctx = this.ctx!;
    const bus = this.musicBus!;

    // deep electrical hum — transformer drone under everything
    const humOut = ctx.createGain();
    humOut.gain.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 240;
    humOut.connect(lp).connect(bus);
    [40, 60, 120, 180].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i > 1 ? "triangle" : "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = [0.09, 0.07, 0.03, 0.014][i]!;
      // slow amplitude wander so it breathes like a real room
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.011;
      const lg = ctx.createGain();
      lg.gain.value = g.gain.value * 0.45;
      lfo.connect(lg).connect(g.gain);
      lfo.start();
      o.connect(g).connect(humOut);
      o.start();
    });

    // faint mains buzz layer
    const buzz = ctx.createBufferSource();
    buzz.buffer = this.noiseBuffer();
    buzz.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 90;
    bp.Q.value = 3;
    const bg = ctx.createGain();
    bg.gain.value = 0.05;
    buzz.connect(bp).connect(bg).connect(bus);
    buzz.start();

    // occasional telemetry beeps, relay clicks and disk chatter
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.settings.muted || this.settings.music <= 0.001) return;
      const r = Math.random();
      if (r < 0.34) this.beep(660 + Math.round(Math.random() * 4) * 110);
      else if (r < 0.5) this.beep(420, 0.05, 0.05);
      else if (r < 0.68) this.relay();
      else if (r < 0.78) this.sweepTick();
    }, 2600);
  }

  private beep(freq: number, dur = 0.09, amp = 0.055): void {
    const ctx = this.ctx!;
    const bus = this.musicBus!;
    const t = ctx.currentTime + Math.random() * 0.4;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private relay(): void {
    const ctx = this.ctx!;
    const bus = this.musicBus!;
    const t = ctx.currentTime + Math.random() * 0.6;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400 + Math.random() * 1800;
    f.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(f).connect(g).connect(bus);
    src.start(t);
    src.stop(t + 0.1);
  }

  private sweepTick(): void {
    const ctx = this.ctx!;
    const bus = this.musicBus!;
    const t = ctx.currentTime + Math.random() * 0.5;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.022, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.6);
  }

  /** Spoken alert in a female voice where the platform offers one. */
  speak(text: string): void {
    if (this.settings.muted || typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const female =
      voices.find((v) => /female|samantha|victoria|zira|karen|serena|moira|tessa/i.test(v.name)) ??
      voices.find((v) => v.lang.startsWith("en"));
    if (female) u.voice = female;
    u.pitch = 1.15;
    u.rate = 0.95;
    u.volume = clamp(this.settings.sfx);
    synth.cancel();
    synth.speak(u);
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
