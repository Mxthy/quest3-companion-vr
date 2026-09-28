import { useEffect, useRef, useState } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { useAdultHud } from "@/lib/companion/adult";
import { playerSim } from "@/lib/companion/player-ref";
import { resumeIfNeeded, unlockAudio } from "@/lib/companion/audio";
import { useCompanion } from "@/lib/companion/store";
import { enterVR, isVRSupported } from "./xr-vr";

function Joystick() {
  const wrap = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const end = () => {
    playerSim.touchMove.x = 0;
    playerSim.touchMove.y = 0;
    setKnob({ x: 0, y: 0 });
  };

  const move = (clientX: number, clientY: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = r.width * 0.38;
    const len = Math.hypot(dx, dy);
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    const nx = dx / max;
    const ny = -dy / max;
    playerSim.touchMove.x = nx;
    playerSim.touchMove.y = ny;
    setKnob({ x: dx, y: dy });
  };

  return (
    <div
      ref={wrap}
      className="relative size-[116px] rounded-full border border-border bg-surface/70"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg/80"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

/** 18+ gate: once per session (meta.warning in content/adult_interaction.yaml). */
let ageConfirmedThisSession = false;

export function Overlay() {
  const phase = useCompanion((s) => s.phase);
  const [vrSupported, setVrSupported] = useState(false);
  useEffect(() => {
    isVRSupported().then(setVrSupported);
  }, []);
  const bond = useCompanion((s) => s.bond);
  const speech = useCompanion((s) => s.speech);
  const prompt = useCompanion((s) => s.prompt);
  const muted = useCompanion((s) => s.muted);
  const used = useCompanion((s) => s.used);
  const seated = useCompanion((s) => s.seated);
  const enter = useCompanion((s) => s.enter);
  const pause = useCompanion((s) => s.pause);
  const resume = useCompanion((s) => s.resume);
  const leave = useCompanion((s) => s.leave);
  const toggleMute = useCompanion((s) => s.toggleMute);
  const interact = useCompanion((s) => s.interact);
  const stand = useCompanion((s) => s.stand);
  const [coarse, setCoarse] = useState(false);
  const [ageOk, setAgeOk] = useState(ageConfirmedThisSession);
  const adult = useAdultHud();

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    const onVis = () => {
      if (!document.hidden) resumeIfNeeded();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mq.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const usedCount = Number(used.cup) + Number(used.vinyl) + Number(used.lantern);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="vignette pointer-events-none absolute inset-0" />

      {phase === "playing" && (
        <>
          <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 pt-[env(safe-area-inset-top)]">
            <div className="min-w-0 rounded-xl border border-border bg-surface/80 px-3 py-2">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Nähe</p>
                <p className="font-mono text-xs tabular-nums text-fg">{Math.round(bond)}</p>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-(--motion-fast)"
                  style={{ width: `${bond}%` }}
                />
              </div>
            </div>
            <div className="pointer-events-auto flex gap-2">
              {vrSupported && (
                <button
                  type="button"
                  onClick={() => void enterVR()}
                  className="rounded-md border border-border bg-surface/80 px-3 text-sm font-medium text-fg"
                  aria-label="In VR starten"
                >
                  VR
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                className="grid size-11 place-items-center rounded-md border border-border bg-surface/80 text-fg"
                aria-label={muted ? "Ton an" : "Ton aus"}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                type="button"
                onClick={pause}
                className="grid size-11 place-items-center rounded-md border border-border bg-surface/80 text-fg"
                aria-label="Pause"
              >
                <Pause size={18} />
              </button>
            </div>
          </div>

          {speech && (
            <div className="absolute inset-x-4 bottom-28 mx-auto max-w-lg rounded-xl border border-border bg-surface/90 px-4 py-3 md:bottom-10">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Elara</p>
              <p className="mt-1 font-display text-lg leading-snug text-fg">{speech}</p>
            </div>
          )}

          {adult.arousal > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-36 rounded-md border border-border bg-surface/70 px-2.5 py-1.5 md:bottom-14">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                  Erregung
                </p>
                {adult.refractory && (
                  <p className="text-[10px] text-muted">Nachglühen</p>
                )}
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${adult.arousal}%` }}
                />
              </div>
            </div>
          )}

          {prompt && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-md border border-border bg-bg/80 px-3 py-2 text-sm text-fg">
              {prompt}
            </div>
          )}

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="size-[7px] rounded-full border border-fg/70" />
          </div>

          {coarse && (
            <div className="pointer-events-auto absolute bottom-6 left-4 right-4 flex items-end justify-between">
              <Joystick />
              <div className="mb-2 flex flex-col items-center gap-2">
                {seated && (
                  <button
                    type="button"
                    onClick={stand}
                    className="h-11 rounded-full border border-border bg-surface/90 px-5 text-sm font-medium text-fg"
                  >
                    Aufstehen
                  </button>
                )}
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    interact();
                  }}
                  className="grid size-[72px] place-items-center rounded-full border border-border bg-primary text-sm font-medium text-primary-fg"
                >
                  E
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "start" && (
        <div className="pointer-events-auto relative flex h-full flex-col justify-end px-6 pb-10 pt-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg from-[12%] via-bg/50 via-[42%] to-transparent" />
          <div className="relative mx-auto w-full max-w-md">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Companion</p>
            <h1 className="mt-3 font-display text-5xl font-medium tracking-[-0.03em] text-fg md:text-6xl">
              Elara
            </h1>
            <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted">
              Sie wartet im Atelier. Drei Dinge im Raum kennen deine Hände — Tasse, Platte, Laterne.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Adult-Inhalt (18+): Berührung, Erregung, Orgasmus. Nur für Erwachsene.
            </p>
            <button
              type="button"
              onClick={() => {
                unlockAudio();
                if (!ageOk) {
                  ageConfirmedThisSession = true;
                  setAgeOk(true);
                  return;
                }
                enter();
              }}
              className="mt-8 h-12 rounded-md bg-primary px-6 text-sm font-medium text-primary-fg transition-transform duration-(--motion-quick) active:scale-[0.98]"
            >
              {ageOk ? "Den Raum betreten" : "Ich bin 18+ — weiter"}
            </button>
            <p className="mt-5 text-xs leading-relaxed text-subtle">
              Bewegen mit WASD · Blick ziehen · E greifen oder sprechen · G halten · F intensiv · Q Klaps
              {usedCount > 0 ? ` · ${usedCount}/3 Dinge berührt` : ""}
            </p>
          </div>
        </div>
      )}

      {phase === "paused" && (
        <div className="pointer-events-auto flex h-full items-end justify-center bg-bg/70 px-6 pb-12 md:items-center md:pb-0">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-elevated p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Pause</p>
            <h2 className="mt-2 font-display text-3xl text-fg">Der Raum wartet</h2>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={resume}
                className="h-12 rounded-md bg-primary text-sm font-medium text-primary-fg"
              >
                Weiter
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="h-12 rounded-md border border-border text-sm text-fg"
              >
                {muted ? "Ton an" : "Ton aus"}
              </button>
              <button
                type="button"
                onClick={leave}
                className="h-12 rounded-md text-sm text-muted"
              >
                Raum verlassen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
