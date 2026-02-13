import { CONTRACT_ADDRESS_TESTNET, CONTRACT_ADDRESS_MAINNET, MODULE_NAME, NETWORK } from "./config";
import { Network } from "@endlesslab/endless-ts-sdk";
import {
  EndlessJsSdk,
  UserResponseStatus,
  EndLessSDKEvent,
} from "@endlesslab/endless-web3-sdk";
import {
  EndlessLuffaSdk,
  UserResponseStatus as LuffaUserResponseStatus,
  EndLessSDKEvent as LuffaSDKEvent,
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

// Извлечь адрес из ответа SDK (поле может быть address или account)
function extractAddress(data: any): string | null {
  if (!data) return null;
  return data.address || data.account || null;
}

function getContractAddress(mode?: "testnet" | "mainnet"): string {
  if (mode === "mainnet") return CONTRACT_ADDRESS_MAINNET;
  // Priority: HTML global > config (handles stale JS cache)
  const htmlOverride = (window as any).__CONTRACT_TESTNET;
  if (htmlOverride) return htmlOverride;
  return CONTRACT_ADDRESS_TESTNET;
}

// ==================== WALLET TYPE ====================

export type WalletType = "endless" | "luffa" | "web3" | null;
let activeWalletType: WalletType = null;

export function getActiveWalletType(): WalletType {
  return activeWalletType;
}

// ==================== ENDLESS WEB3 SDK (primary — iframe wallet) ====================

let web3Sdk: EndlessJsSdk | null = null;
let web3SdkNetwork: string | null = null;

function getWeb3Sdk(mode?: "testnet" | "mainnet"): EndlessJsSdk {
  const network = mode === "mainnet" ? Network.MAINNET : Network.TESTNET;
  const networkKey = mode === "mainnet" ? "mainnet" : "testnet";

  if (!web3Sdk) {
    web3SdkNetwork = networkKey;
    web3Sdk = new EndlessJsSdk({
      network,
      colorMode: "dark",
    });

    web3Sdk.on(EndLessSDKEvent.CONNECT, (info: any) => {
      const addr = extractAddress(info);
      if (addr) {
        connectedAddress = addr;
        onWalletConnect?.(addr);
      }
    });

    web3Sdk.on(EndLessSDKEvent.DISCONNECT, () => {
      connectedAddress = null;
      onWalletDisconnect?.();
    });

    web3Sdk.on(EndLessSDKEvent.ACCOUNT_CHANGE, (info: any) => {
      const addr = extractAddress(info);
      if (addr) {
        connectedAddress = addr;
        onAccountChange?.(addr);
      }
    });
  } else if (web3SdkNetwork !== networkKey) {
    web3SdkNetwork = networkKey;
    web3Sdk.changeNetwork({ network });
  }

  return web3Sdk;
}

// ==================== LUFFA SDK (fallback — inside Luffa app) ====================

let luffaSdk: EndlessLuffaSdk | null = null;
let luffaSdkNetwork: string | null = null;

function getLuffaSdk(mode?: "testnet" | "mainnet"): EndlessLuffaSdk {
  const network = mode === "mainnet" ? "mainnet" : "testnet";

  if (!luffaSdk) {
    luffaSdkNetwork = network;
    luffaSdk = new EndlessLuffaSdk({
      network,
      miniprogram: false,
    });

    luffaSdk.on(LuffaSDKEvent.CONNECT, (info) => {
      const addr = extractAddress(info);
      if (addr) {
        connectedAddress = addr;
        onWalletConnect?.(addr);
      }
    });

    luffaSdk.on(LuffaSDKEvent.DISCONNECT, () => {
      connectedAddress = null;
      onWalletDisconnect?.();
    });

    luffaSdk.on(LuffaSDKEvent.ACCOUNT_CHANGE, (info) => {
      const addr = extractAddress(info);
      if (addr) {
        connectedAddress = addr;
        onAccountChange?.(addr);
      }
    });
  } else if (luffaSdkNetwork !== network) {
    luffaSdkNetwork = network;
    luffaSdk.changeNetwork({ network });
  }

  return luffaSdk;
}

// ==================== SHARED STATE ====================

let connectedAddress: string | null = null;

// Event callbacks for main.ts to subscribe
let onWalletConnect: ((address: string) => void) | null = null;
let onWalletDisconnect: (() => void) | null = null;
let onAccountChange: ((address: string) => void) | null = null;

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

/** Primary: connect via Endless Web3 SDK (iframe wallet — works in any browser) */
export async function connectWallet(mode?: "testnet" | "mainnet"): Promise<string> {
  // Inside Luffa app — use Luffa SDK directly
  if (isInLuffaApp()) {
    return connectLuffa(mode);
  }

  // Otherwise use Web3 SDK (opens iframe modal with wallet.endless.link)
  const sdk = getWeb3Sdk(mode);
  // Force wallet to testnet
  sdk.changeNetwork({ network: mode === "mainnet" ? Network.MAINNET : Network.TESTNET });
  const res = await sdk.connect();
  if (res.status === UserResponseStatus.APPROVED) {
    const addr = extractAddress(res.args);
    if (addr) {
      connectedAddress = addr;
      activeWalletType = "web3";
      return addr;
    }
    throw new Error("Wallet returned empty address");
  }
  throw new Error("Connection rejected by user");
}

/** Connect via Endless browser extension (window.endless) */
export async function connectEndlessExtension(_mode?: "testnet" | "mainnet"): Promise<string> {
  const w = window as any;
  const endless = w.endless;
  if (!endless) {
    throw new Error("ENDLESS_NOT_INSTALLED");
  }
  try {
    const res = endless.connect ? await endless.connect() : null;
    if (res?.address) {
      connectedAddress = res.address;
      activeWalletType = "endless";
      return res.address;
    }
    if (endless.account) {
      const account = await endless.account();
      if (account?.address) {
        connectedAddress = account.address;
        activeWalletType = "endless";
        return account.address;
      }
    }
  } catch {
    // fall through
  }
  throw new Error("ENDLESS_CONNECT_FAILED");
}

/** Connect via Luffa SDK (inside Luffa app) */
export async function connectLuffa(mode?: "testnet" | "mainnet"): Promise<string> {
  const sdk = getLuffaSdk(mode);
  const res = await sdk.connect();
  if (res.status === LuffaUserResponseStatus.APPROVED) {
    const addr = extractAddress(res.args);
    if (addr) {
      connectedAddress = addr;
      activeWalletType = "luffa";
      return addr;
    }
    throw new Error("Wallet returned empty address");
  }
  throw new Error("LUFFA_CONNECT_FAILED");
}

export async function disconnectWallet(): Promise<void> {
  if (activeWalletType === "web3" && web3Sdk) {
    await web3Sdk.disconnect();
  } else if (luffaSdk) {
    await luffaSdk.disconnect();
  }
  connectedAddress = null;
  activeWalletType = null;
}

// Legacy fallback for injected providers
type WalletProvider = {
  connect?: () => Promise<any>;
  account?: () => Promise<{ address: string }>;
  signAndSubmitTransaction?: (args: any) => Promise<any>;
};

function isMobile(): boolean {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod|android/i.test(ua);
}

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
    null
  );
}

// ==================== TRANSACTION SUBMISSION ====================

async function submitEntryFunction(functionName: string, args: any[], mode?: "testnet" | "mainnet") {
  const contractAddr = getContractAddress(mode);
  const func = `${contractAddr}::${MODULE_NAME}::${functionName}`;
  console.log("submitEntryFunction:", func, "args:", args, "contractAddr:", contractAddr);
  const dbg = (window as any).__debugLog as ((msg: string) => void) | undefined;
  const safeArgs = JSON.stringify(args, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  dbg?.(`TX ${functionName} args=${safeArgs}`);
  dbg?.(`Wallet state: active=${activeWalletType || "null"} connected=${connectedAddress ? "yes" : "no"}`);
  // Ensure we have an active wallet session before trying to sign
  if (!activeWalletType || !connectedAddress) {
    const w = window as any;
    if (w?.endless) {
      dbg?.("Connecting via endless extension...");
      await connectEndlessExtension(mode);
    } else {
      dbg?.("Connecting via web3 sdk...");
      await connectWallet(mode);
    }
    dbg?.(`Post-connect: active=${activeWalletType || "null"} connected=${connectedAddress ? "yes" : "no"}`);
  }
  // Pass args as-is — SDK expects BigInt for u128, strings for addresses, etc.
  const payload = {
    function: func as `${string}::${string}::${string}`,
    typeArguments: [] as string[],
    functionArguments: args,
  };

  // Route based on active wallet type
  if (activeWalletType === "endless") {
    dbg?.("TX route: endless extension");
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
        const result = await wallet.signAndSubmitTransaction({ payload: fallbackPayload });
        const hash = result?.hash || result?.args?.hash;
        if (hash) {
          const endless = await getEndless(mode);
          await endless.waitForTransaction({ transactionHash: hash });
        }
        return result;
      } catch {
        return await wallet.signAndSubmitTransaction({ data: fallbackPayload });
      }
    }
    throw new Error("Endless extension not available");
  }

  // Web3 SDK (iframe wallet)
  if (activeWalletType === "web3" && web3Sdk) {
    dbg?.("TX route: web3 sdk");
    if (isMobile()) {
      const wallet = getInjectedWallet();
      if (wallet?.signAndSubmitTransaction) {
        dbg?.("Mobile: using injected wallet instead of web3 sdk");
        const fallbackPayload = {
          function: func,
          typeArguments: [],
          functionArguments: args,
          type_arguments: [],
          arguments: args,
        };
        try {
          const result = await wallet.signAndSubmitTransaction({ payload: fallbackPayload });
          const hash = result?.hash || result?.args?.hash;
          if (hash) {
            const endless = await getEndless(mode);
            await endless.waitForTransaction({ transactionHash: hash });
          }
          return result;
        } catch {
          return await wallet.signAndSubmitTransaction({ data: fallbackPayload });
        }
      }
      dbg?.("Mobile: no injected wallet, opening picker");
      const openPicker = (window as any).__openWalletPicker as (() => void) | undefined;
      openPicker?.();
      throw new Error("WALLET_PICKER_REQUIRED");
    }
    try {
      dbg?.("Web3 SDK pre-connect (wake iframe)");
      await web3Sdk.connect();
      const openFn = (web3Sdk as any).open as (() => Promise<any>) | undefined;
      if (openFn) {
        dbg?.("Web3 SDK open view");
        await openFn();
      }
    } catch (e) {
      dbg?.(`Web3 SDK pre-connect error: ${e instanceof Error ? e.message : String(e)}`);
    }
    let res: any;
    try {
      res = await web3Sdk.signAndSubmitTransaction({ payload });
    } catch (sdkErr: any) {
      console.error("Web3 SDK signAndSubmitTransaction error:", sdkErr);
      dbg?.(`Web3 SDK error: ${sdkErr?.message || sdkErr}`);
      const errMsg = String(sdkErr?.message || sdkErr).toLowerCase();
      // Fallback to injected wallet if available (browser extension)
      const wallet = getInjectedWallet();
      if (wallet?.signAndSubmitTransaction) {
        dbg?.("Web3 SDK failed; fallback to injected wallet");
        const fallbackPayload = {
          function: func,
          typeArguments: [],
          functionArguments: args,
          type_arguments: [],
          arguments: args,
        };
        try {
          const result = await wallet.signAndSubmitTransaction({ payload: fallbackPayload });
          const hash = result?.hash || result?.args?.hash;
          if (hash) {
            const endless = await getEndless(mode);
            await endless.waitForTransaction({ transactionHash: hash });
          }
          return result;
        } catch {
          return await wallet.signAndSubmitTransaction({ data: fallbackPayload });
        }
      }
      if (errMsg.includes("wallet closed")) {
        const openPicker = (window as any).__openWalletPicker as (() => void) | undefined;
        openPicker?.();
      }
      throw new Error(`Wallet SDK error: ${sdkErr?.message || sdkErr}`);
    }
    console.log("signAndSubmitTransaction response:", JSON.stringify(res, null, 2));
    if (res.status === UserResponseStatus.APPROVED) {
      try {
        const endless = await getEndless(mode);
        await endless.waitForTransaction({ transactionHash: res.args.hash });
      } catch (waitErr: any) {
        console.error("Transaction on-chain error:", waitErr);
        throw new Error(`On-chain error: ${waitErr?.message || waitErr}`);
      }
      return res.args;
    }
    throw new Error(`Rejected: ${res.message || res.status}`);
  }

  // Luffa SDK
  const sdk = getLuffaSdk(mode);
  dbg?.("TX route: luffa sdk");
  const luffaArgs = args.map(a => (typeof a === "bigint" ? a.toString() : a));
  const luffaPayload = {
    function: func as `${string}::${string}::${string}`,
    typeArguments: [] as string[],
    functionArguments: luffaArgs,
  };
  try {
    dbg?.("Luffa args sanitized");
    try {
      dbg?.("Luffa pre-connect");
      await sdk.connect();
    } catch {
      // ignore connect errors
    }
    const res = await Promise.race([
      sdk.signAndSubmitTransaction({ payload: luffaPayload }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("LUFFA_TIMEOUT")), 8000)),
    ]) as any;
    dbg?.(`Luffa response status: ${res?.status || "unknown"}`);
    if (res.status === LuffaUserResponseStatus.APPROVED) {
      const endless = await getEndless(mode);
      await endless.waitForTransaction({ transactionHash: res.args.hash });
      return res.args;
    }
    throw new Error("Transaction rejected by user");
  } catch (err) {
    dbg?.(`Luffa SDK error: ${err instanceof Error ? err.message : String(err)}`);
    // Fallback: try injected provider
    const wallet = getInjectedWallet();
    if (wallet?.signAndSubmitTransaction) {
      const fallbackPayload = {
        function: func,
        typeArguments: [],
        functionArguments: luffaArgs,
        type_arguments: [],
        arguments: luffaArgs,
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

// ==================== FAUCET (testnet only) ====================

export async function requestFaucet(address: string, mode?: "testnet" | "mainnet") {
  const func = "0x1::faucet::fund" as `${string}::${string}::${string}`;
  const payload = {
    function: func,
    typeArguments: [] as string[],
    functionArguments: [address],
  };

  // Route based on active wallet type (same logic as submitEntryFunction)
  if (activeWalletType === "endless") {
    const wallet = getInjectedWallet();
    if (wallet?.signAndSubmitTransaction) {
      const fallbackPayload = {
        function: "0x1::faucet::fund",
        typeArguments: [],
        functionArguments: [address],
        type_arguments: [],
        arguments: [address],
      };
      try {
        const result = await wallet.signAndSubmitTransaction({ payload: fallbackPayload });
        const hash = result?.hash || result?.args?.hash;
        if (hash) {
          const endless = await getEndless(mode);
          await endless.waitForTransaction({ transactionHash: hash });
        }
        return result;
      } catch {
        return await wallet.signAndSubmitTransaction({ data: fallbackPayload });
      }
    }
    throw new Error("Endless extension not available");
  }

  if (activeWalletType === "web3" && web3Sdk) {
    const res = await web3Sdk.signAndSubmitTransaction({ payload });
    if (res.status === UserResponseStatus.APPROVED) {
      const endless = await getEndless(mode);
      await endless.waitForTransaction({ transactionHash: res.args.hash });
      return res.args;
    }
    throw new Error("Transaction rejected by user");
  }

  const sdk = getLuffaSdk(mode);
  const res = await sdk.signAndSubmitTransaction({ payload });
  if (res.status === LuffaUserResponseStatus.APPROVED) {
    const endless = await getEndless(mode);
    await endless.waitForTransaction({ transactionHash: res.args.hash });
    return res.args;
  }
  throw new Error("Faucet transaction rejected");
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
    const func = `0x1::endless_coin::balance` as `${string}::${string}::${string}`;
    const payload = { function: func, typeArguments: [], functionArguments: [address] };
    const endless = await getEndless(networkMode);
    const data = await endless.view({ payload });
    return toNumber(data[0]);
  } catch {
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
  return await submitEntryFunction("start_game", [BigInt(betAmount)], networkMode);
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

export async function fundBankroll(amount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("fund_bankroll", [BigInt(amount)], networkMode);
}

export async function withdrawFees(amount: number, toAddress: string, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("withdraw_fees", [amount, toAddress], networkMode);
}

// ==================== PLAYER BANK (Deposit/Withdraw) ====================

export async function deposit(amount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("deposit", [BigInt(amount)], networkMode);
}

export async function withdraw(amount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("withdraw", [BigInt(amount)], networkMode);
}

export async function getPlayerBalance(address: string, networkMode?: "testnet" | "mainnet"): Promise<number> {
  const data = await viewAny("get_player_balance", [address], networkMode);
  return toNumber(data[0]);
}

export async function updatePlayerBalance(
  playerAddress: string,
  delta: number,
  isWin: boolean,
  networkMode?: "testnet" | "mainnet"
) {
  return await submitEntryFunction("update_balance", [playerAddress, BigInt(delta), isWin], networkMode);
}
