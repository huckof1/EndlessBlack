import { CONTRACT_ADDRESS_TESTNET, CONTRACT_ADDRESS_MAINNET, MODULE_NAME, NETWORK } from "./config";
import {
  EndlessLuffaSdk,
  UserResponseStatus,
  EndLessSDKEvent,
  isLuffa,
} from "@luffalab/luffa-endless-sdk";

// ==================== SDK LAZY LOADING ====================

type SdkModule = {
  Endless: any;
  EndlessConfig: any;
  Network: any;
};

let sdkPromise: Promise<SdkModule> | null = null;

async function loadSdk(): Promise<SdkModule> {
  if (!sdkPromise) {
    sdkPromise = import("@endlesslab/endless-ts-sdk") as Promise<SdkModule>;
  }
  return sdkPromise;
}

async function getNetwork(mode?: "testnet" | "mainnet") {
  const { Network } = await loadSdk();
  if (mode === "mainnet") return Network.MAINNET;
  if (mode === "testnet") return Network.TESTNET;
  const net = NETWORK as string;
  if (net === "mainnet") return Network.MAINNET;
  if (net === "testnet") return Network.TESTNET;
  return Network.TESTNET;
}

async function getEndless(mode?: "testnet" | "mainnet") {
  const { Endless, EndlessConfig } = await loadSdk();
  const network = await getNetwork(mode);
  return new Endless(new EndlessConfig({ network }));
}

function toNumber(value: any): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return Number(value);
}

function getContractAddress(mode?: "testnet" | "mainnet"): string {
  if (mode === "mainnet") return CONTRACT_ADDRESS_MAINNET;
  return CONTRACT_ADDRESS_TESTNET;
}

// ==================== LUFFA SDK ====================

let luffaSdk: EndlessLuffaSdk | null = null;
let connectedAddress: string | null = null;

// Event callbacks for main.ts to subscribe
let onWalletConnect: ((address: string) => void) | null = null;
let onWalletDisconnect: (() => void) | null = null;
let onAccountChange: ((address: string) => void) | null = null;

function getLuffaSdk(mode?: "testnet" | "mainnet"): EndlessLuffaSdk {
  if (!luffaSdk) {
    const network = mode === "mainnet" ? "mainnet" : "testnet";
    luffaSdk = new EndlessLuffaSdk({
      network,
      miniprogram: false,
    });

    luffaSdk.on(EndLessSDKEvent.CONNECT, (info) => {
      if (info && info.address) {
        connectedAddress = info.address;
        onWalletConnect?.(info.address);
      }
    });

    luffaSdk.on(EndLessSDKEvent.DISCONNECT, () => {
      connectedAddress = null;
      onWalletDisconnect?.();
    });

    luffaSdk.on(EndLessSDKEvent.ACCOUNT_CHANGE, (info) => {
      if (info && info.address) {
        connectedAddress = info.address;
        onAccountChange?.(info.address);
      }
    });
  }
  return luffaSdk;
}

export function setWalletCallbacks(callbacks: {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onAccountChange?: (address: string) => void;
}) {
  onWalletConnect = callbacks.onConnect || null;
  onWalletDisconnect = callbacks.onDisconnect || null;
  onAccountChange = callbacks.onAccountChange || null;
}

export function isInLuffaApp(): boolean {
  return isLuffa();
}

export function getConnectedAddress(): string | null {
  return connectedAddress;
}

// ==================== WALLET CONNECTION ====================

export async function connectWallet(mode?: "testnet" | "mainnet"): Promise<string> {
  const sdk = getLuffaSdk(mode);

  try {
    const res = await sdk.connect();
    if (res.status === UserResponseStatus.APPROVED) {
      connectedAddress = res.args.address;
      return res.args.address;
    }
    throw new Error("Connection rejected by user");
  } catch (err) {
    // Fallback: try injected provider directly (legacy)
    const address = await tryInjectedProvider();
    if (address) {
      connectedAddress = address;
      return address;
    }
    throw new Error("Wallet not found. Open this page in Luffa app or install Luffa wallet.");
  }
}

export async function disconnectWallet(): Promise<void> {
  if (luffaSdk) {
    await luffaSdk.disconnect();
  }
  connectedAddress = null;
}

// Legacy fallback for injected providers
type WalletProvider = {
  connect?: () => Promise<any>;
  account?: () => Promise<{ address: string }>;
  signAndSubmitTransaction?: (args: any) => Promise<any>;
};

function getInjectedWallet(): WalletProvider | null {
  const w = window as any;
  const luffa = w.luffa;
  const endless = w.endless;
  return (
    (endless as WalletProvider) ||
    (luffa as WalletProvider) ||
    (luffa?.endless as WalletProvider) ||
    (luffa?.endlessProvider as WalletProvider) ||
    (luffa?.provider as WalletProvider) ||
    (luffa?.providers?.endless as WalletProvider) ||
    (w.luffaWallet as WalletProvider) ||
    (w.endlessWallet as WalletProvider) ||
    null
  );
}

async function tryInjectedProvider(): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    const wallet = getInjectedWallet();
    if (wallet) {
      const res = wallet.connect ? await wallet.connect() : null;
      if (res?.address) return res.address;
      if (wallet.account) {
        const account = await wallet.account();
        if (account?.address) return account.address;
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return null;
}

// ==================== TRANSACTION SUBMISSION ====================

async function submitEntryFunction(functionName: string, args: any[], mode?: "testnet" | "mainnet") {
  const func = `${getContractAddress(mode)}::${MODULE_NAME}::${functionName}`;
  const strArgs = args.map((a) => String(a));
  const payload = {
    function: func as `${string}::${string}::${string}`,
    typeArguments: [] as string[],
    functionArguments: strArgs,
  };

  // Primary: use Luffa SDK
  const sdk = getLuffaSdk(mode);
  try {
    const res = await sdk.signAndSubmitTransaction({ payload });
    if (res.status === UserResponseStatus.APPROVED) {
      // Wait for tx confirmation
      const endless = await getEndless(mode);
      await endless.waitForTransaction({ transactionHash: res.args.hash });
      return res.args;
    }
    throw new Error("Transaction rejected by user");
  } catch (err) {
    // Fallback: try injected provider
    const wallet = getInjectedWallet();
    if (wallet?.signAndSubmitTransaction) {
      const fallbackPayload = {
        function: func,
        typeArguments: [],
        functionArguments: args,
        type_arguments: [],
        arguments: args,
      };
      try {
        return await wallet.signAndSubmitTransaction({ payload: fallbackPayload });
      } catch {
        return await wallet.signAndSubmitTransaction({ data: fallbackPayload });
      }
    }
    throw err;
  }
}

// ==================== VIEW FUNCTIONS ====================

async function viewU64(functionName: string, mode?: "testnet" | "mainnet"): Promise<number> {
  const func = `${getContractAddress(mode)}::${MODULE_NAME}::${functionName}` as `${string}::${string}::${string}`;
  const payload = {
    function: func,
    typeArguments: [],
    functionArguments: [],
  };
  const endless = await getEndless(mode);
  const data = await endless.view({ payload });
  return toNumber(data[0]);
}

async function viewAny(functionName: string, args: any[], mode?: "testnet" | "mainnet"): Promise<any[]> {
  const func = `${getContractAddress(mode)}::${MODULE_NAME}::${functionName}` as `${string}::${string}::${string}`;
  const payload = {
    function: func,
    typeArguments: [],
    functionArguments: args,
  };
  const endless = await getEndless(mode);
  const data = await endless.view({ payload });
  return data as any[];
}

// ==================== CHAIN QUERIES ====================

export async function getBankInfo(networkMode?: "testnet" | "mainnet"): Promise<{ bankroll: number; treasury: number; feeBps: number }> {
  const [bankroll, treasury, feeBps] = await Promise.all([
    viewU64("get_bankroll_balance", networkMode),
    viewU64("get_treasury_balance", networkMode),
    viewU64("get_fee_bps", networkMode),
  ]);
  return { bankroll, treasury, feeBps };
}

export async function getWalletBalance(address: string, networkMode?: "testnet" | "mainnet"): Promise<number> {
  try {
    // Use direct view call — SDK getAccountEDSAmount returns wrong values
    const func = `0x1::endless_coin::balance` as `${string}::${string}::${string}`;
    const payload = { function: func, typeArguments: [], functionArguments: [address] };
    const endless = await getEndless(networkMode);
    const data = await endless.view({ payload });
    return toNumber(data[0]);
  } catch {
    // Fallback: SDK method
    const endless = await getEndless(networkMode);
    const balance = await endless.getAccountEDSAmount({ accountAddress: address });
    return toNumber(balance);
  }
}

export async function getPlayerStats(address: string, networkMode?: "testnet" | "mainnet") {
  const data = await viewAny("get_player_stats", [address], networkMode);
  return {
    totalGames: toNumber(data[0]),
    wins: toNumber(data[1]),
    losses: toNumber(data[2]),
    draws: toNumber(data[3]),
    blackjacks: toNumber(data[4]),
    totalWon: toNumber(data[5]),
    totalLost: toNumber(data[6]),
  };
}

// ==================== TYPES ====================

export type ChainCard = { suit: number; rank: number };
export type ChainGame = {
  gameId: number;
  player: string;
  betAmount: number;
  netBet: number;
  feeAmount: number;
  playerCards: ChainCard[];
  dealerCards: ChainCard[];
  playerScore: number;
  dealerScore: number;
  isFinished: boolean;
  result: number;
  payoutDue: number;
  isClaimed: boolean;
};

function normalizeCard(raw: any): ChainCard {
  return {
    suit: toNumber(raw.suit ?? raw["suit"]),
    rank: toNumber(raw.rank ?? raw["rank"]),
  };
}

// ==================== GAME FUNCTIONS ====================

export async function getGame(gameId: number, networkMode?: "testnet" | "mainnet"): Promise<ChainGame> {
  const data = await viewAny("get_game", [gameId], networkMode);
  return {
    gameId,
    player: String(data[0]),
    betAmount: toNumber(data[1]),
    netBet: toNumber(data[2]),
    feeAmount: toNumber(data[3]),
    playerCards: (data[4] as any[]).map(normalizeCard),
    dealerCards: (data[5] as any[]).map(normalizeCard),
    playerScore: toNumber(data[6]),
    dealerScore: toNumber(data[7]),
    isFinished: Boolean(data[8]),
    result: toNumber(data[9]),
    payoutDue: toNumber(data[10]),
    isClaimed: Boolean(data[11]),
  };
}

export async function getLatestGameId(address: string, networkMode?: "testnet" | "mainnet"): Promise<number> {
  const data = await viewAny("get_latest_game_id", [address], networkMode);
  return toNumber(data[0]);
}

export async function getOwner(networkMode?: "testnet" | "mainnet"): Promise<string> {
  const data = await viewAny("get_owner", [], networkMode);
  return String(data[0]);
}

export async function startGame(betAmount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("start_game", [betAmount], networkMode);
}

export async function hit(gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("hit", [gameId], networkMode);
}

export async function stand(gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("stand", [gameId], networkMode);
}

export async function claimPayout(playerAddress: string, gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("claim_payout", [playerAddress, gameId], networkMode);
}
