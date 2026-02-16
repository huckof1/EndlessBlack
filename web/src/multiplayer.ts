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

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private onState: OnState;
  private onSnapshot: OnSnapshot;
  private onEvent: OnEvent;
  private onLog: (msg: string) => void;
  private pending: any[] = [];
  private subscribed: boolean = false;
  private bc: BroadcastChannel | null = null;
  private clientId: string = Math.random().toString(36).slice(2, 8);
  private room: string = "";
  private name: string = "";
  private hostName: string = "";
  private isHost: boolean = false;
  private players: string[] = [];
  private turnIndex: number | null = null;

  constructor(onState: OnState, onSnapshot: OnSnapshot, onEvent: OnEvent, onLog?: (msg: string) => void) {
    this.onState = onState;
    this.onSnapshot = onSnapshot;
    this.onEvent = onEvent;
    this.onLog = onLog || (() => {});
  }

  connect(wsUrl: string, apiKey: string, room: string, name: string, hostName: string) {
    if (!wsUrl || !apiKey || !room) {
      this.onLog(`WS skip: url=${!!wsUrl} key=${!!apiKey} room=${!!room}`);
      return;
    }
    this.room = room;
    this.name = name;
    this.hostName = hostName;
    this.isHost = hostName === name;
    this.subscribed = false;

    if (!this.bc) {
      this.bc = new BroadcastChannel(this.channel());
      this.bc.onmessage = (event) => {
        const data = event.data;
        if (!data || data.__from === this.clientId) return;
        if (typeof data.payload === "string") {
          this.handleMessage(data.payload);
        }
      };
      // Local join for same-origin fallback
      this.sendEvent({ type: "game:join", name: this.name } satisfies JoinEvent);
    }

    // Public keys (lspk_) require discovery service first
    if (apiKey.startsWith("lspk_")) {
      this.onLog("Discovery for lspk_ key...");
      const cluster = new URL(wsUrl).hostname.replace("ws-", "").replace(".lattestream.com", "");
      const discoverUrl = `https://${cluster}.lattestream.com/discover?api_key=${encodeURIComponent(apiKey)}`;
      fetch(discoverUrl)
        .then(r => {
          if (!r.ok) throw new Error(`Discovery ${r.status}`);
          return r.json();
        })
        .then(info => {
          const host = info.host || info.node_host;
          const token = info.discovery_token || info.token;
          if (!host || !token) {
            this.onLog(`Discovery bad response: ${JSON.stringify(info).slice(0, 200)}`);
            return;
          }
          this.onLog(`Discovery OK: host=${host}`);
          this.connectWs(`wss://${host}`, token);
        })
        .catch(err => {
          this.onLog(`Discovery error: ${err.message}`);
          // Fallback: try direct connection anyway
          this.onLog("Fallback: direct connect...");
          this.connectWs(wsUrl, apiKey);
        });
    } else {
      // Private keys (lsk_) or JWT — connect directly
      this.connectWs(wsUrl, apiKey);
    }
  }

  private connectWs(wsUrl: string, authToken: string) {
    this.onLog(`WS connecting to ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      this.onLog("WS open, authenticating...");
      this.sendRaw({ api_key: authToken });
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
    };
    this.ws.onerror = (e) => {
      this.onLog(`WS error: ${e}`);
    };
    this.ws.onclose = (e) => {
      this.onLog(`WS closed: code=${e.code} reason=${e.reason}`);
      this.subscribed = false;
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.bc) {
      this.bc.close();
      this.bc = null;
    }
    this.subscribed = false;
    this.players = [];
    this.turnIndex = null;
    this.pending = [];
  }

  private handleMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.event === "lattestream:connection_established") {
      this.onLog("WS connection_established, subscribing...");
      this.sendRaw({ event: "lattestream:subscribe", data: { channel: this.channel() } });
      return;
    }

    if (msg.event === "lattestream:subscription_succeeded") {
      this.subscribed = true;
      this.onLog(`WS subscribed! pending=${this.pending.length}`);
      this.flushPending();
      // Send join after subscription is confirmed so it's delivered
      this.sendEvent({ type: "game:join", name: this.name } satisfies JoinEvent);
      return;
    }

    if (!msg.event || !msg.data) return;
    if (msg.channel !== this.channel()) return;

    let data: any;
    try {
      data = typeof msg.data === "string" ? JSON.parse(msg.data) : msg.data;
    } catch {
      data = msg.data;
    }

    if (!data || !data.type) return;
    this.onLog(`WS recv: ${data.type}${data.type === "game:state" ? ` p=${(data as any).players?.length}` : ""}`);

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

  private channel() {
    return `room-${this.room}`;
  }

  /** Send a raw protocol message (api_key, subscribe) — bypasses subscription check */
  private sendRaw(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pending.push(payload);
    } else {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /** Send a game event — queues until WS is open AND subscribed */
  private send(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.subscribed) {
      this.pending.push(payload);
    } else {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private sendEvent(
    payload:
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
      | ForfeitEvent
  ) {
    this.send({
      event: "game:event",
      channel: this.channel(),
      data: JSON.stringify(payload),
    });
    if (this.bc) {
      const msg = JSON.stringify({ event: "game:event", channel: this.channel(), data: JSON.stringify(payload) });
      this.bc.postMessage({ __from: this.clientId, payload: msg });
      // Also handle locally so the sender sees its own event
      this.handleMessage(msg);
    }
  }

  private flushPending() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.subscribed) return;
    const queue = [...this.pending];
    this.pending = [];
    queue.forEach(p => this.ws!.send(JSON.stringify(p)));
  }
}
