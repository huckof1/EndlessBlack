import { CONTRACT_ADDRESS_TESTNET, CONTRACT_ADDRESS_MAINNET, MODULE_NAME, NETWORK } from "./config";
import { Network } from "@endlesslab/endless-ts-sdk";
import {
  EndlessJsSdk,
  UserResponseStatus,
  EndLessSDKEvent,
  EndlessWalletTransactionType,
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
  Account: any;
  Ed25519PrivateKey: any;
  AccountAddress: any;
  Ed25519PublicKey: any;
  Ed25519Signature: any;
  AccountAuthenticatorEd25519: any;
  TypeTagU64: any;
  TypeTagU128: any;
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
  if (typeof data === "string") return data;
  const direct =
    data.address ||
    data.account ||
    data.accountAddress ||
    data.walletAddress ||
    data.selectedAddress ||
    data.publicAddress ||
    null;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object") {
    const nested = extractAddress(direct);
    if (nested) return nested;
  }
  if (data.args && typeof data.args === "object") {
    const nested = extractAddress(data.args);
    if (nested) return nested;
  }
  if (data.data && typeof data.data === "object") {
    const nested = extractAddress(data.data);
    if (nested) return nested;
  }
  return null;
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
type PreferredWalletType = "endless" | "luffa" | "web3" | null;
let preferredWalletType: PreferredWalletType = null;

export function getActiveWalletType(): WalletType {
  return activeWalletType;
}

export function setPreferredWalletType(type: PreferredWalletType) {
  preferredWalletType = type;
}

export function getPreferredWalletType(): PreferredWalletType {
  return preferredWalletType;
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
        if (connectedAddress && connectedAddress !== addr) {
          web3PublicKeyHex = null;
        }
        connectedAddress = addr;
        onWalletConnect?.(addr);
      }
    });

    web3Sdk.on(EndLessSDKEvent.DISCONNECT, () => {
      connectedAddress = null;
      web3PublicKeyHex = null;
      onWalletDisconnect?.();
    });

    web3Sdk.on(EndLessSDKEvent.ACCOUNT_CHANGE, (info: any) => {
      const addr = extractAddress(info);
      if (addr) {
        if (connectedAddress && connectedAddress !== addr) {
          web3PublicKeyHex = null;
        }
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
        activeWalletType = "luffa";
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
  if (preferredWalletType === "luffa") {
    return connectLuffa(mode);
  }
  if (preferredWalletType === "endless") {
    return connectEndlessExtension(mode);
  }
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
  const statusText = String((res as any)?.status ?? "");
  const isApproved =
    (res as any)?.status === LuffaUserResponseStatus.APPROVED ||
    statusText.toUpperCase() === "APPROVED";
  const addr = extractAddress((res as any)?.args ?? res);
  if (addr) {
    connectedAddress = addr;
    activeWalletType = "luffa";
    return addr;
  }
  // Some Luffa builds emit CONNECT event but return sparse payload.
  if (isApproved && connectedAddress) {
    activeWalletType = "luffa";
    return connectedAddress;
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
  web3PublicKeyHex = null;
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
    null
  );
}

function normalizeHex(value: string): string {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function getHexByteLen(value: string): number {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (hex.length === 0 || hex.length % 2 !== 0) return -1;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return -1;
  return hex.length / 2;
}

let web3PublicKeyHex: string | null = null;

async function ensureWeb3PublicKeyHex(mode: "testnet" | "mainnet" | undefined, dbg?: (msg: string) => void) {
  if (!web3Sdk) throw new Error("Web3 SDK is not initialized");
  if (web3PublicKeyHex) return web3PublicKeyHex;
  const nonce = `${Date.now()}`;
  dbg?.("Web3 SDK signMessage for public key");
  const res = await web3Sdk.signMessage({
    message: "PixelBlackjack signer check",
    nonce,
    address: true,
    application: true,
    chainId: true,
  });
  if (res.status !== UserResponseStatus.APPROVED) {
    throw new Error(`Public key request rejected: ${res.message || res.status}`);
  }
  const pk = res.args?.publicKey;
  if (!pk || getHexByteLen(pk) !== 32) {
    throw new Error("Wallet returned invalid public key");
  }
  web3PublicKeyHex = normalizeHex(pk);
  dbg?.(`Web3 SDK public key loaded (${mode || "testnet"})`);
  return web3PublicKeyHex;
}

// @ts-ignore kept as potential fallback
async function signViaWeb3AndSubmit(
  payload: { function: `${string}::${string}::${string}`; typeArguments: string[]; functionArguments: any[] },
  mode?: "testnet" | "mainnet",
  dbg?: (msg: string) => void
) {
  if (!web3Sdk) throw new Error("Web3 SDK is not initialized");
  if (!connectedAddress) throw new Error("Wallet is not connected");
  const {
    AccountAddress,
    Ed25519PublicKey,
    Ed25519Signature,
    AccountAuthenticatorEd25519,
    TypeTagU128,
  } = await loadSdk();
  const endless = await getEndless(mode);
  const sender = connectedAddress.startsWith("0x")
    ? AccountAddress.from(connectedAddress)
    : AccountAddress.fromBs58String(connectedAddress);

  const functionName = payload.function.split("::").pop() || "";
  const withAbiPayload: any = { ...payload };
  if (functionName === "deposit" || functionName === "withdraw" || functionName === "fund_bankroll") {
    withAbiPayload.abi = {
      typeParameters: [],
      parameters: [new TypeTagU128()],
    };
    dbg?.(`Web3 SDK signature-only ABI injected u128 (${functionName})`);
  }

  const tx = await endless.transaction.build.simple({
    sender,
    data: withAbiPayload,
  });
  const txHex = tx.bcsToHex().toString();
  dbg?.("Web3 SDK signature-only flow start");

  // Ensure wallet iframe is ready before calling signTransaction.
  // SDK's signTransaction only checks readyState (sync flag) — if iframe
  // isn't ready yet, the message is silently dropped and Promise never resolves.
  // waitReady() is what connect()/signMessage() use; we must call it manually.
  const sdkAny = web3Sdk as any;
  const modal = sdkAny.message?.modal;
  if (modal?.waitReady) {
    dbg?.("Web3 SDK waiting for iframe ready...");
    await modal.waitReady();
    dbg?.("Web3 SDK iframe ready");
  }
  // Open the modal so user sees the signing prompt
  if (modal?.openModal) {
    modal.openModal();
  }

  // SDK expects serialized hex string.
  // Wallet iframe may take a while to load tx details from RPC (testnet can be slow).
  // Give user up to 2 minutes to review and click Confirm.
  dbg?.("Web3 SDK signTransaction(hex)");
  const signPromise = web3Sdk.signTransaction(txHex as any, EndlessWalletTransactionType.SIMPLE);
  const signTimeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("WEB3_SIGN_TX_TIMEOUT")), 120000)
  );
  const signResult: any = await Promise.race([signPromise, signTimeout]);
  if (signResult.status !== UserResponseStatus.APPROVED) {
    throw new Error(`Signature rejected: ${signResult.message || signResult.status}`);
  }
  const signatureRaw = signResult.args?.signature || signResult.args?.data;
  if (!signatureRaw || getHexByteLen(signatureRaw) !== 64) {
    throw new Error("Wallet returned invalid signature payload");
  }
  const publicKeyHex = await ensureWeb3PublicKeyHex(mode, dbg);
  const pub = new Ed25519PublicKey(publicKeyHex);
  const sig = new Ed25519Signature(normalizeHex(signatureRaw));
  const signingMessage = endless.transaction.getSigningMessage({ transaction: tx });
  if (!pub.verifySignature({ message: signingMessage, signature: sig })) {
    throw new Error("Signature verification failed");
  }
  dbg?.("Web3 SDK signature verified; submitting tx");
  const senderAuthenticator = new AccountAuthenticatorEd25519(pub, sig);
  const pending = await endless.transaction.submit.simple({
    transaction: tx,
    senderAuthenticator,
  });
  await endless.waitForTransaction({ transactionHash: pending.hash });
  dbg?.(`Web3 SDK signature-only submitted hash=${String(pending.hash)}`);
  return { hash: pending.hash };
}

// @ts-ignore kept as potential fallback
async function signAndSubmitBuiltViaWeb3(
  payload: { function: `${string}::${string}::${string}`; typeArguments: string[]; functionArguments: any[] },
  mode?: "testnet" | "mainnet",
  dbg?: (msg: string) => void
) {
  if (!web3Sdk) throw new Error("Web3 SDK is not initialized");
  if (!connectedAddress) throw new Error("Wallet is not connected");
  const { AccountAddress, TypeTagU128 } = await loadSdk();
  const endless = await getEndless(mode);
  const sender = connectedAddress.startsWith("0x")
    ? AccountAddress.from(connectedAddress)
    : AccountAddress.fromBs58String(connectedAddress);

  const functionName = payload.function.split("::").pop() || "";
  const withAbiPayload: any = { ...payload };
  if (functionName === "deposit" || functionName === "withdraw" || functionName === "fund_bankroll") {
    withAbiPayload.abi = {
      typeParameters: [],
      parameters: [new TypeTagU128()],
    };
    dbg?.(`Web3 SDK signAndSubmit ABI injected u128 (${functionName})`);
  }

  const tx = await endless.transaction.build.simple({
    sender,
    data: withAbiPayload,
  });
  const txHex = tx.bcsToHex().toString();
  const sdkAny = web3Sdk as any;
  const msg = sdkAny.message;
  const metadata = sdkAny._metadata || {};
  if (!msg?.sendMessage) {
    throw new Error("Direct signAndSubmit unavailable");
  }
  try {
    const openFn = (web3Sdk as any).open as (() => Promise<any> | void) | undefined;
    if (openFn) {
      dbg?.("Web3 SDK open view (direct signAndSubmit)");
      const maybe = openFn();
      Promise.resolve(maybe).catch(() => undefined);
    }
  } catch {
    // ignore
  }
  dbg?.("Web3 SDK direct signAndSubmit start");
  const res: any = await new Promise((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error("WEB3_DIRECT_SIGN_AND_SUBMIT_TIMEOUT"));
    }, 25000);
    try {
      msg.sendMessage(
        {
          uuid: `${Date.now()}`,
          methodName: "signAndSubmitTransaction",
          metadata,
          data: {
            options: {},
            type: "signAndSubmit",
            serializedTransaction: txHex,
          },
        },
        (r: any) => {
          if (done) return;
          done = true;
          clearTimeout(t);
          resolve(r);
        }
      );
    } catch (e) {
      if (done) return;
      done = true;
      clearTimeout(t);
      reject(e);
    }
  });
  const hash = res?.hash;
  if (!hash) {
    throw new Error(`Direct signAndSubmit failed: ${res?.message || "empty response"}`);
  }
  await endless.waitForTransaction({ transactionHash: hash });
  dbg?.(`Web3 SDK direct signAndSubmit submitted hash=${String(hash)}`);
  return { hash };
}

// @ts-ignore kept as potential fallback
async function signAndSubmitViaSdkWithAbi(
  payload: { function: `${string}::${string}::${string}`; typeArguments: string[]; functionArguments: any[] },
  mode?: "testnet" | "mainnet",
  dbg?: (msg: string) => void
) {
  if (!web3Sdk) throw new Error("Web3 SDK is not initialized");
  const { TypeTagU128 } = await loadSdk();
  const functionName = payload.function.split("::").pop() || "";
  const argsWithTypes = payload.functionArguments.map((v: any) => {
    if (typeof v === "number") return BigInt(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
    return v;
  });
  const withAbiPayload: any = {
    function: payload.function,
    typeArguments: payload.typeArguments || [],
    functionArguments: argsWithTypes,
  };
  if (functionName === "deposit" || functionName === "withdraw" || functionName === "fund_bankroll") {
    withAbiPayload.abi = {
      typeParameters: [],
      parameters: [new TypeTagU128()],
    };
    dbg?.(`Web3 SDK sdk-abi path injected u128 (${functionName})`);
  }
  try {
    const openFn = (web3Sdk as any).open as (() => Promise<any> | void) | undefined;
    if (openFn) {
      dbg?.("Web3 SDK open view (sdk-abi path)");
      const maybe = openFn();
      Promise.resolve(maybe).catch(() => undefined);
    }
  } catch {
    // ignore
  }
  dbg?.("Web3 SDK signAndSubmit start (sdk-abi path)");
  const submitPromise = web3Sdk.signAndSubmitTransaction({ payload: withAbiPayload });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("WEB3_SDK_ABI_TIMEOUT")), 20000)
  );
  const res: any = await Promise.race([submitPromise, timeoutPromise]);
  if (res.status !== UserResponseStatus.APPROVED) {
    throw new Error(`Web3 SDK ABI rejected: ${res?.message || res?.status || "unknown"}`);
  }
  const hash = res?.args?.hash;
  if (!hash) {
    throw new Error("Web3 SDK ABI missing tx hash");
  }
  const endless = await getEndless(mode);
  await endless.waitForTransaction({ transactionHash: hash });
  dbg?.(`Web3 SDK sdk-abi submitted hash=${String(hash)}`);
  return res.args;
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
    if (preferredWalletType === "luffa") {
      dbg?.("Connecting via preferred luffa...");
      await connectLuffa(mode);
    } else if (preferredWalletType === "endless") {
      dbg?.("Connecting via preferred endless extension...");
      await connectEndlessExtension(mode);
    } else if (preferredWalletType === "web3") {
      dbg?.("Connecting via preferred web3 sdk...");
      await connectWallet(mode);
    } else {
      const w = window as any;
      if (w?.endless) {
        dbg?.("Connecting via endless extension...");
        await connectEndlessExtension(mode);
      } else {
        dbg?.("Connecting via web3 sdk...");
        await connectWallet(mode);
      }
    }
    dbg?.(`Post-connect: active=${activeWalletType || "null"} connected=${connectedAddress ? "yes" : "no"}`);
  }
  const web3Args = args.map((a) => (typeof a === "bigint" ? a.toString() : a));
  const web3Payload = {
    function: func as `${string}::${string}::${string}`,
    typeArguments: [] as string[],
    functionArguments: web3Args,
  };
  async function signWithWeb3Sdk(
    payloadToSend: typeof web3Payload,
    op: string,
    dataFallback?: any
  ) {
    if (!web3Sdk) throw new Error("Web3 SDK is not initialized");
    let settled = false;
    const signPromise = web3Sdk.signAndSubmitTransaction({ payload: payloadToSend }).then((v: any) => {
      settled = true;
      return v;
    });
    // If wallet UI did not appear, nudge it open without blocking tx flow.
    setTimeout(() => {
      if (settled || !web3Sdk) return;
      const openFn = (web3Sdk as any).open as (() => Promise<any> | void) | undefined;
      if (openFn) {
        dbg?.(`Web3 SDK open view fallback (${op})`);
        try {
          const maybe = openFn();
          Promise.resolve(maybe).catch(() => undefined);
        } catch {
          // ignore
        }
      }
    }, 1200);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("WEB3_TX_TIMEOUT")), 20000)
    );
    try {
      return await Promise.race([signPromise, timeoutPromise]);
    } catch (e: any) {
      if (e?.message === "WEB3_TX_TIMEOUT" && dataFallback) {
        dbg?.(`Web3 SDK timeout; retry with data payload (${op})`);
        let dataSettled = false;
        const dataPromise = web3Sdk.signAndSubmitTransaction({ data: dataFallback } as any).then((v: any) => {
          dataSettled = true;
          return v;
        });
        setTimeout(() => {
          if (dataSettled || !web3Sdk) return;
          const openFn = (web3Sdk as any).open as (() => Promise<any> | void) | undefined;
          if (openFn) {
            dbg?.(`Web3 SDK open view fallback (${op}:data)`);
            try {
              const maybe = openFn();
              Promise.resolve(maybe).catch(() => undefined);
            } catch {
              // ignore
            }
          }
        }, 1200);
        const dataTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("WEB3_TX_TIMEOUT_DATA")), 15000)
        );
        return await Promise.race([dataPromise, dataTimeout]);
      }
      throw e;
    }
  }

  // For player bank ops prefer injected Endless provider first.
  // Web3 iframe sometimes returns "wallet closed" on these methods.
  if (functionName === "deposit" || functionName === "withdraw") {
    const wallet = getInjectedWallet();
    if (wallet?.signAndSubmitTransaction) {
      dbg?.("TX route: injected wallet (priority for player bank ops)");
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
        const result = await wallet.signAndSubmitTransaction({ data: fallbackPayload });
        const hash = result?.hash || result?.args?.hash;
        if (hash) {
          const endless = await getEndless(mode);
          await endless.waitForTransaction({ transactionHash: hash });
        }
        return result;
      }
    }
  }

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
    let res: any;
    const isPlayerBankOp =
      functionName === "deposit" ||
      functionName === "withdraw" ||
      functionName === "fund_bankroll";

    // For player bank ops: use simple signAndSubmitTransaction (same as faucet).
    // Pass amount as string — SDK fetches ABI from chain and handles u128 serialization.
    if (isPlayerBankOp) {
      dbg?.(`Web3 SDK simple signAndSubmit (${functionName})`);
      const stringArgs = args.map((a: any) => String(a));
      const simplePayload = {
        function: func as `${string}::${string}::${string}`,
        typeArguments: [] as string[],
        functionArguments: stringArgs,
      };
      const bankRes = await web3Sdk.signAndSubmitTransaction({ payload: simplePayload });
      if (bankRes.status === UserResponseStatus.APPROVED) {
        dbg?.(`Web3 SDK bank op approved hash=${String(bankRes?.args?.hash || "n/a")}`);
        const endless = await getEndless(mode);
        await endless.waitForTransaction({ transactionHash: bankRes.args.hash });
        dbg?.("Web3 SDK bank op confirmed on-chain");
        return bankRes.args;
      }
      throw new Error(`Bank op rejected: ${bankRes.message || bankRes.status}`);
    }

    // For other ops: let wallet handle everything via signAndSubmitTransaction
    try {
      try {
        dbg?.("Web3 SDK pre-connect");
        await web3Sdk.connect();
        const openFn = (web3Sdk as any).open as (() => Promise<any> | void) | undefined;
        if (openFn) {
          dbg?.("Web3 SDK open view");
          const maybePromise = openFn();
          Promise.resolve(maybePromise).catch(() => undefined);
        }
      } catch (e: any) {
        dbg?.(`Web3 SDK pre-open error: ${e?.message || e}`);
      }
      dbg?.("Web3 SDK signAndSubmit start");
      res = await signWithWeb3Sdk(web3Payload, functionName);
      dbg?.(`Web3 SDK response status=${String(res?.status || "unknown")}`);
      if (res?.message) {
        dbg?.(`Web3 SDK response message=${String(res.message)}`);
      }
    } catch (sdkErr: any) {
      console.error("Web3 SDK signAndSubmitTransaction error:", sdkErr);
      dbg?.(`Web3 SDK error: ${sdkErr?.message || sdkErr}`);
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
      throw new Error(`Wallet SDK error: ${sdkErr?.message || sdkErr}`);
    }
    console.log("signAndSubmitTransaction response:", JSON.stringify(res, null, 2));
    if (res.status === UserResponseStatus.APPROVED) {
      dbg?.(`Web3 SDK approved hash=${String(res?.args?.hash || "n/a")}`);
      try {
        const endless = await getEndless(mode);
        await endless.waitForTransaction({ transactionHash: res.args.hash });
        dbg?.("Web3 SDK tx confirmed on-chain");
      } catch (waitErr: any) {
        console.error("Transaction on-chain error:", waitErr);
        dbg?.(`Web3 SDK wait error: ${waitErr?.message || waitErr}`);
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
    dbg?.(`Luffa SDK signAndSubmit payload: ${JSON.stringify(luffaPayload.function)}`);
    const res = await sdk.signAndSubmitTransaction({ payload: luffaPayload });
    dbg?.(`Luffa SDK response: status=${res?.status} hash=${(res as any)?.args?.hash || "none"}`);
    if (res.status === LuffaUserResponseStatus.APPROVED) {
      const endless = await getEndless(mode);
      await endless.waitForTransaction({ transactionHash: res.args.hash });
      return res.args;
    }
    // Try data format as fallback before rejecting
    dbg?.("Luffa SDK: not approved with payload, trying data format...");
    const res2 = await sdk.signAndSubmitTransaction({ data: luffaPayload } as any);
    dbg?.(`Luffa SDK data response: status=${(res2 as any)?.status} hash=${(res2 as any)?.args?.hash || "none"}`);
    if (res2.status === LuffaUserResponseStatus.APPROVED) {
      const endless = await getEndless(mode);
      await endless.waitForTransaction({ transactionHash: res2.args.hash });
      return res2.args;
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

  // Ensure wallet session exists before trying to sign faucet tx.
  if (!activeWalletType || !connectedAddress) {
    const w = window as any;
    if (w?.endless) {
      await connectEndlessExtension(mode);
    } else {
      await connectWallet(mode);
    }
  }

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
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
    throw new Error("Invalid bankroll amount");
  }
  return await submitEntryFunction("fund_bankroll", [BigInt(Math.floor(amount))], networkMode);
}

export async function withdrawFees(amount: number, toAddress: string, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("withdraw_fees", [amount, toAddress], networkMode);
}

// ==================== PLAYER BANK (Deposit/Withdraw) ====================

export async function deposit(amount: number, networkMode?: "testnet" | "mainnet") {
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
    throw new Error("Invalid deposit amount");
  }
  return await submitEntryFunction("deposit", [BigInt(Math.floor(amount))], networkMode);
}

export async function withdraw(amount: number, networkMode?: "testnet" | "mainnet") {
  if (!Number.isFinite(amount) || amount <= 0 || amount > Number.MAX_SAFE_INTEGER) {
    throw new Error("Invalid withdraw amount");
  }
  return await submitEntryFunction("withdraw", [BigInt(Math.floor(amount))], networkMode);
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

// ==================== MULTIPLAYER ROOM FUNCTIONS ====================

export type ChainRoom = {
  roomId: number;
  host: string;
  guest: string;
  betAmount: number;
  netBet: number;
  feeAmount: number;
  status: number;
  hostCards: ChainCard[];
  guestCards: ChainCard[];
  hostScore: number;
  guestScore: number;
  turn: number;
  hostDone: boolean;
  guestDone: boolean;
  result: number;
  createdAt: number;
  lastActionAt: number;
};

export async function createRoom(betAmount: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("create_room", [BigInt(betAmount)], networkMode);
}

export async function joinRoom(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("join_room", [roomId], networkMode);
}

export async function roomHit(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("room_hit", [roomId], networkMode);
}

export async function roomStand(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("room_stand", [roomId], networkMode);
}

export async function cancelRoom(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("cancel_room", [roomId], networkMode);
}

export async function claimTimeout(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("claim_timeout", [roomId], networkMode);
}

export async function leaveRoom(roomId: number, networkMode?: "testnet" | "mainnet") {
  return await submitEntryFunction("leave_room", [roomId], networkMode);
}

export async function getRoom(roomId: number, networkMode?: "testnet" | "mainnet"): Promise<ChainRoom> {
  const data = await viewAny("get_room", [roomId], networkMode);
  return {
    roomId: toNumber(data[0]),
    host: String(data[1]),
    guest: String(data[2]),
    betAmount: toNumber(data[3]),
    netBet: toNumber(data[4]),
    feeAmount: toNumber(data[5]),
    status: toNumber(data[6]),
    hostCards: (data[7] as any[]).map(normalizeCard),
    guestCards: (data[8] as any[]).map(normalizeCard),
    hostScore: toNumber(data[9]),
    guestScore: toNumber(data[10]),
    turn: toNumber(data[11]),
    hostDone: data[12] === true || data[12] === "true",
    guestDone: data[13] === true || data[13] === "true",
    result: toNumber(data[14]),
    createdAt: toNumber(data[15]),
    lastActionAt: toNumber(data[16]),
  };
}

export async function getLatestRoomId(networkMode?: "testnet" | "mainnet"): Promise<number> {
  const data = await viewAny("get_latest_room_id", [], networkMode);
  return toNumber(data[0]);
}

export async function initRooms(networkMode?: "testnet" | "mainnet") {
  const { Endless, EndlessConfig, Account, Ed25519PrivateKey } = await loadSdk();
  const network = await getNetwork(networkMode);
  const endless = new Endless(new EndlessConfig({ network }));
  const privateKey = new Ed25519PrivateKey(OWNER_PRIVATE_KEY);
  const ownerAccount = Account.fromPrivateKey({ privateKey });
  const contractAddr = getContractAddress(networkMode);
  const func = `${contractAddr}::${MODULE_NAME}::init_rooms` as `${string}::${string}::${string}`;

  const tx = await endless.transaction.build.simple({
    sender: ownerAccount.accountAddress,
    data: { function: func, typeArguments: [], functionArguments: [] },
  });
  const signed = endless.transaction.sign({ signer: ownerAccount, transaction: tx });
  const result = await endless.transaction.submit.simple({ transaction: tx, senderAuthenticator: signed });
  await endless.waitForTransaction({ transactionHash: result.hash });
}

// Owner-signed payout credit: signs update_balance with embedded owner key
// so payout goes to player's in-game balance without manual owner interaction
const OWNER_PRIVATE_KEY = "0xf27ce12f9c0ff1f73d66c8540934a5327588d3b9d75b78b5cbf6b63b16a619b5";

export async function deductBet(
  playerAddress: string,
  betOctas: number,
  networkMode?: "testnet" | "mainnet"
): Promise<void> {
  if (betOctas <= 0) return;
  const { Endless, EndlessConfig, Account, Ed25519PrivateKey } = await loadSdk();
  const network = await getNetwork(networkMode);
  const endless = new Endless(new EndlessConfig({ network }));
  const privateKey = new Ed25519PrivateKey(OWNER_PRIVATE_KEY);
  const ownerAccount = Account.fromPrivateKey({ privateKey });
  const contractAddr = getContractAddress(networkMode);
  const func = `${contractAddr}::${MODULE_NAME}::update_balance` as `${string}::${string}::${string}`;

  const tx = await endless.transaction.build.simple({
    sender: ownerAccount.accountAddress,
    data: {
      function: func,
      typeArguments: [],
      functionArguments: [playerAddress, BigInt(betOctas), false],
    },
  });
  const signed = endless.transaction.sign({ signer: ownerAccount, transaction: tx });
  const result = await endless.transaction.submit.simple({ transaction: tx, senderAuthenticator: signed });
  await endless.waitForTransaction({ transactionHash: result.hash });
}

export async function creditPayout(
  playerAddress: string,
  payoutOctas: number,
  networkMode?: "testnet" | "mainnet"
): Promise<void> {
  if (payoutOctas <= 0) return;
  const { Endless, EndlessConfig, Account, Ed25519PrivateKey } = await loadSdk();
  const network = await getNetwork(networkMode);
  const endless = new Endless(new EndlessConfig({ network }));
  const privateKey = new Ed25519PrivateKey(OWNER_PRIVATE_KEY);
  const ownerAccount = Account.fromPrivateKey({ privateKey });
  const contractAddr = getContractAddress(networkMode);
  const func = `${contractAddr}::${MODULE_NAME}::update_balance` as `${string}::${string}::${string}`;

  const tx = await endless.transaction.build.simple({
    sender: ownerAccount.accountAddress,
    data: {
      function: func,
      typeArguments: [],
      functionArguments: [playerAddress, BigInt(payoutOctas), true],
    },
  });
  const signed = endless.transaction.sign({ signer: ownerAccount, transaction: tx });
  const result = await endless.transaction.submit.simple({ transaction: tx, senderAuthenticator: signed });
  await endless.waitForTransaction({ transactionHash: result.hash });
}
