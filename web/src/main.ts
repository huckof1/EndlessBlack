// Endless Pixel Blackjack v2.0 - Multiplayer Edition
// By Huckof1

import { game } from "./game";
import {
  getBankInfo,
  claimPayout as claimPayoutOnChain,
  connectWallet,
  getWalletBalance,
  getPlayerStats,
  getOwner,
  getLatestGameId,
  getGame,
  startGame as startGameOnChain,
  hit as hitOnChain,
  stand as standOnChain,
  type ChainGame,
} from "./chain";
import { formatEDS, parseEDS, MIN_BET, MAX_BET, SUITS, RANKS, DEMO_MODE, RELEASE_MODE, LS_PUBLIC_KEY, LS_WS_URL } from "./config";
import { soundManager, playSound } from "./sounds";
import { MultiplayerClient } from "./multiplayer";

// ==================== DOM ELEMENTS ====================
const nameSection = document.getElementById("name-section") as HTMLDivElement;
const playerNameInput = document.getElementById("player-name") as HTMLInputElement;
const startSessionBtn = document.getElementById("start-session-btn") as HTMLButtonElement;
const walletSection = document.getElementById("wallet-section") as HTMLDivElement;
const playerDisplayName = document.getElementById("player-display-name") as HTMLSpanElement;
const walletAddressEl = document.getElementById("wallet-address") as HTMLSpanElement;
const walletStatusEl = document.getElementById("wallet-status") as HTMLSpanElement;
const walletNetworkEl = document.getElementById("wallet-network") as HTMLSpanElement;
const walletStatusPill = document.getElementById("wallet-status-pill") as HTMLSpanElement;
const walletNetworkPill = document.getElementById("wallet-network-pill") as HTMLSpanElement;
const headerStatus = document.querySelector(".header-status") as HTMLDivElement;
const balanceEl = document.getElementById("balance") as HTMLSpanElement;
const bankrollEl = document.getElementById("bankroll") as HTMLSpanElement;
const treasuryEl = document.getElementById("treasury") as HTMLSpanElement;
const feeEl = document.getElementById("fee") as HTMLSpanElement;

const mascot = document.getElementById("mascot") as HTMLDivElement;
const mascotMouth = document.getElementById("mascot-mouth") as HTMLDivElement;
const mascotMessage = document.getElementById("mascot-message") as HTMLDivElement;

const gameArea = document.getElementById("game-area") as HTMLDivElement;
const betInput = document.getElementById("bet-input") as HTMLInputElement;
const betMinus = document.getElementById("bet-minus") as HTMLButtonElement;
const betPlus = document.getElementById("bet-plus") as HTMLButtonElement;
const betOffer = document.getElementById("bet-offer") as HTMLDivElement;
const betOfferText = document.getElementById("bet-offer-text") as HTMLDivElement;
const betAccept = document.getElementById("bet-accept") as HTMLButtonElement;
const betDecline = document.getElementById("bet-decline") as HTMLButtonElement;
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
const opponentScoreEl = document.getElementById("opponent-score") as HTMLSpanElement;
const opponentHandEl = document.getElementById("opponent-hand") as HTMLDivElement;
const opponentNameEl = document.getElementById("opponent-name") as HTMLSpanElement;
const messageEl = document.getElementById("message") as HTMLDivElement;
const mpDebugEl = document.getElementById("mp-debug") as HTMLDivElement;
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
const musicVolumeEl = document.getElementById("music-volume") as HTMLInputElement;
const sfxVolumeEl = document.getElementById("sfx-volume") as HTMLInputElement;
const continueBtn = document.getElementById("continue-btn") as HTMLButtonElement;
const rematchBtn = document.getElementById("rematch-btn") as HTMLButtonElement;
const themeToggle = document.getElementById("theme-toggle") as HTMLButtonElement;
const themeIcon = document.getElementById("theme-icon") as HTMLSpanElement;
const langToggle = document.getElementById("lang-toggle") as HTMLButtonElement;
const langIcon = document.getElementById("lang-icon") as HTMLSpanElement;
const networkTestnetBtn = document.getElementById("network-testnet") as HTMLButtonElement;
const networkMainnetBtn = document.getElementById("network-mainnet") as HTMLButtonElement;
const connectWalletHeader = document.getElementById("connect-wallet-header") as HTMLButtonElement;
const demoBadge = document.getElementById("demo-badge") as HTMLSpanElement;

const leaderboardList = document.getElementById("leaderboard-list") as HTMLDivElement;
const feedEl = document.getElementById("feed") as HTMLDivElement;
const feedSection = document.getElementById("feed-section") as HTMLDivElement;
const activePlayersEl = document.getElementById("active-players") as HTMLDivElement;
const resetDemoBtn = document.getElementById("reset-demo-btn") as HTMLButtonElement;
const inviteBtn = document.getElementById("invite-btn") as HTMLButtonElement;
const inviteBtnHeader = document.getElementById("invite-btn-header") as HTMLButtonElement;
const inviteNoteHeader = document.getElementById("invite-note-header") as HTMLSpanElement;
const inviteNote = document.getElementById("invite-note") as HTMLDivElement;
const inviteBanner = document.getElementById("invite-banner") as HTMLDivElement;
const inviteText = document.getElementById("invite-text") as HTMLDivElement;
const inviteAccept = document.getElementById("invite-accept") as HTMLButtonElement;
const inviteDecline = document.getElementById("invite-decline") as HTMLButtonElement;
const connectWalletBtn = document.getElementById("connect-wallet-btn") as HTMLButtonElement;
const walletModal = document.getElementById("wallet-modal") as HTMLDivElement;
const walletModalClose = document.getElementById("wallet-modal-close") as HTMLButtonElement;
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
let chainGameId: number | null = null;
let chainGame: ChainGame | null = null;
let gameMusicActive = false;
let hasGameResult = false;
let invitedByLink = false;
let rematchModalActive = false;
let rematchRetryTimer: number | null = null;
let mpPayoutBucket = parseFloat(localStorage.getItem("mpPayoutBucket") || "0") || 0;
let mpPayoutRoom: string | null = localStorage.getItem("mpPayoutRoom");
let pendingInvite: { name: string; mode: "demo" | "testnet" | "mainnet"; bet: number } | null = null;
let pendingResume: { mode: "demo" | "chain"; game: any; gameId?: number } | null = null;
let currentTurn: "you" | "dealer" | null = null;
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
let multiplayerSnapshot: MultiplayerSnapshot | null = null;
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
    soundManager.startGameMusic();
  }
}
function startIdleMusic() {
  gameMusicActive = false;
  if (!soundManager.getMuted()) {
    soundManager.startIdleMusic();
  }
}
function sendRematchProposal(value: number) {
  multiplayer.proposeBet(value);
  if (rematchRetryTimer) {
    window.clearTimeout(rematchRetryTimer);
    rematchRetryTimer = null;
  }
  let attempts = 0;
  const retry = () => {
    attempts += 1;
    if (attempts > 3) return;
    multiplayer.proposeBet(value);
    rematchRetryTimer = window.setTimeout(retry, 900);
  };
  rematchRetryTimer = window.setTimeout(retry, 900);
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
  if (!isRoomHost) return;
  if (!multiplayerSnapshot) {
    multiplayerSnapshot = {
      players: multiplayerState?.players || [playerName],
      dealerCards: [],
      hands: [],
      deck: [],
      turnIndex: null,
      pendingTurn: null,
      phase: "lobby",
      bet: parseFloat(betInput.value) || 1,
      pendingBet: null,
      pendingBy: null,
      agreed: false,
    };
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
      multiplayerSnapshot.phase = "lobby";
      multiplayerSnapshot.hands = [];
      multiplayerSnapshot.dealerCards = [];
      multiplayerSnapshot.turnIndex = null;
      multiplayerSnapshot.results = undefined;
      multiplayerSnapshot.payouts = undefined;
      multiplayerSnapshot.claimed = undefined;
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
    if (rematchRetryTimer) {
      window.clearTimeout(rematchRetryTimer);
      rematchRetryTimer = null;
    }
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
    if (multiplayerSnapshot.phase === "lobby" && multiplayerSnapshot.players.length >= 2) {
      handleStartGame();
    }
  }
  if (event.type === "game:bet_decline") {
    multiplayerSnapshot.pendingBet = null;
    multiplayerSnapshot.pendingBy = null;
    multiplayerSnapshot.agreed = false;
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
  }
  if (event.type === "game:hit") {
    applyMultiplayerHit();
  }
  if (event.type === "game:stand") {
    applyMultiplayerStand();
  }
});
let multiplayerHost: string | null = null;
let isRoomHost = false;
let pendingInviteAutoAccept = false;

function isDemoActive(): boolean {
  return DEMO_MODE && networkMode !== "mainnet";
}

// ==================== LEADERBOARD DATA ====================
interface LeaderboardEntry {
  name: string;
  wins: number;
  losses: number;
  profit: number;
  lastPlayed: number;
}

interface FeedItem {
  text: string;
  createdAt: number;
}

// Fake players for demo
const FAKE_PLAYERS: LeaderboardEntry[] = [
  { name: "CryptoKing", wins: 45, losses: 32, profit: 125.5, lastPlayed: Date.now() - 60000 },
  { name: "LuckyAce", wins: 38, losses: 28, profit: 89.2, lastPlayed: Date.now() - 120000 },
  { name: "PixelPro", wins: 29, losses: 35, profit: -12.8, lastPlayed: Date.now() - 180000 },
  { name: "Web3Wizard", wins: 52, losses: 41, profit: 156.3, lastPlayed: Date.now() - 30000 },
  { name: "CardShark", wins: 33, losses: 30, profit: 45.0, lastPlayed: Date.now() - 90000 },
];
const DEMO_PLAYERS = DEMO_MODE ? FAKE_PLAYERS : [];

const FEED_EVENTS = [
  "won big on 21",
  "hit blackjack",
  "made a comeback",
  "3 wins in a row",
  "took a risky win",
  "got revenge on the dealer",
];

const I18N = {
  en: {
    subtitle: "WEB3 MULTIPLAYER",
    demo_mode: "DEMO",
    enter_name: "ENTER YOUR NAME:",
    player_placeholder: "Player",
    start: "START",
    player: "PLAYER:",
    balance: "BALANCE:",
    reset_demo: "RESET DEMO",
    mascot_idle: "Let's play?",
    bet: "BET",
    bet_hint: "MIN 0.1 EDS · MAX 10000 EDS",
    deal: "DEAL",
    dealer: "DEALER",
    you: "YOU",
    msg_place_bet: "PLACE YOUR BET AND DEAL!",
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
    msg_good_luck: "Good luck!",
    msg_perfect_21: "Perfect 21!",
    msg_standing_21: "21! STANDING...",
    msg_error: "ERROR!",
    msg_draw: "DRAW - BET RETURNED",
    msg_win: "YOU WIN!",
    msg_lose: "YOU LOSE",
    msg_winner: "Winner: {name}",
    msg_dealer_wins: "DEALER WINS",
    msg_dealer_draw: "DRAW WITH DEALER",
    msg_rematch: "DRAW. REMATCH!",
    msg_turn_wait: "PROCESSING...",
    msg_blackjack: "BLACKJACK!",
    msg_play_again: "Play again?",
    continue: "CONTINUE",
    rematch: "REMATCH",
    msg_resume: "GAME RESUMED",
    msg_resume_ready: "PRESS DEAL TO RESUME",
    turn_you: "YOUR TURN",
    turn_dealer: "DEALER TURN",
    turn_of: "TURN:",
    bet_offer: "Bet offer",
    msg_demo_reset: "DEMO DATA RESET",
    msg_demo_reset_mascot: "Demo reset",
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
    wallet_modal_title: "WALLET REQUIRED",
    wallet_modal_text: "Install Luffa to connect your Endless wallet.",
    wallet_modal_install: "DOWNLOAD WALLET",
    wallet_modal_close: "CLOSE",
    invite_modal_title: "INVITE BET",
    invite_modal_text: "Enter the bet to propose.",
    invite_modal_send: "SEND INVITE",
    rematch_modal_title: "REMATCH BET",
    rematch_modal_text: "Enter the bet for rematch.",
    rematch_modal_send: "SEND OFFER",
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
    msg_release_lock: "Release mode: demo and wallet features are disabled.",
    claim: "CLAIM WINNINGS",
    msg_claimed: "PAYOUT CLAIMED",
    msg_no_payout: "NO PAYOUT AVAILABLE",
    bankroll: "BANKROLL:",
    treasury: "TREASURY:",
    fee: "FEE:",
    payout_due: "Payout due:",
    title_network: "Network",
    title_testnet: "Testnet",
    title_mainnet: "Mainnet",
    testnet: "TEST",
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
    invite_mode_demo: "DEMO",
    invite_mode_testnet: "TESTNET",
    invite_mode_mainnet: "MAINNET",
    invite_bet: "Bet",
    wallet_connected: "CONNECTED",
    wallet_off: "OFF",
  },
  ru: {
    subtitle: "WEB3 МУЛЬТИПЛЕЕР",
    demo_mode: "ДЕМО",
    enter_name: "ВВЕДИТЕ ИМЯ:",
    player_placeholder: "Игрок",
    start: "СТАРТ",
    player: "ИГРОК:",
    balance: "БАЛАНС:",
    reset_demo: "СБРОС ДЕМО",
    mascot_idle: "Играем?",
    bet: "СТАВКА",
    bet_hint: "МИН 0.1 EDS · МАКС 10000 EDS",
    deal: "РАЗДАТЬ",
    dealer: "ДИЛЕР",
    you: "ИГРОК",
    msg_place_bet: "СДЕЛАЙ СТАВКУ И РАЗДАЙ!",
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
    msg_good_luck: "Удачи!",
    msg_perfect_21: "Идеальные 21!",
    msg_standing_21: "21! СТОП...",
    msg_error: "ОШИБКА!",
    msg_draw: "НИЧЬЯ — СТАВКА ВОЗВРАЩЕНА",
    msg_win: "ПОБЕДА!",
    msg_lose: "ПРОИГРЫШ",
    msg_winner: "Победитель: {name}",
    msg_dealer_wins: "ВЫИГРАЛ ДИЛЕР",
    msg_dealer_draw: "НИЧЬЯ С ДИЛЕРОМ",
    msg_rematch: "НИЧЬЯ. ПЕРЕИГРЫВАЕМ!",
    msg_turn_wait: "ОБРАБОТКА...",
    msg_blackjack: "БЛЭКДЖЕК!",
    msg_play_again: "Сыграем ещё?",
    continue: "ПРОДОЛЖИТЬ",
    rematch: "РЕВАНШ",
    msg_resume: "ИГРА ВОЗОБНОВЛЕНА",
    msg_resume_ready: "НАЖМИ РАЗДАТЬ ДЛЯ ПРОДОЛЖЕНИЯ",
    turn_you: "ВАШ ХОД",
    turn_dealer: "ХОД ДИЛЕРА",
    turn_of: "ХОД:",
    bet_offer: "Предложение ставки",
    msg_demo_reset: "ДЕМО ДАННЫЕ СБРОШЕНЫ",
    msg_demo_reset_mascot: "Демо сброшено",
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
    wallet_modal_title: "НУЖЕН КОШЕЛЁК",
    wallet_modal_text: "Установите Luffa для подключения кошелька Endless.",
    wallet_modal_install: "СКАЧАТЬ КОШЕЛЁК",
    wallet_modal_close: "ЗАКРЫТЬ",
    invite_modal_title: "СТАВКА ДЛЯ ПРИГЛАШЕНИЯ",
    invite_modal_text: "Введите ставку для игры.",
    invite_modal_send: "ОТПРАВИТЬ",
    rematch_modal_title: "СТАВКА ДЛЯ РЕВАНША",
    rematch_modal_text: "Введите ставку для реванша.",
    rematch_modal_send: "ОТПРАВИТЬ",
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
    msg_release_lock: "Режим релиза: демо и кошельки отключены.",
    claim: "ЗАБРАТЬ ВЫИГРЫШ",
    msg_claimed: "ВЫИГРЫШ ПОЛУЧЕН",
    msg_no_payout: "НЕТ ВЫПЛАТЫ",
    bankroll: "БАНК:",
    treasury: "КОМИССИЯ:",
    fee: "КОМИССИЯ:",
    payout_due: "К выплате:",
    title_network: "Сеть",
    title_testnet: "Тестнет",
    title_mainnet: "Мейннет",
    testnet: "TEST",
    mainnet: "MAINNET",
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
    invite_mode_demo: "ДЕМО",
    invite_mode_testnet: "ТЕСТНЕТ",
    invite_mode_mainnet: "МЕЙННЕТ",
    invite_bet: "Ставка",
    wallet_connected: "ПОДКЛЮЧЁН",
    wallet_off: "ВЫКЛ",
  },
};

// ==================== INIT ====================
function init() {
  // Name input
  startSessionBtn.addEventListener("click", startSession);
  playerNameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") startSession();
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
  betAccept.addEventListener("click", () => multiplayer.acceptBet());
  betDecline.addEventListener("click", () => multiplayer.declineBet());

  // Sound
  soundToggle.addEventListener("click", toggleSound);
  musicVolumeEl.addEventListener("input", () => {
    const sfx = Number(sfxVolumeEl.value) / 100;
    const music = Number(musicVolumeEl.value) / 100;
    soundManager.setVolume(sfx, music);
  });
  sfxVolumeEl.addEventListener("input", () => {
    const sfx = Number(sfxVolumeEl.value) / 100;
    const music = Number(musicVolumeEl.value) / 100;
    soundManager.setVolume(sfx, music);
  });
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      const startSection = document.getElementById("name-section");
      const walletSection = document.getElementById("wallet-section");
      const gameArea = document.getElementById("game-area");
      if (startSection) {
        startSection.style.display = "block";
      }
      if (walletSection) {
        walletSection.style.display = "none";
      }
      if (gameArea) {
        gameArea.style.display = "none";
      }
      startIdleMusic();
      mpPayoutBucket = 0;
      mpPayoutRoom = null;
      localStorage.setItem("mpPayoutBucket", "0");
      localStorage.removeItem("mpPayoutRoom");
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    });
  }
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      handleStartGame();
    });
  }
  if (rematchBtn) {
    rematchBtn.addEventListener("click", () => {
      if (inviteModal) {
        rematchModalActive = true;
        if (inviteModalTitle) inviteModalTitle.textContent = I18N[currentLocale].rematch_modal_title;
        if (inviteModalText) inviteModalText.textContent = I18N[currentLocale].rematch_modal_text;
        if (inviteBetConfirm) inviteBetConfirm.textContent = I18N[currentLocale].rematch_modal_send;
        inviteBetInput.value = betInput.value || "1";
        inviteModal.style.display = "flex";
      }
    });
  }
  themeToggle.addEventListener("click", toggleTheme);
  langToggle.addEventListener("click", toggleLanguage);
  networkTestnetBtn.addEventListener("click", () => setNetwork("testnet"));
  networkMainnetBtn.addEventListener("click", () => setNetwork("mainnet"));

  // Reset demo
  resetDemoBtn.addEventListener("click", handleResetDemo);
  inviteBtn.addEventListener("click", () => {
    if (inviteModal) {
      rematchModalActive = false;
      if (inviteModalTitle) inviteModalTitle.textContent = I18N[currentLocale].invite_modal_title;
      if (inviteModalText) inviteModalText.textContent = I18N[currentLocale].invite_modal_text;
      if (inviteBetConfirm) inviteBetConfirm.textContent = I18N[currentLocale].invite_modal_send;
      inviteBetInput.value = betInput.value || "1";
      inviteModal.style.display = "flex";
    }
  });
  inviteBtnHeader.addEventListener("click", () => {
    if (inviteModal) {
      rematchModalActive = false;
      if (inviteModalTitle) inviteModalTitle.textContent = I18N[currentLocale].invite_modal_title;
      if (inviteModalText) inviteModalText.textContent = I18N[currentLocale].invite_modal_text;
      if (inviteBetConfirm) inviteBetConfirm.textContent = I18N[currentLocale].invite_modal_send;
      inviteBetInput.value = betInput.value || "1";
      inviteModal.style.display = "flex";
    }
  });
  inviteAccept.addEventListener("click", handleInviteAccept);
  inviteDecline.addEventListener("click", handleInviteDecline);
  connectWalletBtn.addEventListener("click", handleConnectWallet);
  walletModalClose.addEventListener("click", () => {
    if (walletModal) walletModal.style.display = "none";
  });
  nicknameSave.addEventListener("click", saveNickname);
  nicknameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") saveNickname();
  });
  inviteBetCancel.addEventListener("click", () => {
    if (inviteModal) inviteModal.style.display = "none";
    rematchModalActive = false;
  });
  inviteBetConfirm.addEventListener("click", () => {
    if (inviteModal) inviteModal.style.display = "none";
    betInput.value = inviteBetInput.value || betInput.value || "1";
    if (rematchModalActive) {
      rematchModalActive = false;
      const value = parseFloat(betInput.value) || 1;
      sendRematchProposal(value);
      if (!isRoomHost && multiplayerSnapshot) {
        const snap = { ...multiplayerSnapshot };
        snap.phase = "lobby";
        snap.hands = [];
        snap.dealerCards = [];
        snap.turnIndex = null;
        snap.pendingBet = value;
        snap.pendingBy = getMpName();
        snap.agreed = false;
        snap.results = undefined;
        snap.payouts = undefined;
        snap.claimed = undefined;
        multiplayerSnapshot = snap;
        multiplayer.sendSnapshot({ type: "game:snapshot", ...snap });
        renderMultiplayerSnapshot(snap);
      }
      updateMpDebug("rematch");
    } else {
      handleInvite();
    }
  });
  changeLoginHeader.addEventListener("click", () => {
    if (nicknameModal) nicknameModal.style.display = "flex";
    if (nicknameInput) {
      nicknameInput.value = playerName || "";
      nicknameInput.focus();
    }
  });
  connectWalletHeader.addEventListener("click", () => {
    if (!isSessionStarted) {
      startSession();
      return;
    }
    handleConnectWallet();
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

  // Load saved name
  const savedName = localStorage.getItem("playerName");
  if (savedName) {
    playerName = savedName.slice(0, 12);
    playerNameInput.value = savedName;
    if (nicknameInput) nicknameInput.value = savedName;
  } else if (nicknameModal) {
    nicknameModal.style.display = "flex";
  }

  // Load locale/theme
  const savedLocale = localStorage.getItem("locale");
  currentLocale = savedLocale === "ru" ? "ru" : "en";
  const savedTheme = localStorage.getItem("theme");
  currentTheme = savedTheme === "light" ? "light" : "dark";
  const savedNetwork = localStorage.getItem("networkMode");
  networkMode = savedNetwork === "mainnet" ? "mainnet" : "testnet";
  applyTheme();
  applyI18n();
  applyNetworkMode();
  const volumes = soundManager.getVolume();
  musicVolumeEl.value = Math.round(volumes.music * 100).toString();
  sfxVolumeEl.value = Math.round(volumes.sfx * 100).toString();

  const params = new URLSearchParams(window.location.search);
  const inviteFrom = params.get("invite");
  const inviteMode = (params.get("mode") || "").toLowerCase();
  const inviteBet = parseFloat(params.get("bet") || "0");
  const inviteRoom = params.get("room");
  const inviteHost = params.get("host_id");
  if (inviteFrom) {
    invitedByLink = true;
    const mode: "demo" | "testnet" | "mainnet" =
      inviteMode === "mainnet" ? "mainnet" : inviteMode === "testnet" ? "testnet" : "demo";
    const inviteKey = `invite_seen_${inviteRoom || "no-room"}_${inviteFrom}`;
    if (!sessionStorage.getItem(inviteKey)) {
    pendingInvite = {
      name: inviteFrom || I18N[currentLocale].player_placeholder,
      mode,
      bet: inviteBet > 0 ? inviteBet : 1,
    };
      if (inviteRoom) multiplayerRoom = inviteRoom;
      if (inviteHost) multiplayerHost = inviteHost;
      showInviteBanner();
      if (gameArea) gameArea.style.display = "block";
      sessionStorage.setItem(inviteKey, "1");
    }
    // очистить параметры приглашения из URL
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("invite");
    cleanUrl.searchParams.delete("mode");
    cleanUrl.searchParams.delete("bet");
    cleanUrl.searchParams.delete("room");
    cleanUrl.searchParams.delete("host_id");
    history.replaceState({}, "", cleanUrl.toString());
  }

  updateSoundIcon();
  if (!DEMO_MODE) {
    if (demoBadge) demoBadge.style.display = "none";
    if (resetDemoBtn) resetDemoBtn.style.display = "none";
    if (feedSection) feedSection.style.display = "none";
  }
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
      soundManager.stopMusic();
    } else if (!soundManager.getMuted()) {
      if (gameMusicActive) {
        soundManager.startGameMusic();
      } else {
        soundManager.startIdleMusic();
      }
    }
  });

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

async function initAudio() {
  if (firstInteraction) return;
  firstInteraction = true;
  await soundManager.init();
  startIdleMusic();
}

// ==================== SESSION ====================
async function startSession() {
  if (RELEASE_MODE) {
    showMessage(I18N[currentLocale].msg_release_lock, "info");
    return;
  }
  const name = playerNameInput.value.trim() || I18N[currentLocale].player_placeholder;
  playerName = name.slice(0, 12);
  localStorage.setItem("playerName", playerName);

  nameSection.style.display = "none";
  walletSection.style.display = "block";
  gameArea.style.display = "block";
  isSessionStarted = true;

  playerDisplayName.textContent = playerName;
  if (playerHandNameEl) {
    playerHandNameEl.textContent = playerName || I18N[currentLocale].you;
  }

  // Connect wallet
  if (isDemoActive()) {
    await game.connectWallet();
    await updateBalance();
    await updateBank();
    await updateStats();
    setWalletStatus(true);
    if (walletAddressEl) walletAddressEl.textContent = "DEMO";
  } else {
    try {
      walletAddress = await connectWallet();
    } catch (error) {
      showMessage(I18N[currentLocale].msg_wallet_missing, "error");
      if (walletModal) walletModal.style.display = "flex";
      return;
    }
    try {
      await updateBalance();
      await updateBank();
      await updateStats();
      setWalletStatus(true);
      if (walletAddressEl) walletAddressEl.textContent = walletAddress;
    } catch {
      showMessage(I18N[currentLocale].msg_wallet_failed, "error");
      return;
    }
  }

  setMascotState("happy", "👍", `${currentLocale === "ru" ? "Привет" : "Welcome"}, ${playerName}!`);

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
  if (multiplayerRoom && LS_PUBLIC_KEY) {
    const host = multiplayerHost || getMpName();
    if (!mpNameFrozen) mpNameFrozen = getMpName();
    multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), host || "");
  }
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
function toggleSound() {
  const volumes = soundManager.getVolume();
  const prevSfxKey = "soundVolumePrevSfx";
  const prevMusicKey = "soundVolumePrevMusic";
  const muted = soundManager.toggleMute();
  updateSoundIcon();
  if (!muted) {
    const prevSfx = Number(localStorage.getItem(prevSfxKey));
    const prevMusic = Number(localStorage.getItem(prevMusicKey));
    const sfx = Number.isFinite(prevSfx) && prevSfx > 0 ? prevSfx : 0.5;
    const music = Number.isFinite(prevMusic) && prevMusic > 0 ? prevMusic : 0.3;
    soundManager.setVolume(sfx, music);
    musicVolumeEl.value = Math.round(music * 100).toString();
    sfxVolumeEl.value = Math.round(sfx * 100).toString();
    if (gameMusicActive) {
      soundManager.startGameMusic();
    } else {
      soundManager.startIdleMusic();
    }
  } else {
    localStorage.setItem(prevSfxKey, String(volumes.sfx));
    localStorage.setItem(prevMusicKey, String(volumes.music));
    soundManager.setVolume(0, 0);
    musicVolumeEl.value = "0";
    sfxVolumeEl.value = "0";
  }
}

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
  langIcon.textContent = currentLocale.toUpperCase();
  setWalletStatus(Boolean(walletAddress));
  showInviteBanner();
  updateUI();
}

function setTurn(turn: "you" | "dealer" | null) {
  currentTurn = turn;
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

function mpIsBlackjack(cards: { suit: number; rank: number }[]): boolean {
  return cards.length === 2 && mpScore(cards) === 21;
}

function mpFinalizeResults(snapshot: MultiplayerSnapshot) {
  const computed = mpComputeResults(snapshot);
  snapshot.results = computed.results;
  snapshot.payouts = computed.payouts;
  snapshot.claimed = computed.claimed;
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

function mpIsRematch(snapshot: MultiplayerSnapshot) {
  if (snapshot.hands.length < 2) return false;
  const scores = snapshot.hands.map(h => mpScore(h.cards));
  const busts = scores.map(s => s > 21);
  if (busts[0] && busts[1]) return true;
  if (!busts[0] && !busts[1] && scores[0] === scores[1]) return true;
  return false;
}

function mpStartRematch(snapshot: MultiplayerSnapshot) {
  const deck = snapshot.deck.length ? snapshot.deck : mpCreateDeck();
  snapshot.hands = snapshot.players.map(() => ({ cards: [mpDraw(deck), mpDraw(deck)], done: false }));
  snapshot.deck = deck;
  snapshot.turnIndex = Math.random() < 0.5 ? 0 : 1;
  snapshot.phase = "player";
  snapshot.results = undefined;
  snapshot.payouts = undefined;
  snapshot.claimed = undefined;
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
    if (isRoomHost && mpIsRematch(multiplayerSnapshot)) {
      mpStartRematch(multiplayerSnapshot);
      multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
      renderMultiplayerSnapshot(multiplayerSnapshot);
      showMessage(I18N[currentLocale].msg_rematch, "info");
      return;
    }
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
    if (isRoomHost && mpIsRematch(multiplayerSnapshot)) {
      mpStartRematch(multiplayerSnapshot);
      multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
      renderMultiplayerSnapshot(multiplayerSnapshot);
      showMessage(I18N[currentLocale].msg_rematch, "info");
      return;
    }
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

  const meIndex = players.findIndex(p => p === getMpName());
  if (snapshot.phase === "player") {
    if (winnerBannerEl) winnerBannerEl.style.display = "none";
    const isMyTurn =
      snapshot.turnIndex === meIndex &&
      !snapshot.pendingTurn &&
      !snapshot.hands?.[meIndex]?.done;
    if (snapshot.pendingTurn && Date.now() < snapshot.pendingTurn.until) {
      showMessage(I18N[currentLocale].msg_turn_wait, "info");
    } else {
      showMessage(isMyTurn ? I18N[currentLocale].msg_your_turn : I18N[currentLocale].msg_turn_wait, "info");
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
    showMessage(currentLocale === "ru" ? "ПРЕДЛОЖИ СТАВКУ ДЛЯ РЕВАНША" : "PROPOSE A BET FOR REMATCH", "info");
    if (gameMusicActive) {
      startIdleMusic();
    }
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
    } else if (result === 0) {
      showMessage(I18N[currentLocale].msg_rematch, "info");
      setMascotState("thinking", "🤷", I18N[currentLocale].msg_rematch);
      if (winnerBannerEl) winnerBannerEl.style.display = "none";
    } else {
      showMessage(I18N[currentLocale].msg_lose, "error");
      setMascotState("sad", "😞", I18N[currentLocale].msg_lose);
      if (winnerBannerEl) winnerBannerEl.style.display = "none";
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
  localStorage.setItem("playerName", playerName);
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
  if (networkMode === "mainnet" && walletAddress === "DEMO") {
    walletAddress = "";
  }
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
  if (networkMode === "mainnet" && !walletAddress) {
    // auto-connect on mainnet
    startSession();
  }
}

function applyNetworkMode() {
  if (walletNetworkEl) {
    walletNetworkEl.textContent = networkMode.toUpperCase();
  }
  if (walletNetworkPill) {
    walletNetworkPill.textContent = networkMode.toUpperCase();
  }
  networkTestnetBtn.classList.toggle("active", networkMode === "testnet");
  networkMainnetBtn.classList.toggle("active", networkMode === "mainnet");
}

// ==================== BET ====================
function adjustBet(delta: number) {
  playSound("click");
  const current = parseFloat(betInput.value) || 1;
  let newValue = Math.max(0.1, Math.min(10000, current + delta));
  newValue = Math.round(newValue * 10) / 10;
  betInput.value = newValue.toString();
  const phase = multiplayerSnapshot?.phase || "lobby";
  if (multiplayerRoom && (phase === "lobby" || phase === "done")) {
    multiplayer.proposeBet(newValue);
  }
}

function validateBet() {
  let value = parseFloat(betInput.value) || 1;
  value = Math.max(0.1, Math.min(10000, value));
  value = Math.round(value * 10) / 10;
  betInput.value = value.toString();
  const phase = multiplayerSnapshot?.phase || "lobby";
  if (multiplayerRoom && (phase === "lobby" || phase === "done")) {
    multiplayer.proposeBet(value);
  }
}

// ==================== GAME ====================
async function handleStartGame() {
  if (!isSessionStarted) {
    await startSession();
  }
  hasGameResult = false;
  startGameMusic();
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
    const deck = mpCreateDeck();
    const hands = players.map(() => ({ cards: [mpDraw(deck), mpDraw(deck)], done: false }));
    const betValue = parseFloat(betInput.value) || 1;
    multiplayerSnapshot = {
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
    multiplayerSnapshot.hands.forEach((hand, i) => {
      if (mpScore(hand.cards) === 21) {
        hand.done = true;
      }
      if (i === 0 && hand.done) {
        multiplayerSnapshot.turnIndex = mpNextTurn(multiplayerSnapshot, i);
      }
    });
    if (multiplayerSnapshot.hands.every(h => h.done)) {
      multiplayerSnapshot.phase = "done";
      multiplayerSnapshot.turnIndex = null;
      mpFinalizeResults(multiplayerSnapshot);
    }
    multiplayer.sendSnapshot({ type: "game:snapshot", ...multiplayerSnapshot });
    renderMultiplayerSnapshot(multiplayerSnapshot);
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

  const betValue = betInput.value;
  const betAmount = parseEDS(betValue);

  if (betAmount < MIN_BET || betAmount > MAX_BET) {
    playSound("lose");
    showMessage(I18N[currentLocale].msg_invalid_bet, "error");
    setMascotState("sad", "😕", I18N[currentLocale].msg_check_bet);
    return;
  }

  try {
    playSound("chip");
    startBtn.disabled = true;
    setMascotState("thinking", "🤔", I18N[currentLocale].msg_dealing);
    showMessage(I18N[currentLocale].msg_dealing, "info");
    startBtn.classList.add("btn-pulse");

    if (isDemoActive()) {
      const gameState = await game.startGame(betAmount);
      isPlaying = true;
      await renderGame(gameState);
      updateUI();
      setTurn("you");
      startBtn.classList.remove("btn-pulse");

      if (gameState.playerScore === 21) {
        await showBlackjackEffect(betAmount);
      } else {
        setMascotState("wink", "😏", currentLocale === "ru" ? "Ещё или стоп?" : "Hit or stand?");
        showMessage(I18N[currentLocale].msg_your_turn, "info");
      }
    } else {
      setTxStatus(I18N[currentLocale].tx_wait_wallet);
      await startGameOnChain(betAmount, networkMode);
      setTxStatus(I18N[currentLocale].tx_submitted);
      chainGameId = await getLatestGameId(walletAddress, networkMode);
      chainGame = await getGame(chainGameId, networkMode);
      isPlaying = true;
      await renderGame(chainGame);
      updateUI();
      setTurn("you");
      startBtn.classList.remove("btn-pulse");

      if (chainGame.playerScore === 21) {
        await showBlackjackEffect(betAmount);
      } else {
        setMascotState("wink", "😏", currentLocale === "ru" ? "Ещё или стоп?" : "Hit or stand?");
        showMessage(I18N[currentLocale].msg_your_turn, "info");
      }
    }
  } catch (error) {
    playSound("lose");
    showMessage(I18N[currentLocale].msg_failed_start, "error");
    setMascotState("sad", "😢", I18N[currentLocale].msg_try_again);
    startBtn.disabled = false;
    startBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

async function handleHit() {
  if (!isPlaying) return;
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

    if (isDemoActive()) {
      const gameState = await game.hit();
      await renderGame(gameState);
      hitBtn.classList.remove("btn-pulse");

      if (gameState.playerScore > 21) {
        setTurn(null);
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
    } else {
      setTxStatus(I18N[currentLocale].tx_wait_wallet);
      await hitOnChain(chainGameId || 0, networkMode);
      setTxStatus(I18N[currentLocale].tx_submitted);
      chainGame = await getGame(chainGameId || 0, networkMode);
      await renderGame(chainGame);
      hitBtn.classList.remove("btn-pulse");

      if (chainGame.playerScore > 21) {
        setTurn(null);
        await showLoseEffect(chainGame.betAmount);
      } else if (chainGame.playerScore === 21) {
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
        setMascotState("wink", "🎯", `${chainGame.playerScore} ${currentLocale === "ru" ? "очков" : "points"}!`);
      }
    }
  } catch (error) {
    playSound("lose");
    showMessage(I18N[currentLocale].msg_error, "error");
    hitBtn.disabled = false;
    standBtn.disabled = false;
    hitBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

async function handleStand() {
  if (!isPlaying) return;
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

    if (isDemoActive()) {
      const gameState = await game.stand();
      await renderGame(gameState, true);
      standBtn.classList.remove("btn-pulse");

      const result = gameState.result;
      const bet = gameState.betAmount;

      if (result === 1) {
        setTurn(null);
        await showWinEffect(bet);
      } else if (result === 2) {
        setTurn(null);
        await showLoseEffect(bet);
      } else if (result === 3) {
        setTurn(null);
        playSound("chip");
        setMascotState("thinking", "🤷", currentLocale === "ru" ? "Ничья!" : "It's a tie!");
        showMessage(I18N[currentLocale].msg_rematch, "info");
        addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_draw}`);
        await delay(900);
        updateUI();
        endGame();
        handleStartGame();
      } else if (result === 4) {
        await showBlackjackEffect(bet);
      }
    } else {
      setTxStatus(I18N[currentLocale].tx_wait_wallet);
      await standOnChain(chainGameId || 0, networkMode);
      setTxStatus(I18N[currentLocale].tx_submitted);
      chainGame = await getGame(chainGameId || 0, networkMode);
      await renderGame(chainGame, true);
      standBtn.classList.remove("btn-pulse");

      const result = chainGame.result;
      const bet = chainGame.betAmount;

      if (result === 1) {
        setTurn(null);
        await showWinEffect(bet);
      } else if (result === 2) {
        setTurn(null);
        await showLoseEffect(bet);
      } else if (result === 3) {
        setTurn(null);
        playSound("chip");
        setMascotState("thinking", "🤷", currentLocale === "ru" ? "Ничья!" : "It's a tie!");
        showMessage(I18N[currentLocale].msg_rematch, "info");
        addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_draw}`);
        await delay(900);
        updateUI();
        endGame();
        handleStartGame();
      } else if (result === 4) {
        await showBlackjackEffect(bet);
      }
    }
  } catch (error) {
    playSound("lose");
    showMessage(I18N[currentLocale].msg_error, "error");
    standBtn.classList.remove("btn-pulse");
    setTxStatus(null);
  }
}

// ==================== EFFECTS ====================
async function showWinEffect(bet: number) {
  playSound("win");
  const payout = bet * 2;
  winAmount.textContent = `+${formatEDS(payout - bet)}`;
  winEffect.style.display = "flex";
  setMascotState("excited", "🎉", I18N[currentLocale].msg_win);
  createConfetti();
  addFeedItem(`${playerName || I18N[currentLocale].player_placeholder} ${I18N[currentLocale].feed_win} ${formatEDS(payout - bet)}`);

  await delay(2200);
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

  await delay(1800);
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

  setTxStatus(null);
}

// ==================== RENDER ====================
async function renderGame(gameState: any, showDealerCards = false) {
  playerCardsEl.innerHTML = "";
  dealerCardsEl.innerHTML = "";

  for (let i = 0; i < gameState.playerCards.length; i++) {
    await delay(120);
    playSound("deal");
    playerCardsEl.appendChild(renderCard(gameState.playerCards[i]));
  }

  if (showDealerCards || gameState.isFinished) {
    for (let i = 0; i < gameState.dealerCards.length; i++) {
      await delay(140);
      playSound("deal");
      dealerCardsEl.appendChild(renderCard(gameState.dealerCards[i]));
    }
    dealerScoreEl.textContent = gameState.dealerScore.toString();
  } else {
    await delay(120);
    playSound("deal");
    dealerCardsEl.appendChild(renderCard(gameState.dealerCards[0]));
    await delay(120);
    playSound("deal");
    dealerCardsEl.appendChild(renderCardBack());
    dealerScoreEl.textContent = "?";
  }

  playerScoreEl.textContent = gameState.playerScore.toString();
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

function showDebugState(reason: string) {
  if (!messageEl) return;
  if (!multiplayerRoom) return;
  const players = multiplayerSnapshot?.players?.join(",") || "-";
  const agreed = multiplayerSnapshot?.agreed ? "yes" : "no";
  const phase = multiplayerSnapshot?.phase || "-";
  const pending = multiplayerSnapshot?.pendingBet ? multiplayerSnapshot.pendingBet : "-";
  messageEl.textContent = `DBG(${reason}) players=${players} agreed=${agreed} phase=${phase} pending=${pending}`;
  messageEl.className = "message message-info";
  if (mpDebugEl) {
    mpDebugEl.style.display = "block";
    mpDebugEl.textContent = `room=${multiplayerRoom || "-"} host=${isRoomHost ? "yes" : "no"} players=${players} agreed=${agreed} phase=${phase} pending=${pending} my=${getMpName()} hostId=${multiplayerHost || "-"}`;
  }
}

function updateMpDebug(reason: string) {
  if (!mpDebugEl || !multiplayerRoom) return;
  const players = multiplayerSnapshot?.players?.join(",") || multiplayerState?.players?.join(",") || "-";
  const agreed = multiplayerSnapshot?.agreed ? "yes" : "no";
  const phase = multiplayerSnapshot?.phase || "-";
  const pending = multiplayerSnapshot?.pendingBet ? multiplayerSnapshot.pendingBet : "-";
  mpDebugEl.style.display = "block";
  mpDebugEl.textContent = `DBG(${reason}) room=${multiplayerRoom || "-"} host=${isRoomHost ? "yes" : "no"} players=${players} agreed=${agreed} phase=${phase} pending=${pending} my=${getMpName()} hostId=${multiplayerHost || "-"}`;
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
}

async function updateBank() {
  if (isDemoActive()) {
    bankrollEl.textContent = formatEDS(game.getBankroll());
    treasuryEl.textContent = formatEDS(game.getTreasury());
    const feeBps = game.getFeeBps();
    feeEl.textContent = (feeBps / 100).toFixed(2) + "%";
    return;
  }

  try {
    const info = await getBankInfo(networkMode);
    bankrollEl.textContent = formatEDS(info.bankroll);
    treasuryEl.textContent = formatEDS(info.treasury);
    feeEl.textContent = (info.feeBps / 100).toFixed(2) + "%";
  } catch {
    bankrollEl.textContent = "—";
    treasuryEl.textContent = "—";
    feeEl.textContent = "—";
  }
}

async function updateStats() {
  const stats = isDemoActive()
    ? await game.getStats()
    : walletAddress
      ? await getPlayerStats(walletAddress, networkMode)
      : {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          blackjacks: 0,
          totalWon: 0,
          totalLost: 0,
        };

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

function handleInvite() {
  const name = playerName || I18N[currentLocale].player_placeholder;
  if (!isSessionStarted) {
    startSession();
  }
  const url = new URL(window.location.href);
  url.searchParams.set("invite", name);
  const betValue = parseFloat(betInput.value) || 1;
  url.searchParams.set("bet", betValue.toString());
  const mode = isDemoActive() ? "demo" : networkMode;
  url.searchParams.set("mode", mode);
  if (LS_PUBLIC_KEY) {
    if (!multiplayerRoom) {
      multiplayerRoom = Math.random().toString(36).slice(2, 10);
    }
    url.searchParams.set("room", multiplayerRoom);
    const hostId = getMpName();
    url.searchParams.set("host_id", hostId);
    multiplayerHost = hostId;
    isRoomHost = true;
    if (isSessionStarted) {
      if (!mpNameFrozen) mpNameFrozen = getMpName();
      multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), multiplayerHost);
      multiplayer.proposeBet(betValue);
      updateMpDebug("invite");
    }
  }
  navigator.clipboard.writeText(url.toString()).then(() => {
    if (inviteNote) {
      inviteNote.style.display = "block";
      inviteNote.textContent = I18N[currentLocale].invite_note;
      setTimeout(() => {
        inviteNote.style.display = "none";
      }, 2000);
    }
    if (inviteNoteHeader) {
      inviteNoteHeader.style.display = "inline-block";
      inviteNoteHeader.textContent = I18N[currentLocale].invite_note;
      setTimeout(() => {
        inviteNoteHeader.style.display = "none";
      }, 2000);
    }
  });
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
  showMessage(currentLocale === "ru" ? "ПРИМИ ИЛИ ОТКЛОНИ ПРИГЛАШЕНИЕ" : "ACCEPT OR DECLINE THE INVITE", "info");
}

function handleInviteDecline() {
  pendingInvite = null;
  invitedByLink = false;
  if (inviteBanner) inviteBanner.style.display = "none";
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
  if (!pendingInvite) return;
  if (!playerName) {
    pendingInviteAutoAccept = true;
    if (nicknameModal) nicknameModal.style.display = "flex";
    if (nicknameInput) {
      nicknameInput.value = "";
      nicknameInput.focus();
    }
    return;
  }
  const mode = pendingInvite.mode;
  if (mode === "mainnet") {
    setNetwork("mainnet");
  } else {
    setNetwork("testnet");
  }
  betInput.value = pendingInvite.bet.toString();

  if (!isSessionStarted) {
    await startSession();
  }

  if (mode === "demo" && !isDemoActive()) {
    // demo invite but demo disabled
    showMessage(I18N[currentLocale].msg_release_lock, "error");
    return;
  }
  if (multiplayerRoom && LS_PUBLIC_KEY) {
    const host = multiplayerHost || pendingInvite?.name || playerName;
    if (!mpNameFrozen) mpNameFrozen = getMpName();
    multiplayer.connect(LS_WS_URL, LS_PUBLIC_KEY, multiplayerRoom, getMpName(), host || "");
    isRoomHost = false;
    multiplayer.acceptBet();
    updateMpDebug("accept");
  }

  if (inviteBanner) inviteBanner.style.display = "none";
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
  }
  if (rematchBtn) {
    const showRematch = Boolean(multiplayerRoom && multiplayerSnapshot?.phase === "done");
    rematchBtn.style.display = showRematch ? "inline-flex" : "none";
  }
  updateMpDebug("ui");
  if (headerStatus) {
    headerStatus.style.display = isDemoActive() ? "none" : "flex";
  }
  if (resetDemoBtn) {
    resetDemoBtn.style.display = isDemoActive() ? "inline-flex" : "none";
  }
  if (connectWalletBtn) {
    connectWalletBtn.style.display = isDemoActive() ? "none" : "inline-flex";
    connectWalletBtn.disabled = Boolean(walletAddress);
  }
  if (connectWalletHeader) {
    connectWalletHeader.style.display = isDemoActive() ? "none" : "inline-flex";
    connectWalletHeader.disabled = Boolean(walletAddress);
  }
  if (walletModal) {
    walletModal.style.display = "none";
  }
  setWalletStatus(Boolean(walletAddress));

  const current = isDemoActive() ? game.getCurrentGame() : chainGame;
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
    const players = multiplayerSnapshot.players || [];
    const meIndex = players.findIndex(p => p === getMpName());
    const computed =
      multiplayerSnapshot.results && multiplayerSnapshot.payouts
        ? {
            results: multiplayerSnapshot.results,
            payouts: multiplayerSnapshot.payouts,
            claimed: multiplayerSnapshot.claimed || [],
          }
        : mpComputeResults(multiplayerSnapshot);
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
}

async function handleConnectWallet() {
  if (isDemoActive()) return;
  const hasWallet = Boolean((window as any).endless);
  if (!hasWallet) {
    if (walletModal) walletModal.style.display = "flex";
    return;
  }
  try {
    walletAddress = await connectWallet();
    await updateBalance();
    await updateBank();
    await updateStats();
    setWalletStatus(true);
    if (walletAddressEl) walletAddressEl.textContent = walletAddress;
    updateUI();
  } catch {
    showMessage(I18N[currentLocale].msg_wallet_missing, "error");
    if (walletModal) walletModal.style.display = "flex";
  }
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
    if (isDemoActive()) {
      await game.claimPayout();
    } else {
      if (!chainGameId) {
        showMessage(I18N[currentLocale].msg_no_payout, "error");
        return;
      }
      const ownerAddress = await getOwner(networkMode);
      if (!walletAddress || walletAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
        showMessage("Only the contract owner can claim on-chain payouts.", "error");
        return;
      }
      setTxStatus(I18N[currentLocale].tx_wait_wallet);
      const gameOnChain = await getGame(chainGameId, networkMode);
      await claimPayoutOnChain(gameOnChain.player, chainGameId, networkMode);
      setTxStatus(I18N[currentLocale].tx_submitted);
      chainGame = await getGame(chainGameId, networkMode);
    }
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
function getLeaderboard(): LeaderboardEntry[] {
  if (!isDemoActive()) return [];
  const saved = localStorage.getItem("leaderboard");
  if (saved) {
    const entries = JSON.parse(saved).map((entry: LeaderboardEntry) => ({
      ...entry,
      lastPlayed: entry.lastPlayed ?? 0,
    }));
    return [...entries, ...DEMO_PLAYERS];
  }
  return [...DEMO_PLAYERS];
}

function updateLeaderboardEntry() {
  if (!isDemoActive()) return;
  if (!playerName) return;

  const leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const stats = game.getCurrentStats();

  let entry = leaderboard.find((e: LeaderboardEntry) => e.name === playerName);
  if (!entry) {
    entry = { name: playerName, wins: 0, losses: 0, profit: 0, lastPlayed: Date.now() };
    leaderboard.push(entry);
  }

  entry.wins = stats.wins;
  entry.losses = stats.losses;
  entry.profit = (stats.totalWon - stats.totalLost) / 100000000;
  entry.lastPlayed = Date.now();

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  const all = getLeaderboard();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const filtered = activeLeaderboardTab === "daily"
    ? all.filter(entry => now - entry.lastPlayed <= dayMs)
    : all;
  const sorted = filtered.sort((a, b) => b.profit - a.profit);
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
    const profitClass = entry.profit < 0 ? "negative" : "";

    return `
      <div class="lb-row ${rankClass} ${isCurrentPlayer ? "current-player" : ""}">
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${entry.name}</span>
        <span class="lb-wins">${entry.wins}</span>
        <span class="lb-profit ${profitClass}">${entry.profit >= 0 ? "+" : ""}${entry.profit.toFixed(1)}</span>
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
