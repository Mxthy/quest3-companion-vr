/**
 * Standalone Audio System for the Apartment simulation.
 * Manages loading and playback of /audio/*.wav files (click, gift, cook, giggle, city)
 * as well as procedural synthesis for radio and presence bed.
 */

export type SfxName = "click" | "gift" | "cook" | "giggle";

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private unlocked = false;

  private sfxBuffers: Map<SfxName, AudioBuffer> = new Map();
  private cityBuffer: AudioBuffer | null = null;

  private citySource: AudioBufferSourceNode | null = null;
  private cityGain: GainNode | null = null;
  private cityPlaying = false;
  private cityVol = 0.22;

  private radioOsc: OscillatorNode | null = null;
  private radioGain: GainNode | null = null;

  /** Soft presence bed — very quiet filtered noise / tone */
  private presenceOsc: OscillatorNode | null = null;
  private presenceGain: GainNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private proxCooldown = 0;

  constructor() {
    // Lazily initialized upon interaction or unlock
  }

  private ac(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private async loadWav(url: string): Promise<AudioBuffer | null> {
    const c = this.ac();
    if (!c) return null;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const arr = await resp.arrayBuffer();
      return await c.decodeAudioData(arr);
    } catch {
      return null;
    }
  }

  public async preloadAssets(): Promise<void> {
    const sfxNames: SfxName[] = ["click", "gift", "cook", "giggle"];
    await Promise.all([
      ...sfxNames.map(async (name) => {
        const buf = await this.loadWav("/audio/" + name + ".wav");
        if (buf) this.sfxBuffers.set(name, buf);
      }),
      (async () => {
        const buf = await this.loadWav("/audio/city.wav");
        if (buf) this.cityBuffer = buf;
      })(),
    ]);
  }

  public unlockAudio(): void {
    if (this.unlocked) {
      const c = this.ac();
      if (c && c.state === "suspended") void c.resume();
      this.ensurePresenceBed();
      return;
    }
    this.unlocked = true;
    const c = this.ac();
    if (c && c.state === "suspended") void c.resume();

    // Lazy asset load if not preloaded
    if (this.sfxBuffers.size === 0 && !this.cityBuffer) {
      void this.preloadAssets().then(() => {
        if (this.cityPlaying && !this.citySource) {
          this.startCityLoop();
        }
      });
    }

    this.startCityLoop();
    this.ensurePresenceBed();
  }

  private startCityLoop(): void {
    const c = this.ac();
    if (!c || !this.cityBuffer || this.citySource) return;
    try {
      const src = c.createBufferSource();
      const gain = c.createGain();
      src.buffer = this.cityBuffer;
      src.loop = true;
      gain.gain.value = this.cityVol;
      src.connect(gain);
      gain.connect(c.destination);
      src.start();
      this.citySource = src;
      this.cityGain = gain;
      this.cityPlaying = true;
    } catch {
      /* ignore */
    }
  }

  private stopCityLoop(): void {
    if (this.citySource) {
      try {
        this.citySource.stop();
        this.citySource.disconnect();
      } catch {
        /* ignore */
      }
      this.citySource = null;
    }
    if (this.cityGain) {
      try {
        this.cityGain.disconnect();
      } catch {
        /* ignore */
      }
      this.cityGain = null;
    }
    this.cityPlaying = false;
  }

  public playSfx(name: SfxName): void {
    const c = this.ac();
    if (!c) return;
    const buf = this.sfxBuffers.get(name);
    if (!buf) {
      // Fallback: try loading once on-demand if buffer missing
      void this.loadWav("/audio/" + name + ".wav").then((loadedBuf) => {
        if (loadedBuf) {
          this.sfxBuffers.set(name, loadedBuf);
          this.playSfx(name);
        }
      });
      return;
    }

    try {
      const src = c.createBufferSource();
      const gain = c.createGain();
      src.buffer = buf;
      const defaultVol: Record<SfxName, number> = {
        click: 0.45,
        gift: 0.55,
        cook: 0.5,
        giggle: 0.5,
      };
      gain.gain.value = defaultVol[name] ?? 0.5;
      src.playbackRate.value = 0.94 + Math.random() * 0.12;

      src.connect(gain);
      gain.connect(c.destination);
      src.start();
    } catch {
      /* ignore */
    }
  }

  public setAmbience(on: boolean, vol = 0.22): void {
    this.cityVol = vol;
    if (this.cityGain) {
      this.cityGain.gain.value = on ? vol : 0;
    }
    if (on) {
      this.cityPlaying = true;
      if (!this.citySource && this.cityBuffer) {
        this.startCityLoop();
      }
    } else {
      this.stopCityLoop();
    }
  }

  private ensurePresenceBed(): void {
    const c = this.ac();
    if (!c || this.presenceOsc) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.value = 110;
      filter.type = "lowpass";
      filter.frequency.value = 280;
      gain.gain.value = 0.0001;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      osc.start();
      this.presenceOsc = osc;
      this.presenceGain = gain;
      this.presenceFilter = filter;
    } catch {
      /* */
    }
  }

  /** Continuous immersion mix from director */
  public setImmersionMix(proximity: number, warmth01: number, night: boolean): void {
    this.ensurePresenceBed();
    if (!this.presenceGain || !this.presenceFilter || !this.presenceOsc) return;
    const now = this.ctx?.currentTime ?? 0;
    // Closer → slightly more body in the bed, never loud
    const target = 0.002 + proximity * 0.012 * (0.5 + warmth01 * 0.5) * (night ? 0.85 : 1);
    this.presenceGain.gain.cancelScheduledValues(now);
    this.presenceGain.gain.linearRampToValueAtTime(target, now + 0.15);
    this.presenceFilter.frequency.linearRampToValueAtTime(220 + proximity * 180, now + 0.2);
    this.presenceOsc.frequency.linearRampToValueAtTime(98 + warmth01 * 40, now + 0.25);
  }

  /** Sparse soft tick when very close — not a metronome */
  public playProximityTone(proximity: number, dt: number): void {
    this.proxCooldown -= dt;
    if (this.proxCooldown > 0 || proximity < 0.75) return;
    this.proxCooldown = 2.8 + Math.random() * 2.5;
    const c = this.ac();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = 320 + proximity * 80;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(c.destination);
      const t0 = c.currentTime;
      g.gain.linearRampToValueAtTime(0.018 * proximity, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.start(t0);
      o.stop(t0 + 0.5);
    } catch {
      /* */
    }
  }

  public setRadio(on: boolean): void {
    if (on) this.startRadio();
    else this.stopRadio();
  }

  private startRadio(): void {
    try {
      const c = this.ac();
      if (!c) return;
      this.stopRadio();
      const osc = c.createOscillator();
      const gain = c.createGain();
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = 196;
      lfo.frequency.value = 0.35;
      lfoGain.gain.value = 12;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      lfo.start();
      this.radioOsc = osc;
      this.radioGain = gain;
    } catch {
      /* ignore */
    }
  }

  private stopRadio(): void {
    try {
      this.radioOsc?.stop();
    } catch {
      /* already stopped */
    }
    this.radioOsc?.disconnect();
    this.radioGain?.disconnect();
    this.radioOsc = null;
    this.radioGain = null;
  }

  public disposeAudio(): void {
    this.stopRadio();
    try {
      this.presenceOsc?.stop();
    } catch {
      /* */
    }
    this.presenceOsc?.disconnect();
    this.presenceGain?.disconnect();
    this.presenceFilter?.disconnect();
    this.presenceOsc = null;
    this.presenceGain = null;
    this.presenceFilter = null;

    this.stopCityLoop();
    this.sfxBuffers.clear();
    this.cityBuffer = null;
  }
}

// Module singleton instance + functional exports matching legacy API
export const defaultAudioSystem = new AudioSystem();

export function unlockAudio(): void {
  defaultAudioSystem.unlockAudio();
}

export function playSfx(name: SfxName): void {
  defaultAudioSystem.playSfx(name);
}

export function setAmbience(on: boolean, vol = 0.22): void {
  defaultAudioSystem.setAmbience(on, vol);
}

export function setImmersionMix(proximity: number, warmth01: number, night: boolean): void {
  defaultAudioSystem.setImmersionMix(proximity, warmth01, night);
}

export function playProximityTone(proximity: number, dt: number): void {
  defaultAudioSystem.playProximityTone(proximity, dt);
}

export function setRadio(on: boolean): void {
  defaultAudioSystem.setRadio(on);
}

export function disposeAudio(): void {
  defaultAudioSystem.disposeAudio();
}
