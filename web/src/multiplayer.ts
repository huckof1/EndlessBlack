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

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private onState: OnState;
  private onSnapshot: OnSnapshot;
  private onEvent: OnEvent;
  private pending: any[] = [];
  private bc: BroadcastChannel | null = null;
  private clientId: string = Math.random().toString(36).slice(2, 8);
  private room: string = "";
  private name: string = "";
  private hostName: string = "";
  private isHost: boolean = false;
  private players: string[] = [];
  private turnIndex: number | null = null;

  constructor(onState: OnState, onSnapshot: OnSnapshot, onEvent: OnEvent) {
    this.onState = onState;
    this.onSnapshot = onSnapshot;
    this.onEvent = onEvent;
  }

  connect(wsUrl: string, apiKey: string, room: string, name: string, hostName: string) {
    if (!wsUrl || !apiKey || !room) return;
    this.room = room;
    this.name = name;
    this.hostName = hostName;
    this.isHost = hostName === name;

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

    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      this.send({ api_key: apiKey });
    };
    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
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

  private handleMessage(raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.event === "lattestream:connection_established") {
      this.send({ event: "lattestream:subscribe", data: { channel: this.channel() } });
      return;
    }

    if (msg.event === "lattestream:subscription_succeeded") {
      this.sendEvent({ type: "game:join", name: this.name } satisfies JoinEvent);
      this.flushPending();
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

  private send(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const queue = [...this.pending];
    this.pending = [];
    queue.forEach(p => this.send(p));
  }
}
