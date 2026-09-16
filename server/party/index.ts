/**
 * PartyKit Edge Stub – P1
 * Nur Connect / Disconnect / Echo. Keine Physik, kein Multiplayer-State.
 * Deploy: npx partykit deploy
 * KB: networking/partykit-rooms-deep, networking/serialization-quantization
 */
import type { Party, PartyKitServer, Connection } from 'partykit/server';

export default {
  async onConnect(conn: Connection, room: Party) {
    // Quantisierter Hello – kein Raw-Pose-Stream
    conn.send(JSON.stringify({ t: 'hello', room: room.id, ts: Date.now() }));
  },
  async onMessage(message: string, conn: Connection, room: Party) {
    // Echo nur für kleine Events (Bond-Level, Prop-ID) – nie Physik-Posen
    let data: unknown;
    try { data = JSON.parse(message); } catch { return; }
    const safe = sanitize(data);
    if (!safe) return;
    room.broadcast(JSON.stringify({ t: 'echo', from: conn.id, ...safe }), [conn.id]);
  },
  async onClose(conn: Connection) {
    // Cleanup lokal; kein Frame-kritischer Pfad
  },
} satisfies PartyKitServer;

function sanitize(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  // Whitelist: nur leichte, quantisierte Felder
  const out: Record<string, unknown> = {};
  if (typeof o.bond === 'number') out.bond = Math.round(o.bond);
  if (typeof o.prop === 'string') out.prop = o.prop.slice(0, 32);
  if (typeof o.zone === 'string') out.zone = o.zone.slice(0, 32);
  return Object.keys(out).length ? out : null;
}
