import { getServerUrl } from "./api";
type Handler = (data: any) => void;
class RavoqSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<Handler>>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private delay = 2000;
  on(type: string, handler: Handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }
  private emit(type: string, data: any) { this.handlers.get(type)?.forEach(h => h(data)); }
  async connect(address: string) {
    this.disconnect();
    const generation = this.generation;
    const open = async () => {
      try {
        const base = await getServerUrl();
        if (!base || generation !== this.generation) return;
        const ws = new WebSocket(base.replace(/^http/, "ws") + "/api/bc/ws");
        this.ws = ws;
        ws.onopen = () => { if (generation === this.generation) ws.send(JSON.stringify({ type: "auth", address })); };
        ws.onmessage = event => {
          if (generation !== this.generation) return;
          try { const data = JSON.parse(event.data); if (data.type === "connected") this.delay = 2000; this.emit(data.type, data); } catch {}
        };
        ws.onclose = () => {
          if (generation !== this.generation) return;
          this.emit("disconnected", {});
          this.timer = setTimeout(() => { this.delay = Math.min(this.delay * 1.5, 30000); void open(); }, this.delay);
        };
        ws.onerror = () => { if (generation === this.generation) ws.close(); };
      } catch { if (generation === this.generation) this.emit("disconnected", {}); }
    };
    await open();
  }
  send(data: object) { if (this.ws?.readyState === WebSocket.OPEN) { this.ws.send(JSON.stringify(data)); return true; } return false; }
  joinRoom(roomId: string) { this.send({ type: "join_room", roomId }); }
  notifyDocAuthenticated(roomId: string, messageId: string, document: object) { this.send({ type: "doc_authenticated", roomId, messageId, document }); }
  disconnect() {
    this.generation++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.ws?.close(); this.ws = null;
  }
}
export const socket = new RavoqSocket();
