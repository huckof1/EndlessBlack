/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_CONTRACT_ADDRESS_TESTNET?: string;
  readonly VITE_CONTRACT_ADDRESS_MAINNET?: string;
  readonly VITE_ENDLESS_NETWORK?: string;
  readonly VITE_LS_PUBLIC_KEY?: string;
  readonly VITE_LS_CLUSTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
