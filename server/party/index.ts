/**
 * PartyKit server – Edge stub (P1).
 * Only echoes sanitized, quantized events. No physics poses.
 * KB: networking/partykit-rooms-deep, networking/serialization-quantization
 */
import type * as Party from 'partykit/server';

const ALLOWED = new Set(['bond', 'prop', 'zone', 'ping', 'hello']);

function sanitize(raw: unknown): object | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const t = o.t;
  if (typeof t !== 'string' || !ALLOWED.has(t)) return null;
  // whitelist fields per type
  if (t === 'bond' && typeof o.v === 'number') return { t, v: Math.round(o.v) };
  if (t === 'prop' && typeof o.id === 'string') return { t, id: o.id.slice(0, 32) };
  if (t === 'zone' && typeof o.id === 'string') return { t, id: o.id.slice(0, 32) };
  if (t === 'ping') return { t, ts: Date.now() };
  if (t === 'hello') return { t, name: String(o.name ?? 'guest').slice(0, 24) };
  return null;
}

export default class PartyServer implements Party.Server {
  constructor(public party: Party.Room) {}

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ t: 'hello', name: 'server', ts: Date.now() }));
  }

  onMessage(message: string, conn: Party.Connection) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }
    const clean = sanitize(parsed);
    if (!clean) return;
    // echo to sender + broadcast to room (bounded)
    conn.send(JSON.stringify(clean));
    this.party.broadcast(JSON.stringify(clean), [conn.id]);
  }

  onClose(conn: Party.Connection) {
    this.party.broadcast(JSON.stringify({ t: 'leave', id: conn.id }));
  }
}
