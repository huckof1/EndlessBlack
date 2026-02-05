import { CONTRACT_ADDRESS_MAINNET, CONTRACT_ADDRESS_TESTNET, MODULE_NAME, NETWORK } from "./config";

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
  return Network.DEVNET;
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
  if (mode === "testnet") return CONTRACT_ADDRESS_TESTNET;
  return CONTRACT_ADDRESS_TESTNET;
}

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

type WalletProvider = {
  connect?: () => Promise<any>;
  account?: () => Promise<{ address: string }>;
  signAndSubmitTransaction?: (args: any) => Promise<any>;
};

function getWallet(): WalletProvider | null {
  const w = window as any;
  return (w.endless as WalletProvider) || null;
}

export async function connectWallet(): Promise<string> {
  const wallet = getWallet();
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  const res = wallet.connect ? await wallet.connect() : null;
  if (res?.address) return res.address;
  if (wallet.account) {
    const account = await wallet.account();
    if (account?.address) return account.address;
  }
  throw new Error("Failed to connect wallet");
}

async function submitEntryFunction(functionName: string, args: any[], mode?: "testnet" | "mainnet") {
  const wallet = getWallet();
  if (!wallet || !wallet.signAndSubmitTransaction) {
    throw new Error("Wallet not found");
  }
  const payload = {
    function: `${getContractAddress(mode)}::${MODULE_NAME}::${functionName}`,
    typeArguments: [],
    functionArguments: args,
    type_arguments: [],
    arguments: args,
  };
  try {
    return await wallet.signAndSubmitTransaction({ payload });
  } catch {
    return await wallet.signAndSubmitTransaction({ data: payload });
  }
}

export async function getBankInfo(networkMode?: "testnet" | "mainnet"): Promise<{ bankroll: number; treasury: number; feeBps: number }> {
  const [bankroll, treasury, feeBps] = await Promise.all([
    viewU64("get_bankroll_balance", networkMode),
    viewU64("get_treasury_balance", networkMode),
    viewU64("get_fee_bps", networkMode),
  ]);
  return { bankroll, treasury, feeBps };
}

export async function getWalletBalance(address: string, networkMode?: "testnet" | "mainnet"): Promise<number> {
  const func = `0x1::coin::balance` as `${string}::${string}::${string}`;
  const payload = {
    function: func,
    typeArguments: ["0x1::endless_coin::EndlessCoin"],
    functionArguments: [address],
  };
  const endless = await getEndless(networkMode);
  const data = await endless.view({ payload });
  return toNumber(data[0]);
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

export async function startGame(betAmount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("start_game", [betAmount], networkMode);
}

export async function hit(gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("hit", [gameId], networkMode);
}

export async function stand(gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("stand", [gameId], networkMode);
}

export async function claimPayout(gameId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("claim_payout", [gameId], networkMode);
}
