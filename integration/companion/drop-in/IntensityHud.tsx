/** Paste into overlay while phase===playing */
import { useCompanion } from "@/lib/companion/store";

export function IntensityHud() {
  const phase = useCompanion((s) => s.phase);
  const value = useCompanion((s) => (s as { intensityValue?: number }).intensityValue ?? 0);
  const zone = useCompanion((s) => (s as { contactZone?: string | null }).contactZone ?? null);
  const band = useCompanion((s) => (s as { intensityBand?: string }).intensityBand ?? "low");

  if (phase !== "playing") return null;

  return (
    <div
      className="pointer-events-none absolute bottom-24 left-1/2 z-20 w-48 -translate-x-1/2"
      aria-hidden
    >
      <div className="mb-1 text-center text-[10px] uppercase tracking-widest text-white/40">
        {zone ? `contact · ${zone}` : "reach · F hold · R burst"}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-200/70 transition-[width] duration-100"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <div className="mt-0.5 text-center text-[9px] text-white/30">{band}</div>
    </div>
  );
}
