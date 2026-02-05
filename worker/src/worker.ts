export interface Env {
  ROOMS: DurableObjectNamespace;
}

type ClientMessage =
  | { type: "join"; room: string; name: string }
  | { type: "end_turn" }
  | { type: "reset" };

type ServerMessage =
  | { type: "state"; room: string; players: string[]; turnIndex: number | null; phase: "lobby" | "player" | "dealer" | "done" }
  | { type: "error"; message: string };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("room");
    if (!roomId) {
      return new Response("Missing room", { status: 400 });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const id = env.ROOMS.idFromName(roomId);
    const room = env.ROOMS.get(id);
    return room.fetch(request);
  },
};

export class RoomDO {
  private state: DurableObjectState;
  private clients: Map<string, WebSocket> = new Map();
  private names: Map<string, string> = new Map();
  private order: string[] = [];
  private turnIndex: number | null = null;
  private phase: "lobby" | "player" | "dealer" | "done" = "lobby";

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    await this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleSession(ws: WebSocket) {
    ws.accept();
    const id = crypto.randomUUID();
    this.clients.set(id, ws);

    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ClientMessage;
        this.handleMessage(id, msg);
      } catch {
        this.send(id, { type: "error", message: "Bad message" });
      }
    });

    ws.addEventListener("close", () => {
      this.clients.delete(id);
      this.names.delete(id);
      this.order = this.order.filter(pid => pid !== id);
      if (this.order.length < 2) {
        this.phase = "lobby";
        this.turnIndex = null;
      }
      this.broadcastState();
    });
  }

  private handleMessage(id: string, msg: ClientMessage) {
    if (msg.type === "join") {
      this.names.set(id, msg.name || "Player");
      if (!this.order.includes(id)) this.order.push(id);
      if (this.order.length === 2 && this.phase === "lobby") {
        this.phase = "player";
        this.turnIndex = 0;
      }
      this.broadcastState(msg.room);
      return;
    }

    if (msg.type === "reset") {
      this.phase = "lobby";
      this.turnIndex = null;
      this.broadcastState();
      return;
    }

    if (msg.type === "end_turn") {
      if (this.phase !== "player" || this.turnIndex === null) return;
      if (this.order.length < 2) return;
      this.turnIndex = (this.turnIndex + 1) % 2;
      this.broadcastState();
      return;
    }
  }

  private broadcastState(room?: string) {
    const players = this.order.map(id => this.names.get(id) || "Player");
    const payload: ServerMessage = {
      type: "state",
      room: room || "",
      players,
      turnIndex: this.turnIndex,
      phase: this.phase,
    };
    for (const [id] of this.clients) {
      this.send(id, payload);
    }
  }

  private send(id: string, message: ServerMessage) {
    const ws = this.clients.get(id);
    if (!ws) return;
    ws.send(JSON.stringify(message));
  }
}
