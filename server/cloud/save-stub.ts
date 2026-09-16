/**
 * Cloud-Save Stub – P2
 * Lokaler Cache zuerst (localStorage), Sync im Hintergrund.
 * Niemals im Render-Tick aufrufen.
 * KB: ai-vibe/rag-pipeline-retrieval (später), networking/serialization-quantization
 */

export interface SavePayload {
  bond: number;
  visits: number;
  used: Record<string, boolean>;
  muted: boolean;
  ts: number;
}

const KEY = 'quest3_companion_save_v1';

/** Sofort lokal schreiben – blockiert nie den Frame. */
export function saveLocal(p: SavePayload): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Quota / Private Mode – still degradiert
  }
}

export function loadLocal(): SavePayload | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavePayload) : null;
  } catch {
    return null;
  }
}

/**
 * Hintergrund-Sync zur Cloud. Feuert nur bei Idle / nach Event,
 * nie pro Frame. Stub: POST an eigenen Endpoint.
 */
export async function syncCloud(p: SavePayload, endpoint = '/api/save'): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
      // keepalive erlaubt Senden beim Unload
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false; // Offline – lokal bleibt gültig
  }
}

/** Debounced Sync: max 1 Request / 5 s. */
let timer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSync(p: SavePayload): void {
  saveLocal(p);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void syncCloud(p); }, 5000);
}
