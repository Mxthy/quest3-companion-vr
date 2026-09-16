/**
 * PartySocket – Client-Seite für den Edge-Stub.
 * Sendet nur quantisierte Events (Bond, Prop, Zone). Niemals Physik-Posen.
 * KB: networking/partykit-rooms-deep
 */
export type PartyEvent =
  | { t: 'bond'; v: number }
  | { t: 'prop'; id: string }
  | { t: 'zone'; id: string };

export class PartySocket {
  private ws: WebSocket | null = null;
  private url: string;
  private queue: PartyEvent[] = [];

  constructor(url = 'wss://your-party.example.partykit.dev/room') {
    this.url = url;
  }

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      // Flush queued events (bounded)
      while (this.queue.length) this.send(this.queue.shift()!);
    };
    this.ws.onmessage = (ev) => {
      // Echo / Server-Events – hier nur loggen, später an Store
      try { console.log('[party]', JSON.parse(ev.data)); } catch { /* ignore */ }
    };
    this.ws.onclose = () => { this.ws = null; };
  }

  send(ev: PartyEvent) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.queue.length < 32) this.queue.push(ev);
      return;
    }
    this.ws.send(JSON.stringify(ev));
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}
