// Endless Pixel Blackjack v2.0 - Multiplayer Edition
// By Huckof1

import { game } from "./game";
import {
  getBankInfo,
  connectWallet,
  connectEndlessExtension,
  connectLuffa,
  setPreferredWalletType,
  getWalletBalance,
  getLatestGameId,
  getGame,
  setWalletCallbacks,
  isInLuffaApp,
  disconnectWallet,
  requestFaucet,
  fundBankroll,
  deposit as depositOnChain,
  withdraw as withdrawOnChain,
  getPlayerBalance as getPlayerBalanceOnChain,
  startGame as startGameOnChain,
  hit as hitOnChain,
  stand as standOnChain,
  creditPayout,
  deductBet,
  type ChainGame,
  type ChainRoom,
  createRoom as createRoomOnChain,
  joinRoom as joinRoomOnChain,
  roomHit as roomHitOnChain,
  roomStand as roomStandOnChain,
  cancelRoom as cancelRoomOnChain,
  claimTimeout as claimTimeoutOnChain,
  getRoom as getRoomOnChain,
  getLatestRoomId as getLatestRoomIdOnChain,
  getPlayerStats,
} from "./chain";
import QRCode from "qrcode";
import { formatEDS, parseEDS, MIN_BET, MAX_BET, SUITS, RANKS, DEMO_MODE, RELEASE_MODE, LS_PUBLIC_KEY, LS_WS_URL } from "./config";
import { soundManager, playSound } from "./sounds";
import { MultiplayerClient } from "./multiplayer";

// ==================== DOM ELEMENTS ====================
const nameSection = document.getElementById("name-section") as HTMLDivElement;
const mainVeil = document.getElementById("main-veil") as HTMLDivElement;
const gameShadowBars = document.getElementById("game-shadow-bars") as HTMLDivElement;
const playerNameInput = document.getElementById("player-name") as HTMLInputElement;
const startSessionBtn = document.getElementById("start-session-btn") as HTMLButtonElement;
const walletSection = document.getElementById("wallet-section") as HTMLDivElement;
const playerDisplayName = document.getElementById("player-display-name") as HTMLSpanElement;
const walletAddressEl = document.getElementById("wallet-address") as HTMLSpanElement;
const walletStatusEl = document.getElementById("wallet-status") as HTMLSpanElement;
const walletNetworkEl = document.getElementById("wallet-network") as HTMLSpanElement;
const walletStatusPill = document.getElementById("wallet-status-pill") as HTMLSpanElement;
const walletNetworkPill = document.getElementById("wallet-network-pill") as HTMLSpanElement;
let autoConnectAttempted = false;
const headerStatus = document.querySelector(".header-status") as HTMLDivElement;
const balanceEl = document.getElementById("balance") as HTMLSpanElement;
const bankrollEl = document.getElementById("bankroll") as HTMLSpanElement;
const betFeeEl = document.getElementById("bet-fee") as HTMLSpanElement;
const feeEl = document.getElementById("fee") as HTMLSpanElement;

const mascot = document.getElementById("mascot") as HTMLDivElement;
const mascotMouth = document.getElementById("mascot-mouth") as HTMLDivElement;
const mascotMessage = document.getElementById("mascot-message") as HTMLDivElement;

const gameArea = document.getElementById("game-area") as HTMLDivElement;
const betInput = document.getElementById("bet-input") as HTMLInputElement;
const betMinus = document.getElementById("bet-minus") as HTMLButtonElement;
const betPlus = document.getElementById("bet-plus") as HTMLButtonElement;
const betOffer = document.getElementById("bet-offer") as HTMLDivElement;
const betDisplay = document.querySelector(".bet-display") as HTMLDivElement;
const betOfferText = document.getElementById("bet-offer-text") as HTMLDivElement;
const betAccept = document.getElementById("bet-accept") as HTMLButtonElement;
const betDecline = document.getElementById("bet-decline") as HTMLButtonElement;
const betHintEl = document.querySelector(".bet-hint") as HTMLDivElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
const hitBtn = document.getElementById("hit-btn") as HTMLButtonElement;
const standBtn = document.getElementById("stand-btn") as HTMLButtonElement;
const claimBtn = document.getElementById("claim-btn") as HTMLButtonElement;
const payoutDueEl = document.getElementById("payout-due") as HTMLDivElement;
const winnerBannerEl = document.getElementById("winner-banner") as HTMLDivElement;

const dealerCardsEl = document.getElementById("dealer-cards") as HTMLDivElement;
const dealerHandEl = document.querySelector(".dealer-hand") as HTMLDivElement;
const playerCardsEl = document.getElementById("player-cards") as HTMLDivElement;
const opponentCardsEl = document.getElementById("opponent-cards") as HTMLDivElement;
const dealerScoreEl = document.getElementById("dealer-score") as HTMLSpanElement;
const playerScoreEl = document.getElementById("player-score") as HTMLSpanElement;
const playerHandNameEl = document.getElementById("player-hand-name") as HTMLSpanElement;
const softBadge = document.getElementById("soft-badge") as HTMLSpanElement;
const scoreHint = document.getElementById("score-hint") as HTMLDivElement;
const dealerHint = document.getElementById("dealer-hint") as HTMLSpanElement;
const opponentScoreEl = document.getElementById("opponent-score") as HTMLSpanElement;
const opponentHandEl = document.getElementById("opponent-hand") as HTMLDivElement;
const opponentNameEl = document.getElementById("opponent-name") as HTMLSpanElement;
const messageEl = document.getElementById("message") as HTMLDivElement;
const turnIndicator = document.getElementById("turn-indicator") as HTMLDivElement;
const txStatusEl = document.getElementById("tx-status") as HTMLDivElement;

const winEffect = document.getElementById("win-effect") as HTMLDivElement;
const loseEffect = document.getElementById("lose-effect") as HTMLDivElement;
const blackjackEffect = document.getElementById("blackjack-effect") as HTMLDivElement;
const winAmount = document.getElementById("win-amount") as HTMLDivElement;
const loseAmount = document.getElementById("lose-amount") as HTMLDivElement;
const blackjackAmount = document.getElementById("blackjack-amount") as HTMLDivElement;

const soundToggle = document.getElementById("sound-toggle") as HTMLButtonElement;
const homeBtn = document.getElementById("home-btn") as HTMLButtonElement;
const soundIcon = document.getElementById("sound-icon") as HTMLSpanElement;
const continueBtn = document.getElementById("continue-btn") as HTMLButtonElement;
const endGameBtn = document.getElementById("end-game-btn") as HTMLButtonElement;
const gameResultAmount = document.getElementById("game-result-amount") as HTMLSpanElement;
const leaveGameBtn = document.getElementById("leave-game-btn") as HTMLButtonElement;
const themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement;
const themeIcon = document.getElementById("theme-icon") as HTMLSpanElement;
const langToggle = document.getElementById("lang-toggle") as HTMLButtonElement;
const langIcon = document.getElementById("lang-icon") as HTMLSpanElement;
const networkTestnetBtn = document.getElementById("network-testnet") as HTMLButtonElement;
const networkMainnetBtn = document.getElementById("network-mainnet") as HTMLButtonElement;
const connectWalletHeader = document.getElementById("connect-wallet-header") as HTMLButtonElement;
const demoPlayBtn = document.getElementById("demo-play-btn") as HTMLButtonElement;
const fundBankHeader = document.getElementById("fund-bank-header") as HTMLButtonElement;
const faucetBtn = document.getElementById("faucet-btn") as HTMLButtonElement;
const demoBadge = document.getElementById("demo-badge") as HTMLSpanElement;

const leaderboardList = document.getElementById("leaderboard-list") as HTMLDivElement;
const feedEl = document.getElementById("feed") as HTMLDivElement;
const activePlayersEl = document.getElementById("active-players") as HTMLDivElement;
const resetDemoBtn = document.getElementById("reset-demo-btn") as HTMLButtonElement;
const inviteBtnHeader = document.getElementById("invite-btn-header") as HTMLButtonElement;
const inviteBanner = document.getElementById("invite-banner") as HTMLDivElement;
const inviteText = document.getElementById("invite-text") as HTMLDivElement;
const inviteAccept = document.getElementById("invite-accept") as HTMLButtonElement;
const inviteDecline = document.getElementById("invite-decline") as HTMLButtonElement;
const fundModal = document.getElementById("fund-modal") as HTMLDivElement;
const fundAmountInput = document.getElementById("fund-amount-input") as HTMLInputElement;
const fundModalConfirm = document.getElementById("fund-modal-confirm") as HTMLButtonElement;
const fundModalCancel = document.getElementById("fund-modal-cancel") as HTMLButtonElement;
const depositBtnHeader = document.getElementById("deposit-btn-header") as HTMLButtonElement;
const withdrawBtnHeader = document.getElementById("withdraw-btn-header") as HTMLButtonElement;
const depositModal = document.getElementById("deposit-modal") as HTMLDivElement;
const depositAmountInput = document.getElementById("deposit-amount-input") as HTMLInputElement;
const depositModalConfirm = document.getElementById("deposit-modal-confirm") as HTMLButtonElement;
const depositModalCancel = document.getElementById("deposit-modal-cancel") as HTMLButtonElement;
const withdrawModal = document.getElementById("withdraw-modal") as HTMLDivElement;
const withdrawAmountInput = document.getElementById("withdraw-amount-input") as HTMLInputElement;
const withdrawModalConfirm = document.getElementById("withdraw-modal-confirm") as HTMLButtonElement;
const withdrawModalCancel = document.getElementById("withdraw-modal-cancel") as HTMLButtonElement;
const ingameBalanceRow = document.getElementById("ingame-balance-row") as HTMLDivElement;
const ingameBalanceEl = document.getElementById("ingame-balance") as HTMLSpanElement;
const walletModal = document.getElementById("wallet-modal") as HTMLDivElement;
const walletModalClose = document.getElementById("wallet-modal-close") as HTMLButtonElement;
const debugLogEl = document.getElementById("debug-log") as HTMLDivElement;
const walletInstallLink = document.getElementById("wallet-install-link") as HTMLAnchorElement;
const walletPickerTitle = document.getElementById("wallet-picker-title") as HTMLDivElement;
const walletPickerOptions = document.getElementById("wallet-picker-options") as HTMLDivElement;
const walletOptEndless = document.getElementById("wallet-opt-endless") as HTMLButtonElement;
const walletOptLuffa = document.getElementById("wallet-opt-luffa") as HTMLButtonElement;
const walletConnectStatus = document.getElementById("wallet-connect-status") as HTMLDivElement;
const walletStatusText = document.getElementById("wallet-status-text") as HTMLDivElement;
const walletQrContainer = document.getElementById("wallet-qr-container") as HTMLDivElement;
const walletPickerBack = document.getElementById("wallet-picker-back") as HTMLButtonElement;
const walletLuffaQrSection = document.getElementById("wallet-luffa-qr-section") as HTMLDivElement;
const walletLuffaQr = document.getElementById("wallet-luffa-qr") as HTMLDivElement;
const walletLuffaQrHint = document.getElementById("wallet-luffa-qr-hint") as HTMLDivElement;
const nicknameModal = document.getElementById("nickname-modal") as HTMLDivElement;
const nicknameInput = document.getElementById("nickname-input") as HTMLInputElement;
const nicknameSave = document.getElementById("nickname-save") as HTMLButtonElement;
const inviteModal = document.getElementById("invite-modal") as HTMLDivElement;
const inviteBetInput = document.getElementById("invite-bet-input") as HTMLInputElement;
const inviteBetConfirm = document.getElementById("invite-bet-confirm") as HTMLButtonElement;
const inviteBetCancel = document.getElementById("invite-bet-cancel") as HTMLButtonElement;
const inviteModalTitle = inviteModal?.querySelector(".modal-title") as HTMLDivElement;
const inviteModalText = inviteModal?.querySelector(".modal-text") as HTMLDivElement;
const changeLoginHeader = document.getElementById("change-login-header") as HTMLButtonElement;

// Stats elements
const statGames = document.getElementById("stat-games") as HTMLSpanElement;
const statWins = document.getElementById("stat-wins") as HTMLSpanElement;
const statLosses = document.getElementById("stat-losses") as HTMLSpanElement;
const statBlackjacks = document.getElementById("stat-blackjacks") as HTMLSpanElement;
const statWinrate = document.getElementById("stat-winrate") as HTMLSpanElement;
const statProfit = document.getElementById("stat-profit") as HTMLSpanElement;

const PLAYER_CARD_REVEAL_DELAY = 220;
const DEALER_CARD_REVEAL_DELAY = 260;

// ==================== STATE ====================
let playerName = "";
let isPlaying = false;
let isSessionStarted = false;
let firstInteraction = false;
let activeLeaderboardTab: "daily" | "alltime" = "daily";
let currentLocale: "en" | "ru" = "en";
let currentTheme: "dark" | "light" = "dark";
let networkMode: "testnet" | "mainnet" = "testnet";
let walletAddress = "";
let isContractOwner = false;
let chainGameId: number | null = null;
let chainGame: ChainGame | null = null;
let gameMusicActive = false;
let hasGameResult = false;
let invitedByLink = false;
let mpPayoutBucket = parseFloat(localStorage.getItem("mpPayoutBucket") || "0") || 0;
let mpPayoutRoom: string | null = localStorage.getItem("mpPayoutRoom");
let mpLastWinKey: string | null = localStorage.getItem("mpLastWinKey");
let pendingInvite: { name: string; mode: "demo" | "testnet" | "mainnet"; bet: number } | null = null;
let inviteLinkKey: string | null = null;
let inviteAlreadyUsed = false;
let finishRoomTimeout: number | null = null;
let pendingResume: { mode: "demo" | "chain"; game: any; gameId?: number } | null = null;
let inGameBalance: number = 0; // Player's in-game balance (octas) from contract
let isWalletConnecting = false;
let currentFeeBps = 200;
let currentBankrollOctas = 0;
let currentPlayerBalanceOctas = 0;
let debugEnabled = false;
let debugLog: string[] = [];
let multiplayerRoom: string | null = null;
let multiplayerState: { players: string[]; turnIndex: number | null } | null = null;
type MultiplayerSnapshot = {
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
function createLobbySnapshot(players: string[] = []): MultiplayerSnapshot {
  const betValue = parseFloat(betInput?.value || "1") || 1;
  return {
    players,
    dealerCards: [],
    hands: [],
    deck: [],
    turnIndex: null,
    pendingTurn: null,
    phase: "lobby",
    bet: betValue,
    pendingBet: null,
    pendingBy: null,
    agreed: false,
  };
}
let drawRestartTimeout: number | null = null;

function createMultiplayerRoundSnapshot(players: string[], betValue: number): MultiplayerSnapshot {
  const deck = mpCreateDeck();
  const hands = players.map(() => ({ cards: [mpDraw(deck), mpDraw(deck)], done: false }));
  const snapshot: MultiplayerSnapshot = {
    players,
    dealerCards: [],
    hands,
    deck,
    turnIndex: Math.random() < 0.5 ? 0 : 1,
    pendingTurn: null,
    phase: "player",
    bet: betValue,
    pendingBet: null,
    pendingBy: null,
    agreed: true,
  };
  snapshot.hands.forEach((hand, i) => {
    if (mpScore(hand.cards) === 21) {
      hand.done = true;
    }
    if (i === 0 && hand.done) {
      const nextIndex = mpNextTurn(snapshot, i);
      if (nextIndex !== null) {
        snapshot.turnIndex = nextIndex;
      }
    }
  });
  return snapshot;
}

function scheduleDrawContinuation(prevSnapshot: MultiplayerSnapshot) {
  if (!isRoomHost || !prevSnapshot.players || prevSnapshot.players.length < 2) return;
  if (drawRestartTimeout) {
    window.clearTimeout(drawRestartTimeout);
  }
  drawRestartTimeout = window.setTimeout(() => {
    drawRestartTimeout = null;
    const players = prevSnapshot.players.slice();
    const betValue = prevSnapshot.bet;
    const nextSnapshot = createMultiplayerRoundSnapshot(players, betValue);
    multiplayerSnapshot = nextSnapshot;
    multiplayer.sendSnapshot({ type: "game:snapshot", ...nextSnapshot });
    renderMultiplayerSnapshot(nextSnapshot);
  }, 2200);
}
let multiplayerSnapshot: MultiplayerSnapshot | null = null;
let lastRenderedMpPhase: MultiplayerSnapshot["phase"] | null = null;
const mpSessionId = Math.random().toString(36).slice(2, 6);
let mpNameCached = "";
let mpNameFrozen: string | null = null;
function getMpName() {
  if (mpNameFrozen) return mpNameFrozen;
  if (!mpNameCached) {
    const base = (playerName || I18N[currentLocale].player_placeholder).slice(0, 12);
    mpNameCached = `${base}#${mpSessionId}`;
  }
  return mpNameCached;
}
function displayName(name: string) {
  return name.includes("#") ? name.split("#")[0] : name;
}
function displayNameWithId(name: string) {
  if (!name.includes("#")) return name;
  const [base, id] = name.split("#");
  return `${base}#${id}`;
}
function displayNameSmart(name: string, allPlayers: string[]) {
  const base = displayName(name);
  const duplicates = allPlayers.filter(p => displayName(p) === base);
  if (duplicates.length > 1) return displayNameWithId(name);
  return base;
}
function formatMpEds(amount: number) {
  if (!Number.isFinite(amount)) return "0 EDS";
  const rounded = Math.round(amount * 100) / 100;
  const text = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
  return `${text} EDS`;
}
function setWalletStatus(on: boolean) {
  const text = on ? I18N[currentLocale].wallet_connected : I18N[currentLocale].wallet_off;
  if (walletStatusEl) {
    walletStatusEl.textContent = text;
    walletStatusEl.classList.toggle("status-on", on);
    walletStatusEl.classList.toggle("status-off", !on);
  }
  if (walletStatusPill) {
    walletStatusPill.textContent = text;
    walletStatusPill.classList.toggle("status-on", on);
    walletStatusPill.classList.toggle("status-off", !on);
  }
}
function startGameMusic() {
  gameMusicActive = true;
  if (!soundManager.getMuted()) {
    void initAudio();
    soundManager.startGameMusic();
  }
}
function startIdleMusic() {
  gameMusicActive = false;
  if (!soundManager.getMuted()) {
    soundManager.startIdleMusic();
  }
}
const multiplayer = new MultiplayerClient((state) => {
  multiplayerState = { players: state.players, turnIndex: state.turnIndex };
  if (!multiplayerSnapshot || multiplayerSnapshot.phase !== "player") {
    setTurn(null);
    if (
      multiplayerSnapshot &&
      multiplayerSnapshot.agreed &&
      multiplayerSnapshot.phase === "lobby" &&
      isRoomHost &&
      state.players.length >= 2
    ) {
      handleStartGame();
    }
    return;
  }
  if (state.turnIndex === null) {
    setTurn(null);
    return;
  }
  const meIndex = state.players.findIndex(p => p === getMpName());
  if (meIndex === -1) {
    setTurn(null);
    return;
  }
  if (state.turnIndex === meIndex) {
    setTurn("you");
  } else {
    const name = state.players[state.turnIndex] || "OPPONENT";
    setTurnText(`${I18N[currentLocale].turn_of} ${displayName(name)}`);
  }
}, (snapshot) => {
  multiplayerSnapshot = snapshot;
  renderMultiplayerSnapshot(snapshot);
}, (event) => {
  // wallet_info handled by all players
  if (event.type === "game:wallet_info") {
    const addr = event.address as string;
    const by = event.by as string;
    if (addr && by && by !== getMpName()) {
      mpWalletAddresses[by] = addr;
      // Send our own wallet info back
      if (walletAddress) {
        multiplayer.sendWalletInfo(walletAddress);
      }
    }
    // If both sent wallet info, we are in on-chain mode
    if (walletAddress && Object.keys(mpWalletAddresses).length >= 1) {
      mpOnChainMode = true;
    }
    return;
  }
  // forfeit handled by all players
  if (event.type === "game:forfeit") {
    handleForfeitReceived(event.by as string);
    return;
  }
  if (!isRoomHost) return;
  if (!multiplayerSnapshot) {
    const players = multiplayerState?.players?.length ? multiplayerState.players : [playerName];
    multiplayerSnapshot = createLobbySnapshot(players);
  }
  if (multiplayerState?.players?.length) {
    const handsStarted = multiplayerSnapshot.hands && multiplayerSnapshot.hands.length > 0;
    if (!handsStarted && (!multiplayerSnapshot.players || multiplayerState.players.length > multiplayerSnapshot.players.length)) {
      multiplayerSnapshot.players = multiplayerState.players;
    }
  }
  if (event.type === "game:bet_propose") {
    if (!multiplayerSnapshot.players || multiplayerSnapshot.players.length < 2) {
      return;
    }
    if (multiplayerSnapshot.phase !== "lobby" && multiplayerSnapshot.phase !== "done") return;
    const bet = Number(event.bet) || 0;
    if (multiplayerSnapshot.phase === "done") {
      const bothDone = multiplayerSnapshot.hands.length >= 2 && multiplayerSnapshot.hands.every(h => h.done);
      if (!bothDone) return;
      const players = multiplayerState?.players?.length ? multiplayerState.players : multiplayerSnapshot.players;
      multiplayerSnapshot = createLobbySnapshot(players);
      announceFreshMultiplayerGame();
    }
    multiplayerSnapshot.pendingBet = bet;
    multiplayerSnapshot.pendingBy = event.by;
    multiplayerSnapshot.agreed = false;
    multiplayerSnapshot.bet = bet;
    betInput.value = bet.toString();
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
    renderMultiplayerSnapshot(multiplayerSnapshot);
  }
  if (event.type === "game:bet_accept") {
    if (multiplayerSnapshot.pendingBet) {
      multiplayerSnapshot.bet = multiplayerSnapshot.pendingBet;
      betInput.value = multiplayerSnapshot.bet.toString();
    }
    multiplayerSnapshot.pendingBet = null;
    multiplayerSnapshot.pendingBy = null;
    multiplayerSnapshot.agreed = true;
    if (multiplayerSnapshot.players.length < 2 && event.by) {
      const hostId = multiplayerHost || getMpName();
      const unique = new Set([hostId, event.by]);
      multiplayerSnapshot.players = Array.from(unique);
    }
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
    showDebugState("bet_accept");
    // Скрыть секцию приглашения
    mpWaitingForGuest = false;
    const shareEl = document.getElementById("invite-share");
    if (shareEl) shareEl.style.display = "none";
    showMessage(
      currentLocale === "ru"
        ? "ИГРОК ПРИНЯЛ СТАВКУ! РАЗДАЁМ КАРТЫ..."
        : "PLAYER ACCEPTED! DEALING CARDS...",
      "success"
    );
    playSound("chip");
    if (multiplayerSnapshot.phase === "lobby" && multiplayerSnapshot.players.length >= 2) {
      handleStartGame();
    }
  }
  if (event.type === "game:bet_decline") {
    multiplayerSnapshot.pendingBet = null;
    multiplayerSnapshot.pendingBy = null;
    multiplayerSnapshot.agreed = false;
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
    mpWaitingForGuest = false;
    // Скрыть секцию приглашения
    const shareDecl = document.getElementById("invite-share");
    if (shareDecl) shareDecl.style.display = "none";
    showMessage(
      currentLocale === "ru"
        ? "ИГРОК ОТКЛОНИЛ ПРИГЛАШЕНИЕ"
        : "PLAYER DECLINED THE INVITE",
      "error"
    );
    playSound("lose");
  }
  if (event.type === "game:hit") {
    applyMultiplayerHit();
  }
  if (event.type === "game:stand") {
    applyMultiplayerStand();
  }
}, (msg) => mpLog(msg));
let multiplayerHost: string | null = null;
let isRoomHost = false;
let pendingInviteAutoAccept = false;
let mpWalletAddresses: Record<string, string> = {};
let mpBetsDeducted = false;
let mpOnChainMode = false;
let mpWaitingForGuest = false;
let mpLogLines: string[] = [];
type PersistedUiState = {
  v: 1;
  ts: number;
  sessionStarted: boolean;
  sessionMode: "demo" | "wallet";
  gameActive: boolean;
  isPlaying: boolean;
  hasGameResult: boolean;
  multiplayerRoom: string | null;
  chainRoomId: number | null;
  chainGameId: number | null;
  mpOnChainMode: boolean;
  isRoomHost: boolean;
  amIHost: boolean;
  scrollMode: "top" | "bet" | "table";
};
const UI_STATE_KEY = "pixelBlackjackUiStateV1";
const UI_STATE_TTL_MS = 24 * 60 * 60 * 1000;
let restoredUiState: PersistedUiState | null = null;
let restoreChainStateAttempted = false;
let isApplyingUiState = false;

// ==================== ON-CHAIN ROOM STATE ====================
let chainRoomId: number | null = null;
let chainRoom: ChainRoom | null = null;
let lastRenderedChainRoomStatus: number | null = null;
let roomPollingTimer: ReturnType<typeof setInterval> | null = null;
let isRoomPolling = false;
// Room status constants (mirror contract)
const ROOM_STATUS_WAITING = 0;
const ROOM_STATUS_PLAYING = 1;
const ROOM_STATUS_FINISHED = 2;
const ROOM_STATUS_CANCELLED = 3;
const ROOM_STATUS_TIMEOUT = 4;
// Room result: 0=in progress, 1=host win, 2=guest win, 3=draw
let amIHost = false; // true if I'm the room host

function startRoomPolling() {
  stopRoomPolling();
  isRoomPolling = true;
  lastRenderedChainRoomStatus = null;
  lastRenderedMyCardCount = 0;
  lastRenderedOppCardCount = 0;
  lastRenderedOppDone = false;
  chainRoomResultShown = false;
  roomPollingTimer = setInterval(async () => {
    if (!chainRoomId || !isRoomPolling) return;
    try {
      const room = await getRoomOnChain(chainRoomId, networkMode);
      const prevStatus = chainRoom?.status;
      const prevTurn = chainRoom?.turn;
      chainRoom = room;

      // Update UI based on room state
      renderChainRoom(room);

      // Detect status changes
      if (prevStatus !== room.status) {
        if (room.status === ROOM_STATUS_PLAYING && prevStatus === ROOM_STATUS_WAITING) {
          // Guest joined - game started
          playSound("chip");
          mpLog(`Room ${chainRoomId}: game started!`);
          mpWaitingForGuest = false;
          const shareEl = document.getElementById("invite-share");
          if (shareEl) shareEl.style.display = "none";
          startGameMusic();
          focusGameplayArea();
        }
        // Handle instant finish (e.g. both players got blackjack on deal)
        if ((room.status === ROOM_STATUS_FINISHED || room.status === ROOM_STATUS_TIMEOUT) && prevStatus === ROOM_STATUS_WAITING) {
          mpWaitingForGuest = false;
          const shareEl = document.getElementById("invite-share");
          if (shareEl) shareEl.style.display = "none";
          mpLog(`Room ${chainRoomId}: instant finish (both blackjack?)`);
        }
        if (room.status === ROOM_STATUS_FINISHED || room.status === ROOM_STATUS_TIMEOUT || room.status === ROOM_STATUS_CANCELLED) {
          // Game ended
          mpLog(`Room ${chainRoomId}: ended with status=${room.status} result=${room.result}`);
          stopRoomPolling();
        }
        // При ничьей комната остаётся в ROOM_PLAYING — просто сбрасываем карты
        // Продолжаем опрос, не останавливаем
      }
      // Detect turn changes
      if (prevTurn !== undefined && prevTurn !== room.turn && room.status === ROOM_STATUS_PLAYING) {
        playSound("deal");
      }
    } catch (err) {
      mpLog(`Poll error: ${err}`);
    }
  }, 2500);
}

function stopRoomPolling() {
  isRoomPolling = false;
  if (roomPollingTimer) {
    clearInterval(roomPollingTimer);
    roomPollingTimer = null;
  }
}

function getMyTurnIndex(): number {
  // host = 0, guest = 1
  return amIHost ? 0 : 1;
}

function isMyTurn(room: ChainRoom): boolean {
  if (room.status !== ROOM_STATUS_PLAYING) return false;
  const myIdx = getMyTurnIndex();
  if (myIdx === 0 && room.hostDone) return false;
  if (myIdx === 1 && room.guestDone) return false;
  return room.turn === myIdx;
}

// Track rendered state to avoid flicker on every poll
let lastRenderedMyCardCount = 0;
let lastRenderedOppCardCount = 0;
let lastRenderedOppDone = false;
let chainRoomResultShown = false;

function renderCardsIfChanged(container: HTMLElement, cards: { suit: number; rank: number }[], prevCount: number, hidden: boolean): number {
  if (cards.length === prevCount && container.children.length === cards.length) return prevCount;
  // Only append new cards (don't clear existing)
  while (container.children.length > cards.length) {
    container.removeChild(container.lastChild!);
  }
  for (let i = container.children.length; i < cards.length; i++) {
    const el = hidden ? renderCardBack() : renderCard(cards[i]);
    el.style.animation = i >= prevCount ? "dealCard 0.35s ease-out" : "none";
    container.appendChild(el);
  }
  // If switching from hidden to shown (opponent done), replace all
  if (!hidden && prevCount === cards.length && container.querySelector(".card-back")) {
    container.innerHTML = "";
    cards.forEach(card => {
      const el = renderCard(card);
      el.style.animation = "none";
      container.appendChild(el);
    });
  }
  return cards.length;
}

function renderChainRoom(room: ChainRoom) {
  const justEnteredPlaying = room.status === ROOM_STATUS_PLAYING && lastRenderedChainRoomStatus !== ROOM_STATUS_PLAYING;
  lastRenderedChainRoomStatus = room.status;
  if (justEnteredPlaying) {
    focusGameplayArea();
  }

  if (!opponentHandEl || !opponentCardsEl || !opponentScoreEl || !opponentNameEl) return;

  const myIdx = getMyTurnIndex();
  const oppIdx = myIdx === 0 ? 1 : 0;

  if (room.status === ROOM_STATUS_WAITING) {
    // Waiting for guest - use dealer area for "waiting" UI, hide opponent
    if (dealerHandEl) dealerHandEl.style.display = "none";
    opponentHandEl.style.display = "none";
    if (winnerBannerEl) winnerBannerEl.style.display = "none";
    return;
  }

  // Multiplayer layout: opponent at top (dealer area), my cards at bottom (player area)
  // Use dealer-hand for opponent (top of table)
  if (dealerHandEl) dealerHandEl.style.display = "block";
  opponentHandEl.style.display = "none"; // Don't use bottom opponent area

  const myCards = myIdx === 0 ? room.hostCards : room.guestCards;
  const oppCards = oppIdx === 0 ? room.hostCards : room.guestCards;
  const myScore = myIdx === 0 ? room.hostScore : room.guestScore;
  const oppScore = oppIdx === 0 ? room.hostScore : room.guestScore;
  const myDone = myIdx === 0 ? room.hostDone : room.guestDone;
  const oppDone = oppIdx === 0 ? room.hostDone : room.guestDone;

  // Show opponent name in dealer label
  const oppAddr = oppIdx === 0 ? room.host : room.guest;
  const dealerNameEl = dealerHandEl?.querySelector(".hand-name") as HTMLSpanElement;
  if (dealerNameEl) dealerNameEl.textContent = oppAddr.slice(0, 8) + "...";

  // Render MY cards at bottom (player area) - only add new cards, no flicker
  const showOppCards = room.status !== ROOM_STATUS_PLAYING || oppDone;
  lastRenderedMyCardCount = renderCardsIfChanged(playerCardsEl, myCards, lastRenderedMyCardCount, false);

  // Render OPPONENT cards at top (dealer area) - hidden during play unless opp is done
  if (showOppCards !== lastRenderedOppDone || oppCards.length !== lastRenderedOppCardCount) {
    lastRenderedOppCardCount = renderCardsIfChanged(dealerCardsEl, oppCards, lastRenderedOppCardCount, !showOppCards);
    lastRenderedOppDone = showOppCards;
  }

  // Scores
  playerScoreEl.textContent = myScore.toString();
  if (!showOppCards) {
    dealerScoreEl.textContent = oppCards.length + " cards";
  } else {
    dealerScoreEl.textContent = oppScore.toString();
  }

  // Update player hints
  updatePlayerHints(myCards);

  // Update buttons and turn
  isPlaying = room.status === ROOM_STATUS_PLAYING;
  const myTurn = isMyTurn(room);

  if (room.status === ROOM_STATUS_PLAYING) {
    document.body.classList.add("game-active");
    if (winnerBannerEl) winnerBannerEl.style.display = "none";
    hitBtn.disabled = !myTurn;
    standBtn.disabled = !myTurn;
    if (myTurn) {
      setTurn("you");
      showMessage(
        currentLocale === "ru" ? "ВАШ ХОД! HIT ИЛИ STAND" : "YOUR TURN! HIT OR STAND",
        "info"
      );
    } else if (myDone) {
      setTurnText(currentLocale === "ru" ? "Ожидание оппонента..." : "Waiting for opponent...");
      showMessage(
        currentLocale === "ru" ? "ОЖИДАНИЕ ХОДА ОППОНЕНТА..." : "WAITING FOR OPPONENT'S MOVE...",
        "info"
      );
    } else {
      setTurnText(currentLocale === "ru" ? "Ход оппонента" : "Opponent's turn");
      showMessage(
        currentLocale === "ru" ? "ОЖИДАНИЕ ХОДА ОППОНЕНТА..." : "WAITING FOR OPPONENT'S MOVE...",
        "info"
      );
    }

    // Show claim timeout button if opponent AFK > 5 min and it's their turn
    const now = Math.floor(Date.now() / 1000);
    const claimTimeoutBtn = document.getElementById("claim-timeout-btn") as HTMLButtonElement;
    if (claimTimeoutBtn) {
      const opponentTurn = room.turn !== getMyTurnIndex();
      if (opponentTurn && now - room.lastActionAt >= 300) {
        claimTimeoutBtn.style.display = "block";
        claimTimeoutBtn.textContent = currentLocale === "ru" ? "ЗАБРАТЬ ВЫИГРЫШ (ТАЙМАУТ)" : "CLAIM WIN (TIMEOUT)";
      } else {
        claimTimeoutBtn.style.display = "none";
      }
    }
  }

  if ((room.status === ROOM_STATUS_FINISHED || room.status === ROOM_STATUS_TIMEOUT) && !chainRoomResultShown) {
    chainRoomResultShown = true;
    isPlaying = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    setTurn(null);
    startIdleMusic();

    // Show opponent cards face up (they were hidden)
    dealerCardsEl.innerHTML = "";
    oppCards.forEach(card => {
      const el = renderCard(card);
      el.style.animation = "none";
      dealerCardsEl.appendChild(el);
    });
    dealerScoreEl.textContent = oppScore.toString();

    // Determine result for me
    let myResult: "win" | "lose" | "draw";
    if (room.result === 3) {
      myResult = "draw";
    } else if ((room.result === 1 && amIHost) || (room.result === 2 && !amIHost)) {
      myResult = "win";
    } else {
      myResult = "lose";
    }

    const betEds = formatEDS(room.betAmount);
    if (myResult === "win") {
      showMessage(
        currentLocale === "ru" ? `ПОБЕДА! +${betEds}` : `YOU WIN! +${betEds}`,
        "success"
      );
      playSound("win");
      createConfetti();
      setMascotState("excited", "\u{1F929}", currentLocale === "ru" ? "ПОБЕДА!" : "YOU WIN!");
      if (winnerBannerEl) {
        winnerBannerEl.style.display = "block";
        winnerBannerEl.textContent = currentLocale === "ru" ? "ПОБЕДИТЕЛЬ" : "WINNER";
      }
      // Подсветка изменения баланса (быстрее)
      setTimeout(() => highlightBalanceChange(true, room.betAmount), 200);
    } else if (myResult === "draw") {
      showMessage(
        currentLocale === "ru" ? "НИЧЬЯ!" : "DRAW!",
        "info"
      );
      setMascotState("thinking", "\u{1F937}", currentLocale === "ru" ? "Ничья!" : "Draw!");
      if (winnerBannerEl) winnerBannerEl.style.display = "none";

      // Пауза 2 секунды перед переигрышем
      setTimeout(() => {
        showMessage(
          currentLocale === "ru" ? "⚠️ ПЕРЕИГРЫШ! Раздаём новые карты..." : "⚠️ REPLAY! Dealing new cards...",
          "info"
        );
        setMascotState("thinking", "\u{1F3B4}", currentLocale === "ru" ? "Переигрыш!" : "Replay!");
      }, 2000);

      // Ничья в on-chain мультиплеере — комната остаётся активной, просто сбрасываем карты
      // Контракт уже сбросил состояние и раздал новые карты
      // Просто продолжаем опрос комнаты
      return; // Не вызываем finishActiveRoom()
    } else {
      showMessage(
        currentLocale === "ru" ? `ПОРАЖЕНИЕ -${betEds}` : `YOU LOSE -${betEds}`,
        "error"
      );
      setMascotState("sad", "\u{1F61E}", currentLocale === "ru" ? "Поражение..." : "You lose...");
      if (winnerBannerEl) winnerBannerEl.style.display = "none";
      // Подсветка изменения баланса (быстрее)
      setTimeout(() => highlightBalanceChange(false, room.betAmount), 200);
    }

    // Refresh balance
    updateInGameBalance();
    setTimeout(() => updateInGameBalance(), 3000);
    updateUI();
    // Keep result + table + action buttons in view
    setTimeout(() => {
      focusGameplayArea();
    }, 500);
    finishActiveRoom();
  }

  if (room.status === ROOM_STATUS_CANCELLED) {
    isPlaying = false;
    showMessage(
      currentLocale === "ru" ? "КОМНАТА ОТМЕНЕНА" : "ROOM CANCELLED",
      "info"
    );
    cleanupMultiplayer();
  }

  updateUI();
}

function mpLog(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${ts}] ${msg}`;
  mpLogLines.push(line);
  if (mpLogLines.length > 20) mpLogLines = mpLogLines.slice(-20);
  console.log(line);
}

// Normalize address: convert base58 to hex if needed, lowercase
function normalizeAddress(addr: string): string {
  if (!addr) return "";
  // Already hex
  if (addr.startsWith("0x")) return addr.toLowerCase();
  // Try base58 decode
  try {
    const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let n = BigInt(0);
    for (const c of addr) {
      n = n * 58n + BigInt(ALPHABET.indexOf(c));
    }
    let hex = n.toString(16);
    // Pad to 64 chars (32 bytes)
    while (hex.length < 64) hex = "0" + hex;
    return ("0x" + hex).toLowerCase();
  } catch {
    return addr.toLowerCase();
  }
}

function isDemoActive(): boolean {
  // Demo mode OFF when: wallet connected (any network) or mainnet selected
  if (walletAddress) return false;
  if (networkMode === "mainnet") return false;
  return DEMO_MODE;
}

function isLuffaInApp(): boolean {
  try { return isInLuffaApp(); } catch { /* fallback */ }
  const ua = navigator.userAgent || "";
  const w = window as any;
  return /luffa/i.test(ua) || Boolean(w.luffa);
}

function requestAutoConnectInLuffa() {
  if (autoConnectAttempted || walletAddress) return;
  autoConnectAttempted = true;

  // If opened from QR with ?wallet=luffa — auto-start session and connect
  const wp = new URLSearchParams(window.location.search).get("wallet");
  const fromQr = wp === "luffa";

  // Luffa bridge (_endlessWallet) may take time to inject — retry several times
  let attempt = 0;
  const maxAttempts = 10;
  const check = () => {
    if (walletAddress || attempt >= maxAttempts) return;
    attempt++;
    if (isLuffaInApp() || fromQr) {
      // Auto-start session so the user doesn't have to press START
      if (!isSessionStarted && playerName) {
        startSession();
      }
      setPreferredWalletType("luffa");
      connectLuffa(networkMode).then(async (addr) => {
        walletAddress = addr;
        await onWalletConnectSuccess();
      }).catch(() => {});
    } else {
      setTimeout(check, 400);
    }
  };
  setTimeout(check, 500);
}

function pulseBetDisplay() {
  if (betDisplay) {
    betDisplay.classList.remove("bet-pulse");
    // Force reflow to restart animation
    void betDisplay.offsetWidth;
    betDisplay.classList.add("bet-pulse");
    window.setTimeout(() => betDisplay.classList.remove("bet-pulse"), 3800);
  }
}

function pulseDepositButton() {
  if (!depositBtnHeader || depositBtnHeader.style.display === "none") return;
  depositBtnHeader.classList.remove("wallet-cta-pulse");
  // Force reflow to restart animation
  void depositBtnHeader.offsetWidth;
  depositBtnHeader.classList.add("wallet-cta-pulse");
  window.setTimeout(() => depositBtnHeader.classList.remove("wallet-cta-pulse"), 3600);
}

// Скролл к балансу и подмигивание после изменения
function highlightBalanceChange(isWin: boolean, _amount: number) {
  // Скролл к балансу (верхняя область с кнопками)
  if (ingameBalanceRow) {
    ingameBalanceRow.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  
  // Подмигивание кнопки депозита (рядом с балансом)
  pulseDepositButton();

  // Показываем изменение баланса анимацией
  if (balanceEl) {
    balanceEl.classList.add("balance-flash");
    balanceEl.classList.toggle("balance-win", isWin);
    balanceEl.classList.toggle("balance-lose", !isWin);
  }
  
  // Через 2 секунды возвращаем обратно к столу
  window.setTimeout(() => {
    if (balanceEl) {
      balanceEl.classList.remove("balance-flash", "balance-win", "balance-lose");
    }
    focusGameplayArea();
  }, 2000);
}

function focusBetArea() {
  scrollToGameArea();
  pulseBetDisplay();
}

function focusGameplayArea() {
  scrollToGameArea(window.innerWidth <= 520 ? 150 : 110);
}

function forceScrollToAbsoluteTop() {
  // Mobile in-app browsers may ignore a single smooth scroll call.
  const applyTop = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  applyTop();
  requestAnimationFrame(() => {
    applyTop();
    window.setTimeout(applyTop, 80);
  });
}

function getScrollModeForPersist(): "top" | "bet" | "table" {
  if (!isSessionStarted) return "top";
  if (document.body.classList.contains("game-active") || isPlaying || multiplayerRoom) return "table";
  return "bet";
}

function saveUiState() {
  if (isApplyingUiState) return;
  try {
    const state: PersistedUiState = {
      v: 1,
      ts: Date.now(),
      sessionStarted: Boolean(isSessionStarted),
      sessionMode: walletAddress ? "wallet" : "demo",
      gameActive: document.body.classList.contains("game-active"),
      isPlaying: Boolean(isPlaying),
      hasGameResult: Boolean(hasGameResult),
      multiplayerRoom: multiplayerRoom || null,
      chainRoomId: chainRoomId ?? null,
      chainGameId: chainGameId ?? null,
      mpOnChainMode: Boolean(mpOnChainMode),
      isRoomHost: Boolean(isRoomHost),
      amIHost: Boolean(amIHost),
      scrollMode: getScrollModeForPersist(),
    };
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures.
  }
}

function applySessionLayout() {
  nameSection.style.display = isSessionStarted ? "none" : "block";
  walletSection.style.display = isSessionStarted ? "block" : "none";
  gameArea.style.display = isSessionStarted ? "block" : "none";
  setDarkVeilVisible(!isSessionStarted);
  setShadowBarsVisible(isSessionStarted);
}

function restoreUiStateFromStorage() {
  let parsed: PersistedUiState | null = null;
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return;
    parsed = JSON.parse(raw) as PersistedUiState;
  } catch {
    return;
  }
  if (!parsed || parsed.v !== 1) return;
  if (!parsed.ts || (Date.now() - parsed.ts) > UI_STATE_TTL_MS) return;
  restoredUiState = parsed;
  if (!parsed.sessionStarted || RELEASE_MODE) return;

  // Проверяем, есть ли активная комната для восстановления
  // Восстанавливаем только если есть multiplayerRoom или chainRoomId
  const hasActiveRoom = parsed.multiplayerRoom || parsed.chainRoomId;
  
  if (!hasActiveRoom) {
    // Нет активной комнаты — показываем главный экран
    return;
  }

  // Есть комната — восстанавливаем сессию
  isApplyingUiState = true;
  isSessionStarted = true;
  if (parsed.multiplayerRoom) multiplayerRoom = parsed.multiplayerRoom;
  if (parsed.chainRoomId) chainRoomId = parsed.chainRoomId;
  if (parsed.chainGameId) chainGameId = parsed.chainGameId;
  mpOnChainMode = Boolean(parsed.mpOnChainMode);
  isRoomHost = Boolean(parsed.isRoomHost);
  amIHost = Boolean(parsed.amIHost);
  hasGameResult = Boolean(parsed.hasGameResult);
  isPlaying = false;
  applySessionLayout();
  if (playerDisplayName) playerDisplayName.textContent = playerName || I18N[currentLocale].player_placeholder;
  if (playerHandNameEl) playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
  if (parsed.gameActive) {
    document.body.classList.add("game-active");
  } else {
    document.body.classList.remove("game-active");
  }
  isApplyingUiState = false;
}

function restoreDemoGameIfNeeded() {
  if (!restoredUiState || restoredUiState.sessionMode !== "demo") return;
  if (multiplayerRoom) return;
  const existingGame = game.getCurrentGame();
  if (!existingGame) return;
  if (!existingGame.isFinished) {
    pendingResume = { mode: "demo", game: existingGame };
    setTurn("you");
    showMessage(I18N[currentLocale].msg_resume_ready, "info");
    return;
  }
  hasGameResult = true;
  void renderGame(existingGame).then(() => {
    updateUI();
  }).catch(() => {});
}

async function restoreChainStateIfNeeded() {
  if (restoreChainStateAttempted) return;
  if (!restoredUiState || restoredUiState.sessionMode !== "wallet") return;
  if (!walletAddress) return;
  restoreChainStateAttempted = true;

  if (restoredUiState.chainRoomId && restoredUiState.mpOnChainMode) {
    chainRoomId = restoredUiState.chainRoomId;
    mpOnChainMode = true;
    multiplayerRoom = `chain_${restoredUiState.chainRoomId}`;
    try {
      const room = await getRoomOnChain(restoredUiState.chainRoomId, networkMode);
      if (room.status === ROOM_STATUS_WAITING && amIHost) {
        try {
          await cancelRoomOnChain(restoredUiState.chainRoomId, networkMode);
          mpLog(`Restored waiting room ${restoredUiState.chainRoomId} cancelled (refund).`);
          showMessage(
            currentLocale === "ru"
              ? "Неактивное приглашение отменено, баланс возвращён."
              : "Stale invite cancelled, balance refunded.",
            "info"
          );
        } catch (err) {
          mpLog(`cancel_room error while restoring: ${err}`);
        }
        cleanupMultiplayer();
        chainRoomId = null;
        mpOnChainMode = false;
        amIHost = false;
        multiplayerRoom = null;
        updateUI();
        return;
      }
      chainRoom = room;
      renderChainRoom(room);
      startRoomPolling();
      showMessage(
        currentLocale === "ru" ? "СЕССИЯ В КОМНАТЕ ВОССТАНОВЛЕНА" : "ROOM SESSION RESTORED",
        "info"
      );
      return;
    } catch {
      // Room may be unavailable already.
    }
  }

  if (restoredUiState.chainGameId && !multiplayerRoom) {
    try {
      const savedChainGame = await getGame(restoredUiState.chainGameId, networkMode);
      chainGameId = restoredUiState.chainGameId;
      chainGame = savedChainGame;
      if (savedChainGame && !savedChainGame.isFinished) {
        pendingResume = { mode: "chain", game: savedChainGame, gameId: restoredUiState.chainGameId };
        setTurn("you");
        showMessage(I18N[currentLocale].msg_resume_ready, "info");
      } else if (savedChainGame) {
        hasGameResult = true;
        await renderGame(savedChainGame);
      }
      updateUI();
    } catch {
      // Ignore restore errors.
    }
  }
}

function initDebug() {
  // Debug UI removed — log only to console
  debugEnabled = true;
  (window as any).__debugLog = debugLogLine;
}

function debugLogLine(message: string) {
  if (!debugEnabled) return;
  const ts = new Date().toISOString().slice(11, 19);
  debugLog.push(`[${ts}] ${message}`);
  if (debugLog.length > 200) debugLog = debugLog.slice(-200);
  if (debugLogEl) debugLogEl.textContent = debugLog.join("\n");
}

// ==================== MAIN VEIL (HOME ONLY) ====================
let veilRaf: number | null = null;
let veilRunning = false;
let veilCanvas: HTMLCanvasElement | null = null;
let veilCtx: CanvasRenderingContext2D | null = null;
let veilLowCanvas: HTMLCanvasElement | null = null;
let veilLowCtx: CanvasRenderingContext2D | null = null;
let veilLowData: ImageData | null = null;


function initDarkVeil() {
  if (!mainVeil) return;
  if (veilCanvas) return;
  veilCanvas = document.createElement("canvas");
  veilCanvas.className = "dark-veil-canvas";
  mainVeil.appendChild(veilCanvas);
  veilCtx = veilCanvas.getContext("2d");
  const onResize = () => resizeDarkVeil();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  resizeDarkVeil();
}

function getViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  if (vv && vv.width > 0 && vv.height > 0) {
    return { width: vv.width, height: vv.height };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function resizeDarkVeil() {
  if (!veilCanvas || !veilCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width: vw, height: vh } = getViewportSize();
  const width = Math.max(1, vw);
  const height = Math.max(1, vh);
  veilCanvas.width = Math.floor(width * dpr);
  veilCanvas.height = Math.floor(height * dpr);
  veilCanvas.style.width = `${width}px`;
  veilCanvas.style.height = `${height}px`;
  veilCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderDarkVeil(time: number) {
  if (!veilCanvas || !veilCtx) return;
  const ctx = veilCtx;
  const dpr = ctx.getTransform().a || 1;
  const w = veilCanvas.width / dpr;
  const h = veilCanvas.height / dpr;
  const t = time * 0.001332;
  const isLight = document.body.getAttribute("data-theme") === "light";
  const lowW = Math.max(140, Math.floor(w / 4.5));
  const lowH = Math.max(240, Math.floor(h / 4.5));

  if (!veilLowCanvas) {
    veilLowCanvas = document.createElement("canvas");
  }
  if (!veilLowCtx) {
    veilLowCtx = veilLowCanvas.getContext("2d");
  }
  if (!veilLowCtx) return;
  if (veilLowCanvas.width !== lowW || veilLowCanvas.height !== lowH || !veilLowData) {
    veilLowCanvas.width = lowW;
    veilLowCanvas.height = lowH;
    veilLowData = veilLowCtx.createImageData(lowW, lowH);
  }

  const data = veilLowData.data;
  const cx = 0.5;
  const cy = 0.45;
  for (let y = 0; y < lowH; y++) {
    const ny = y / lowH;
    for (let x = 0; x < lowW; x++) {
      const nx = x / lowW;
      const flowX = nx + 0.08 * Math.sin((ny * 4.0) + t);
      const flowY = ny + 0.08 * Math.cos((nx * 3.2) - t * 0.9);
      const v1 = Math.sin((flowX * 7.2 + t * 0.7) + Math.sin(flowY * 5.1 - t * 0.6) * 1.6);
      const v2 = Math.cos((flowY * 6.4 - t * 0.5) + Math.sin(flowX * 4.4 + t * 0.8) * 1.4);
      const v3 = Math.sin((flowX + flowY) * 4.2 - t * 0.4);
      let v = (v1 + v2 + v3) / 3; // -1..1
      v = v * 0.5 + 0.5; // 0..1
      const dx = nx - cx;
      const dy = ny - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vignette = Math.max(0, 1 - dist * 1.35);
      v = v * 0.85 + vignette * 0.15;

      let r: number;
      let g: number;
      let b: number;
      if (isLight) {
        const baseR = 232;
        const baseG = 226;
        const baseB = 216;
        r = baseR - v * 120;
        g = baseG - v * 130;
        b = baseB + v * 70;
      } else {
        const base = 8;
        r = base + v * 110;
        g = base + v * 55;
        b = 30 + v * 190;
      }
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      const idx = (y * lowW + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  veilLowCtx.putImageData(veilLowData, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(veilLowCanvas, 0, 0, w, h);

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.max(w, h) * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, isLight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function startDarkVeil() {
  if (veilRunning) return;
  veilRunning = true;
  const loop = (time: number) => {
    if (!veilRunning) return;
    renderDarkVeil(time);
    veilRaf = requestAnimationFrame(loop);
  };
  veilRaf = requestAnimationFrame(loop);
}

function stopDarkVeil() {
  veilRunning = false;
  if (veilRaf) {
    cancelAnimationFrame(veilRaf);
    veilRaf = null;
  }
}

function setDarkVeilVisible(show: boolean) {
  if (!mainVeil) return;
  mainVeil.style.display = show ? "block" : "none";
  if (show) {
    startDarkVeil();
  } else {
    stopDarkVeil();
  }
}

// ==================== SHADOW BARS (GAME ONLY) ====================
let shadowBarsRaf: number | null = null;
let shadowBarsRunning = false;
let shadowBarsCanvas: HTMLCanvasElement | null = null;
let shadowBarsCtx: CanvasRenderingContext2D | null = null;
let shadowBarsLowCanvas: HTMLCanvasElement | null = null;
let shadowBarsLowCtx: CanvasRenderingContext2D | null = null;
let shadowBarsLowData: ImageData | null = null;

function initShadowBars() {
  if (!gameShadowBars) return;
  if (shadowBarsCanvas) return;
  shadowBarsCanvas = document.createElement("canvas");
  shadowBarsCanvas.className = "shadow-bars-canvas";
  gameShadowBars.appendChild(shadowBarsCanvas);
  shadowBarsCtx = shadowBarsCanvas.getContext("2d");
  const onResize = () => resizeShadowBars();
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);
  window.visualViewport?.addEventListener("resize", onResize);
  resizeShadowBars();
}

function resizeShadowBars() {
  if (!shadowBarsCanvas || !shadowBarsCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width: vw, height: vh } = getViewportSize();
  const width = Math.max(1, vw);
  const height = Math.max(1, vh);
  shadowBarsCanvas.width = Math.floor(width * dpr);
  shadowBarsCanvas.height = Math.floor(height * dpr);
  shadowBarsCanvas.style.width = `${width}px`;
  shadowBarsCanvas.style.height = `${height}px`;
  shadowBarsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderShadowBars(time: number) {
  if (!shadowBarsCanvas || !shadowBarsCtx) return;
  const ctx = shadowBarsCtx;
  const dpr = ctx.getTransform().a || 1;
  const w = shadowBarsCanvas.width / dpr;
  const h = shadowBarsCanvas.height / dpr;
  const t = time * 0.000333;
  const isLight = document.body.getAttribute("data-theme") === "light";
  const lowW = Math.max(120, Math.floor(w / 6));
  const lowH = Math.max(220, Math.floor(h / 6));

  if (!shadowBarsLowCanvas) shadowBarsLowCanvas = document.createElement("canvas");
  if (!shadowBarsLowCtx) shadowBarsLowCtx = shadowBarsLowCanvas.getContext("2d");
  if (!shadowBarsLowCtx) return;
  if (shadowBarsLowCanvas.width !== lowW || shadowBarsLowCanvas.height !== lowH || !shadowBarsLowData) {
    shadowBarsLowCanvas.width = lowW;
    shadowBarsLowCanvas.height = lowH;
    shadowBarsLowData = shadowBarsLowCtx.createImageData(lowW, lowH);
  }

  const data = shadowBarsLowData.data;
  for (let y = 0; y < lowH; y++) {
    const ny = y / lowH;
    const fadeY = 0.25 + 0.75 * Math.sin(ny * Math.PI);
    for (let x = 0; x < lowW; x++) {
      const nx = x / lowW;
      const wave =
        Math.sin(nx * 7.5 + t * 1.2) * 0.55 +
        Math.sin(nx * 15.0 - t * 0.9) * 0.35 +
        Math.sin((nx + ny * 0.25) * 11.0 + t * 0.6) * 0.25;
      let v = wave * 0.5 + 0.5;
      v = Math.pow(Math.max(0, v - 0.2), 2.0) * 1.35;
      v *= fadeY;

      let r: number;
      let g: number;
      let b: number;
      if (isLight) {
        const baseR = 238;
        const baseG = 232;
        const baseB = 224;
        r = baseR - v * 150;
        g = baseG - v * 170;
        b = baseB + v * 70;
      } else {
        const base = 6;
        r = base + v * 90;
        g = base + v * 20;
        b = 18 + v * 170;
      }
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      const idx = (y * lowW + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  shadowBarsLowCtx.putImageData(shadowBarsLowData, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(shadowBarsLowCanvas, 0, 0, w, h);

  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.max(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, isLight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.65)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function startShadowBars() {
  if (shadowBarsRunning) return;
  shadowBarsRunning = true;
  const loop = (time: number) => {
    if (!shadowBarsRunning) return;
    renderShadowBars(time);
    shadowBarsRaf = requestAnimationFrame(loop);
  };
  shadowBarsRaf = requestAnimationFrame(loop);
}

function stopShadowBars() {
  shadowBarsRunning = false;
  if (shadowBarsRaf) {
    cancelAnimationFrame(shadowBarsRaf);
    shadowBarsRaf = null;
  }
}

function setShadowBarsVisible(show: boolean) {
  if (!gameShadowBars) return;
  gameShadowBars.style.display = show ? "block" : "none";
  if (show) startShadowBars();
  else stopShadowBars();
}



function resetCurrentGameState() {
  game.resetCurrentGame();
  isPlaying = false;
  hasGameResult = false;
  pendingResume = null;
  chainGameId = 0;
  chainGame = null;
  dealerCardsEl.innerHTML = "";
  playerCardsEl.innerHTML = "";
  dealerScoreEl.textContent = "-";
  playerScoreEl.textContent = "-";
  hidePlayerHints();
  hideGameResult();
  setTurn(null);
}

function returnToStartScreen() {
  document.body.classList.remove("game-active");
  isSessionStarted = false;
  applySessionLayout();
  resetCurrentGameState();
  startIdleMusic();
  mpPayoutBucket = 0;
  mpPayoutRoom = null;
  localStorage.setItem("mpPayoutBucket", "0");
  localStorage.removeItem("mpPayoutRoom");
  saveUiState();
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

// ==================== LEADERBOARD DATA ====================
interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  profit: number;
  lastPlayed: number;
  dailyWins: number;
  dailyLosses: number;
  dailyProfit: number;
  dailyDate: string; // "YYYY-MM-DD"
}

interface FeedItem {
  text: string;
  createdAt: number;
}

// Fake players for demo
const todayStr = new Date().toISOString().slice(0, 10);
const FAKE_PLAYERS: LeaderboardEntry[] = [
  { name: "CryptoKing", wins: 45, losses: 32, profit: 125.5, lastPlayed: Date.now() - 60000, dailyWins: 5, dailyLosses: 3, dailyProfit: 18.2, dailyDate: todayStr },
  { name: "LuckyAce", wins: 38, losses: 28, profit: 89.2, lastPlayed: Date.now() - 120000, dailyWins: 3, dailyLosses: 2, dailyProfit: 12.0, dailyDate: todayStr },
  { name: "PixelPro", wins: 29, losses: 35, profit: -12.8, lastPlayed: Date.now() - 180000, dailyWins: 1, dailyLosses: 4, dailyProfit: -8.5, dailyDate: todayStr },
  { name: "Web3Wizard", wins: 52, losses: 41, profit: 156.3, lastPlayed: Date.now() - 30000, dailyWins: 7, dailyLosses: 2, dailyProfit: 32.1, dailyDate: todayStr },
  { name: "CardShark", wins: 33, losses: 30, profit: 45.0, lastPlayed: Date.now() - 90000, dailyWins: 2, dailyLosses: 3, dailyProfit: -4.0, dailyDate: todayStr },
];
const DEMO_PLAYERS = DEMO_MODE ? FAKE_PLAYERS : [];

const FEED_EVENTS = [
  "won big on 21",
  "hit blackjack",
  "made a comeback",
  "3 wins in a row",
  "took a risky win",
  "pulled off a surprise win",
];

const I18N = {
  en: {
    subtitle: "WEB3 MULTIPLAYER",
    demo_mode: "TEST MODE",
    enter_name: "ENTER YOUR NAME:",
    player_placeholder: "Player",
    start: "START",
    player: "PLAYER:",
    balance: "BALANCE:",
  reset_demo: "RESET BALANCE",
    mascot_idle: "Let's play?",
    bet: "BET",
    bet_hint: "MIN 0.1 EDS · MAX 10000 EDS",
    deal: "DEAL",
    dealer: "DEALER",
    you: "YOU",
    msg_place_bet: "PLACE YOUR BET AND LET THE DEALER DEAL!",
    hit: "HIT",
    stand: "STAND",
    actions_hint: "HIT — take a card, STAND — end your turn",
    win: "YOU WIN!",
    lose: "YOU LOSE",
    blackjack: "BLACKJACK!",
    leaderboard: "🏆 LEADERBOARD",
    today: "TODAY",
    all_time: "ALL TIME",
    wins: "WINS",
    profit: "PROFIT",
    feed: "≋ FEED",
    your_stats: "▮▮▮ YOUR STATS",
    games: "GAMES",
    losses: "LOSSES",
    blackjacks: "BLACKJACKS",
    win_rate: "WIN RATE",
    active_players: "🎮 ACTIVE PLAYERS",
    powered_by: "POWERED BY",
    author: "By",
    version: "v2.0.0 - Multiplayer",
    msg_invalid_bet: "INVALID BET!",
    msg_check_bet: "Check your bet!",
    msg_dealing: "DEALING...",
    msg_dealer_turn: "DEALER'S TURN...",
    msg_your_turn: "YOUR TURN!",
    msg_failed_start: "FAILED TO START!",
    msg_try_again: "Try again!",
    msg_insufficient: "NOT ENOUGH BALANCE FOR THIS BET! TOP UP OR LOWER THE BET.",
    msg_good_luck: "Good luck!",
    msg_perfect_21: "Perfect 21!",
    msg_standing_21: "21! STANDING...",
    msg_error: "ERROR!",
    msg_draw: "DRAW — DEAL AGAIN UNTIL WINNER",
    msg_win: "YOU WIN!",
    msg_lose: "YOU LOSE",
    msg_winner: "Winner: {name}",
    msg_dealer_wins: "DEALER WINS",
    msg_dealer_draw: "DRAW WITH DEALER",
    msg_turn_wait: "PROCESSING...",
    msg_blackjack: "BLACKJACK!",
    msg_play_again: "Play again?",
    msg_invite_used: "This invite already finished. Request a new link.",
    continue: "CONTINUE",
    msg_resume: "GAME RESUMED",
    msg_resume_ready: "PRESS DEAL TO RESUME",
    turn_you: "YOUR TURN",
    turn_dealer: "DEALER TURN",
    turn_of: "TURN:",
    bet_offer: "Bet offer",
    msg_demo_reset: "TEST DATA RESET",
    msg_demo_reset_mascot: "Test reset",
    feed_empty: "No events yet. Play your first hand!",
    feed_draw: "played a draw",
    feed_win: "won",
    feed_lose: "lost",
    feed_blackjack: "hit blackjack and won",
    rel_now: "just now",
    rel_1m: "1 min ago",
    rel_min: "min ago",
    rel_old: "a while ago",
    title_sound: "Sound",
    music: "MUSIC",
    effects: "EFFECTS",
    connect_wallet: "CONNECT WALLET",
    reconnect_wallet: "RECONNECT WALLET",
    wallet_picker_title: "CHOOSE WALLET",
    wallet_endless: "ENDLESS WALLET",
    wallet_endless_desc: "Web wallet",
    wallet_luffa: "LUFFA WALLET",
    wallet_luffa_desc: "Scan QR code",
    wallet_recommended: "RECOMMENDED",
    wallet_coming_soon: "COMING SOON",
    wallet_back: "BACK",
    wallet_connecting: "CONNECTING...",
    wallet_endless_missing: "ENDLESS WALLET NOT FOUND",
    wallet_endless_install: "Open Endless Wallet and connect manually.",
    wallet_endless_open: "OPEN ENDLESS WALLET",
    wallet_luffa_qr: "SCAN QR CODE IN LUFFA APP",
    wallet_luffa_qr_hint: "SCAN QR IN LUFFA APP. THE PAGE WILL OPEN IN LUFFA BROWSER AND WALLET CONNECTS AUTOMATICALLY.",
    wallet_luffa_connecting: "Connecting via Luffa...",
    wallet_modal_title: "WALLET REQUIRED",
    wallet_modal_text: "Install Luffa to connect your Endless wallet.",
    wallet_modal_text_inapp: "Approve the connection in your Luffa wallet.",
    wallet_modal_install: "OPEN ENDLESS WALLET",
    wallet_modal_close: "CLOSE",
    invite_modal_title: "INVITE BET",
    invite_modal_text: "Enter the bet to propose.",
    invite_modal_send: "SEND INVITE",
    change_login: "CHANGE LOGIN",
    nickname_title: "YOUR NICKNAME",
    nickname_text: "Choose a name to show in games.",
    nickname_save: "SAVE",
    title_theme: "Theme",
    title_lang: "Language",
    title_bet_minus: "Decrease bet",
    title_bet_plus: "Increase bet",
    title_deal: "Start dealing",
    title_hit: "Take a card",
    title_stand: "Stand and pass to dealer",
    msg_release_lock: "Release mode: test and wallet features are disabled.",
    claim: "CLAIM WINNINGS",
    msg_claimed: "PAYOUT CLAIMED",
    msg_no_payout: "NO PAYOUT AVAILABLE",
    bankroll: "BANKROLL:",
    bet_fee: "BET FEE:",
    game_fee: "GAME FEE:",
    payout_due: "Payout due:",
    title_network: "Network",
    title_testnet: "Testnet",
    title_mainnet: "Mainnet",
    testnet: "TESTNET",
    mainnet: "MAINNET",
    msg_wallet_missing: "CONNECT ENDLESS WALLET",
    msg_wallet_failed: "WALLET CONNECTION FAILED",
    tx_wait_wallet: "Waiting for wallet confirmation...",
    tx_submitted: "Transaction submitted:",
    wallet: "WALLET:",
    status: "STATUS:",
    network: "NETWORK:",
    invite: "INVITE TO GAME",
    invite_note: "Game invite link copied",
    invited_by: "Invited by",
    invite_accept: "ACCEPT",
    invite_decline: "DECLINE",
    invite_mode_demo: "TEST",
    invite_mode_testnet: "TESTNET",
    invite_mode_mainnet: "MAINNET",
    invite_bet: "Bet",
    wallet_connected: "CONNECTED",
    wallet_off: "OFF",
    disconnect_wallet: "DISCONNECT",
    demo_play: "TEST",
    faucet: "GET EDS",
    faucet_success: "Test EDS received! Balance updated.",
    faucet_fail: "Failed to get test EDS. Try again.",
    fund_bank: "FUND BANK",
    fund_bank_success: "Bankroll funded!",
    fund_bank_fail: "Failed to fund bankroll.",
    deposit: "DEPOSIT",
    withdraw_btn: "WITHDRAW",
    deposit_success: "Deposit successful! In-game balance updated.",
    deposit_fail: "Deposit failed.",
    withdraw_success: "Withdrawal successful! Funds returned to wallet.",
    withdraw_fail: "Withdrawal failed.",
    ingame_balance: "IN-GAME:",
  },
  ru: {
    subtitle: "WEB3 МУЛЬТИПЛЕЕР",
    demo_mode: "ТЕСТОВЫЙ РЕЖИМ",
    enter_name: "ВВЕДИТЕ ИМЯ:",
    player_placeholder: "Игрок",
    start: "СТАРТ",
    player: "ИГРОК:",
    balance: "БАЛАНС:",
  reset_demo: "СБРОС БАЛАНСА",
    mascot_idle: "Играем?",
    bet: "СТАВКА",
    bet_hint: "МИН 0.1 EDS · МАКС 10000 EDS",
    deal: "РАЗДАТЬ",
    dealer: "ДИЛЕР",
    you: "ИГРОК",
    msg_place_bet: "СДЕЛАЙ СТАВКУ И ДИЛЕР РАЗДАСТ КАРТЫ!",
    hit: "ЕЩЕ",
    stand: "СТОП",
    actions_hint: "ЕЩЕ — взять карту, СТОП — завершить ход",
    win: "ПОБЕДА!",
    lose: "ПРОИГРЫШ",
    blackjack: "БЛЭКДЖЕК!",
    leaderboard: "🏆 РЕЙТИНГ",
    today: "СЕГОДНЯ",
    all_time: "ВСЕ ВРЕМЯ",
    wins: "ПОБЕДЫ",
    profit: "ПРИБЫЛЬ",
    feed: "≋ ЛЕНТА",
    your_stats: "▮▮▮ ТВОЯ СТАТИСТИКА",
    games: "ИГРЫ",
    losses: "ПОРАЖЕНИЯ",
    blackjacks: "БЛЭКДЖЕКИ",
    win_rate: "ВИНРЕЙТ",
    active_players: "🎮 АКТИВНЫЕ ИГРОКИ",
    powered_by: "НА ОСНОВЕ",
    author: "Автор:",
    version: "v2.0.0 - Мультиплеер",
    msg_invalid_bet: "НЕВЕРНАЯ СТАВКА!",
    msg_check_bet: "Проверь ставку!",
    msg_dealing: "РАЗДАЧА...",
    msg_dealer_turn: "ХОД ДИЛЕРА...",
    msg_your_turn: "ТВОЙ ХОД!",
    msg_failed_start: "НЕ УДАЛОСЬ НАЧАТЬ!",
    msg_try_again: "Попробуй ещё раз!",
    msg_insufficient: "НЕДОСТАТОЧНО БАЛАНСА ДЛЯ СТАВКИ! ПОПОЛНИТЕ БАЛАНС ИЛИ УМЕНЬШИТЕ СТАВКУ.",
    msg_good_luck: "Удачи!",
    msg_perfect_21: "Идеальные 21!",
    msg_standing_21: "21! СТОП...",
    msg_error: "ОШИБКА!",
    msg_draw: "НИЧЬЯ — РАЗДАЁМ СНОВА, ПОКА НЕ БУДЕТ ПОБЕДИТЕЛЯ",
    msg_win: "ПОБЕДА!",
    msg_lose: "ПРОИГРЫШ",
    msg_winner: "Победитель: {name}",
    msg_dealer_wins: "ВЫИГРАЛ ДИЛЕР",
    msg_dealer_draw: "НИЧЬЯ С ДИЛЕРОМ",
    msg_turn_wait: "ОБРАБОТКА...",
    msg_blackjack: "БЛЭКДЖЕК!",
    msg_play_again: "Сыграем ещё?",
    msg_invite_used: "Эта ссылка уже сыграна. Попросите новую.",
    continue: "ПРОДОЛЖИТЬ",
    msg_resume: "ИГРА ВОЗОБНОВЛЕНА",
    msg_resume_ready: "НАЖМИ РАЗДАТЬ ДЛЯ ПРОДОЛЖЕНИЯ",
    turn_you: "ВАШ ХОД",
    turn_dealer: "ХОД ДИЛЕРА",
    turn_of: "ХОД:",
    bet_offer: "Предложение ставки",
    msg_demo_reset: "ТЕСТОВЫЕ ДАННЫЕ СБРОШЕНЫ",
    msg_demo_reset_mascot: "Тест сброшен",
    feed_empty: "Пока пусто. Сыграй первую раздачу!",
    feed_draw: "сыграл вничью",
    feed_win: "выиграл",
    feed_lose: "проиграл",
    feed_blackjack: "взял блэкджек и выиграл",
    rel_now: "только что",
    rel_1m: "1 мин назад",
    rel_min: "мин назад",
    rel_old: "давно",
    title_sound: "Звук",
    music: "МУЗЫКА",
    effects: "ЭФФЕКТЫ",
    connect_wallet: "ПОДКЛЮЧИТЬ КОШЕЛЁК",
    reconnect_wallet: "ПЕРЕПОДКЛЮЧИТЬ",
    wallet_picker_title: "ВЫБОР КОШЕЛЬКА",
    wallet_endless: "ENDLESS WALLET",
    wallet_endless_desc: "Веб-кошелёк",
    wallet_luffa: "LUFFA WALLET",
    wallet_luffa_desc: "Сканировать QR-код",
    wallet_recommended: "РЕКОМЕНДУЕМ",
    wallet_coming_soon: "СКОРО",
    wallet_back: "НАЗАД",
    wallet_connecting: "ПОДКЛЮЧЕНИЕ...",
    wallet_endless_missing: "ENDLESS WALLET НЕ НАЙДЕН",
    wallet_endless_install: "Откройте Endless Wallet и подключитесь вручную.",
    wallet_endless_open: "ОТКРЫТЬ ENDLESS WALLET",
    wallet_luffa_qr: "СКАНИРУЙТЕ QR-КОД В ПРИЛОЖЕНИИ LUFFA",
    wallet_luffa_qr_hint: "СКАНИРУЙТЕ QR В LUFFA. СТРАНИЦА ОТКРОЕТСЯ В БРАУЗЕРЕ LUFFA И КОШЕЛЁК ПОДКЛЮЧИТСЯ АВТОМАТИЧЕСКИ.",
    wallet_luffa_connecting: "Подключение через Luffa...",
    wallet_modal_title: "НУЖЕН КОШЕЛЁК",
    wallet_modal_text: "Установите Luffa для подключения кошелька Endless.",
    wallet_modal_text_inapp: "Подтвердите подключение в кошельке Luffa.",
    wallet_modal_install: "ОТКРЫТЬ ENDLESS WALLET",
    wallet_modal_close: "ЗАКРЫТЬ",
    invite_modal_title: "СТАВКА ДЛЯ ПРИГЛАШЕНИЯ",
    invite_modal_text: "Введите ставку для игры.",
    invite_modal_send: "ОТПРАВИТЬ",
    change_login: "СМЕНИТЬ ЛОГИН",
    nickname_title: "ВАШ НИКНЕЙМ",
    nickname_text: "Выберите имя для отображения в игре.",
    nickname_save: "СОХРАНИТЬ",
    title_theme: "Тема",
    title_lang: "Язык",
    title_bet_minus: "Уменьшить ставку",
    title_bet_plus: "Увеличить ставку",
    title_deal: "Начать раздачу",
    title_hit: "Взять карту",
    title_stand: "Остановиться и передать ход дилеру",
    msg_release_lock: "Режим релиза: тест и кошельки отключены.",
    claim: "ЗАБРАТЬ ВЫИГРЫШ",
    msg_claimed: "ВЫИГРЫШ ПОЛУЧЕН",
    msg_no_payout: "НЕТ ВЫПЛАТЫ",
    bankroll: "БАНК:",
    bet_fee: "КОМИССИЯ:",
    game_fee: "КОМИССИЯ ИГРЫ:",
    payout_due: "К выплате:",
    title_network: "Сеть",
    title_testnet: "Тестнет",
    title_mainnet: "Майннет",
    testnet: "ТЕСТНЕТ",
    mainnet: "МАЙННЕТ",
    msg_wallet_missing: "ПОДКЛЮЧИТЕ КОШЕЛЁК ENDLESS",
    msg_wallet_failed: "ОШИБКА ПОДКЛЮЧЕНИЯ КОШЕЛЬКА",
    tx_wait_wallet: "Ожидание подтверждения кошелька...",
    tx_submitted: "Транзакция отправлена:",
    wallet: "КОШЕЛЁК:",
    status: "СТАТУС:",
    network: "СЕТЬ:",
    invite: "ПРИГЛАСИТЬ НА ИГРУ",
    invite_note: "Ссылка на игру скопирована",
    invited_by: "Пригласил",
    invite_accept: "ПРИНЯТЬ",
    invite_decline: "ОТКЛОНИТЬ",
    invite_mode_demo: "ТЕСТ",
    invite_mode_testnet: "ТЕСТНЕТ",
    invite_mode_mainnet: "МАЙННЕТ",
    invite_bet: "Ставка",
    wallet_connected: "ПОДКЛЮЧЁН",
    wallet_off: "ВЫКЛ",
    disconnect_wallet: "ОТКЛЮЧИТЬ",
    demo_play: "ТЕСТ",
    faucet: "ПОЛУЧИТЬ EDS",
    faucet_success: "Тестовые EDS получены! Баланс обновлён.",
    faucet_fail: "Не удалось получить EDS. Попробуйте ещё раз.",
    fund_bank: "ПОПОЛНИТЬ БАНК",
    fund_bank_success: "Банкролл пополнен!",
    fund_bank_fail: "Не удалось пополнить банкролл.",
    deposit: "ПОПОЛНИТЬ",
    withdraw_btn: "ВЫВЕСТИ",
    deposit_success: "Депозит выполнен! Игровой баланс обновлён.",
    deposit_fail: "Ошибка депозита.",
    withdraw_success: "Вывод выполнен! Средства возвращены в кошелёк.",
    withdraw_fail: "Ошибка вывода.",
    ingame_balance: "В ИГРЕ:",
  },
};

// ==================== INIT ====================
function init() {
  initDebug();
  (window as any).__openWalletPicker = showWalletPicker;
  initDarkVeil();
  initShadowBars();
  setDarkVeilVisible(!isSessionStarted);
  setShadowBarsVisible(isSessionStarted);
  // Name input
  startSessionBtn.addEventListener("click", startDemoSession);
  playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startDemoSession();
  });

  // Game controls
  startBtn.addEventListener("click", handleStartGame);
  hitBtn.addEventListener("click", handleHit);
  standBtn.addEventListener("click", handleStand);
  claimBtn.addEventListener("click", handleClaim);

  // Bet controls
  betMinus.addEventListener("click", () => adjustBet(-1));
  betPlus.addEventListener("click", () => adjustBet(1));
  betInput.addEventListener("change", validateBet);
  betInput.addEventListener("blur", validateBet);
  betInput.addEventListener("input", () => {
    // Force value sync on every keystroke for mobile browsers
    const val = parseFloat(betInput.value);
    if (!isNaN(val) && val > 0) {
      betInput.dataset.lastValue = val.toString();
    }
    updateFeeFromBet();
  });
  betAccept.addEventListener("click", async () => {
    if (mpOnChainMode && walletAddress && multiplayerSnapshot?.pendingBet) {
      const newBetOctas = parseEDS(multiplayerSnapshot.pendingBet.toString());
      await updateInGameBalance();
      if (inGameBalance < newBetOctas) {
        showMessage(
          currentLocale === "ru"
            ? `Недостаточно баланса для ставки ${multiplayerSnapshot.pendingBet} EDS. Пополните баланс.`
            : `Insufficient balance for ${multiplayerSnapshot.pendingBet} EDS bet. Please deposit.`,
          "error"
        );
        return;
      }
    }
    multiplayer.acceptBet();
  });
  betDecline.addEventListener("click", () => multiplayer.declineBet());
  updateFeeFromBet();

  // Sound
  soundToggle.addEventListener("click", () => {
    const muted = soundManager.toggleMute();
    updateSoundIcon();
    if (muted) {
      soundManager.setVolume(0, 0);
    } else {
      soundManager.setVolume(0.5, 0.3);
      if (gameMusicActive) {
        soundManager.startGameMusic();
      } else {
        soundManager.startIdleMusic();
      }
    }
  });
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      returnToStartScreen();
    });
  }
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      handleStartGame();
    });
  }
  if (endGameBtn) {
    endGameBtn.addEventListener("click", () => {
      returnToStartScreen();
    });
  }
  if (leaveGameBtn) {
    leaveGameBtn.addEventListener("click", () => {
      if (multiplayerRoom) {
        handleLeaveGame();
      } else {
        backToWalletStep();
      }
    });
  }
  // Claim timeout button (on-chain rooms)
  const claimTimeoutBtnInit = document.getElementById("claim-timeout-btn") as HTMLButtonElement;
  if (claimTimeoutBtnInit) {
    claimTimeoutBtnInit.addEventListener("click", async () => {
      if (!chainRoomId || !mpOnChainMode) return;
      try {
        claimTimeoutBtnInit.disabled = true;
        showMessage(
          currentLocale === "ru" ? "ЗАБИРАЕМ ВЫИГРЫШ..." : "CLAIMING WIN...",
          "info"
        );
        await claimTimeoutOnChain(chainRoomId, networkMode);
        mpLog(`Timeout claimed for room ${chainRoomId}`);
        showMessage(
          currentLocale === "ru" ? "ПОБЕДА ПО ТАЙМАУТУ!" : "WIN BY TIMEOUT!",
          "success"
        );
        playSound("win");
        stopRoomPolling();
        await updateInGameBalance();
      } catch (err) {
        mpLog(`claim_timeout error: ${err}`);
        showMessage(
          currentLocale === "ru" ? "ОШИБКА CLAIM" : "CLAIM ERROR",
          "error"
        );
        claimTimeoutBtnInit.disabled = false;
      }
    });
  }
  themeToggle.addEventListener("click", toggleTheme);
  langToggle.addEventListener("click", toggleLanguage);
  if (networkTestnetBtn) networkTestnetBtn.addEventListener("click", () => setNetwork("testnet"));
  if (networkMainnetBtn) networkMainnetBtn.addEventListener("click", () => setNetwork("mainnet"));

  // Demo play button — start session in demo mode without wallet
  if (demoPlayBtn) {
    demoPlayBtn.addEventListener("click", async () => {
      await startDemoSession();
    });
  }
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", () => {
      handleResetDemo();
    });
  }

  // Faucet button — get test EDS on testnet
  if (faucetBtn) {
    faucetBtn.addEventListener("click", () => {
      handleFaucet();
    });
  }

  // Fund bankroll button - owner only
  if (fundBankHeader) {
    fundBankHeader.addEventListener("click", () => handleFundBankroll());
  }
  // Init rooms button - owner only, one-time
  const initRoomsBtnSetup = document.getElementById("init-rooms-btn") as HTMLButtonElement;
  if (initRoomsBtnSetup) {
    initRoomsBtnSetup.addEventListener("click", async () => {
      try {
        initRoomsBtnSetup.disabled = true;
        initRoomsBtnSetup.textContent = "INITIALIZING...";
        const { initRooms } = await import("./chain");
        await initRooms(networkMode);
        initRoomsBtnSetup.textContent = "DONE!";
        showMessage("RoomStore initialized!", "success");
        setTimeout(() => { initRoomsBtnSetup.style.display = "none"; }, 2000);
      } catch (err) {
        initRoomsBtnSetup.disabled = false;
        initRoomsBtnSetup.textContent = "INIT ROOMS";
        const msg = err instanceof Error ? err.message : String(err);
        showMessage("Init rooms error: " + msg, "error");
      }
    });
  }
  // Fund modal confirm/cancel
  if (fundModalConfirm) {
    fundModalConfirm.addEventListener("click", () => executeFundBankroll());
  }
  if (fundModalCancel) {
    fundModalCancel.addEventListener("click", () => {
      if (fundModal) fundModal.style.display = "none";
    });
  }

  // Deposit/Withdraw buttons
  if (depositBtnHeader) depositBtnHeader.addEventListener("click", handleShowDeposit);
  if (withdrawBtnHeader) withdrawBtnHeader.addEventListener("click", handleShowWithdraw);
  if (depositModalConfirm) depositModalConfirm.addEventListener("click", executeDeposit);
  if (depositModalCancel) depositModalCancel.addEventListener("click", () => {
    if (depositModal) depositModal.style.display = "none";
  });
  if (withdrawModalConfirm) withdrawModalConfirm.addEventListener("click", executeWithdraw);
  if (withdrawModalCancel) withdrawModalCancel.addEventListener("click", () => {
    if (withdrawModal) withdrawModal.style.display = "none";
  });

  inviteBtnHeader.addEventListener("click", () => {
    if (inviteModal) {
      if (inviteModalTitle) inviteModalTitle.textContent = I18N[currentLocale].invite_modal_title;
      if (inviteModalText) inviteModalText.textContent = I18N[currentLocale].invite_modal_text;
      if (inviteBetConfirm) inviteBetConfirm.textContent = I18N[currentLocale].invite_modal_send;
      inviteBetInput.value = betInput.value || "1";
      inviteModal.style.display = "flex";
    }
  });
  inviteAccept.addEventListener("click", handleInviteAccept);
  inviteDecline.addEventListener("click", handleInviteDecline);
  walletModalClose.addEventListener("click", () => {
    if (walletModal) walletModal.style.display = "none";
  });
  if (walletOptEndless) {
    walletOptEndless.addEventListener("click", handleEndlessWalletConnect);
  }
  if (walletOptLuffa) {
    walletOptLuffa.addEventListener("click", handleLuffaWalletConnect);
  }
  if (walletPickerBack) {
    walletPickerBack.addEventListener("click", showWalletPicker);
  }
  requestAutoConnectInLuffa();
  nicknameSave.addEventListener("click", saveNickname);
  nicknameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveNickname();
  });
  inviteBetCancel.addEventListener("click", () => {
    if (inviteModal) inviteModal.style.display = "none";
  });
  inviteBetConfirm.addEventListener("click", () => {
    if (inviteModal) inviteModal.style.display = "none";
    betInput.value = inviteBetInput.value || betInput.value || "1";
    handleInvite();
  });
  changeLoginHeader.addEventListener("click", () => {
    if (nicknameModal) nicknameModal.style.display = "flex";
    if (nicknameInput) {
      nicknameInput.value = playerName || "";
      nicknameInput.focus();
    }
  });
  connectWalletHeader.addEventListener("click", async () => {
    if (walletAddress) {
      // Сразу отключаем кошелек без модалки
      await handleDisconnectWallet();
      return;
    }
    if (!isSessionStarted) {
      await startSession();
      showWalletPicker();
      focusBetArea();
      return;
    }
    showWalletPicker();
    focusBetArea();
  });

  // Tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn as HTMLButtonElement));
  });

  // Global button click SFX
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target && target.closest("button") && !target.closest("#start-btn")) {
      playSound("click");
    }
  });

  // First interaction
  document.addEventListener("click", initAudio, { once: true });
  document.addEventListener("touchstart", initAudio, { once: true });

  // Load name from URL param (QR link) or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const urlName = urlParams.get("name");
  
  // Если кошелек подключен — пробуем получить никнейм из localStorage по адресу кошелька
  if (walletAddress) {
    const walletNickname = localStorage.getItem("walletNickname_" + walletAddress);
    if (walletNickname) {
      playerName = walletNickname.slice(0, 12);
    } else if (urlName) {
      playerName = urlName.slice(0, 12);
    } else {
      playerName = I18N[currentLocale].player_placeholder;
    }
  } else {
    const savedName = urlName || localStorage.getItem("playerName");
    playerName = savedName ? savedName.slice(0, 12) : I18N[currentLocale].player_placeholder;
  }
  
  if (playerNameInput) playerNameInput.value = playerName;
  if (nicknameInput) nicknameInput.value = playerName;
  
  // Сохраняем никнейм для кошелька или глобально
  if (walletAddress) {
    localStorage.setItem("walletNickname_" + walletAddress, playerName);
  } else {
    localStorage.setItem("playerName", playerName);
  }

  // Load locale/theme
  const savedLocale = localStorage.getItem("locale");
  if (savedLocale) {
    currentLocale = savedLocale === "ru" ? "ru" : "en";
  } else {
    currentLocale = navigator.language.startsWith("ru") ? "ru" : "en";
  }
  const savedTheme = localStorage.getItem("theme");
  currentTheme = savedTheme === "light" ? "light" : "dark";
  networkMode = "testnet";
  localStorage.setItem("networkMode", networkMode);
  applyTheme();
  applyI18n();
  applyNetworkMode();
  // Sound sliders removed; toggle only.

  const params = new URLSearchParams(window.location.search);
  const inviteFrom = params.get("invite");
  const inviteMode = (params.get("mode") || "").toLowerCase();
  const inviteBet = parseFloat(params.get("bet") || "0");
  const inviteRoom = params.get("room");
  const inviteHost = params.get("host_id");
  const inviteWalletAddr = params.get("wallet_addr");
  const inviteRoomId = params.get("room_id");
  if (inviteFrom) {
    invitedByLink = true;
    const mode: "demo" | "testnet" | "mainnet" =
      inviteMode === "mainnet" ? "mainnet" : inviteMode === "testnet" ? "testnet" : "demo";
    if (inviteWalletAddr && inviteHost) {
      mpWalletAddresses[inviteHost] = inviteWalletAddr;
    }
    // On-chain room ID from URL
    let room_id_to_use: number | null = null;
    if (inviteRoomId) {
      // Проверяем, подключен ли кошелек — если нет, игнорируем room_id
      if (!walletAddress) {
        console.warn("room_id in URL but wallet not connected, ignoring");
      } else {
        room_id_to_use = parseInt(inviteRoomId, 10);
        amIHost = false;
      }
    }
    const inviteKey = `invite_seen_${room_id_to_use || inviteRoom || "no-room"}_${inviteFrom}`;
    const inviteUniqueKey = `${room_id_to_use || inviteRoom || "no-room"}_${inviteFrom}`;
    inviteLinkKey = inviteUniqueKey;
    const inviteUsedKey = getInviteUsedStorageKey(inviteUniqueKey);
    const inviteUsed = Boolean(localStorage.getItem(inviteUsedKey));
    if (inviteUsed) {
      inviteAlreadyUsed = true;
      showMessage(
        I18N[currentLocale].msg_invite_used,
        "info"
      );
    } else {
      pendingInvite = {
        name: inviteFrom || I18N[currentLocale].player_placeholder,
        mode,
        bet: inviteBet > 0 ? inviteBet : 1,
      };
      if (inviteRoom) multiplayerRoom = inviteRoom;
      if (inviteHost) multiplayerHost = inviteHost;
      // Не показываем gameArea сразу — только после начала сессии
      showInviteBanner();
    }
    if (!sessionStorage.getItem(inviteKey)) {
      sessionStorage.setItem(inviteKey, "1");
    }
    // очистить параметры приглашения из URL
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("invite");
    cleanUrl.searchParams.delete("mode");
    cleanUrl.searchParams.delete("bet");
    cleanUrl.searchParams.delete("room");
    cleanUrl.searchParams.delete("room_id");
    cleanUrl.searchParams.delete("host_id");
    cleanUrl.searchParams.delete("wallet_addr");
    // wallet=luffa оставляем — нужен для автоконнекта
    history.replaceState({}, "", cleanUrl.toString());
  }
  
  // Всегда восстанавливаем UI состояние (даже при инвайте)
  restoreUiStateFromStorage();
  restoreDemoGameIfNeeded();

  if (!inviteFrom) {
    const mode = restoredUiState?.scrollMode || "bet";
    window.setTimeout(() => {
      if (mode === "top") {
        forceScrollToAbsoluteTop();
      } else if (mode === "table") {
        focusGameplayArea();
      } else if (isSessionStarted) {
        focusBetArea();
      }
    }, 160);
  }

  updateSoundIcon();
  // allow network toggle even in demo for visibility
  if (RELEASE_MODE) {
    nameSection.style.display = "none";
    walletSection.style.display = "none";
    gameArea.style.display = "none";
    showMessage(I18N[currentLocale].msg_release_lock, "info");
  }

  renderLeaderboard();
  if (DEMO_MODE) {
    initFeed();
  }
  renderActivePlayers();
  startMascotAnimations();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveUiState();
      soundManager.stopMusic();
    } else if (!soundManager.getMuted()) {
      if (gameMusicActive) {
        soundManager.startGameMusic();
      } else {
        soundManager.startIdleMusic();
      }
    }
  });
  window.addEventListener("beforeunload", () => saveUiState());
  window.addEventListener("pagehide", () => saveUiState());

  // Initial UI update to show/hide buttons correctly
  updateUI();

  // Console branding
  console.log(`
╔═══════════════════════════════════════╗
║   ENDLESS PIXEL BLACKJACK v2.0        ║
║   Multiplayer Edition                 ║
║   By Huckof1                          ║
║   github.com/huckof1                  ║
╚═══════════════════════════════════════╝
  `);
}

function initAudio() {
  if (firstInteraction) return;
  firstInteraction = true;
  void soundManager.init().then(() => {
    if (gameMusicActive) {
      soundManager.startGameMusic();
    } else {
      startIdleMusic();
    }
  });
}

// ==================== WALLET EVENTS ====================
setWalletCallbacks({
  onConnect: (address) => {
    walletAddress = address;
    setWalletStatus(true);
    const displayAddr = address.length > 12 ? address.slice(0, 6) + "..." + address.slice(-4) : address;
    if (walletAddressEl) walletAddressEl.textContent = displayAddr;
    void updateBalance();
    updateUI();
  },
  onDisconnect: () => {
    walletAddress = "";
    setWalletStatus(false);
    if (walletAddressEl) walletAddressEl.textContent = "—";
    updateUI();
  },
  onAccountChange: (address) => {
    walletAddress = address;
    const displayAddr = address.length > 12 ? address.slice(0, 6) + "..." + address.slice(-4) : address;
    if (walletAddressEl) walletAddressEl.textContent = displayAddr;
    void updateBalance();
    updateUI();
  },
});

// ==================== SESSION ====================
async function startSession() {
  if (RELEASE_MODE) {
    showMessage(I18N[currentLocale].msg_release_lock, "info");
    return;
  }
  const name = playerNameInput.value.trim() || I18N[currentLocale].player_placeholder;
  playerName = name.slice(0, 12);
  localStorage.setItem("playerName", playerName);

  isSessionStarted = true;
  applySessionLayout();

  playerDisplayName.textContent = playerName;
  if (playerHandNameEl) {
    playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
  }

  setMascotState("happy", "👍", `${currentLocale === "ru" ? "Привет" : "Welcome"}, ${playerName}!`);
  scrollToGameArea(window.innerWidth <= 520 ? 150 : 110);
  pulseBetDisplay();

  // Восстановление текущей игры (если была)
  if (isDemoActive()) {
    const existingGame = game.getCurrentGame();
    if (existingGame && !existingGame.isFinished) {
      pendingResume = { mode: "demo", game: existingGame };
      isPlaying = false;
      updateUI();
      setTurn("you");
      showMessage(I18N[currentLocale].msg_resume_ready, "info");
    }
  } else if (walletAddress) {
    const latestId = await getLatestGameId(walletAddress, networkMode);
    if (latestId > 0) {
      chainGameId = latestId;
      chainGame = await getGame(latestId, networkMode);
      if (chainGame && !chainGame.isFinished) {
        pendingResume = { mode: "chain", game: chainGame, gameId: latestId };
        isPlaying = false;
        updateUI();
        setTurn("you");
        showMessage(I18N[currentLocale].msg_resume_ready, "info");
      }
    }
  }

  // Update active players
  renderActivePlayers();
  renderLeaderboard();
  if (multiplayerRoom && LS_PUBLIC_KEY && !mpOnChainMode) {
    const host = multiplayerHost || getMpName();
    if (!mpNameFrozen) mpNameFrozen = getMpName();
    multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), host || "");
  }
  saveUiState();
}

// ==================== MASCOT ====================
function setMascotState(state: string, mouth: string, message: string) {
  const base = mascot.dataset.mascotBase || "mascot";
  mascot.className = `${base} ${state}`.trim();
  mascotMouth.textContent = mouth;
  mascotMessage.textContent = message;
  document.querySelectorAll<HTMLElement>("[data-mascot-dup]").forEach(dup => {
    const dupBase = dup.dataset.mascotBase || "mascot mascot-deal";
    dup.className = `${dupBase} ${state}`.trim();
    const mouthEl = dup.querySelector(".mascot-mouth") as HTMLDivElement | null;
    if (mouthEl) mouthEl.textContent = mouth;
  });
}

function startMascotAnimations() {
  // Random winks
  window.setInterval(() => {
    if (Math.random() > 0.7) {
      mascot.classList.add("wink");
      const dups = Array.from(document.querySelectorAll<HTMLElement>("[data-mascot-dup]"));
      dups.forEach(dup => dup.classList.add("wink"));
      setTimeout(() => {
        mascot.classList.remove("wink");
        dups.forEach(dup => dup.classList.remove("wink"));
      }, 500);
    }
  }, 3000);
}

// ==================== SOUND ====================

function updateSoundIcon() {
  const muted = soundManager.getMuted();
  soundIcon.textContent = muted ? "🔇" : "🔊";
  soundToggle.classList.toggle("muted", muted);
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme();
}

function applyTheme() {
  document.body.setAttribute("data-theme", currentTheme);
  themeIcon.textContent = currentTheme === "dark" ? "☀" : "🌙";
}

function toggleLanguage() {
  currentLocale = currentLocale === "en" ? "ru" : "en";
  localStorage.setItem("locale", currentLocale);
  applyI18n();
}

function applyI18n() {
  const dict = I18N[currentLocale];
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n as keyof typeof dict;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder as keyof typeof dict;
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach(el => {
    const key = el.dataset.i18nTitle as keyof typeof dict;
    if (dict[key]) {
      el.title = dict[key] as string;
    }
  });
  updateBetLimitsUI();
  langIcon.textContent = currentLocale.toUpperCase();
  setWalletStatus(Boolean(walletAddress));
  showInviteBanner();
  refreshHintsLocale();
  // Обновить тексты секции invite-share (хост)
  const isBtn = document.getElementById("invite-share-copy");
  if (isBtn && isBtn.style.display !== "none") {
    isBtn.textContent = currentLocale === "ru" ? "ОТПРАВИТЬ QR" : "SHARE QR";
  }
  const isHint = document.getElementById("invite-share-hint");
  if (isHint && isHint.textContent) {
    isHint.textContent = currentLocale === "ru"
      ? "Отправьте QR или покажите для сканирования в Luffa"
      : "Share QR or show to scan in Luffa";
  }
  // Обновить кнопку LEAVE GAME
  const lgBtn = document.getElementById("leave-game-btn");
  if (lgBtn && lgBtn.style.display !== "none") {
    lgBtn.textContent = currentLocale === "ru" ? "ПОКИНУТЬ ИГРУ" : "LEAVE GAME";
  }
  updateUI();
}

function setTurn(turn: "you" | "dealer" | null) {
  if (!turnIndicator) return;
  if (!turn) {
    turnIndicator.style.display = "none";
    turnIndicator.textContent = "";
    return;
  }
  turnIndicator.style.display = "block";
  turnIndicator.textContent = turn === "you"
    ? I18N[currentLocale].turn_you
    : I18N[currentLocale].turn_dealer;
}

function setTurnText(text: string) {
  if (!turnIndicator) return;
  turnIndicator.style.display = "block";
  turnIndicator.textContent = text;
}

function mpCreateDeck(): { suit: number; rank: number }[] {
  const deck: { suit: number; rank: number }[] = [];
  for (let suit = 0; suit < 4; suit++) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function mpScore(cards: { suit: number; rank: number }[]): number {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 1) {
      aces++;
      score += 11;
    } else if (card.rank >= 10) {
      score += 10;
    } else {
      score += card.rank;
    }
  }
  while (aces > 0 && score > 21) {
    score -= 10;
    aces--;
  }
  return score;
}

// Анализ руки: soft/hard, подсказки
interface HandInfo {
  score: number;
  isSoft: boolean;       // есть туз, считающийся как 11
  aceCount: number;      // кол-во тузов
  acesReduced: number;   // тузов, ставших 1
}

function analyzeHand(cards: { suit: number; rank: number }[]): HandInfo {
  let score = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 1) { aces++; score += 11; }
    else if (card.rank >= 10) { score += 10; }
    else { score += card.rank; }
  }
  let reduced = 0;
  while (reduced < aces && score > 21) {
    score -= 10;
    reduced++;
  }
  return { score, isSoft: aces > reduced && score <= 21, aceCount: aces, acesReduced: reduced };
}

let prevHandInfo: HandInfo | null = null;
let currentPlayerCards: { suit: number; rank: number }[] = [];

function updatePlayerHints(cards: { suit: number; rank: number }[]) {
  currentPlayerCards = cards;
  const info = analyzeHand(cards);
  const prev = prevHandInfo;
  prevHandInfo = info;

  // SOFT badge
  if (softBadge) {
    softBadge.style.display = info.isSoft ? "inline-block" : "none";
    softBadge.textContent = info.isSoft ? "SOFT" : "";
  }

  if (!scoreHint) return;

  // Туз только что сменил значение (был soft, стал hard)
  if (prev && prev.isSoft && !info.isSoft && info.acesReduced > prev.acesReduced) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-ace";
    scoreHint.textContent = currentLocale === "ru"
      ? `A: 11→1 (иначе перебор)`
      : `Ace: 11→1 (would bust)`;
    return;
  }

  // Подсказки по счёту
  if (info.score > 21) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-danger";
    scoreHint.textContent = currentLocale === "ru" ? "ПЕРЕБОР! Более 21" : "BUST! Over 21";
  } else if (info.score === 21) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-safe";
    scoreHint.textContent = currentLocale === "ru" ? "21! Идеально!" : "21! Perfect!";
  } else if (info.score >= 17) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-warning";
    scoreHint.textContent = currentLocale === "ru"
      ? "Рискованно брать ещё"
      : "Risky to hit";
  } else if (info.score >= 13 && info.score <= 16) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-warning";
    scoreHint.textContent = currentLocale === "ru"
      ? "Опасная зона — подумай"
      : "Danger zone — think";
  } else if (info.isSoft) {
    scoreHint.style.display = "block";
    scoreHint.className = "score-hint hint-ace";
    scoreHint.textContent = currentLocale === "ru"
      ? `Мягкая рука: туз = 11 (безопасно брать)`
      : `Soft hand: ace = 11 (safe to hit)`;
  } else {
    scoreHint.style.display = "none";
  }
}

function showDealerHint(show: boolean) {
  if (!dealerHint) return;
  if (show) {
    dealerHint.style.display = "inline-block";
    dealerHint.textContent = currentLocale === "ru" ? "берёт до 17" : "stands on 17";
  } else {
    dealerHint.style.display = "none";
  }
}

function hidePlayerHints() {
  prevHandInfo = null;
  currentPlayerCards = [];
  if (softBadge) softBadge.style.display = "none";
  if (scoreHint) scoreHint.style.display = "none";
  if (dealerHint) dealerHint.style.display = "none";
}

function refreshHintsLocale() {
  // Обновить подсказки при смене языка
  if (currentPlayerCards.length > 0 && scoreHint && scoreHint.style.display !== "none") {
    const info = analyzeHand(currentPlayerCards);
    if (info.score > 21) {
      scoreHint.textContent = currentLocale === "ru" ? "ПЕРЕБОР! Более 21" : "BUST! Over 21";
    } else if (info.score === 21) {
      scoreHint.textContent = currentLocale === "ru" ? "21! Идеально!" : "21! Perfect!";
    } else if (info.score >= 17) {
      scoreHint.textContent = currentLocale === "ru" ? "Рискованно брать ещё" : "Risky to hit";
    } else if (info.score >= 13 && info.score <= 16) {
      scoreHint.textContent = currentLocale === "ru" ? "Опасная зона — подумай" : "Danger zone — think";
    } else if (info.isSoft) {
      scoreHint.textContent = currentLocale === "ru"
        ? "Мягкая рука: туз = 11 (безопасно брать)"
        : "Soft hand: ace = 11 (safe to hit)";
    } else if (prevHandInfo && !info.isSoft && info.acesReduced > 0) {
      scoreHint.textContent = currentLocale === "ru"
        ? "A: 11→1 (иначе перебор)"
        : "Ace: 11→1 (would bust)";
    }
  }
  if (dealerHint && dealerHint.style.display !== "none") {
    dealerHint.textContent = currentLocale === "ru" ? "берёт до 17" : "stands on 17";
  }
}

function resetMultiplayerGameUI() {
  hasGameResult = false;
  hideGameResult();
  if (playerCardsEl) playerCardsEl.innerHTML = "";
  if (opponentCardsEl) opponentCardsEl.innerHTML = "";
  if (dealerCardsEl) dealerCardsEl.innerHTML = "";
  if (playerScoreEl) playerScoreEl.textContent = "-";
  if (opponentScoreEl) opponentScoreEl.textContent = "-";
  if (dealerScoreEl) dealerScoreEl.textContent = "-";
  if (winnerBannerEl) winnerBannerEl.style.display = "none";
  if (betOffer) betOffer.style.display = "none";
  if (scoreHint) scoreHint.style.display = "none";
  if (softBadge) softBadge.style.display = "none";
  currentPlayerCards = [];
  prevHandInfo = null;
  isPlaying = false;
  setTurn(null);
  if (turnIndicator) {
    turnIndicator.style.display = "none";
    turnIndicator.textContent = "";
  }
}

function announceFreshMultiplayerGame(message?: string) {
  resetMultiplayerGameUI();
  setMascotState("idle", "👍", I18N[currentLocale].mascot_idle);
  const text = message
    ?? (currentLocale === "ru" ? "ЖДЁМ ОППОНЕНТА..." : "WAITING FOR OPPONENT...");
  showMessage(text, "info");
}

function mpDraw(deck: { suit: number; rank: number }[]) {
  if (deck.length === 0) {
    deck.push(...mpCreateDeck());
  }
  return deck.pop()!;
}

function mpNextTurn(snapshot: MultiplayerSnapshot, start: number): number | null {
  const total = snapshot.hands.length;
  for (let i = 1; i <= total; i++) {
    const idx = (start + i) % total;
    if (!snapshot.hands[idx].done) return idx;
  }
  return null;
}

function mpFinalizeResults(snapshot: MultiplayerSnapshot) {
  const computed = mpComputeResults(snapshot);
  snapshot.results = computed.results;
  snapshot.payouts = computed.payouts;
  snapshot.claimed = computed.claimed;
  const isDraw = computed.results.every(r => r === 0);
  if (isDraw) {
    scheduleDrawContinuation(snapshot);
    return;
  }
  // Trigger on-chain payouts (fire-and-forget)
  if (mpOnChainMode && mpBetsDeducted && isRoomHost) {
    mpCreditOnChainPayouts(snapshot).catch(err => {
      debugLogLine(`mpCreditOnChainPayouts error: ${err}`);
    });
  }
}

function mpComputeResults(snapshot: MultiplayerSnapshot) {
  const results: number[] = [];
  const payouts: number[] = [];
  const claimed: boolean[] = [];
  const feeBps = game.getFeeBps();
  const applyFee = (amount: number) => {
    const fee = amount * feeBps / 10000;
    return Math.max(0, Math.round((amount - fee) * 100) / 100);
  };
  if (snapshot.hands.length < 2) {
    snapshot.hands.forEach(() => {
      results.push(0);
      payouts.push(applyFee(snapshot.bet));
      claimed.push(false);
    });
    return { results, payouts, claimed };
  }
  const scores = snapshot.hands.map(h => mpScore(h.cards));
  const busts = scores.map(s => s > 21);
  if (busts[0] && busts[1]) {
    results.push(0, 0);
    payouts.push(applyFee(snapshot.bet), applyFee(snapshot.bet));
  } else if (busts[0] && !busts[1]) {
    results.push(-1, 1);
    payouts.push(0, applyFee(snapshot.bet * 2));
  } else if (!busts[0] && busts[1]) {
    results.push(1, -1);
    payouts.push(applyFee(snapshot.bet * 2), 0);
  } else if (scores[0] > scores[1]) {
    results.push(1, -1);
    payouts.push(applyFee(snapshot.bet * 2), 0);
  } else if (scores[1] > scores[0]) {
    results.push(-1, 1);
    payouts.push(0, applyFee(snapshot.bet * 2));
  } else {
    results.push(0, 0);
    payouts.push(applyFee(snapshot.bet), applyFee(snapshot.bet));
  }
  claimed.push(false, false);
  return { results, payouts, claimed };
}

async function mpCreditOnChainPayouts(snapshot: MultiplayerSnapshot) {
  if (!mpOnChainMode || !mpBetsDeducted || !isRoomHost) return;
  const players = snapshot.players || [];
  if (players.length < 2) return;
  const computed = snapshot.results && snapshot.payouts
    ? { results: snapshot.results, payouts: snapshot.payouts }
    : mpComputeResults(snapshot);

  const playerAddresses = players.map(p => {
    if (p === getMpName()) return walletAddress;
    return mpWalletAddresses[p] || "";
  });

  try {
    for (let i = 0; i < players.length; i++) {
      const addr = playerAddresses[i];
      if (!addr) continue;
      const payoutEDS = computed.payouts[i];
      if (payoutEDS > 0) {
        const payoutOctas = parseEDS(payoutEDS.toString());
        debugLogLine(`MP payout: ${payoutOctas} octas to ${addr}`);
        await creditPayout(addr, payoutOctas, networkMode);
      }
    }
    mpBetsDeducted = false;
    debugLogLine("MP on-chain payouts completed");
    // Refresh balances after a short delay
    setTimeout(() => {
      updateInGameBalance();
    }, 2000);
  } catch (err) {
    debugLogLine(`MP payout error: ${err}`);
    showMessage(
      currentLocale === "ru"
        ? "Ошибка при выплате. Попробуйте CLAIM."
        : "Payout error. Try CLAIM.",
      "error"
    );
  }
}

function applyMultiplayerHit() {
  if (!multiplayerSnapshot) return;
  if (multiplayerSnapshot.phase !== "player") return;
  const meIndex = multiplayerSnapshot.turnIndex ?? 0;
  const hand = multiplayerSnapshot.hands[meIndex];
  if (!hand || hand.done) return;
  hand.cards.push(mpDraw(multiplayerSnapshot.deck));
  const score = mpScore(hand.cards);
  if (score >= 21) {
    hand.done = true;
    const nextIndex = mpNextTurn(multiplayerSnapshot, meIndex);
    if (nextIndex !== null) {
      const delayMs = 600 + Math.floor(Math.random() * 700);
      multiplayerSnapshot.turnIndex = null;
      multiplayerSnapshot.pendingTurn = { nextIndex, until: Date.now() + delayMs };
    } else {
      multiplayerSnapshot.turnIndex = null;
      multiplayerSnapshot.pendingTurn = null;
    }
  }
  if (multiplayerSnapshot.hands.every(h => h.done)) {
    multiplayerSnapshot.phase = "done";
    multiplayerSnapshot.turnIndex = null;
    multiplayerSnapshot.pendingTurn = null;
    mpFinalizeResults(multiplayerSnapshot);
  }
  multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
  renderMultiplayerSnapshot(multiplayerSnapshot);
  if (multiplayerSnapshot.pendingTurn && isRoomHost) {
    const nextIndex = multiplayerSnapshot.pendingTurn.nextIndex;
    const delay = Math.max(0, multiplayerSnapshot.pendingTurn.until - Date.now());
    setTimeout(() => {
      if (!multiplayerSnapshot || !multiplayerSnapshot.pendingTurn) return;
      if (multiplayerSnapshot.pendingTurn.nextIndex !== nextIndex) return;
      multiplayerSnapshot.turnIndex = nextIndex;
      multiplayerSnapshot.pendingTurn = null;
      multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
      renderMultiplayerSnapshot(multiplayerSnapshot);
    }, delay);
  }
}

function applyMultiplayerStand() {
  if (!multiplayerSnapshot) return;
  if (multiplayerSnapshot.phase !== "player") return;
  const meIndex = multiplayerSnapshot.turnIndex ?? 0;
  if (!multiplayerSnapshot.hands[meIndex] || multiplayerSnapshot.hands[meIndex].done) return;
  multiplayerSnapshot.hands[meIndex].done = true;
  const nextIndex = mpNextTurn(multiplayerSnapshot, meIndex);
  if (nextIndex !== null) {
    const delayMs = 600 + Math.floor(Math.random() * 700);
    multiplayerSnapshot.turnIndex = null;
    multiplayerSnapshot.pendingTurn = { nextIndex, until: Date.now() + delayMs };
  } else {
    multiplayerSnapshot.turnIndex = null;
    multiplayerSnapshot.pendingTurn = null;
  }
  if (multiplayerSnapshot.hands.every(h => h.done)) {
    multiplayerSnapshot.phase = "done";
    multiplayerSnapshot.turnIndex = null;
    multiplayerSnapshot.pendingTurn = null;
    mpFinalizeResults(multiplayerSnapshot);
  }
  multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
  renderMultiplayerSnapshot(multiplayerSnapshot);
  if (multiplayerSnapshot.pendingTurn && isRoomHost) {
    const nextIndex = multiplayerSnapshot.pendingTurn.nextIndex;
    const delay = Math.max(0, multiplayerSnapshot.pendingTurn.until - Date.now());
    setTimeout(() => {
      if (!multiplayerSnapshot || !multiplayerSnapshot.pendingTurn) return;
      if (multiplayerSnapshot.pendingTurn.nextIndex !== nextIndex) return;
      multiplayerSnapshot.turnIndex = nextIndex;
      multiplayerSnapshot.pendingTurn = null;
      multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
      renderMultiplayerSnapshot(multiplayerSnapshot);
    }, delay);
  }
}

function renderMultiplayerSnapshot(snapshot: MultiplayerSnapshot) {
  if (!opponentHandEl || !opponentCardsEl || !opponentScoreEl || !opponentNameEl) return;
  if (dealerHandEl) {
    dealerHandEl.style.display = multiplayerRoom ? "none" : "flex";
  }

  const players = snapshot.players || [];
  multiplayerState = { players, turnIndex: snapshot.turnIndex };
  const prevPhase = lastRenderedMpPhase;
  lastRenderedMpPhase = snapshot.phase;
  // Не меняем turnIndex на клиенте — только хост задаёт ход
  if (players.length < 2) {
    opponentHandEl.style.display = "none";
    if (betOffer) betOffer.style.display = "none";
    if (winnerBannerEl) winnerBannerEl.style.display = "none";
    return;
  }
  opponentHandEl.style.display = "flex";
  if (winnerBannerEl && snapshot.phase !== "done") {
    winnerBannerEl.style.display = "none";
  }

  if (
    snapshot.agreed &&
    snapshot.phase === "lobby" &&
    isRoomHost &&
    snapshot.players.length >= 2 &&
    !snapshot.pendingBet
  ) {
    showDebugState("auto_start_render");
    handleStartGame();
  }
  if (snapshot.phase === "player" && !gameMusicActive) {
    startGameMusic();
  }
  if (snapshot.phase === "player" && prevPhase !== "player") {
    focusGameplayArea();
  }

  const meIndex = players.findIndex(p => p === getMpName());
  if (snapshot.phase === "player") {
    if (winnerBannerEl) winnerBannerEl.style.display = "none";
    const isMyTurn =
      snapshot.turnIndex === meIndex &&
      !snapshot.pendingTurn &&
      !snapshot.hands?.[meIndex]?.done;
    if (snapshot.pendingTurn && Date.now() < snapshot.pendingTurn.until) {
      showMessage(I18N[currentLocale].msg_turn_wait, "info");
    } else if (!isMyTurn) {
      showMessage(I18N[currentLocale].msg_turn_wait, "info");
    } else {
      showMessage(I18N[currentLocale].msg_your_turn, "info");
    }
  }
  if (!snapshot.hands || snapshot.hands.length < 2) {
    if (betOffer && betOfferText) {
      if (snapshot.pendingBet && snapshot.pendingBy && snapshot.pendingBy !== getMpName()) {
        betOffer.style.display = "block";
        betOfferText.textContent =
          currentLocale === "ru"
            ? `${displayName(snapshot.pendingBy)} предложил ставку ${snapshot.pendingBet} EDS`
            : `${displayName(snapshot.pendingBy)} offered bet ${snapshot.pendingBet} EDS`;
        betInput.value = snapshot.pendingBet.toString();
      } else {
        betOffer.style.display = "none";
      }
    }
    if (snapshot.pendingBet && snapshot.pendingBy) {
      const betText = Number(snapshot.pendingBet).toFixed(2);
      if (snapshot.pendingBy === getMpName()) {
        const waitingText = currentLocale === "ru"
          ? "Ждём подтверждения соперника..."
          : "Waiting for opponent to accept the bet...";
        showMessage(waitingText, "info");
      } else {
        const offerText = currentLocale === "ru"
          ? `${displayName(snapshot.pendingBy)} предложил ставку ${betText} EDS`
          : `${displayName(snapshot.pendingBy)} offered bet ${betText} EDS`;
        showMessage(offerText, "info");
      }
      setTurn(null);
    }
    return;
  }
  const oppIndex = meIndex === 0 ? 1 : 0;
  opponentNameEl.textContent = displayNameSmart(players[oppIndex] || "OPPONENT", players);

  dealerCardsEl.innerHTML = "";
  playerCardsEl.innerHTML = "";
  opponentCardsEl.innerHTML = "";

  if (!multiplayerRoom) {
    snapshot.dealerCards.forEach(card => dealerCardsEl.appendChild(renderCard(card)));
  }
  const myHand = snapshot.hands[meIndex] || { cards: [] };
  const oppHand = snapshot.hands[oppIndex] || { cards: [] };
  myHand.cards.forEach(card => playerCardsEl.appendChild(renderCard(card)));
  if (multiplayerRoom && snapshot.phase === "player") {
    for (let i = 0; i < oppHand.cards.length; i++) {
      opponentCardsEl.appendChild(renderCardBack());
    }
  } else {
    oppHand.cards.forEach(card => opponentCardsEl.appendChild(renderCard(card)));
  }

  dealerScoreEl.textContent = multiplayerRoom
    ? "-"
    : snapshot.phase === "player"
      ? "?"
      : mpScore(snapshot.dealerCards).toString();
  playerScoreEl.textContent = mpScore(myHand.cards).toString();
  opponentScoreEl.textContent =
    multiplayerRoom && snapshot.phase === "player"
      ? oppHand.cards.length.toString()
      : mpScore(oppHand.cards).toString();

  if (snapshot.bet && betInput) {
    betInput.value = snapshot.bet.toString();
  }
  if (betOffer && betOfferText) {
    if (snapshot.pendingBet && snapshot.pendingBy && snapshot.pendingBy !== getMpName()) {
      betOffer.style.display = "block";
      betOfferText.textContent =
        currentLocale === "ru"
          ? `${displayName(snapshot.pendingBy)} предложил ставку ${snapshot.pendingBet} EDS`
          : `${displayName(snapshot.pendingBy)} offered bet ${snapshot.pendingBet} EDS`;
      betInput.value = snapshot.pendingBet.toString();
    } else {
      betOffer.style.display = "none";
    }
  }

  isPlaying = snapshot.phase !== "done" && snapshot.phase !== "lobby";
  showDebugState("snapshot");
  if (snapshot.phase === "done") {
    const meIndex = players.findIndex(p => p === getMpName());
    const computed =
      snapshot.results && snapshot.payouts
        ? { results: snapshot.results, payouts: snapshot.payouts, claimed: snapshot.claimed || [] }
        : mpComputeResults(snapshot);
    const result = computed.results[meIndex];
    const payout = computed.payouts[meIndex];
    if (result === 1) {
      showMessage(I18N[currentLocale].msg_win, "success");
      playSound("win");
      createConfetti();
      setMascotState("excited", "🤩", I18N[currentLocale].msg_win);
      if (winnerBannerEl) {
        winnerBannerEl.style.display = "block";
        winnerBannerEl.textContent = currentLocale === "ru" ? "ПОБЕДИТЕЛЬ" : "WINNER";
      }
      mpPayoutBucket = Math.round((mpPayoutBucket + payout) * 100) / 100;
      localStorage.setItem("mpPayoutBucket", mpPayoutBucket.toString());
      if (multiplayerRoom) {
        mpPayoutRoom = multiplayerRoom;
        localStorage.setItem("mpPayoutRoom", mpPayoutRoom);
      }
      if (mpOnChainMode && walletAddress) {
        // On-chain mode: payouts handled by host via mpCreditOnChainPayouts
        // Just refresh balance after delay
        const winKey = `${multiplayerRoom || "_"}:${snapshot.results?.join(",") || ""}:${snapshot.phase}:${snapshot.bet}`;
        if (winKey !== mpLastWinKey) {
          mpLastWinKey = winKey;
          localStorage.setItem("mpLastWinKey", winKey);
          mpPayoutBucket = 0;
          localStorage.setItem("mpPayoutBucket", "0");
          setTimeout(() => {
            updateInGameBalance();
          }, 3000);
        }
      } else if (isDemoActive() && payout > 0) {
        const winKey = `${multiplayerRoom || "_"}:${snapshot.results?.join(",") || ""}:${snapshot.payouts?.join(",") || ""}:${snapshot.phase}:${snapshot.bet}:${snapshot.players.join(",")}`;
        if (winKey !== mpLastWinKey) {
          mpLastWinKey = winKey;
          localStorage.setItem("mpLastWinKey", winKey);
          game.addBalanceEDS(payout);
          updateBalance().catch(() => {
            /* ignore */
          });
          mpPayoutBucket = 0;
          localStorage.setItem("mpPayoutBucket", "0");
        }
      }
      finishActiveRoom();
    } else if (result === 0) {
      showMessage(I18N[currentLocale].msg_draw, "info");
      setMascotState("thinking", "🤷", I18N[currentLocale].msg_draw);
      if (winnerBannerEl) winnerBannerEl.style.display = "none";
    } else {
      showMessage(I18N[currentLocale].msg_lose, "error");
      setMascotState("sad", "😞", I18N[currentLocale].msg_lose);
      if (winnerBannerEl) winnerBannerEl.style.display = "none";
      finishActiveRoom();
    }
    const winners = computed.results
      .map((r, i) => (r === 1 ? players[i] : null))
      .filter(Boolean) as string[];
    if (winners.length >= 1) {
      const names = winners.map(n => displayNameSmart(n, players)).join(", ");
      const winnerText = I18N[currentLocale].msg_winner.replace("{name}", names);
      showMessage(winnerText, "info");
    }
    if (result !== 1 && winnerBannerEl) {
      winnerBannerEl.style.display = "none";
    }
    if (claimBtn && payoutDueEl) {
      if (mpPayoutBucket > 0) {
        claimBtn.style.display = "block";
        claimBtn.disabled = false;
        payoutDueEl.style.display = "block";
        payoutDueEl.textContent = `${I18N[currentLocale].payout_due} ${formatMpEds(mpPayoutBucket)}`;
      } else {
        claimBtn.style.display = "none";
        claimBtn.disabled = true;
        payoutDueEl.style.display = "none";
      }
    }
  }
  if (snapshot.pendingTurn && Date.now() < snapshot.pendingTurn.until) {
    setTurnText(I18N[currentLocale].msg_turn_wait);
  } else if (snapshot.turnIndex === null) {
    setTurn(null);
  } else if (snapshot.turnIndex === meIndex) {
    setTurn("you");
  } else {
    const name = snapshot.players[snapshot.turnIndex] || "OPPONENT";
    setTurnText(`${I18N[currentLocale].turn_of} ${displayName(name)}`);
  }
  updateUI();
}

function saveNickname() {
  const name = nicknameInput.value.trim() || I18N[currentLocale].player_placeholder;
  playerName = name.slice(0, 12);
  
  // Сохраняем никнейм для кошелька или глобально
  if (walletAddress) {
    localStorage.setItem("walletNickname_" + walletAddress, playerName);
  } else {
    localStorage.setItem("playerName", playerName);
  }
  
  playerNameInput.value = playerName;
  if (playerHandNameEl) {
    playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
  }
  if (!multiplayerRoom) {
    mpNameCached = "";
  }
  if (nicknameModal) nicknameModal.style.display = "none";
  if (pendingInviteAutoAccept && pendingInvite) {
    pendingInviteAutoAccept = false;
    handleInviteAccept();
  }
}

function setNetwork(mode: "testnet" | "mainnet") {
  const prevMode = networkMode;
  networkMode = mode;
  localStorage.setItem("networkMode", networkMode);
  if (prevMode !== mode) {
    pendingResume = null;
    if (!walletAddress) {
      setWalletStatus(false);
      if (walletAddressEl) walletAddressEl.textContent = "—";
    }
    isPlaying = false;
    chainGameId = 0;
    chainGame = null;
    dealerCardsEl.innerHTML = "";
    playerCardsEl.innerHTML = "";
    dealerScoreEl.textContent = "-";
    playerScoreEl.textContent = "-";
  }
  applyNetworkMode();
  updateBank();
  updateBalance();
  updateStats();
  updateUI();
  if (isDemoActive()) {
    showMessage(I18N[currentLocale].msg_place_bet, "info");
    initFeed();
    renderLeaderboard();
    renderActivePlayers();
  }
}

function applyNetworkMode() {
  const networkLabel = "TESTNET";
  if (walletNetworkEl) {
    walletNetworkEl.textContent = networkLabel;
  }
  if (walletNetworkPill) {
    walletNetworkPill.textContent = networkLabel;
  }
  if (networkTestnetBtn) networkTestnetBtn.classList.toggle("active", networkMode === "testnet");
  if (networkMainnetBtn) networkMainnetBtn.classList.toggle("active", networkMode === "mainnet");
}

function updateFeeFromBet() {
  if (!feeEl) return;
  const betValue = parseFloat(betInput.value);
  if (isNaN(betValue) || betValue <= 0) {
    if (betFeeEl) betFeeEl.textContent = "0.00 EDS";
    return;
  }
  const betOctas = Math.floor(betValue * 100000000);
  const feeOctas = Math.floor((betOctas * currentFeeBps) / 10000);
  if (betFeeEl) betFeeEl.textContent = formatEDS(feeOctas);
}

function getBetLimits(): { minOctas: number; maxOctas: number } {
  const playerFunds = isDemoActive()
    ? currentPlayerBalanceOctas
    : (walletAddress ? inGameBalance : 0);

  if (currentBankrollOctas <= 0) {
    return { minOctas: 0, maxOctas: 0 };
  }
  const feeRate = currentFeeBps / 10000;
  const maxPayoutMultiplier = 2.5; // blackjack pays 2.5x
  const safetyMultiplier = 1.2; // 20% reserve buffer
  const lossMultiplier = (maxPayoutMultiplier - 1) + feeRate;
  const safeMax = lossMultiplier > 0
    ? Math.floor(currentBankrollOctas / (lossMultiplier * safetyMultiplier))
    : MAX_BET;
  let maxOctas = Math.max(0, Math.min(MAX_BET, safeMax));
  if (playerFunds > 0) {
    maxOctas = Math.min(maxOctas, playerFunds);
  }
  let minOctas = MIN_BET;
  if (maxOctas > 0 && maxOctas < MIN_BET) {
    minOctas = maxOctas;
  }
  return { minOctas, maxOctas };
}

function updateBetLimitsUI() {
  const { minOctas, maxOctas } = getBetLimits();
  if (betHintEl) {
    const minText = (minOctas / 100000000).toFixed(2);
    const maxText = (maxOctas / 100000000).toFixed(2);
    betHintEl.textContent = currentLocale === "ru"
      ? `МИН ${minText} EDS · МАКС ${maxText} EDS`
      : `MIN ${minText} EDS · MAX ${maxText} EDS`;
  }
  betInput.min = (minOctas / 100000000).toString();
  betInput.max = (maxOctas / 100000000).toString();
}

// ==================== BET ====================
function getBetStep(current: number): number {
  if (current >= 1000) return 500;
  if (current >= 100) return 50;
  if (current >= 10) return 5;
  if (current >= 1) return 1;
  return 0.1;
}

function adjustBet(direction: number) {
  playSound("click");
  const current = parseFloat(betInput.value) || 1;
  const step = getBetStep(current);
  const { minOctas, maxOctas } = getBetLimits();
  const minEds = minOctas / 100000000;
  const maxEds = maxOctas / 100000000;
  let newValue = Math.max(minEds, Math.min(maxEds, current + step * direction));
  newValue = Math.round(newValue * 10) / 10;
  betInput.value = newValue.toString();
  const phase = multiplayerSnapshot?.phase || "lobby";
  if (multiplayerRoom && (phase === "lobby" || phase === "done")) {
    multiplayer.proposeBet(newValue);
  }
  updateFeeFromBet();
}

function validateBet() {
  let raw = parseFloat(betInput.value);
  // Fallback: if input returns NaN, use last known good value
  if (isNaN(raw) || raw <= 0) {
    raw = parseFloat(betInput.dataset.lastValue || "1");
  }
  const { minOctas, maxOctas } = getBetLimits();
  const minEds = minOctas / 100000000;
  const maxEds = maxOctas / 100000000;
  let value = Math.max(minEds, Math.min(maxEds, raw));
  value = Math.round(value * 10) / 10;
  betInput.value = value.toString();
  betInput.dataset.lastValue = value.toString();
  const phase = multiplayerSnapshot?.phase || "lobby";
  if (multiplayerRoom && (phase === "lobby" || phase === "done")) {
    multiplayer.proposeBet(value);
  }
  updateFeeFromBet();
}

// ==================== GAME ====================
function scrollToGameArea(offset = 8) {
  if (!gameArea) return;
  // Keep BET/DEAL area visible (top of game block), not action buttons below table.
  const top = window.scrollY + gameArea.getBoundingClientRect().top - offset;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "smooth" });
}

function backToWalletStep() {
  document.body.classList.remove("game-active");
  scrollToGameArea(window.innerWidth <= 520 ? 150 : 110);
  pulseDepositButton();
  showMessage(
    currentLocale === "ru" ? "Вернулись к кошельку. Пополните баланс и начните раздачу." : "Back to wallet. Deposit and start dealing.",
    "info"
  );
}

async function handleStartGame() {
  scrollToGameArea(window.innerWidth <= 520 ? 150 : 110);
  pulseBetDisplay();
  document.body.classList.add("game-active");
  hasGameResult = false;
  hideGameResult();
  hidePlayerHints();
  initAudio();
  startGameMusic();
  if (!isSessionStarted) {
    if (!walletAddress && DEMO_MODE) {
      await startDemoSession();
    } else {
      await startSession();
    }
  }

  // On-chain room: game starts automatically when guest joins (no manual start needed)
  if (chainRoomId && mpOnChainMode) {
    // Room already created/joined, polling handles everything
    return;
  }

  if (multiplayerRoom && LS_PUBLIC_KEY && !isRoomHost) {
    showMessage(currentLocale === "ru" ? "Ждём хоста..." : "Waiting for host...", "info");
    return;
  }
  if (multiplayerRoom && LS_PUBLIC_KEY && isRoomHost) {
    const players = multiplayerState?.players || multiplayerSnapshot?.players || [getMpName()];
    if (players.length < 2) {
      showMessage(currentLocale === "ru" ? "Ждём второго игрока..." : "Waiting for second player...", "info");
      return;
    }
    const betValue = parseFloat(betInput.value) || 1;

    // On-chain: deduct bets from both players
    if (mpOnChainMode && walletAddress) {
      const betOctas = parseEDS(betValue.toString());
      const playerAddresses = players.map(p => {
        if (p === getMpName()) return walletAddress;
        return mpWalletAddresses[p] || "";
      });
      if (playerAddresses.some(a => !a)) {
        showMessage(
          currentLocale === "ru"
            ? "Не все игроки подключили кошельки."
            : "Not all players have connected wallets.",
          "error"
        );
        return;
      }
      try {
        showMessage(
          currentLocale === "ru"
            ? "Списание ставок..."
            : "Deducting bets...",
          "info"
        );
        // Deduct from first player
        await deductBet(playerAddresses[0], betOctas, networkMode);
        // Deduct from second player
        try {
          await deductBet(playerAddresses[1], betOctas, networkMode);
        } catch (err2) {
          // Second deduction failed — refund first player
          debugLogLine(`MP deductBet[1] failed, refunding player 0: ${err2}`);
          await creditPayout(playerAddresses[0], betOctas, networkMode);
          showMessage(
            currentLocale === "ru"
              ? "Не удалось списать ставку второго игрока. Ставки возвращены."
              : "Failed to deduct second player's bet. Bets refunded.",
            "error"
          );
          return;
        }
        mpBetsDeducted = true;
        debugLogLine(`MP bets deducted: ${betOctas} from each player`);
        await updateInGameBalance();
      } catch (err) {
        debugLogLine(`MP deductBet[0] failed: ${err}`);
        showMessage(
          currentLocale === "ru"
            ? "Не удалось списать ставку. Проверьте баланс."
            : "Failed to deduct bet. Check your balance.",
          "error"
        );
        return;
      }
    }

    const snapshot = createMultiplayerRoundSnapshot(players, betValue);
    multiplayerSnapshot = snapshot;
    if (snapshot.hands.every(h => h.done)) {
      snapshot.phase = "done";
      snapshot.turnIndex = null;
      mpFinalizeResults(snapshot);
    }
    multiplayer.sendSnapshot({ type: "game:snapshot", ...snapshot });
    renderMultiplayerSnapshot(snapshot);
    return;
  }
  if (pendingResume) {
    const resume = pendingResume;
    pendingResume = null;
    if (resume.mode === "demo") {
      isPlaying = true;
      await renderGame(resume.game);
      updateUI();
      showMessage(I18N[currentLocale].msg_resume, "info");
      return;
    }
    if (resume.mode === "chain") {
      chainGameId = resume.gameId || chainGameId;
      chainGame = resume.game;
      isPlaying = true;
      await renderGame(chainGame);
      updateUI();
      showMessage(I18N[currentLocale].msg_resume, "info");
      return;
    }
  }

  // Force re-read and validate the bet value
  validateBet();
  const betValue = betInput.value;
  const betAmount = parseEDS(betValue);
  const { minOctas, maxOctas } = getBetLimits();
  const topUpMsg = currentLocale === "ru" ? "ПОПОЛНИТЕ ИГРОВОЙ БАЛАНС." : "TOP UP IN-GAME BALANCE.";

  if (!isDemoActive() && walletAddress && (inGameBalance < MIN_BET || inGameBalance < minOctas)) {
    playSound("lose");
    showMessage(topUpMsg, "error");
    setMascotState("sad", "💸", topUpMsg);
    return;
  }

  if (betAmount < MIN_BET || betAmount > MAX_BET) {
    playSound("lose");
    showMessage(I18N[currentLocale].msg_invalid_bet, "error");
    setMascotState("sad", "😕", I18N[currentLocale].msg_check_bet);
    return;
  }
  if (betAmount < minOctas || betAmount > maxOctas) {
    if (!isDemoActive() && walletAddress && (inGameBalance < betAmount || inGameBalance < minOctas)) {
      playSound("lose");
      showMessage(topUpMsg, "error");
      setMascotState("sad", "💸", topUpMsg);
      return;
    }
    playSound("lose");
    showMessage(I18N[currentLocale].msg_invalid_bet, "error");
    setMascotState("sad", "😕", I18N[currentLocale].msg_check_bet);
    return;
  }

  const betEDS = (betAmount / 100000000).toFixed(2);
  const prevInGameBalance = inGameBalance;
  const prevBankroll = currentBankrollOctas;
  const prevChainGameId = Math.max(0, chainGameId || 0);

  // Check balance before starting
  debugLogLine(`DEAL check: isDemoActive=${isDemoActive()}, walletAddress=${!!walletAddress}, inGameBalance=${inGameBalance}, betAmount=${betAmount}`);
  if (!isDemoActive() && walletAddress) {
    // When wallet connected, use in-game balance (deposit-based)
    if (inGameBalance < betAmount) {
      playSound("lose");
      debugLogLine(`DEAL blocked: balance ${inGameBalance} < bet ${betAmount}`);
      showMessage(
        currentLocale === "ru"
          ? `Недостаточно игрового баланса: ${(inGameBalance / 100000000).toFixed(2)} EDS. Нажмите ПОПОЛНИТЬ.`
          : `Insufficient in-game balance: ${(inGameBalance / 100000000).toFixed(2)} EDS. Tap DEPOSIT.`,
        "error"
      );
      setMascotState("sad", "💸", currentLocale === "ru" ? "Пополните баланс!" : "Deposit first!");
      return;
    }
  }

  try {
    playSound("chip");
    startBtn.disabled = true;
    setMascotState("thinking", "🤔", I18N[currentLocale].msg_dealing);
    showMessage(
      currentLocale === "ru"
        ? `РАЗДАЧА... СТАВКА: ${betEDS} EDS`
        : `DEALING... BET: ${betEDS} EDS`,
      "info"
    );
    startBtn.classList.add("btn-pulse");

    if (!isDemoActive() && walletAddress) {
      // ON-CHAIN: start_game deducts bet, adds to bankroll/treasury
      debugLogLine(`DEAL on-chain: bet=${betAmount}`);
      await startGameOnChain(betAmount, networkMode);
      chainGameId = await waitForLatestGameId(walletAddress, prevChainGameId, networkMode);
      chainGame = await getGame(chainGameId, networkMode);
      debugLogLine(`DEAL on-chain OK: gameId=${chainGameId}, score=${chainGame.playerScore}`);
      isPlaying = true;
      await renderGame(chainGame);
      scrollToGameArea();
      await syncOnChainHudAfterTx(prevInGameBalance, prevBankroll);
      updateUI();
      setTurn("you");
      startBtn.classList.remove("btn-pulse");

      if (chainGame.playerScore === 21) {
        // Blackjack — auto-credit payout to in-game balance
        if (chainGame.payoutDue > 0) {
          debugLogLine(`BLACKJACK payout: ${chainGame.payoutDue} octas`);
          await creditPayout(walletAddress, chainGame.payoutDue, networkMode);
          await syncOnChainHudAfterTx(prevInGameBalance, prevBankroll);
        }
        game.recordOnChainResult(4, betAmount, chainGame.payoutDue || 0);
        await showBlackjackEffect(betAmount);
      } else {
        setMascotState("wink", "😏", currentLocale === "ru" ? "Ещё или стоп?" : "Hit or stand?");
      }
    } else {
      // DEMO: local game engine
      const gameState = await game.startGame(betAmount);
      isPlaying = true;
      await renderGame(gameState);
      scrollToGameArea();
      updateUI();
      setTurn("you");
      startBtn.classList.remove("btn-pulse");

      if (gameState.playerScore === 21) {
        await showBlackjackEffect(betAmount);
      } else {
        setMascotState("wink", "😏", currentLocale === "ru" ? "Ещё или стоп?" : "Hit or stand?");
      }
    }
  } catch (error) {
    playSound("lose");
    const errMsg = error instanceof Error ? error.message : "";
    debugLogLine(`DEAL error: ${errMsg}`);
    if (errMsg.includes("Недостаточно") || errMsg.toLowerCase().includes("insufficient") || errMsg.includes("INSUFFICIENT")) {
      showMessage(I18N[currentLocale].msg_insufficient, "error");
      setMascotState("sad", "💸", currentLocale === "ru" ? "Не хватает средств!" : "Not enough funds!");
    } else {
      showMessage(I18N[currentLocale].msg_failed_start, "error");
      setMascotState("sad", "😢", I18N[currentLocale].msg_try_again);
    }
    startBtn.disabled = false;
    startBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

async function handleHit() {
  if (!isPlaying) return;
  const prevInGameBalance = inGameBalance;
  const prevBankroll = currentBankrollOctas;

  // On-chain room multiplayer
  if (chainRoomId && chainRoom && mpOnChainMode) {
    if (!isMyTurn(chainRoom)) return;
    // Don't hit if room is already finished
    if (chainRoom.status !== ROOM_STATUS_PLAYING) return;
    try {
      hitBtn.disabled = true;
      standBtn.disabled = true;
      showMessage(
        currentLocale === "ru" ? "БЕРЁМ КАРТУ..." : "HITTING...",
        "info"
      );
      await roomHitOnChain(chainRoomId, networkMode);
      mpLog(`room_hit sent for room ${chainRoomId}`);
      // Immediate poll to update UI without waiting 2.5s
      try {
        const freshRoom = await getRoomOnChain(chainRoomId!, networkMode);
        chainRoom = freshRoom;
        renderChainRoom(freshRoom);
      } catch (_) {}
    } catch (err) {
      mpLog(`room_hit error: ${err}`);
      // Check if room finished while we were hitting (e.g. both got 21)
      try {
        const freshRoom = await getRoomOnChain(chainRoomId!, networkMode);
        chainRoom = freshRoom;
        if (freshRoom.status === ROOM_STATUS_FINISHED || freshRoom.status === ROOM_STATUS_TIMEOUT) {
          // Room already ended - render the result instead of error
          renderChainRoom(freshRoom);
          updateUI();
          return;
        }
      } catch (_) {}
      showMessage(
        currentLocale === "ru" ? "ОШИБКА HIT" : "HIT ERROR",
        "error"
      );
      hitBtn.disabled = false;
      standBtn.disabled = false;
    }
    return;
  }

  // Legacy ntfy.sh multiplayer
  if (multiplayerSnapshot && multiplayerRoom) {
    const meIndex = multiplayerSnapshot.players.findIndex(p => p === getMpName());
    if (multiplayerSnapshot.turnIndex !== meIndex) return;
    if (multiplayerSnapshot.hands?.[meIndex]?.done) return;
    if (isRoomHost) {
      applyMultiplayerHit();
    } else {
      multiplayer.hit();
    }
    return;
  }

  try {
    playSound("deal");
    hitBtn.disabled = true;
    standBtn.disabled = true;
    hitBtn.classList.add("btn-pulse");
    setMascotState("thinking", "🤞", I18N[currentLocale].msg_good_luck);

    let gameState: any;
    if (!isDemoActive() && walletAddress && chainGameId) {
      // ON-CHAIN hit
      debugLogLine(`HIT on-chain: gameId=${chainGameId}`);
      await hitOnChain(chainGameId, networkMode);
      chainGame = await getGame(chainGameId, networkMode);
      gameState = chainGame;
      debugLogLine(`HIT on-chain OK: score=${chainGame.playerScore}, finished=${chainGame.isFinished}`);
    } else {
      // DEMO: local
      gameState = await game.hit();
    }

    await renderHitCard(gameState);
    hitBtn.classList.remove("btn-pulse");

    if (gameState.playerScore > 21) {
      setTurn(null);
      if (!isDemoActive() && walletAddress) {
        game.recordOnChainResult(2, gameState.betAmount, 0);
        await syncOnChainHudAfterTx(prevInGameBalance, prevBankroll);
      }
      await showLoseEffect(gameState.betAmount);
    } else if (gameState.playerScore === 21) {
      setTurn("dealer");
      playSound("win");
      setMascotState("happy", "😃", I18N[currentLocale].msg_perfect_21);
      showMessage(I18N[currentLocale].msg_standing_21, "success");
      await delay(500);
      await handleStand();
    } else {
      setTurn("you");
      hitBtn.disabled = false;
      standBtn.disabled = false;
      setMascotState("wink", "🎯", `${gameState.playerScore} ${currentLocale === "ru" ? "очков" : "points"}!`);
    }
  } catch (error) {
    playSound("lose");
    debugLogLine(`HIT error: ${error instanceof Error ? error.message : error}`);
    showMessage(I18N[currentLocale].msg_error, "error");
    hitBtn.disabled = false;
    standBtn.disabled = false;
    hitBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

async function handleStand() {
  if (!isPlaying) return;
  const prevInGameBalance = inGameBalance;
  const prevBankroll = currentBankrollOctas;

  // On-chain room multiplayer
  if (chainRoomId && chainRoom && mpOnChainMode) {
    if (!isMyTurn(chainRoom)) return;
    if (chainRoom.status !== ROOM_STATUS_PLAYING) return;
    try {
      hitBtn.disabled = true;
      standBtn.disabled = true;
      showMessage(
        currentLocale === "ru" ? "СТОИМ..." : "STANDING...",
        "info"
      );
      await roomStandOnChain(chainRoomId, networkMode);
      mpLog(`room_stand sent for room ${chainRoomId}`);
      // Immediate poll to update UI without waiting 2.5s
      try {
        const freshRoom = await getRoomOnChain(chainRoomId!, networkMode);
        chainRoom = freshRoom;
        renderChainRoom(freshRoom);
      } catch (_) {}
    } catch (err) {
      mpLog(`room_stand error: ${err}`);
      // Check if room finished while we were standing
      try {
        const freshRoom = await getRoomOnChain(chainRoomId!, networkMode);
        chainRoom = freshRoom;
        if (freshRoom.status === ROOM_STATUS_FINISHED || freshRoom.status === ROOM_STATUS_TIMEOUT) {
          renderChainRoom(freshRoom);
          updateUI();
          return;
        }
      } catch (_) {}
      showMessage(
        currentLocale === "ru" ? "ОШИБКА STAND" : "STAND ERROR",
        "error"
      );
      hitBtn.disabled = false;
      standBtn.disabled = false;
    }
    return;
  }

  // Legacy ntfy.sh multiplayer
  if (multiplayerSnapshot && multiplayerRoom) {
    const meIndex = multiplayerSnapshot.players.findIndex(p => p === getMpName());
    if (multiplayerSnapshot.turnIndex !== meIndex) return;
    if (multiplayerSnapshot.hands?.[meIndex]?.done) return;
    if (isRoomHost) {
      applyMultiplayerStand();
    } else {
      multiplayer.stand();
    }
    return;
  }

  try {
    hitBtn.disabled = true;
    standBtn.disabled = true;
    standBtn.classList.add("btn-pulse");
    setTurn("dealer");
    setMascotState("thinking", "😬", I18N[currentLocale].msg_dealer_turn);
    showMessage(I18N[currentLocale].msg_dealer_turn, "info");
    if (multiplayerRoom) {
      multiplayer.endTurn();
    }

    let gameState: any;
    if (!isDemoActive() && walletAddress && chainGameId) {
      // ON-CHAIN stand
      debugLogLine(`STAND on-chain: gameId=${chainGameId}`);
      await standOnChain(chainGameId, networkMode);
      chainGame = await getGame(chainGameId, networkMode);
      gameState = chainGame;
      debugLogLine(`STAND on-chain OK: result=${chainGame.result}, payout=${chainGame.payoutDue}`);
    } else {
      // DEMO: local
      gameState = await game.stand();
    }

    await renderDealerReveal(gameState);
    standBtn.classList.remove("btn-pulse");

    const result = gameState.result;
    const bet = gameState.betAmount;

    // Credit payout for wins/draws (on-chain only)
    if (!isDemoActive() && walletAddress && gameState.payoutDue > 0) {
      debugLogLine(`PAYOUT credit: ${gameState.payoutDue} octas (result=${result})`);
      await creditPayout(walletAddress, gameState.payoutDue, networkMode);
      await syncOnChainHudAfterTx(prevInGameBalance, prevBankroll);
    } else if (!isDemoActive() && walletAddress) {
      // Loss — just refresh balances
      await syncOnChainHudAfterTx(prevInGameBalance, prevBankroll);
    }

    // Record on-chain result in local stats for leaderboard
    if (!isDemoActive() && walletAddress) {
      game.recordOnChainResult(result, bet, gameState.payoutDue || 0);
    }

    if (result === 1) {
      setTurn(null);
      await showWinEffect(bet);
    } else if (result === 2) {
      setTurn(null);
      await showLoseEffect(bet);
    } else if (result === 3) {
      setTurn(null);
      playSound("chip");
      setMascotState(
        "thinking",
        "🤷",
        currentLocale === "ru" ? "Ничья! Нажми ПРОДОЛЖИТЬ для новой игры" : "It's a tie! Tap Continue to play again"
      );
      showMessage(I18N[currentLocale].msg_draw, "info");
      addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_draw}`);
      showGameResult(0, "draw");
      updateUI();
      endGame();
    } else if (result === 4) {
      await showBlackjackEffect(bet);
    }
  } catch (error) {
    playSound("lose");
    debugLogLine(`STAND error: ${error instanceof Error ? error.message : error}`);
    showMessage(I18N[currentLocale].msg_error, "error");
    standBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

// ==================== EFFECTS ====================

function showGameResult(amount: number, type: "win" | "lose" | "draw") {
  if (!gameResultAmount) return;
  gameResultAmount.style.display = "inline-block";
  if (type === "win") {
    gameResultAmount.textContent = `+${formatEDS(amount)}`;
    gameResultAmount.className = "game-result-amount result-win";
  } else if (type === "lose") {
    gameResultAmount.textContent = `-${formatEDS(amount)}`;
    gameResultAmount.className = "game-result-amount result-lose";
  } else {
    gameResultAmount.textContent = `0 EDS`;
    gameResultAmount.className = "game-result-amount result-draw";
  }
}

function hideGameResult() {
  if (!gameResultAmount) return;
  gameResultAmount.style.display = "none";
}

async function showWinEffect(bet: number) {
  playSound("win");
  const payout = bet * 2;
  winAmount.textContent = `+${formatEDS(payout - bet)}`;
  winEffect.style.display = "flex";
  setMascotState("excited", "🎉", I18N[currentLocale].msg_win);
  createConfetti();
  addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_win} ${formatEDS(payout - bet)}`);
  showGameResult(payout - bet, "win");

  await delay(1100);
  winEffect.style.display = "none";
  showMessage(I18N[currentLocale].msg_win, "success");
  updateUI();
  endGame();
}

async function showLoseEffect(bet: number) {
  playSound("lose");
  loseAmount.textContent = `-${formatEDS(bet)}`;
  loseEffect.style.display = "flex";
  setMascotState("sad", "😭", currentLocale === "ru" ? "В следующий раз!" : "Better luck next time!");
  addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_lose} ${formatEDS(bet)}`);
  showGameResult(bet, "lose");

  await delay(900);
  loseEffect.style.display = "none";
  showMessage(I18N[currentLocale].msg_lose, "error");
  updateUI();
  endGame();
}

async function showBlackjackEffect(bet: number) {
  playSound("blackjack");
  const payout = Math.floor(bet * 2.5);
  blackjackAmount.textContent = `+${formatEDS(payout - bet)}`;
  blackjackEffect.style.display = "flex";
  setMascotState("excited", "🤩", I18N[currentLocale].msg_blackjack);
  createConfetti();
  addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_blackjack} ${formatEDS(payout - bet)}`);
  showGameResult(payout - bet, "win");

  await delay(2600);
  blackjackEffect.style.display = "none";
  showMessage(I18N[currentLocale].msg_blackjack, "success");
  updateUI();
  endGame();
}

function createConfetti() {
  const container = document.getElementById("confetti");
  if (!container) return;

  container.innerHTML = "";
  const colors = ["#ffd700", "#ff4444", "#00ff88", "#00d9ff", "#8b5cf6"];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = Math.random() * 100 + "%";
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + "s";
    confetti.style.animationDuration = (2 + Math.random()) + "s";
    container.appendChild(confetti);
  }
}

function endGame() {
  isPlaying = false;
  setTurn(null);
  hasGameResult = true;

  updateUI();
  updateBalance();
  updateBank();
  updateStats();
  updateLeaderboardEntry();
  renderLeaderboard();

  setTimeout(() => {
    setMascotState("happy", "😊", I18N[currentLocale].msg_play_again);
  }, 1000);

  // Keep result + table + action buttons in view
  setTimeout(() => {
    focusGameplayArea();
  }, 500);

  setTxStatus(null);
}

// ==================== RENDER ====================

// Полный рендер начальной раздачи (только для startGame)
async function renderGame(gameState: any, showDealerCards = false) {
  playerCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";
  hidePlayerHints();
  prevHandInfo = null;

  // Показываем карты игрока по одной, обновляя счёт и подсказки
  for (let i = 0; i < gameState.playerCards.length; i++) {
    await delay(PLAYER_CARD_REVEAL_DELAY);
    playSound("deal");
    playerCardsEl.appendChild(renderCard(gameState.playerCards[i]));
    const partial = gameState.playerCards.slice(0, i + 1);
    playerScoreEl.textContent = mpScore(partial).toString();
    updatePlayerHints(partial);
  }

  if (showDealerCards || gameState.isFinished) {
    for (let i = 0; i < gameState.dealerCards.length; i++) {
      await delay(DEALER_CARD_REVEAL_DELAY);
      playSound("deal");
      dealerCardsEl.appendChild(renderCard(gameState.dealerCards[i]));
      dealerScoreEl.textContent = mpScore(gameState.dealerCards.slice(0, i + 1)).toString();
    }
  } else {
    await delay(DEALER_CARD_REVEAL_DELAY);
    playSound("deal");
    dealerCardsEl.appendChild(renderCard(gameState.dealerCards[0]));
    await delay(DEALER_CARD_REVEAL_DELAY);
    playSound("deal");
    dealerCardsEl.appendChild(renderCardBack());
    dealerScoreEl.textContent = "?";
  }
}

// Добавить одну карту игроку (для Hit) — без перерисовки всех карт
async function renderHitCard(gameState: any) {
  const newCard = gameState.playerCards[gameState.playerCards.length - 1];
  await delay(PLAYER_CARD_REVEAL_DELAY);
  playSound("deal");
  playerCardsEl.appendChild(renderCard(newCard));
  playerScoreEl.textContent = gameState.playerScore.toString();
  updatePlayerHints(gameState.playerCards);
}

// Раскрыть карты дилера пошагово (для Stand)
async function renderDealerReveal(gameState: any) {
  showDealerHint(true);
  // Убираем текущие карты дилера (первая + рубашка)
  dealerCardsEl.innerHTML = "";
  // Показываем все карты дилера по одной с обновлением счёта
  for (let i = 0; i < gameState.dealerCards.length; i++) {
    await delay(DEALER_CARD_REVEAL_DELAY);
    playSound("deal");
    dealerCardsEl.appendChild(renderCard(gameState.dealerCards[i]));
    dealerScoreEl.textContent = mpScore(gameState.dealerCards.slice(0, i + 1)).toString();
  }
  showDealerHint(false);
}

function renderCard(card: { suit: number; rank: number }): HTMLDivElement {
  const suit = SUITS[card.suit];
  const rank = RANKS[card.rank];
  const isRed = card.suit === 1 || card.suit === 2;

  const cardEl = document.createElement("div");
  cardEl.className = `card ${isRed ? "card-red" : "card-black"}`;
  cardEl.innerHTML = `<div class="card-rank">${rank}</div><div class="card-suit">${suit}</div>`;
  return cardEl;
}

function renderCardBack(): HTMLDivElement {
  const cardEl = document.createElement("div");
  cardEl.className = "card card-back";
  cardEl.textContent = "?";
  return cardEl;
}

function showMessage(text: string, type: "info" | "success" | "error") {
  messageEl.textContent = text;
  messageEl.className = `message message-${type}`;
}

function showDebugState(_reason: string) {
  // Debug UI removed — keep function signature for callers
}

function updateMpDebug(_reason: string) {
  // Debug UI removed — keep function signature for callers
}

function setTxStatus(text: string | null) {
  if (!txStatusEl) return;
  if (!text) {
    txStatusEl.style.display = "none";
    txStatusEl.textContent = "";
    return;
  }
  txStatusEl.style.display = "block";
  txStatusEl.textContent = text;
}

async function updateBalance() {
  if (isDemoActive()) {
    const balance = await game.getBalance();
    balanceEl.textContent = balance;
    currentPlayerBalanceOctas = Math.max(0, Math.floor(parseFloat(balance) * 100000000) || 0);
    updateBetLimitsUI();
    return;
  }
  if (!walletAddress) {
    balanceEl.textContent = "—";
    return;
  }
  try {
    const balance = await getWalletBalance(walletAddress, networkMode);
    balanceEl.textContent = formatEDS(balance);
  } catch {
    balanceEl.textContent = "—";
  }
  // Also refresh in-game balance
  await updateInGameBalance();
}

async function updateBank() {
  if (isDemoActive()) {
    currentBankrollOctas = game.getBankroll();
    bankrollEl.textContent = formatEDS(currentBankrollOctas);
    if (betFeeEl) betFeeEl.textContent = formatEDS(0);
    currentFeeBps = game.getFeeBps();
    feeEl.textContent = (currentFeeBps / 100).toFixed(2) + "%";
    updateFeeFromBet();
    updateBetLimitsUI();
    return;
  }

  try {
    const info = await getBankInfo(networkMode);
    currentBankrollOctas = info.bankroll;
    bankrollEl.textContent = formatEDS(currentBankrollOctas);
    if (betFeeEl) betFeeEl.textContent = formatEDS(0);
    currentFeeBps = info.feeBps;
    feeEl.textContent = (currentFeeBps / 100).toFixed(2) + "%";
    updateFeeFromBet();
    updateBetLimitsUI();
  } catch {
    bankrollEl.textContent = "—";
    if (betFeeEl) betFeeEl.textContent = "—";
    feeEl.textContent = "—";
  }
}

async function waitForLatestGameId(
  address: string,
  minExpectedId: number,
  mode: "testnet" | "mainnet",
): Promise<number> {
  let lastSeen = Math.max(0, minExpectedId);
  for (let i = 0; i < 8; i++) {
    const latest = await getLatestGameId(address, mode);
    if (latest > minExpectedId) return latest;
    lastSeen = Math.max(lastSeen, latest);
    await delay(450);
  }
  return lastSeen;
}

async function syncOnChainHudAfterTx(prevInGame: number, prevBankroll: number) {
  // Indexer/view may lag right after tx confirmation (especially first tx in session).
  for (let i = 0; i < 7; i++) {
    await Promise.all([updateInGameBalance(), updateBank()]);
    const inGameChanged = inGameBalance !== prevInGame;
    const bankrollChanged = currentBankrollOctas !== prevBankroll;
    if (inGameChanged || bankrollChanged) return;
    await delay(500);
  }
}

async function updateStats() {
  let stats;
  
  // Если подключен кошелек — берем статистику из контракта
  if (walletAddress) {
    try {
      const chainStats = await getPlayerStats(walletAddress, networkMode);
      stats = {
        totalGames: chainStats.totalGames,
        wins: chainStats.wins,
        losses: chainStats.losses,
        draws: chainStats.draws,
        blackjacks: chainStats.blackjacks,
        totalWon: chainStats.totalWon,
        totalLost: chainStats.totalLost,
      };
    } catch (err) {
      console.error("Failed to fetch chain stats:", err);
      // Fallback to local stats
      stats = await game.getStats();
    }
  } else {
    // Demo mode — локальная статистика
    stats = await game.getStats();
  }

  if (statGames) statGames.textContent = stats.totalGames.toString();
  if (statWins) statWins.textContent = stats.wins.toString();
  if (statLosses) statLosses.textContent = stats.losses.toString();
  if (statBlackjacks) statBlackjacks.textContent = stats.blackjacks.toString();

  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;
  if (statWinrate) statWinrate.textContent = winRate + "%";

  const profit = (stats.totalWon - stats.totalLost) / 100000000;
  if (statProfit) {
    statProfit.textContent = (profit >= 0 ? "+" : "") + profit.toFixed(2) + " EDS";
    statProfit.style.color = profit >= 0 ? "var(--success)" : "var(--error)";
  }
}

function handleResetDemo() {
  if (!DEMO_MODE) return;
  game.resetDemo();
  localStorage.removeItem("leaderboard");
  localStorage.removeItem("activePlayers");
  localStorage.removeItem("liveFeed");
  feedItems = [];
  updateBalance();
  updateBank();
  updateStats();
  renderLeaderboard();
  renderActivePlayers();
  renderFeed();
  showMessage(I18N[currentLocale].msg_demo_reset, "info");
  setMascotState("happy", "🙂", I18N[currentLocale].msg_demo_reset_mascot);
}

function buildInviteQrImage(qrCanvas: HTMLCanvasElement, hostName: string, bet: number): HTMLCanvasElement {
  const qrSize = qrCanvas.width;
  const pad = 20;
  const width = qrSize + pad * 2;

  // Текст
  const title = "ENDLESS BLACKJACK";
  const info = currentLocale === "ru"
    ? `${hostName} приглашает в игру`
    : `${hostName} invites you to play`;
  const betLine = currentLocale === "ru"
    ? `Ставка: ${bet} EDS`
    : `Bet: ${bet} EDS`;
  const hint = currentLocale === "ru"
    ? "Отсканируйте QR в приложении Luffa"
    : "Scan QR in Luffa app";

  // Измерить высоту текста
  const titleFont = "bold 18px Arial, sans-serif";
  const infoFont = "14px Arial, sans-serif";
  const betFont = "bold 16px Arial, sans-serif";
  const hintFont = "12px Arial, sans-serif";
  const lineGap = 6;
  const topTextH = 18 + lineGap + 14 + lineGap + 16 + lineGap + 8;
  const bottomTextH = 12 + 10;
  const height = pad + topTextH + qrSize + lineGap + bottomTextH + pad;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Фон
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, width, height);

  let y = pad;

  // Заголовок
  ctx.fillStyle = "#ffd700";
  ctx.font = titleFont;
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, y + 16);
  y += 18 + lineGap;

  // Инфо
  ctx.fillStyle = "#ffffff";
  ctx.font = infoFont;
  ctx.fillText(info, width / 2, y + 12);
  y += 14 + lineGap;

  // Ставка
  ctx.fillStyle = "#4ade80";
  ctx.font = betFont;
  ctx.fillText(betLine, width / 2, y + 14);
  y += 16 + lineGap + 8;

  // QR
  const qrX = (width - qrSize) / 2;
  ctx.drawImage(qrCanvas, qrX, y);
  y += qrSize + lineGap;

  // Подсказка
  ctx.fillStyle = "#aaaaaa";
  ctx.font = hintFont;
  ctx.fillText(hint, width / 2, y + 10);

  return canvas;
}

async function handleInvite() {
  const name = playerName || I18N[currentLocale].player_placeholder;
  if (!isSessionStarted) {
    await startDemoSession();
  }
  const betValue = parseFloat(betInput.value) || 1;

  // On-chain room creation (wallet required)
  if (walletAddress) {
    await updateInGameBalance();
    const betOctas = parseEDS(betValue.toString());
    if (inGameBalance < betOctas) {
      const neededEDS = ((betOctas - inGameBalance) / 100000000) + 0.01;
      showMessage(
        currentLocale === "ru"
          ? `НЕДОСТАТОЧНО БАЛАНСА НА ИГРОВОМ СЧЁТЕ. НУЖНО ЕЩЁ ${neededEDS.toFixed(2)} EDS. ПОПОЛНИТЕ СЧЁТ.`
          : `INSUFFICIENT IN-GAME BALANCE. NEED ${neededEDS.toFixed(2)} MORE EDS. DEPOSIT FIRST.`,
        "error"
      );
      if (depositModal && depositAmountInput) {
        depositAmountInput.value = Math.ceil(neededEDS).toString();
        depositModal.style.display = "flex";
      }
      return;
    }

    // Create room on-chain
    showMessage(
      currentLocale === "ru" ? "СОЗДАНИЕ КОМНАТЫ..." : "CREATING ROOM...",
      "info"
    );
    try {
      await createRoomOnChain(betOctas, networkMode);
      const roomId = await getLatestRoomIdOnChain(networkMode);
      chainRoomId = roomId;
      amIHost = true;
      isRoomHost = true;
      mpOnChainMode = true;
      multiplayerRoom = `chain_${roomId}`;
      mpLog(`Room created: id=${roomId}, bet=${betOctas}`);
      await updateInGameBalance();

      // Start polling
      startRoomPolling();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      mpLog(`create_room error: ${errMsg}`);
      showMessage(
        currentLocale === "ru"
          ? `ОШИБКА СОЗДАНИЯ КОМНАТЫ: ${errMsg}`
          : `ROOM CREATION ERROR: ${errMsg}`,
        "error"
      );
      return;
    }
  } else {
    // Demo mode: use old ntfy.sh flow
    if (!multiplayerRoom) {
      multiplayerRoom = Math.random().toString(36).slice(2, 10);
    }
    isRoomHost = true;
    multiplayerHost = getMpName();
    mpOnChainMode = false;
    if (LS_PUBLIC_KEY && isSessionStarted) {
      if (!mpNameFrozen) mpNameFrozen = getMpName();
      multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), multiplayerHost);
      multiplayer.proposeBet(betValue);
      updateMpDebug("invite");
    }
  }

  // Build invite URL
  const url = new URL(window.location.href);
  url.searchParams.set("invite", name);
  url.searchParams.set("bet", betValue.toString());
  const mode = walletAddress ? "testnet" : "demo";
  url.searchParams.set("mode", mode);
  if (walletAddress) {
    url.searchParams.set("wallet_addr", walletAddress);
    url.searchParams.set("wallet", "luffa");
  }
  if (chainRoomId) {
    url.searchParams.set("room_id", chainRoomId.toString());
  }
  if (multiplayerRoom) {
    url.searchParams.set("room", multiplayerRoom);
  }
  const hostId = getMpName();
  url.searchParams.set("host_id", hostId);
  multiplayerHost = hostId;
  // QR URL без wallet=luffa — чистый HTTPS для сканера Luffa
  const qrUrl = new URL(url.toString());
  qrUrl.searchParams.delete("wallet");
  const qrUrlStr = qrUrl.toString();

  // Показать секцию с QR для хоста
  const inviteShare = document.getElementById("invite-share") as HTMLDivElement;
  const inviteShareInfo = document.getElementById("invite-share-info") as HTMLDivElement;
  const inviteShareQr = document.getElementById("invite-share-qr") as HTMLDivElement;
  const inviteShareCopy = document.getElementById("invite-share-copy") as HTMLButtonElement;
  const inviteShareDownload = document.getElementById("invite-share-download") as HTMLButtonElement;
  const inviteShareHint = document.getElementById("invite-share-hint") as HTMLDivElement;
  if (inviteShare && inviteShareQr) {
    inviteShare.style.display = "flex";

    if (inviteShareInfo) inviteShareInfo.textContent = "";

    inviteShareQr.innerHTML = "";

    // На экране — простой QR без текста
    QRCode.toCanvas(qrUrlStr, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((qrCanvas: HTMLCanvasElement) => {
      inviteShareQr.appendChild(qrCanvas);
    }).catch(() => {
      inviteShareQr.textContent = qrUrlStr;
    });

    let latestInviteBlob: Blob | null = null;
    const resetInviteShareHint = () => {
      latestInviteBlob = null;
      if (inviteShareHint) {
        inviteShareHint.textContent = inviteShareHint.dataset.defaultText || "";
      }
      if (inviteShareDownload) {
        inviteShareDownload.style.display = "none";
      }
    };
    const showFallbackQrHint = (text: string) => {
      if (inviteShareHint) {
        inviteShareHint.textContent = text;
      }
      if (inviteShareDownload) {
        inviteShareDownload.style.display = "inline-flex";
      }
    };
    inviteShareDownload?.addEventListener("click", () => {
      if (!latestInviteBlob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(latestInviteBlob);
      a.download = "invite-qr.png";
      a.click();
      URL.revokeObjectURL(a.href);
    });
    inviteShareDownload?.style?.setProperty("display", "none");

    // Кнопка ОТПРАВИТЬ — при отправке создаём составную картинку с текстом
    if (inviteShareCopy) {
      inviteShareCopy.textContent = currentLocale === "ru"
        ? "ОТПРАВИТЬ QR"
        : "SHARE QR";
      inviteShareCopy.onclick = async () => {
        const plainQr = inviteShareQr.querySelector("canvas");
        if (!plainQr) return;
        const composite = buildInviteQrImage(plainQr, name, betValue);
        composite.toBlob(async (blob) => {
          if (!blob) return;
        const file = new File([blob], "invite-qr.png", { type: "image/png" });
        const isAndroid = /android/i.test(navigator.userAgent);
        const canClipboard = typeof ClipboardItem !== "undefined" && navigator.clipboard?.write;
        if (isAndroid && canClipboard) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            resetInviteShareHint();
            return;
          } catch (_) {
            // fall through to share/download fallback
          }
        }
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file] });
            resetInviteShareHint();
            return;
          } catch (_) {
            // fall through to fallback
          }
        }
        latestInviteBlob = blob;
        showFallbackQrHint(
          currentLocale === "ru"
            ? "QR СОХРАНЁН — отправьте файл вручную"
            : "QR SAVED — send the file manually"
        );
        }, "image/png");
      };
    }

    if (inviteShareHint) {
      const hintText = currentLocale === "ru"
        ? "Отправьте QR или покажите для сканирования в Luffa"
        : "Share QR or show to scan in Luffa";
      inviteShareHint.textContent = hintText;
      inviteShareHint.dataset.defaultText = hintText;
    }
  }

  mpWaitingForGuest = true;
  showMessage(
    currentLocale === "ru"
      ? "ОЖИДАЕМ ПОДТВЕРЖДЕНИЯ ОТ ПРИГЛАШЁННОГО ИГРОКА..."
      : "WAITING FOR INVITED PLAYER TO CONFIRM...",
    "info"
  );
  updateUI();
}


function showInviteBanner() {
  if (!pendingInvite || !inviteBanner || !inviteText) return;
  const modeLabel =
    pendingInvite.mode === "mainnet"
      ? I18N[currentLocale].invite_mode_mainnet
      : pendingInvite.mode === "testnet"
        ? I18N[currentLocale].invite_mode_testnet
        : I18N[currentLocale].invite_mode_demo;
  betInput.value = pendingInvite.bet.toString();
  inviteBanner.style.display = "block";
  inviteText.textContent = `${I18N[currentLocale].invited_by}: ${displayNameWithId(pendingInvite.name)} · ${I18N[currentLocale].invite_bet}: ${pendingInvite.bet} EDS · ${modeLabel}`;
  if (startBtn) startBtn.style.display = "none";
  betMinus.disabled = true;
  betPlus.disabled = true;
  betInput.disabled = true;
  document.body.classList.add("invite-mode");
  if (mascot) mascot.style.display = "none";
  const isOnChain = pendingInvite.mode === "testnet" || pendingInvite.mode === "mainnet";
  const notInLuffa = isOnChain && !isLuffaInApp();

  // Если on-chain и НЕ в Luffa — полноэкранный QR-оверлей
  const luffaQrScreen = document.getElementById("luffa-qr-screen") as HTMLDivElement;
  const luffaQrTitle = document.getElementById("luffa-qr-title") as HTMLDivElement;
  const luffaQrInfo = document.getElementById("luffa-qr-info") as HTMLDivElement;
  const luffaQrCode = document.getElementById("luffa-qr-code") as HTMLDivElement;
  const luffaQrHint = document.getElementById("luffa-qr-hint") as HTMLDivElement;

  if (notInLuffa && luffaQrScreen) {
    // Скрыть всё остальное — оверлей покроет экран
    inviteBanner.style.display = "none";

    // Заполнить оверлей
    if (luffaQrTitle) {
      luffaQrTitle.textContent = currentLocale === "ru"
        ? "ОТКРОЙТЕ В LUFFA"
        : "OPEN IN LUFFA";
    }
    if (luffaQrInfo) {
      const hostName = pendingInvite.name || "???";
      luffaQrInfo.textContent = currentLocale === "ru"
        ? `${hostName} приглашает в Blackjack · Ставка: ${pendingInvite.bet} EDS`
        : `${hostName} invites to Blackjack · Bet: ${pendingInvite.bet} EDS`;
      luffaQrInfo.style.color = "#ffd700";
      luffaQrInfo.style.fontWeight = "bold";
    }

    // QR-код
    if (luffaQrCode) {
      const qrUrl = buildInviteQrUrl();
      luffaQrCode.innerHTML = "";
      QRCode.toCanvas(qrUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then((canvas: HTMLCanvasElement) => {
        luffaQrCode.appendChild(canvas);
      }).catch(() => {
        luffaQrCode.textContent = qrUrl;
      });
    }

    if (luffaQrHint) {
      luffaQrHint.textContent = currentLocale === "ru"
        ? "Отсканируйте QR в приложении Luffa — страница откроется в браузере Luffa и кошелёк подключится автоматически"
        : "Scan QR in Luffa app — page will open in Luffa browser and wallet connects automatically";
    }

    luffaQrScreen.style.display = "flex";
  } else {
    // Обычный режим — скрыть QR-оверлей, показать баннер
    if (luffaQrScreen) luffaQrScreen.style.display = "none";
    const hostName = pendingInvite.name || "???";
    if (isOnChain) {
      showMessage(
        currentLocale === "ru"
          ? `${hostName} ПРИГЛАШАЕТ В BLACKJACK · СТАВКА: ${pendingInvite.bet} EDS`
          : `${hostName} INVITES TO BLACKJACK · BET: ${pendingInvite.bet} EDS`,
        "info"
      );
    } else {
      showMessage(
        currentLocale === "ru"
          ? "ПРИМИ ИЛИ ОТКЛОНИ ПРИГЛАШЕНИЕ"
          : "ACCEPT OR DECLINE THE INVITE",
        "info"
      );
    }
  }
}

function buildInviteQrUrl(): string {
  // Полный URL текущей страницы + invite params + wallet=luffa
  let base: string;
  const loc = window.location;
  if (loc.hostname === "localhost" || loc.hostname === "127.0.0.1") {
    base = (window as any).__LUFFA_QR_URL || "https://huckof1.github.io/EndlessBlack/";
  } else {
    base = loc.origin + loc.pathname;
  }
  const params = new URLSearchParams();
  if (pendingInvite) {
    params.set("invite", pendingInvite.name);
    params.set("bet", pendingInvite.bet.toString());
    params.set("mode", pendingInvite.mode);
  }
  if (multiplayerRoom) params.set("room", multiplayerRoom);
  if (chainRoomId) params.set("room_id", chainRoomId.toString());
  if (multiplayerHost) params.set("host_id", multiplayerHost);
  // Адрес хоста из сохранённых
  const hostAddr = multiplayerHost ? mpWalletAddresses[multiplayerHost] : null;
  if (hostAddr) params.set("wallet_addr", hostAddr);
  // НЕ добавляем wallet=luffa — сканер Luffa откроет как обычный URL,
  // isLuffaInApp() сработает автоматически в Luffa browser
  if (playerName) params.set("name", playerName);
  return base + "?" + params.toString();
}

function handleInviteDecline() {
  pendingInvite = null;
  invitedByLink = false;
  if (inviteBanner) inviteBanner.style.display = "none";
  const luffaQr = document.getElementById("luffa-qr-screen");
  if (luffaQr) luffaQr.style.display = "none";
  betMinus.disabled = false;
  betPlus.disabled = false;
  betInput.disabled = false;
  document.body.classList.remove("invite-mode");
  if (mascot) mascot.style.display = multiplayerRoom ? "none" : "flex";
  if (playerHandNameEl) {
    playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
  }
  showMessage(I18N[currentLocale].msg_place_bet, "info");
  updateUI();
}

async function handleInviteAccept() {
  if (!pendingInvite) { mpLog("no pendingInvite"); return; }
  debugLogLine(`handleInviteAccept: start, invite=${pendingInvite.name}, bet=${pendingInvite.bet}, mode=${pendingInvite.mode}`);
  if (inviteAlreadyUsed) {
    showMessage(I18N[currentLocale].msg_invite_used, "info");
    return;
  }

  if (!playerName) {
    pendingInviteAutoAccept = true;
    if (nicknameModal) nicknameModal.style.display = "flex";
    if (nicknameInput) {
      nicknameInput.value = "";
      nicknameInput.focus();
    }
    return;
  }

  const isOnChainInvite = pendingInvite.mode === "testnet" || pendingInvite.mode === "mainnet";
  mpOnChainMode = isOnChainInvite;

  if (isOnChainInvite) {
    setNetwork(pendingInvite.mode === "mainnet" ? "mainnet" : "testnet");
  }
  betInput.value = pendingInvite.bet.toString();

  // On-chain: подключить кошелёк автоматически
  if (isOnChainInvite && !walletAddress) {
    showMessage(
      currentLocale === "ru" ? "ПОДКЛЮЧЕНИЕ КОШЕЛЬКА..." : "CONNECTING WALLET...",
      "info"
    );
    try {
      if (isLuffaInApp()) {
        walletAddress = await connectLuffa(networkMode);
      } else {
        walletAddress = await connectWallet(networkMode);
      }
      await onWalletConnectSuccess();
      mpLog("handleInviteAccept: wallet connected = " + walletAddress);
    } catch (err) {
      mpLog(`wallet connect failed: ${err}`);
      showMessage(
        currentLocale === "ru"
          ? "НЕ УДАЛОСЬ ПОДКЛЮЧИТЬ КОШЕЛЁК. ОТКРОЙТЕ ССЫЛКУ В LUFFA."
          : "FAILED TO CONNECT WALLET. OPEN LINK IN LUFFA.",
        "error"
      );
      return;
    }
  }

  // Запуск сессии
  if (!isSessionStarted) {
    mpLog("handleInviteAccept: starting session");
    if (isOnChainInvite && walletAddress) {
      nameSection.style.display = "none";
      walletSection.style.display = "block";
      gameArea.style.display = "block";
      isSessionStarted = true;
      setDarkVeilVisible(false);
      setShadowBarsVisible(true);
      if (playerDisplayName) playerDisplayName.textContent = playerName;
      if (playerHandNameEl) playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
      await game.connectWallet();
      await updateBalance();
      await updateInGameBalance();
      await updateBank();
    } else {
      await startDemoSession();
    }
  }

  // On-chain: проверка баланса
  if (isOnChainInvite && walletAddress) {
    try {
      await updateInGameBalance();
    } catch (e) {
      mpLog(`updateInGameBalance failed: ${e}`);
    }
    const betOctas = parseEDS(pendingInvite.bet.toString());
    if (inGameBalance < betOctas) {
      const neededEDS = ((betOctas - inGameBalance) / 100000000) + 0.01;
      showMessage(
        currentLocale === "ru"
          ? `ПОПОЛНИТЕ ИГРОВОЙ СЧЁТ! НЕ ХВАТАЕТ ${neededEDS.toFixed(2)} EDS`
          : `TOP UP GAME BALANCE! NEED ${neededEDS.toFixed(2)} MORE EDS`,
        "error"
      );
      if (depositModal && depositAmountInput) {
        depositAmountInput.value = Math.ceil(neededEDS).toString();
        depositModal.style.display = "flex";
      }
      return;
    }
  }

  if (!isOnChainInvite && !isDemoActive()) {
    showMessage(I18N[currentLocale].msg_release_lock, "error");
    return;
  }

  // On-chain room: join via contract
  if (isOnChainInvite && !chainRoomId) {
    mpLog(`handleInviteAccept: on-chain invite but no chainRoomId!`);
    showMessage(
      currentLocale === "ru"
        ? "ОШИБКА: НЕТ ID КОМНАТЫ. ПОПРОСИТЕ НОВУЮ ССЫЛКУ."
        : "ERROR: NO ROOM ID. ASK FOR A NEW LINK.",
      "error"
    );
    return;
  }
  if (isOnChainInvite && chainRoomId && walletAddress) {
    // Проверяем статус комнаты перед присоединением
    mpLog(`Checking room ${chainRoomId} status before join...`);
    try {
      const roomToCheck = await getRoomOnChain(chainRoomId, networkMode);
      if (roomToCheck.status === ROOM_STATUS_FINISHED || roomToCheck.status === ROOM_STATUS_TIMEOUT || roomToCheck.status === ROOM_STATUS_CANCELLED) {
        mpLog(`Room ${chainRoomId} already finished (status=${roomToCheck.status})`);
        showMessage(
          currentLocale === "ru"
            ? "❌ Эта игра уже завершена. Запросите новую ссылку."
            : "❌ This game already finished. Request a new link.",
          "error"
        );
        setMascotState("sad", "\u{1F61E}", currentLocale === "ru" ? "Игра окончена" : "Game over");
        markInviteUsed();
        return;
      }
      if (roomToCheck.status === ROOM_STATUS_PLAYING && roomToCheck.guest !== "@0x0" && roomToCheck.guest !== walletAddress) {
        mpLog(`Room ${chainRoomId} already has guest`);
        showMessage(
          currentLocale === "ru"
            ? "❌ В этой комнате уже есть игрок"
            : "❌ This room already has a player",
          "error"
        );
        markInviteUsed();
        return;
      }
    } catch (err) {
      mpLog(`Error checking room status: ${err}`);
    }
    
    showMessage(
      currentLocale === "ru" ? "ВХОД В КОМНАТУ..." : "JOINING ROOM...",
      "info"
    );
    mpLog(`joinRoomOnChain(${chainRoomId}) starting...`);
    setTxStatus(currentLocale === "ru" ? "Подтвердите транзакцию в кошельке..." : "Confirm transaction in wallet...");
    try {
      await joinRoomOnChain(chainRoomId, networkMode);
      setTxStatus(null);
      mpLog(`joinRoomOnChain(${chainRoomId}) success`);
      amIHost = false;
      isRoomHost = false;
      mpOnChainMode = true;
      multiplayerRoom = `chain_${chainRoomId}`;
      document.body.classList.add("game-active");
      showMessage(
        currentLocale === "ru" ? "ВЫ В КОМНАТЕ! ОЖИДАНИЕ НАЧАЛА..." : "JOINED! WAITING FOR START...",
        "success"
      );
      await updateInGameBalance();
      startRoomPolling();
      scrollToGameArea();
      markInviteUsed();
    } catch (err) {
      setTxStatus(null);
      const errMsg = err instanceof Error ? err.message : String(err);
      mpLog(`join_room error: ${errMsg}`);
      showMessage(
        currentLocale === "ru"
          ? `ОШИБКА ВХОДА В КОМНАТУ: ${errMsg}`
          : `ROOM JOIN ERROR: ${errMsg}`,
        "error"
      );
      return;
    }
  } else if (!isOnChainInvite) {
    // Demo mode: use old ntfy.sh flow
    debugLogLine(`handleInviteAccept: connecting to room=${multiplayerRoom}`);
    if (multiplayerRoom && LS_PUBLIC_KEY) {
      showMessage(
        currentLocale === "ru" ? "ПОДКЛЮЧЕНИЕ К ИГРЕ..." : "CONNECTING TO GAME...",
        "info"
      );
      const host = multiplayerHost || pendingInvite?.name || playerName;
      if (!mpNameFrozen) mpNameFrozen = getMpName();
      multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), host || "");
      isRoomHost = false;
      multiplayer.acceptBet();
      mpLog("handleInviteAccept: acceptBet queued");
      updateMpDebug("accept");
      markInviteUsed();
    } else {
      mpLog(`NO room or key! room=${multiplayerRoom} key=${LS_PUBLIC_KEY ? "yes" : "no"}`);
    }
  }

  if (inviteBanner) inviteBanner.style.display = "none";
  const luffaQrOverlay = document.getElementById("luffa-qr-screen");
  if (luffaQrOverlay) luffaQrOverlay.style.display = "none";
  pendingInvite = null;
  invitedByLink = false;
  betMinus.disabled = false;
  betPlus.disabled = false;
  betInput.disabled = false;
  document.body.classList.remove("invite-mode");
  if (mascot) mascot.style.display = multiplayerRoom ? "none" : "flex";
  updateUI();
}

function updateUI() {
  document.body.classList.toggle("mp-mode", Boolean(multiplayerRoom));
  document.body.classList.toggle("solo-mode", !multiplayerRoom);
  if (multiplayerRoom && mpPayoutRoom !== multiplayerRoom) {
    mpPayoutRoom = multiplayerRoom;
    mpPayoutBucket = 0;
    localStorage.setItem("mpPayoutRoom", mpPayoutRoom);
    localStorage.setItem("mpPayoutBucket", "0");
  }
  document.body.classList.toggle("invite-mode", Boolean(invitedByLink && pendingInvite));
  if (multiplayerRoom) {
    startBtn.style.display = "none";
  } else if (invitedByLink && pendingInvite) {
    startBtn.style.display = "none";
  } else {
    startBtn.style.display = "inline-flex";
  }
  startBtn.disabled = isPlaying;
  if (dealerHandEl) {
    dealerHandEl.style.display = multiplayerRoom ? "none" : "flex";
  }
  if (mascot) {
    mascot.style.display = multiplayerRoom ? "none" : "flex";
  }
  betInput.disabled = isPlaying;
  betMinus.disabled = isPlaying;
  betPlus.disabled = isPlaying;
  hitBtn.disabled = !isPlaying;
  standBtn.disabled = !isPlaying;
  if (continueBtn) {
    const showContinue = !multiplayerRoom && isSessionStarted && !isPlaying && hasGameResult;
    continueBtn.style.display = showContinue ? "inline-flex" : "none";
    continueBtn.textContent = currentLocale === "ru" ? "ПРОДОЛЖИТЬ" : "CONTINUE";
  }
  if (endGameBtn) {
    const showEnd = !multiplayerRoom && isSessionStarted && !isPlaying && hasGameResult;
    endGameBtn.style.display = showEnd ? "inline-flex" : "none";
    endGameBtn.textContent = currentLocale === "ru" ? "ЗАВЕРШИТЬ" : "END GAME";
  }
  if (leaveGameBtn) {
    const showLeaveMultiplayer = Boolean(multiplayerRoom);
    const showBackToWalletSolo = Boolean(!multiplayerRoom && isSessionStarted && !isPlaying && !hasGameResult);
    leaveGameBtn.style.display = (showLeaveMultiplayer || showBackToWalletSolo) ? "inline-flex" : "none";
    leaveGameBtn.textContent = showLeaveMultiplayer
      ? (currentLocale === "ru" ? "ПОКИНУТЬ ИГРУ" : "LEAVE GAME")
      : (currentLocale === "ru" ? "НАЗАД К КОШЕЛЬКУ" : "BACK TO WALLET");
  }
  updateMpDebug("ui");
  const demo = isDemoActive();
  if (headerStatus) {
    headerStatus.style.display = "flex";
  }
  if (demoBadge) {
    if (walletAddress) {
      demoBadge.textContent = networkMode === "mainnet" ? "MAINNET" : "TESTNET";
    } else {
      demoBadge.textContent = "DEMO";
    }
    demoBadge.style.display = "inline-block";
  }
  document.body.dataset.demo = demo ? "true" : "false";
  if (resetDemoBtn) {
    const inviteActive = Boolean(pendingInvite) || (inviteBanner && inviteBanner.style.display !== "none");
    resetDemoBtn.style.display = demo && !multiplayerRoom && !inviteActive ? "inline-flex" : "none";
  }
  if (inviteBtnHeader) {
    inviteBtnHeader.style.display = (isSessionStarted || Boolean(walletAddress)) ? "inline-flex" : "none";
    inviteBtnHeader.textContent = I18N[currentLocale].invite;
  }
  if (connectWalletHeader) {
    // Always visible — connect or reconnect
    connectWalletHeader.style.display = "inline-flex";
    if (walletAddress) {
      connectWalletHeader.textContent = I18N[currentLocale].disconnect_wallet;
    } else {
      connectWalletHeader.textContent = I18N[currentLocale].connect_wallet;
    }
  }
  if (demoPlayBtn) {
    // Show demo button only when wallet is NOT connected
    demoPlayBtn.style.display = walletAddress ? "none" : "inline-flex";
    demoPlayBtn.textContent = I18N[currentLocale].demo_play;
  }
  if (faucetBtn) {
    // Show faucet button only when wallet connected on testnet
    faucetBtn.style.display = (walletAddress && networkMode === "testnet") ? "inline-flex" : "none";
    faucetBtn.textContent = I18N[currentLocale].faucet;
  }
  // Deposit/Withdraw buttons — visible when wallet connected
  if (depositBtnHeader) {
    depositBtnHeader.style.display = walletAddress ? "inline-flex" : "none";
    depositBtnHeader.textContent = I18N[currentLocale].deposit;
  }
  if (withdrawBtnHeader) {
    withdrawBtnHeader.style.display = walletAddress ? "inline-flex" : "none";
    withdrawBtnHeader.textContent = I18N[currentLocale].withdraw_btn;
  }
  if (ingameBalanceRow) {
    ingameBalanceRow.style.display = walletAddress ? "flex" : "none";
  }
  if (fundBankHeader) {
    fundBankHeader.style.display = (walletAddress && isContractOwner) ? "inline-flex" : "none";
    fundBankHeader.textContent = I18N[currentLocale].fund_bank;
  }
  const initRoomsBtn = document.getElementById("init-rooms-btn") as HTMLButtonElement;
  if (initRoomsBtn) {
    initRoomsBtn.style.display = (walletAddress && isContractOwner) ? "inline-flex" : "none";
  }
  if (walletModal) {
    walletModal.style.display = "none";
  }
  setWalletStatus(Boolean(walletAddress));

  // Both demo and wallet modes use local game engine now
  const current = game.getCurrentGame();
  const canClaim = current && current.isFinished && current.payoutDue > 0 && !current.isClaimed;

  if (multiplayerRoom && multiplayerSnapshot?.phase === "player") {
    const players = multiplayerSnapshot.players || [];
    const meIndex = players.findIndex(p => p === getMpName());
    const turn = multiplayerSnapshot.turnIndex ?? multiplayerState?.turnIndex ?? null;
    const isMyTurn = meIndex !== -1 && turn === meIndex;
    const isPending = Boolean(multiplayerSnapshot.pendingTurn && Date.now() < multiplayerSnapshot.pendingTurn.until);
    const isDone = Boolean(multiplayerSnapshot.hands?.[meIndex]?.done);
    startBtn.disabled = !isMyTurn || isPending;
    hitBtn.disabled = !isMyTurn || !isPlaying || isPending || isDone;
    standBtn.disabled = !isMyTurn || !isPlaying || isPending || isDone;
  }
  if (multiplayerSnapshot && multiplayerSnapshot.pendingBet) {
    startBtn.disabled = true;
  }
  if (multiplayerRoom && multiplayerSnapshot?.phase === "done" && multiplayerSnapshot.agreed) {
    if (mpOnChainMode) {
      // On-chain mode: payouts auto-credited, no CLAIM button
      claimBtn.style.display = "none";
      claimBtn.disabled = true;
      payoutDueEl.style.display = "none";
    } else if (mpPayoutBucket > 0) {
      claimBtn.style.display = "block";
      claimBtn.disabled = false;
      payoutDueEl.style.display = "block";
      payoutDueEl.textContent = `${I18N[currentLocale].payout_due} ${formatMpEds(mpPayoutBucket)}`;
    } else {
      claimBtn.style.display = "none";
      claimBtn.disabled = true;
      payoutDueEl.style.display = "none";
    }
  } else {
    if (canClaim) {
      claimBtn.style.display = "block";
      claimBtn.disabled = false;
      payoutDueEl.style.display = "block";
      payoutDueEl.textContent = `${I18N[currentLocale].payout_due} ${formatEDS(current.payoutDue)}`;
    } else {
      claimBtn.style.display = "none";
      claimBtn.disabled = true;
      payoutDueEl.style.display = "none";
    }
  }

  // Гарантировать что "ОЖИДАЕМ" не затрётся
  if (mpWaitingForGuest) {
    showMessage(
      currentLocale === "ru"
        ? "ОЖИДАЕМ ПОДТВЕРЖДЕНИЯ ОТ ПРИГЛАШЁННОГО ИГРОКА..."
        : "WAITING FOR INVITED PLAYER TO CONFIRM...",
      "info"
    );
  }
  saveUiState();
}

function cleanupMultiplayer() {
  multiplayerRoom = null;
  multiplayerState = null;
  multiplayerSnapshot = null;
  multiplayerHost = null;
  isRoomHost = false;
  mpWalletAddresses = {};
  mpBetsDeducted = false;
  mpOnChainMode = false;
  mpWaitingForGuest = false;
  mpPayoutBucket = 0;
  localStorage.setItem("mpPayoutBucket", "0");
  // Clean up chain room state
  stopRoomPolling();
  chainRoomId = null;
  chainRoom = null;
  lastRenderedChainRoomStatus = null;
  amIHost = false;
  lastRenderedMyCardCount = 0;
  lastRenderedOppCardCount = 0;
  lastRenderedOppDone = false;
  chainRoomResultShown = false;
  isPlaying = false;
  if (opponentHandEl) opponentHandEl.style.display = "none";
  if (winnerBannerEl) winnerBannerEl.style.display = "none";
  if (betOffer) betOffer.style.display = "none";
  if (turnIndicator) turnIndicator.style.display = "none";
  if (dealerHandEl) {
    dealerHandEl.style.display = "flex";
    const dealerNameEl = dealerHandEl.querySelector(".hand-name") as HTMLSpanElement;
    if (dealerNameEl) dealerNameEl.textContent = currentLocale === "ru" ? "ДИЛЕР" : "DEALER";
  }
  if (mascot) mascot.style.display = "flex";
  const luffaQrScreen = document.getElementById("luffa-qr-screen");
  if (luffaQrScreen) luffaQrScreen.style.display = "none";
  hideInviteShareSection();
  document.body.classList.remove("game-active");
  playerCardsEl.innerHTML = "";
  opponentCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";
  playerScoreEl.textContent = "-";
  dealerScoreEl.textContent = "-";
  betMinus.disabled = false;
  betPlus.disabled = false;
  betInput.disabled = false;
  startIdleMusic();
  saveUiState();
}

function getInviteUsedStorageKey(key: string): string {
  return `invite_used_${key}`;
}

function hideInviteShareSection() {
  const inviteShareCleanup = document.getElementById("invite-share");
  if (inviteShareCleanup) inviteShareCleanup.style.display = "none";
  const luffaQrScreen = document.getElementById("luffa-qr-screen");
  if (luffaQrScreen) luffaQrScreen.style.display = "none";
}

function markInviteUsed() {
  if (inviteAlreadyUsed) return;
  inviteAlreadyUsed = true;
  if (inviteLinkKey) {
    localStorage.setItem(getInviteUsedStorageKey(inviteLinkKey), "1");
  }
  hideInviteShareSection();
}

function finishActiveRoom() {
  if (finishRoomTimeout) return;
  if (drawRestartTimeout) {
    window.clearTimeout(drawRestartTimeout);
    drawRestartTimeout = null;
  }
  finishRoomTimeout = window.setTimeout(() => {
    finishRoomTimeout = null;
    cleanupMultiplayer();
    returnToStartScreen();
  }, 2200);
}

async function handleLeaveGame() {
  if (!multiplayerRoom) return;

  // On-chain room: cancel if waiting, otherwise just leave (opponent can claim timeout)
  if (chainRoomId && mpOnChainMode && walletAddress) {
    if (chainRoom && chainRoom.status === ROOM_STATUS_WAITING && amIHost) {
      try {
        await cancelRoomOnChain(chainRoomId, networkMode);
        mpLog(`Room ${chainRoomId} cancelled`);
      } catch (err) {
        mpLog(`cancel_room error: ${err}`);
      }
    }
    // If game is in progress, the opponent can claim timeout after 5 min
    stopRoomPolling();
    cleanupMultiplayer();
    showMessage(
      currentLocale === "ru"
        ? "Вы покинули игру."
        : "You left the game.",
      "info"
    );
    await updateInGameBalance();
    updateUI();
    return;
  }

  // Legacy ntfy.sh flow
  const isInGame = multiplayerSnapshot &&
    multiplayerSnapshot.phase === "player" &&
    multiplayerSnapshot.hands.length >= 2;

  if (isInGame && mpBetsDeducted && mpOnChainMode && walletAddress) {
    const players = multiplayerSnapshot!.players || [];
    const meIndex = players.findIndex(p => p === getMpName());
    const oppIndex = meIndex === 0 ? 1 : 0;
    const oppAddr = mpWalletAddresses[players[oppIndex]] || "";
    const betOctas = parseEDS(multiplayerSnapshot!.bet.toString());

    if (oppAddr && betOctas > 0) {
      try {
        const fee = betOctas * 2 * 0.02;
        const payoutOctas = Math.floor(betOctas * 2 - fee);
        debugLogLine(`FORFEIT: paying ${payoutOctas} octas to opponent ${oppAddr}`);
        await creditPayout(oppAddr, payoutOctas, networkMode);
        mpBetsDeducted = false;
      } catch (err) {
        debugLogLine(`FORFEIT payout error: ${err}`);
      }
    }
  }

  multiplayer.forfeit();
  multiplayer.disconnect();
  cleanupMultiplayer();
  showMessage(
    currentLocale === "ru"
      ? "Вы покинули игру."
      : "You left the game.",
    "info"
  );
  if (walletAddress) {
    await updateInGameBalance();
  }
  updateUI();
}

async function handleForfeitReceived(byName: string) {
  if (!multiplayerRoom || !multiplayerSnapshot) return;

  const isInGame = multiplayerSnapshot.phase === "player" &&
    multiplayerSnapshot.hands.length >= 2;

  if (isInGame && mpBetsDeducted && mpOnChainMode && isRoomHost && walletAddress) {
    // Opponent forfeited mid-game: credit winnings to us
    const myAddr = walletAddress;
    const betOctas = parseEDS(multiplayerSnapshot.bet.toString());

    if (myAddr && betOctas > 0) {
      try {
        const fee = betOctas * 2 * 0.02;
        const payoutOctas = Math.floor(betOctas * 2 - fee);
        debugLogLine(`FORFEIT received: crediting ${payoutOctas} octas to self ${myAddr}`);
        await creditPayout(myAddr, payoutOctas, networkMode);
        mpBetsDeducted = false;
        setTimeout(() => updateInGameBalance(), 2000);
      } catch (err) {
        debugLogLine(`FORFEIT credit error: ${err}`);
      }
    }
  }

  // Mark game as done
  multiplayerSnapshot.phase = "done";
  multiplayerSnapshot.turnIndex = null;
  multiplayerSnapshot.pendingTurn = null;
  // Set results: forfeiter loses
  const players = multiplayerSnapshot.players || [];
  const forfeiterIndex = players.findIndex(p => p === byName);
  if (forfeiterIndex !== -1 && multiplayerSnapshot.hands.length >= 2) {
    const results = [0, 0];
    const payouts = [0, 0];
    const claimed = [false, false];
    const winnerIndex = forfeiterIndex === 0 ? 1 : 0;
    const feeBps = game.getFeeBps();
    const pot = multiplayerSnapshot.bet * 2;
    const fee = pot * feeBps / 10000;
    results[winnerIndex] = 1;
    results[forfeiterIndex] = -1;
    payouts[winnerIndex] = Math.round((pot - fee) * 100) / 100;
    payouts[forfeiterIndex] = 0;
    multiplayerSnapshot.results = results;
    multiplayerSnapshot.payouts = payouts;
    multiplayerSnapshot.claimed = claimed;
  }

  if (isRoomHost) {
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
  }
  renderMultiplayerSnapshot(multiplayerSnapshot);

  showMessage(
    currentLocale === "ru"
      ? `${displayName(byName)} покинул игру. Вы победили!`
      : `${displayName(byName)} left the game. You win!`,
    "success"
  );
  playSound("win");
  createConfetti();
}

// handleConnectWallet removed — was unused

async function handleDisconnectWallet() {
  const oldWalletAddress = walletAddress;
  
  try {
    await disconnectWallet();
  } catch (err) {
    console.warn("Disconnect error:", err);
  }
  walletAddress = "";
  isContractOwner = false;
  chainGameId = 0;
  chainGame = null;
  chainRoomId = null;
  multiplayerRoom = null;
  mpOnChainMode = false;
  isRoomHost = false;
  amIHost = false;
  isPlaying = false;
  pendingResume = null;
  inGameBalance = 0;
  if (ingameBalanceRow) ingameBalanceRow.style.display = "none";
  setWalletStatus(false);
  if (walletAddressEl) walletAddressEl.textContent = "—";
  resetCurrentGameState();
  
  // Очищаем localStorage чтобы сессия не восстанавливалась
  localStorage.removeItem(UI_STATE_KEY);
  if (oldWalletAddress) {
    localStorage.removeItem("walletNickname_" + oldWalletAddress);
  }
  
  returnToStartScreen();
  showMessage(
    currentLocale === "ru"
      ? "Кошелёк отключён."
      : "Wallet disconnected.",
    "info"
  );
}

async function startDemoSession() {
  if (RELEASE_MODE) {
    showMessage(I18N[currentLocale].msg_release_lock, "info");
    return;
  }
  const name = playerNameInput?.value?.trim() || localStorage.getItem("playerName") || I18N[currentLocale].player_placeholder;
  playerName = name.slice(0, 12);
  localStorage.setItem("playerName", playerName);

  isSessionStarted = true;
  applySessionLayout();

  if (playerDisplayName) playerDisplayName.textContent = playerName;
  if (playerHandNameEl) playerHandNameEl.textContent = playerName || I18N[currentLocale].you;

  // Start in demo mode without wallet
  await game.connectWallet();
  await updateBalance();
  await updateBank();
  await updateStats();
  setWalletStatus(false);
  if (walletAddressEl) walletAddressEl.textContent = "TEST";

  setMascotState("happy", "👍", `${currentLocale === "ru" ? "Привет" : "Welcome"}, ${playerName}!`);
  showMessage(
    currentLocale === "ru" ? "Тестовый режим. Сделай ставку!" : "Test mode. Place your bet!",
    "info"
  );
  scrollToGameArea(window.innerWidth <= 520 ? 150 : 110);
  pulseBetDisplay();
  updateUI();
  initFeed();
  renderLeaderboard();
  renderActivePlayers();
  saveUiState();
}

async function handleFaucet() {
  if (!walletAddress) {
    showMessage(
      currentLocale === "ru"
        ? "Сначала подключите кошелёк."
        : "Connect wallet first.",
      "error"
    );
    return;
  }
  try {
    if (faucetBtn) faucetBtn.disabled = true;
    debugLogLine(`FAUCET submit: ${walletAddress}`);
    showMessage(
      currentLocale === "ru"
        ? "Запрос тестовых EDS... Подтвердите в кошельке."
        : "Requesting test EDS... Confirm in wallet.",
      "info"
    );
    await requestFaucet(walletAddress, networkMode);
    await updateBalance();
    showMessage(I18N[currentLocale].faucet_success, "success");
    if (pendingInvite) {
      showInviteBanner();
      showMessage(
        currentLocale === "ru"
          ? "Баланс пополнен. Прими приглашение!"
          : "Balance topped up. Accept the invite!",
        "info"
      );
      focusGameplayArea();
    }
  } catch (err) {
    console.warn("Faucet failed:", err);
    debugLogLine(`FAUCET error: ${err instanceof Error ? err.message : String(err)}`);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("wallet closed") || msg.includes("WALLET_PICKER_REQUIRED")) {
      showMessage(
        currentLocale === "ru"
          ? "Кошелёк закрылся. Откройте LUFFA (кнопка вверху) или QR и повторите."
          : "Wallet closed. Open LUFFA (top button) or use QR, then try again.",
        "error"
      );
      showWalletPicker();
    } else {
      showMessage(I18N[currentLocale].faucet_fail, "error");
    }
  } finally {
    if (faucetBtn) faucetBtn.disabled = false;
  }
}

function handleFundBankroll() {
  if (!walletAddress) return;
  // Show HTML modal instead of prompt() — prompt() blocks wallet iframe on mobile
  if (fundModal) {
    if (fundAmountInput) fundAmountInput.value = "5";
    fundModal.style.display = "flex";
  }
}

async function executeFundBankroll() {
  if (!walletAddress) return;
  const edsAmount = parseFloat(fundAmountInput?.value || "0");
  if (isNaN(edsAmount) || edsAmount <= 0) return;
  const octas = Math.floor(edsAmount * 100000000);
  // Hide modal first so it doesn't block wallet popup
  if (fundModal) fundModal.style.display = "none";
  try {
    if (fundBankHeader) fundBankHeader.disabled = true;
    showMessage(
      currentLocale === "ru"
        ? "Пополнение банкролла... Подтвердите в кошельке."
        : "Funding bankroll... Confirm in wallet.",
      "info"
    );
    // Call transaction IMMEDIATELY — no async before this!
    // Mobile Safari blocks wallet popup if user gesture context is lost.
    await fundBankroll(octas, networkMode);
    await updateBank();
    await updateBalance();
    showMessage(I18N[currentLocale].fund_bank_success, "success");
  } catch (err: any) {
    console.error("Fund bankroll failed:", err);
    const errMsg = err?.message || err?.toString?.() || String(err);
    // Show contract address in error for debugging
    const { CONTRACT_ADDRESS_TESTNET } = await import("./config");
    showMessage(
      currentLocale === "ru"
        ? `Ошибка: ${errMsg} [контракт: ${CONTRACT_ADDRESS_TESTNET.slice(0, 10)}...]`
        : `Error: ${errMsg} [contract: ${CONTRACT_ADDRESS_TESTNET.slice(0, 10)}...]`,
      "error"
    );
  } finally {
    if (fundBankHeader) fundBankHeader.disabled = false;
  }
}

// ==================== DEPOSIT / WITHDRAW ====================

function handleShowDeposit() {
  if (!walletAddress) return;
  if (depositModal) {
    if (depositAmountInput) depositAmountInput.value = "5";
    requestAnimationFrame(() => {
      depositModal.style.display = "flex";
      if (depositAmountInput) {
        depositAmountInput.focus();
        depositAmountInput.select();
      }
    });
  }
  debugLogLine("DEPOSIT modal opened");
}

function handleShowWithdraw() {
  if (!walletAddress) return;
  if (withdrawModal) {
    const currentBal = (inGameBalance / 100000000).toFixed(2);
    if (withdrawAmountInput) withdrawAmountInput.value = currentBal;
    requestAnimationFrame(() => {
      withdrawModal.style.display = "flex";
      if (withdrawAmountInput) {
        withdrawAmountInput.focus();
        withdrawAmountInput.select();
      }
    });
  }
}

async function executeDeposit() {
  if (!walletAddress) return;
  if (!depositModal || depositModal.style.display === "none") {
    handleShowDeposit();
    return;
  }
  const edsAmount = parseFloat(depositAmountInput?.value || "0");
  if (isNaN(edsAmount) || edsAmount <= 0) return;
  const octas = Math.floor(edsAmount * 100000000);
  const expectedInGame = inGameBalance + octas;
  if (depositModal) depositModal.style.display = "none";
  try {
    debugLogLine(`DEPOSIT submit: ${edsAmount} EDS (${octas} octas)`);
    showMessage(
      currentLocale === "ru"
        ? "Депозит... Подтвердите в кошельке."
        : "Depositing... Confirm in wallet.",
      "info"
    );
    await depositOnChain(octas, networkMode);
    debugLogLine("DEPOSIT tx submitted/confirmed, syncing in-game balance...");
    // Indexers/view can lag for a moment after tx confirmation.
    for (let i = 0; i < 6; i++) {
      await updateInGameBalance();
      debugLogLine(`DEPOSIT sync attempt ${i + 1}: inGameBalance=${inGameBalance}, expected=${expectedInGame}`);
      if (inGameBalance >= expectedInGame) break;
      await delay(600);
    }
    debugLogLine(`DEPOSIT sync done: inGameBalance=${inGameBalance}`);
    await updateBalance();
    showMessage(I18N[currentLocale].deposit_success, "success");
    debugLogLine("DEPOSIT complete, game ready");
  } catch (err: any) {
    console.error("Deposit failed:", err);
    const msg = err?.message || err;
    debugLogLine(`DEPOSIT error: ${msg}`);
    if (String(msg).toLowerCase().includes("wallet closed") || String(msg).includes("WALLET_PICKER_REQUIRED")) {
      try {
        showMessage(
          currentLocale === "ru"
            ? "Повторное подключение кошелька..."
            : "Reconnecting wallet...",
          "info"
        );
        await connectWalletFlow(false);
        await depositOnChain(octas, networkMode);
        await updateInGameBalance();
        await updateBalance();
        showMessage(I18N[currentLocale].deposit_success, "success");
        return;
      } catch (retryErr: any) {
        debugLogLine(`DEPOSIT retry error: ${retryErr?.message || retryErr}`);
      }
    }
    showMessage(I18N[currentLocale].deposit_fail, "error");
  }
}

async function executeWithdraw() {
  if (!walletAddress) return;
  if (!withdrawModal || withdrawModal.style.display === "none") {
    handleShowWithdraw();
    return;
  }
  const edsAmount = parseFloat(withdrawAmountInput?.value || "0");
  if (isNaN(edsAmount) || edsAmount <= 0) return;
  const octas = Math.floor(edsAmount * 100000000);
  if (withdrawModal) withdrawModal.style.display = "none";
  try {
    debugLogLine(`WITHDRAW submit: ${edsAmount} EDS (${octas} octas)`);
    showMessage(
      currentLocale === "ru"
        ? "Вывод... Подтвердите в кошельке."
        : "Withdrawing... Confirm in wallet.",
      "info"
    );
    await withdrawOnChain(octas, networkMode);
    await updateInGameBalance();
    await updateBalance();
    showMessage(I18N[currentLocale].withdraw_success, "success");
  } catch (err: any) {
    console.error("Withdraw failed:", err);
    const msg = err?.message || err;
    debugLogLine(`WITHDRAW error: ${msg}`);
    if (String(msg).toLowerCase().includes("wallet closed") || String(msg).includes("WALLET_PICKER_REQUIRED")) {
      showMessage(
        currentLocale === "ru"
          ? "Кошелёк закрылся. Откройте LUFFA (кнопка вверху) или QR и повторите."
          : "Wallet closed. Open LUFFA (top button) or use QR, then try again.",
        "error"
      );
      showWalletPicker();
    } else {
      showMessage(I18N[currentLocale].withdraw_fail, "error");
    }
  }
}

async function updateInGameBalance() {
  if (!walletAddress) {
    inGameBalance = 0;
    if (ingameBalanceRow) ingameBalanceRow.style.display = "none";
    return;
  }
  try {
    inGameBalance = await getPlayerBalanceOnChain(walletAddress, networkMode);
    debugLogLine(`BALANCE sync: ${inGameBalance} octas (${formatEDS(inGameBalance)})`);
    if (ingameBalanceEl) ingameBalanceEl.textContent = formatEDS(inGameBalance);
    if (ingameBalanceRow) ingameBalanceRow.style.display = "flex";
    updateBetLimitsUI();
  } catch (err) {
    debugLogLine(`BALANCE sync error: ${err}`);
    inGameBalance = 0;
    if (ingameBalanceEl) ingameBalanceEl.textContent = "0.00 EDS";
    if (ingameBalanceRow) ingameBalanceRow.style.display = walletAddress ? "flex" : "none";
    updateBetLimitsUI();
  }
}

async function connectWalletFlow(fromSessionStart: boolean) {
  if (isWalletConnecting) return;
  isWalletConnecting = true;
  const wasDemo = isDemoActive();

  // Show wallet picker with Luffa QR immediately
  showWalletPicker();

  try {
    const w = window as any;
    if (isLuffaInApp()) {
      walletAddress = await connectLuffa(networkMode);
    } else if (w?.endless) {
      walletAddress = await connectEndlessExtension(networkMode);
    } else {
      walletAddress = await connectWallet(networkMode);
    }
    if (wasDemo) {
      resetCurrentGameState();
    }
    await onWalletConnectSuccess();
  } catch (err) {
    console.warn("Wallet connect failed:", err);
    if (fromSessionStart) {
      // Wallet not available — show error and fall back to demo mode
      showMessage(
        currentLocale === "ru"
          ? "Кошелёк не подключён. Запущен тестовый режим."
          : "Wallet not connected. Running in test mode.",
        "error"
      );
      await game.connectWallet();
      await updateBalance();
      await updateBank();
      await updateStats();
      setWalletStatus(false);
      if (walletAddressEl) walletAddressEl.textContent = "TEST";
      if (walletModal) walletModal.style.display = "none";
    }
    // Wallet picker with QR stays open for manual connection
  } finally {
    isWalletConnecting = false;
    updateUI();
  }
}

function showWalletPicker() {
  if (!walletModal) return;
  // Reset to options view
  if (walletPickerOptions) walletPickerOptions.style.display = "flex";
  if (walletConnectStatus) walletConnectStatus.style.display = "none";
  if (walletPickerBack) walletPickerBack.style.display = "none";
  if (walletInstallLink) walletInstallLink.style.display = "none";
  if (walletQrContainer) {
    walletQrContainer.style.display = "none";
    walletQrContainer.innerHTML = "";
  }
  if (walletPickerTitle) {
    walletPickerTitle.textContent = I18N[currentLocale].wallet_picker_title;
  }
  // Hide Luffa QR section — it only shows when user clicks the Luffa button
  if (walletLuffaQrSection) walletLuffaQrSection.style.display = "none";
  walletModal.style.display = "flex";
}

function getLuffaQrUrl(): string {
  // Base URL: on localhost use production URL so phone can reach it
  let base: string;
  const loc = window.location;
  if (loc.hostname === "localhost" || loc.hostname === "127.0.0.1") {
    base = (window as any).__LUFFA_QR_URL || "https://huckof1.github.io/EndlessBlack/";
  } else {
    base = loc.origin + loc.pathname;
  }
  // Add player name and wallet=luffa so the page auto-connects
  const params = new URLSearchParams();
  if (playerName) params.set("name", playerName);
  params.set("wallet", "luffa");
  return base + "?" + params.toString();
}

async function generateLuffaQr() {
  if (!walletLuffaQr) return;
  walletLuffaQr.innerHTML = "";
  if (walletLuffaQrSection) walletLuffaQrSection.style.display = "flex";
  if (walletLuffaQrHint) {
    walletLuffaQrHint.textContent = I18N[currentLocale].wallet_luffa_qr_hint;
  }
  const qrUrl = getLuffaQrUrl();
  try {
    const canvas = await QRCode.toCanvas(qrUrl, {
      width: 180,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
    walletLuffaQr.appendChild(canvas);
  } catch {
    walletLuffaQr.textContent = qrUrl;
  }
}

async function connectLuffaWithTimeout(timeoutMs = 4000): Promise<string> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("LUFFA_CONNECT_TIMEOUT")), timeoutMs);
  });
  return Promise.race([connectLuffa(networkMode), timeoutPromise]);
}

async function tryLuffaAutoConnect() {
  if (walletAddress) return;
  // Luffa bridge may take time to inject — retry several times
  let attempt = 0;
  const maxAttempts = 8;
  const check = async () => {
    if (walletAddress || attempt >= maxAttempts) return;
    attempt++;
    if (isLuffaInApp()) {
      try {
        walletAddress = await connectLuffaWithTimeout(3000);
        await onWalletConnectSuccess();
      } catch {
        // failed — QR is visible for manual scan
      }
    } else {
      setTimeout(check, 400);
    }
  };
  setTimeout(check, 300);
}

async function handleEndlessWalletConnect() {
  if (!walletModal) return;
  setPreferredWalletType("web3");
  if (walletAddress) {
    await handleDisconnectWallet();
  }
  // Switch to status view
  if (walletPickerOptions) walletPickerOptions.style.display = "none";
  if (walletConnectStatus) walletConnectStatus.style.display = "flex";
  if (walletPickerBack) walletPickerBack.style.display = "inline-flex";
  if (walletQrContainer) walletQrContainer.style.display = "none";
  if (walletInstallLink) walletInstallLink.style.display = "none";
  if (walletStatusText) {
    walletStatusText.textContent = I18N[currentLocale].wallet_connecting;
  }
  if (walletPickerTitle) {
    walletPickerTitle.textContent = I18N[currentLocale].wallet_endless;
  }

  try {
    // Universal flow first: web3 SDK works without browser extension.
    walletAddress = await connectWallet(networkMode);
    await onWalletConnectSuccess();
  } catch (err: any) {
    try {
      walletAddress = await connectEndlessExtension(networkMode);
      await onWalletConnectSuccess();
      return;
    } catch {
      if (walletStatusText) {
        walletStatusText.textContent = I18N[currentLocale].wallet_endless_install;
      }
      if (walletPickerTitle) {
        walletPickerTitle.textContent = I18N[currentLocale].wallet_endless_missing;
      }
      if (walletInstallLink) {
        walletInstallLink.href = "https://wallet.endless.link/";
        walletInstallLink.textContent = I18N[currentLocale].wallet_endless_open;
        walletInstallLink.style.display = "inline-flex";
      }
    }
  }
}

async function handleLuffaWalletConnect() {
  if (!walletModal) return;
  setPreferredWalletType("luffa");
  if (walletAddress) {
    await handleDisconnectWallet();
  }
  // Hide picker options and try direct in-app connect first.
  if (walletPickerOptions) walletPickerOptions.style.display = "none";
  if (walletPickerBack) walletPickerBack.style.display = "inline-flex";
  if (walletConnectStatus) walletConnectStatus.style.display = "flex";
  if (walletInstallLink) walletInstallLink.style.display = "none";
  if (walletPickerTitle) {
    walletPickerTitle.textContent = I18N[currentLocale].wallet_luffa || "LUFFA WALLET";
  }
  if (walletStatusText) {
    walletStatusText.textContent = I18N[currentLocale].wallet_luffa_connecting;
  }
  if (walletLuffaQrSection) walletLuffaQrSection.style.display = "none";

  // Try connecting directly several times (Luffa bridge may inject with delay).
  const maxAttempts = 8;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (walletAddress) {
      await onWalletConnectSuccess();
      return;
    }
    try {
      walletAddress = await connectLuffaWithTimeout(3500);
      await onWalletConnectSuccess();
      return;
    } catch {
      if (walletAddress) {
        await onWalletConnectSuccess();
        return;
      }
      if (attempt < maxAttempts) {
        await delay(450);
      }
    }
  }

  // Fallback: show QR only when direct connect did not succeed.
  if (walletConnectStatus) walletConnectStatus.style.display = "none";
  generateLuffaQr();
  // Keep background auto-retry for late bridge injection.
  tryLuffaAutoConnect();
}

async function onWalletConnectSuccess() {
  await updateBalance();
  await updateInGameBalance();
  await updateBank();
  await updateStats();
  setWalletStatus(true);
  const displayAddr = walletAddress.length > 12
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : walletAddress;
  if (walletAddressEl) walletAddressEl.textContent = displayAddr;
  if (walletModal) walletModal.style.display = "none";
  // Check if connected wallet is contract owner
  const CONTRACT_ADDR_HEX = "0x8af019770bdc550cb6796ae9449c8223e83c7465ce0eec70a2417d6bc007ea6f";
  const CONTRACT_ADDR_B58 = "AMMcEa1cGhmcFFxBFiJgpuLTCU5gdNTmnvvTF2SbV1Jv";
  const normWallet = normalizeAddress(walletAddress);
  isContractOwner = normWallet === CONTRACT_ADDR_HEX
    || walletAddress === CONTRACT_ADDR_B58
    || walletAddress.toLowerCase() === CONTRACT_ADDR_HEX;
  showMessage(
    currentLocale === "ru" ? "Кошелёк подключён." : "Wallet connected.",
    "success"
  );
  // Авто-accept только если запрошен (ввод ника)
  if (pendingInviteAutoAccept && pendingInvite) {
    pendingInviteAutoAccept = false;
    handleInviteAccept();
    return;
  }
  // Если есть ожидающий инвайт — обновить баннер (кошелёк подключён, можно жать ACCEPT)
  if (pendingInvite) {
    showInviteBanner();
  }
  // After successful wallet connect, bring the page fully to the absolute top.
  if (!isPlaying && !pendingInvite && !multiplayerRoom && !mpWaitingForGuest) {
    window.setTimeout(() => {
      forceScrollToAbsoluteTop();
    }, 120);
  }
  window.setTimeout(() => {
    const inviteActive = Boolean(pendingInvite) || (inviteBanner && inviteBanner.style.display !== "none");
    const resumeActive = Boolean(pendingResume);
    if (!isPlaying && !inviteActive && !resumeActive && !multiplayerRoom && !mpWaitingForGuest) {
      showMessage(I18N[currentLocale].msg_place_bet, "info");
    }
  }, 2000);
  await restoreChainStateIfNeeded();
  updateUI();
}

async function handleClaim() {
  try {
    if (multiplayerSnapshot && multiplayerSnapshot.phase === "done" && multiplayerSnapshot.results && multiplayerSnapshot.payouts) {
      const payout = mpPayoutBucket;
      if (payout > 0) {
        if (isDemoActive()) {
          game.addBalanceEDS(payout);
          await updateBalance();
        }
        mpPayoutBucket = 0;
        localStorage.setItem("mpPayoutBucket", "0");
        if (mpPayoutRoom) {
          localStorage.setItem("mpPayoutRoom", mpPayoutRoom);
        }
      }
      showMessage(I18N[currentLocale].msg_claimed, "success");
      updateUI();
      return;
    }
    // With the new local engine, payouts are auto-applied to in-game balance
    // The claim button is primarily for demo mode and multiplayer payouts
    await game.claimPayout();
    updateBalance();
    updateBank();
    updateStats();
    updateUI();
    showMessage(I18N[currentLocale].msg_claimed, "success");
  } catch (error) {
    showMessage(I18N[currentLocale].msg_no_payout, "error");
    setTxStatus(null);
  }
}

// ==================== LEADERBOARD ====================

async function getLeaderboardEntryForAddress(address: string, name: string): Promise<LeaderboardEntry | null> {
  try {
    const stats = await getPlayerStats(address, networkMode);
    const today = new Date().toISOString().slice(0, 10);
    return {
      name: name || address.slice(0, 8) + '...',
      wins: stats.wins,
      losses: stats.losses,
      profit: (stats.totalWon - stats.totalLost) / 100000000,
      lastPlayed: Date.now(),
      dailyWins: stats.wins, // Для ончейн считаем все игры за сегодня
      dailyLosses: stats.losses,
      dailyProfit: (stats.totalWon - stats.totalLost) / 100000000,
      dailyDate: today,
    };
  } catch (err) {
    console.error("Failed to fetch stats for", address, err);
    return null;
  }
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const today = new Date().toISOString().slice(0, 10);
  
  // Если подключен кошелек — показываем только настоящую статистику из контракта
  if (walletAddress) {
    // Для демо показываем фейковых игроков, для ончейн — только реальные данные
    // В будущем можно загружать топ игроков из контракта
    const myStats = await getLeaderboardEntryForAddress(walletAddress, playerName);
    if (myStats) {
      return [myStats];
    }
    return [];
  }
  
  // Demo mode — используем локальную статистику
  const saved = localStorage.getItem("leaderboard");
  if (saved) {
    const entries = JSON.parse(saved).map((entry: any) => {
      const e: LeaderboardEntry = {
        name: entry.name,
        wins: entry.wins ?? 0,
        losses: entry.losses ?? 0,
        profit: entry.profit ?? 0,
        lastPlayed: entry.lastPlayed ?? 0,
        dailyWins: entry.dailyWins ?? 0,
        dailyLosses: entry.dailyLosses ?? 0,
        dailyProfit: entry.dailyProfit ?? 0,
        dailyDate: entry.dailyDate ?? "",
      };
      // Reset daily stats if date changed
      if (e.dailyDate !== today) {
        e.dailyWins = 0;
        e.dailyLosses = 0;
        e.dailyProfit = 0;
        e.dailyDate = today;
      }
      return e;
    });
    return [...entries, ...DEMO_PLAYERS];
  }
  return [...DEMO_PLAYERS];
}

function updateLeaderboardEntry() {
  if (!playerName) return;

  const today = new Date().toISOString().slice(0, 10);
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const stats = game.getCurrentStats();

  let entry = leaderboard.find((e: LeaderboardEntry) => e.name === playerName);
  if (!entry) {
    entry = {
      name: playerName, wins: 0, losses: 0, profit: 0, lastPlayed: Date.now(),
      dailyWins: 0, dailyLosses: 0, dailyProfit: 0, dailyDate: today,
    };
    leaderboard.push(entry);
  }

  // Reset daily if new day
  if (entry.dailyDate !== today) {
    entry.dailyWins = 0;
    entry.dailyLosses = 0;
    entry.dailyProfit = 0;
    entry.dailyDate = today;
  }

  // Calculate deltas from previous all-time values
  const prevWins = entry.wins || 0;
  const prevLosses = entry.losses || 0;
  const prevProfit = entry.profit || 0;

  // Update all-time
  entry.wins = stats.wins;
  entry.losses = stats.losses;
  entry.profit = (stats.totalWon - stats.totalLost) / 100000000;
  entry.lastPlayed = Date.now();

  // Update daily with deltas
  const deltaWins = entry.wins - prevWins;
  const deltaLosses = entry.losses - prevLosses;
  const deltaProfit = entry.profit - prevProfit;

  entry.dailyWins = (entry.dailyWins || 0) + deltaWins;
  entry.dailyLosses = (entry.dailyLosses || 0) + deltaLosses;
  entry.dailyProfit = Math.round(((entry.dailyProfit || 0) + deltaProfit) * 100) / 100;

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

async function renderLeaderboard() {
  const all = await getLeaderboard();
  const today = new Date().toISOString().slice(0, 10);
  const isDaily = activeLeaderboardTab === "daily";

  // For daily: filter only players who played today and have daily activity
  const filtered = isDaily
    ? all.filter(entry => entry.dailyDate === today && (entry.dailyWins > 0 || entry.dailyLosses > 0))
    : all;

  // Sort by appropriate profit
  const sorted = filtered.sort((a, b) => {
    const profitA = isDaily ? (a.dailyProfit || 0) : a.profit;
    const profitB = isDaily ? (b.dailyProfit || 0) : b.profit;
    return profitB - profitA;
  });
  const top10 = sorted.slice(0, 10);

  if (top10.length === 0) {
    leaderboardList.innerHTML = `
      <div class="lb-row">
        <span class="lb-rank">-</span>
        <span class="lb-name">${currentLocale === "ru" ? "НЕТ ДАННЫХ" : "NO DATA"}</span>
        <span class="lb-wins">-</span>
        <span class="lb-profit">-</span>
      </div>
    `;
    return;
  }

  leaderboardList.innerHTML = top10.map((entry, i) => {
    const isCurrentPlayer = entry.name === playerName;
    const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
    const wins = isDaily ? (entry.dailyWins || 0) : entry.wins;
    const profit = isDaily ? (entry.dailyProfit || 0) : entry.profit;
    const profitClass = profit < 0 ? "negative" : "";

    return `
      <div class="lb-row ${rankClass} ${isCurrentPlayer ? "current-player" : ""}">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${entry.name}</span>
        <span class="lb-wins">${wins}</span>
        <span class="lb-profit ${profitClass}">${profit >= 0 ? "+" : ""}${profit.toFixed(1)}</span>
      </div>
    `;
  }).join("");
}

function switchTab(btn: HTMLButtonElement) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeLeaderboardTab = btn.dataset.tab === "alltime" ? "alltime" : "daily";
  renderLeaderboard();
}

// ==================== FEED ====================
let feedItems: FeedItem[] = [];

function initFeed() {
  if (!isDemoActive()) {
    feedItems = [];
    renderFeed();
    return;
  }
  const saved = localStorage.getItem("liveFeed");
  if (saved) {
    feedItems = JSON.parse(saved);
  }
  renderFeed();
  startFeedTicker();
}

function addFeedItem(text: string) {
  if (!isDemoActive()) return;
  const item: FeedItem = { text, createdAt: Date.now() };
  feedItems.unshift(item);
  feedItems = feedItems.slice(0, 8);
  localStorage.setItem("liveFeed", JSON.stringify(feedItems));
  renderFeed();
}

function renderFeed() {
  if (!feedEl) return;
  if (feedItems.length === 0) {
    feedEl.innerHTML = `
      <div class="feed-item">
        <span class="feed-text">${I18N[currentLocale].feed_empty}</span>
      </div>
    `;
    return;
  }

  feedEl.innerHTML = feedItems.map(item => {
    const time = formatRelativeTime(item.createdAt);
    return `
      <div class="feed-item">
        <span class="feed-text">${item.text}</span>
        <span class="feed-time">${time}</span>
      </div>
    `;
  }).join("");
}

function startFeedTicker() {
  window.setInterval(() => {
    if (!isDemoActive() || DEMO_PLAYERS.length === 0) return;
    const name = DEMO_PLAYERS[Math.floor(Math.random() * DEMO_PLAYERS.length)].name;
    const eventText = currentLocale === "ru"
      ? [
        "выиграл крупно на 21",
          "словил блэкджек",
          "сделал камбэк",
          "серия из 3 побед подряд",
          "рискнул и забрал банк",
          "взял реванш у дилера",
        ][Math.floor(Math.random() * 6)]
      : FEED_EVENTS[Math.floor(Math.random() * FEED_EVENTS.length)];
    addFeedItem(`${name} ${eventText}`);
  }, 12000);
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) return I18N[currentLocale].rel_now;
  if (diff < 2 * 60 * 1000) return I18N[currentLocale].rel_1m;
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} ${I18N[currentLocale].rel_min}`;
  return I18N[currentLocale].rel_old;
}

// ==================== ACTIVE PLAYERS ====================
function getActivePlayersList(): string[] {
  if (multiplayerRoom && multiplayerState?.players?.length) {
    return multiplayerState.players.map(displayName).slice(0, 8);
  }
  if (isDemoActive() && playerName) {
    return [playerName];
  }
  return [];
}

function renderActivePlayers() {
  if (!isDemoActive()) {
    activePlayersEl.innerHTML = `
      <div class="active-player">
        <span class="player-status"></span>
        <span class="player-avatar">—</span>
        <span class="player-info-name">${currentLocale === "ru" ? "НЕТ ДАННЫХ" : "NO DATA"}</span>
      </div>
    `;
    return;
  }
  const allPlayers = getActivePlayersList();
  if (allPlayers.length === 0) {
    activePlayersEl.innerHTML = `
      <div class="active-player">
        <span class="player-status"></span>
        <span class="player-avatar">—</span>
        <span class="player-info-name">${currentLocale === "ru" ? "НЕТ АКТИВНЫХ" : "NO ACTIVE"}</span>
      </div>
    `;
    return;
  }

  const avatars = ["🎮", "🎲", "🃏", "💎", "🔥", "⚡", "🌟", "👾"];
  activePlayersEl.innerHTML = allPlayers.map((name, i) => {
    const isPlayerActive = displayName(name) === displayName(playerName) && isPlaying;
    const label = displayNameSmart(name, allPlayers);
    return `
      <div class="active-player ${isPlayerActive ? "playing" : ""}">
        <span class="player-status"></span>
        <span class="player-avatar">${avatars[i % avatars.length]}</span>
        <span class="player-info-name">${label}</span>
      </div>
    `;
  }).join("");
}

// ==================== UTILS ====================
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== START ====================
document.addEventListener("DOMContentLoaded", init);
