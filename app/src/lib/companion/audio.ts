type AudioKit = {
  ctx: AudioContext;
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
  ambientSrc: OscillatorNode[];
  recordTimer: number | null;
  recordOn: boolean;
};

let kit: AudioKit | null = null;
let muted = false;

function freq(n: number) {
  return 220 * Math.pow(2, n / 12);
}

export function unlockAudio() {
  if (!kit) {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx({ latencyHint: "interactive" });
    const master = ctx.createGain();
    const music = ctx.createGain();
    const sfx = ctx.createGain();
    master.gain.value = muted ? 0 : 0.85;
    music.gain.value = 0.22;
    sfx.gain.value = 0.5;
    music.connect(master);
    sfx.connect(master);
    master.connect(ctx.destination);

    const pad1 = ctx.createOscillator();
    const pad2 = ctx.createOscillator();
    const padGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    pad1.type = "sine";
    pad2.type = "sine";
    pad1.frequency.value = 110;
    pad2.frequency.value = 164.8;
    padGain.gain.value = 0.035;
    filter.type = "lowpass";
    filter.frequency.value = 420;
    pad1.connect(filter);
    pad2.connect(filter);
    filter.connect(padGain);
    padGain.connect(music);
    pad1.start();
    pad2.start();

    kit = {
      ctx,
      master,
      music,
      sfx,
      ambientSrc: [pad1, pad2],
      recordTimer: null,
      recordOn: false,
    };
  }
  if (kit.ctx.state === "suspended") {
    void kit.ctx.resume();
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (!kit) return;
  kit.master.gain.setTargetAtTime(next ? 0 : 0.85, kit.ctx.currentTime, 0.04);
}

export function isMuted() {
  return muted;
}

function pluck(hz: number, when: number, dur = 0.35, vol = 0.18) {
  if (!kit) return;
  const { ctx, sfx } = kit;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(hz, when);
  osc.frequency.exponentialRampToValueAtTime(hz * 0.92, when + dur);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(sfx);
  osc.start(when);
  osc.stop(when + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export function playPickup() {
  if (!kit) return;
  const t = kit.ctx.currentTime;
  pluck(freq(7), t, 0.22, 0.16);
  pluck(freq(12), t + 0.04, 0.2, 0.1);
}

export function playPlace() {
  if (!kit) return;
  const t = kit.ctx.currentTime;
  pluck(freq(4), t, 0.28, 0.14);
  pluck(freq(9), t + 0.05, 0.32, 0.12);
}

export function playSoft() {
  if (!kit) return;
  pluck(freq(16), kit.ctx.currentTime, 0.4, 0.08);
}

export function speakTone() {
  if (!kit) return;
  const { ctx, sfx } = kit;
  const t = ctx.currentTime;
  const notes = [7, 9, 12, 9];
  notes.forEach((n, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 320 * Math.pow(2, n / 12);
    f.type = "bandpass";
    f.frequency.value = 740;
    f.Q.value = 3.2;
    const start = t + i * 0.11;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.07, start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(f);
    f.connect(g);
    g.connect(sfx);
    osc.start(start);
    osc.stop(start + 0.24);
    osc.onended = () => {
      osc.disconnect();
      f.disconnect();
      g.disconnect();
    };
  });
}

export function startRecord() {
  if (!kit) return;
  if (kit.recordOn) return;
  kit.recordOn = true;
  const pattern = [0, 3, 7, 10, 7, 3];
  let step = 0;
  const tick = () => {
    if (!kit?.recordOn) return;
    const t = kit.ctx.currentTime;
    pluck(freq(pattern[step]!) * 2, t, 0.5, 0.07);
    if (step % 2 === 0) pluck(freq(pattern[step]!) * 1, t, 0.55, 0.05);
    step = (step + 1) % pattern.length;
    kit.recordTimer = window.setTimeout(tick, 420);
  };
  tick();
}

export function stopRecord() {
  if (!kit) return;
  kit.recordOn = false;
  if (kit.recordTimer != null) {
    window.clearTimeout(kit.recordTimer);
    kit.recordTimer = null;
  }
}

export function resumeIfNeeded() {
  if (kit && kit.ctx.state === "suspended") void kit.ctx.resume();
}

export function updateListener(x: number, y: number, z: number, fx: number, fz: number) {
  if (!kit) return;
  const l = kit.ctx.listener;
  if (l.positionX) {
    l.positionX.value = x;
    l.positionY.value = y;
    l.positionZ.value = z;
    l.forwardX.value = fx;
    l.forwardY.value = 0;
    l.forwardZ.value = fz;
    l.upX.value = 0;
    l.upY.value = 1;
    l.upZ.value = 0;
  }
}
