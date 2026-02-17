type ClientState = {
  room: string;
  players: string[];
  turnIndex: number | null;
};

type OnState = (state: ClientState) => void;
type OnSnapshot = (snapshot: SnapshotEvent) => void;
type OnEvent = (data: any) => void;

type JoinEvent = { type: "game:join"; name: string };
type EndTurnEvent = { type: "game:end_turn"; from: string };
type ResetEvent = { type: "game:reset" };
type StateEvent = { type: "game:state"; players: string[]; turnIndex: number | null };
type SnapshotEvent = {
  type: "game:snapshot";
  players: string[];
  dealerCards: { suit: number; rank: number }[];
  hands: { cards: { suit: number; rank: number }[]; done: boolean }[];
  deck: { suit: number; rank: number }[];
  turnIndex: number | null;
  pendingTurn: { nextIndex: number; until: number } | null;
  phase: "lobby" | "player" | "dealer" | "done";
  bet: number;
  pendingBet: number | null;
  pendingBy: string | null;
  agreed: boolean;
  results?: number[];
  payouts?: number[];
  claimed?: boolean[];
};
type BetProposeEvent = { type: "game:bet_propose"; bet: number; by: string };
type BetAcceptEvent = { type: "game:bet_accept"; by: string };
type BetDeclineEvent = { type: "game:bet_decline"; by: string };
type HitEvent = { type: "game:hit"; by: string };
type StandEvent = { type: "game:stand"; by: string };
type WalletInfoEvent = { type: "game:wallet_info"; by: string; address: string };
type ForfeitEvent = { type: "game:forfeit"; by: string };

type GameEvent =
  | JoinEvent
  | EndTurnEvent
  | ResetEvent
  | StateEvent
  | SnapshotEvent
  | BetProposeEvent
  | BetAcceptEvent
  | BetDeclineEvent
  | HitEvent
  | StandEvent
  | WalletInfoEvent
  | ForfeitEvent;

const NTFY_BASE = "https://ntfy.sh";
const NTFY_WS = "wss://ntfy.sh";
const TOPIC_PREFIX = "pxbj-";

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private onState: OnState;
  private onSnapshot: OnSnapshot;
  private onEvent: OnEvent;
  private onLog: (msg: string) => void;
  private clientId: string = Math.random().toString(36).slice(2, 8);
  private room: string = "";
  private name: string = "";
  private hostName: string = "";
  private isHost: boolean = false;
  private players: string[] = [];
  private turnIndex: number | null = null;
  public connected: boolean = false;
  private intentionalClose: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts: number = 0;
  private static readonly MAX_RECONNECT_ATTEMPTS = 50;
  private static readonly KEEPALIVE_INTERVAL = 30_000; // 30s ping to keep WS alive

  constructor(onState: OnState, onSnapshot: OnSnapshot, onEvent: OnEvent, onLog?: (msg: string) => void) {
    this.onState = onState;
    this.onSnapshot = onSnapshot;
    this.onEvent = onEvent;
    this.onLog = onLog || (() => {});
  }

  connect(_wsUrl: string, _apiKey: string, room: string, name: string, hostName: string) {
    if (!room) {
      this.onLog("No room specified");
      return;
    }
    this.room = room;
    this.name = name;
    this.hostName = hostName;
    this.isHost = hostName === name;
    this.connected = false;
    this.intentionalClose = false;
    this.reconnectAttempts = 0;

    this.openWs();
  }

  private openWs() {
    this.clearKeepAlive();
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    const topic = this.topic();
    this.onLog(`Connecting to ntfy.sh/${topic}`);

    this.ws = new WebSocket(`${NTFY_WS}/${topic}/ws`);
    this.ws.onopen = () => {
      this.onLog("WS open");
      this.startKeepAlive();
    };
    this.ws.onmessage = (event) => {
      this.handleWsMessage(event.data as string);
    };
    this.ws.onerror = () => {
      this.onLog("WS error");
    };
    this.ws.onclose = (e) => {
      this.onLog(`WS closed: ${e.code}`);
      this.connected = false;
      this.clearKeepAlive();
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  endTurn() {
    this.sendEvent({ type: "game:end_turn", from: this.name } satisfies EndTurnEvent);
  }

  sendSnapshot(snapshot: SnapshotEvent) {
    this.sendEvent(snapshot);
  }

  proposeBet(bet: number) {
    this.sendEvent({ type: "game:bet_propose", bet, by: this.name } satisfies BetProposeEvent);
  }

  acceptBet() {
    this.sendEvent({ type: "game:bet_accept", by: this.name } satisfies BetAcceptEvent);
  }

  declineBet() {
    this.sendEvent({ type: "game:bet_decline", by: this.name } satisfies BetDeclineEvent);
  }

  hit() {
    this.sendEvent({ type: "game:hit", by: this.name } satisfies HitEvent);
  }

  stand() {
    this.sendEvent({ type: "game:stand", by: this.name } satisfies StandEvent);
  }

  reset() {
    this.sendEvent({ type: "game:reset" } satisfies ResetEvent);
  }

  sendWalletInfo(address: string) {
    this.sendEvent({ type: "game:wallet_info", by: this.name, address } satisfies WalletInfoEvent);
  }

  forfeit() {
    this.sendEvent({ type: "game:forfeit", by: this.name } satisfies ForfeitEvent);
  }

  disconnect() {
    this.intentionalClose = true;
    this.clearKeepAlive();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.players = [];
    this.turnIndex = null;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= MultiplayerClient.MAX_RECONNECT_ATTEMPTS) {
      this.onLog("Max reconnect attempts reached");
      return;
    }
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15_000);
    this.reconnectAttempts++;
    this.onLog(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openWs();
    }, delay);
  }

  private startKeepAlive() {
    this.clearKeepAlive();
    this.keepaliveTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // ntfy.sh ignores unknown JSON, but sending a small message keeps the connection alive
        fetch(`${NTFY_BASE}/${this.topic()}`, {
          method: "POST",
          body: JSON.stringify({ __from: this.clientId, __ping: true }),
          headers: { "Content-Type": "text/plain" },
        }).catch(() => {});
      }
    }, MultiplayerClient.KEEPALIVE_INTERVAL);
  }

  private clearKeepAlive() {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }

  private topic(): string {
    return `${TOPIC_PREFIX}${this.room}`;
  }

  private handleWsMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // ntfy.sh wraps messages: { event: "open"|"message", message: "..." }
    if (msg.event === "open") {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.onLog("ntfy connected, sending join...");
      this.sendEvent({ type: "game:join", name: this.name } satisfies JoinEvent);
      return;
    }

    if (msg.event !== "message" || !msg.message) return;

    // Parse the game payload from message field
    let data: any;
    try {
      data = JSON.parse(msg.message);
    } catch {
      return;
    }

    // Skip own messages
    if (data.__from === this.clientId) return;

    const payload = data.payload;
    if (!payload || !payload.type) return;

    this.onLog(`recv: ${payload.type}${payload.type === "game:state" ? ` p=${payload.players?.length}` : ""}`);
    this.handleGameEvent(payload);
  }

  private handleGameEvent(data: any) {
    if (data.type === "game:state") {
      const payload = data as StateEvent;
      this.players = payload.players || [];
      this.turnIndex = payload.turnIndex ?? null;
      this.onState({ room: this.room, players: this.players, turnIndex: this.turnIndex });
      return;
    }

    if (data.type === "game:snapshot") {
      this.onSnapshot(data as SnapshotEvent);
      return;
    }

    this.onEvent(data);

    if (this.isHost) {
      if (data.type === "game:join") {
        const join = data as JoinEvent;
        if (!this.players.includes(this.hostName)) {
          this.players.push(this.hostName);
        }
        if (!this.players.includes(join.name)) {
          this.players.push(join.name);
        }
        if (this.players.length >= 2 && this.turnIndex === null) {
          this.turnIndex = 0;
        }
        this.broadcastState();
      } else if (data.type === "game:end_turn") {
        if (this.turnIndex !== null) {
          this.turnIndex = (this.turnIndex + 1) % this.players.length;
          this.broadcastState();
        }
      } else if (data.type === "game:reset") {
        this.players = [this.hostName];
        this.turnIndex = null;
        this.broadcastState();
      }
    }
  }

  private broadcastState() {
    this.sendEvent({
      type: "game:state",
      players: this.players,
      turnIndex: this.turnIndex,
    } satisfies StateEvent);
  }

  private sendEvent(payload: GameEvent) {
    // Send via HTTP POST to ntfy.sh (this is how ntfy relays to WebSocket subscribers)
    const body = JSON.stringify({ __from: this.clientId, payload });
    fetch(`${NTFY_BASE}/${this.topic()}`, {
      method: "POST",
      body,
      headers: { "Content-Type": "text/plain" },
    }).catch(err => {
      this.onLog(`POST error: ${err.message}`);
    });

    // Also handle locally so the sender sees its own event immediately
    this.handleGameEvent(payload);
  }
}
