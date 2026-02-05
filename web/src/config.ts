// Конфигурация Pixel Blackjack

// Релизный режим (без кошельков и без демо)
export const RELEASE_MODE = false;

// Демо-режим (без блокчейна)
export const DEMO_MODE = !RELEASE_MODE;

// Адрес контракта (общий, если не указаны testnet/mainnet отдельно)
export const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// Адреса по сетям (опционально)
export const CONTRACT_ADDRESS_TESTNET =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS_TESTNET || CONTRACT_ADDRESS;
export const CONTRACT_ADDRESS_MAINNET =
  (import.meta as any).env?.VITE_CONTRACT_ADDRESS_MAINNET || CONTRACT_ADDRESS;

// Модуль контракта
export const MODULE_NAME = "blackjack";

// Сеть
export const NETWORK = "testnet"; // или "mainnet"

// Минимальная ставка (0.1 EDS = 10000000 octas)
export const MIN_BET = 10000000;

// Максимальная ставка (10000 EDS)
export const MAX_BET = 1000000000000;

// Multiplayer (LatteStream)
export const LS_PUBLIC_KEY = import.meta.env.VITE_LS_PUBLIC_KEY || "";
export const LS_CLUSTER = import.meta.env.VITE_LS_CLUSTER || "eu1";
export const LS_WS_URL = `wss://ws-${LS_CLUSTER}.lattestream.com`;

// Масти карт
export const SUITS = ["♠", "♥", "♦", "♣"];
export const SUIT_NAMES = ["Пики", "Черви", "Бубны", "Трефы"];

// Ранги карт
export const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Результаты игры
export const RESULTS = {
  0: "В процессе",
  1: "Победа!",
  2: "Поражение",
  3: "Ничья",
  4: "БЛЭКДЖЕК!"
};

// EDS к человеческому формату
export function formatEDS(octas: number): string {
  return (octas / 100000000).toFixed(2) + " EDS";
}

// Человеческий формат к EDS
export function parseEDS(eds: string): number {
  return Math.floor(parseFloat(eds) * 100000000);
}
