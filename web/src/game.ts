// Игровая логика Endless Pixel Blackjack
// By Huckof1
// DEMO MODE - работает без блокчейна для тестирования UI

import { SUITS, RANKS, RESULTS, formatEDS } from "./config";

// Тип карты
interface Card {
  suit: number;
  rank: number;
}

// Состояние игры
interface GameState {
  gameId: number;
  playerCards: Card[];
  dealerCards: Card[];
  playerScore: number;
  dealerScore: number;
  betAmount: number;
  netBet: number;
  feeAmount: number;
  payoutDue: number;
  isClaimed: boolean;
  isFinished: boolean;
  result: number;
}

// Статистика игрока
interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  blackjacks: number;
  totalWon: number;
  totalLost: number;
}

// Класс игры (DEMO MODE)
export class PixelBlackjack {
  private currentGame: GameState | null = null;
  private walletAddress: string = "";
  private balance: number = 10000000000; // 100 EDS для демо
  private stats: PlayerStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    blackjacks: 0,
    totalWon: 0,
    totalLost: 0,
  };
  private deck: Card[] = [];
  private treasury: number = 0;
  private bankroll: number = 0;
  private feeBps: number = 200; // 2%
  private defaultStats: PlayerStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    blackjacks: 0,
    totalWon: 0,
    totalLost: 0,
  };
  private defaultBalance = 12500000000; // 125 EDS
  private defaultTreasury = 500000000; // 5 EDS
  private defaultBankroll = 50000000000; // 500 EDS

  constructor() {
    // Загрузка статистики из localStorage
    const savedStats = localStorage.getItem("pixelBlackjackStats");
    if (savedStats) {
      this.stats = JSON.parse(savedStats);
    } else {
      // Стартовые демо-данные
      this.stats = { ...this.defaultStats };
      this.saveStats();
    }
    const savedBalance = localStorage.getItem("pixelBlackjackBalance");
    if (savedBalance) {
      this.balance = parseInt(savedBalance);
    } else {
      this.balance = this.defaultBalance;
      this.saveBalance();
    }

    const savedTreasury = localStorage.getItem("pixelBlackjackTreasury");
    if (savedTreasury) {
      this.treasury = parseInt(savedTreasury);
    } else {
      this.treasury = this.defaultTreasury;
      this.saveTreasury();
    }

    const savedBankroll = localStorage.getItem("pixelBlackjackBankroll");
    if (savedBankroll) {
      this.bankroll = parseInt(savedBankroll);
    } else {
      this.bankroll = this.defaultBankroll;
      this.saveBankroll();
    }

    const savedGame = localStorage.getItem("pixelBlackjackCurrentGame");
    const savedDeck = localStorage.getItem("pixelBlackjackDeck");
    if (savedGame && savedDeck) {
      try {
        this.currentGame = JSON.parse(savedGame);
        this.deck = JSON.parse(savedDeck);
      } catch {
        this.currentGame = null;
        this.deck = [];
      }
    }
    if (
      this.currentGame &&
      this.currentGame.isFinished &&
      this.currentGame.payoutDue > 0 &&
      !this.currentGame.isClaimed
    ) {
      this.applyPayout(this.currentGame.payoutDue);
      this.currentGame.payoutDue = 0;
      this.currentGame.isClaimed = true;
      this.saveCurrentGame();
    }

  }

  // Создание колоды
  private createDeck(): void {
    this.deck = [];
    for (let suit = 0; suit < 4; suit++) {
      for (let rank = 1; rank <= 13; rank++) {
        this.deck.push({ suit, rank });
      }
    }
    // Перемешивание
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  // Взять карту из колоды
  private drawCard(): Card {
    if (this.deck.length === 0) {
      this.createDeck();
    }
    return this.deck.pop()!;
  }

  // Подсчёт очков
  private calculateScore(cards: Card[]): number {
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

    // Тузы: если перебор, считаем за 1
    while (aces > 0 && score > 21) {
      score -= 10;
      aces--;
    }

    return score;
  }

  // Подключение кошелька (DEMO)
  async connectWallet(): Promise<string> {
    // Симуляция задержки подключения
    await this.delay(800);

    // Генерация случайного адреса для демо
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let address = "";
    for (let i = 0; i < 64; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.walletAddress = address;

    return this.walletAddress;
  }

  // Получить баланс
  async getBalance(): Promise<string> {
    return formatEDS(this.balance);
  }

  // Начать игру
  async startGame(betAmount: number): Promise<GameState> {
    await this.delay(300);

    // Проверка баланса
    if (betAmount > this.balance) {
      throw new Error("Недостаточно средств");
    }

    // Списание ставки
    this.balance -= betAmount;
    this.saveBalance();

    // Создание новой колоды
    this.createDeck();

    // Раздача карт
    const playerCards: Card[] = [this.drawCard(), this.drawCard()];
    const dealerCards: Card[] = [this.drawCard(), this.drawCard()];

    const playerScore = this.calculateScore(playerCards);
    const dealerScore = this.calculateScore(dealerCards);

    this.currentGame = {
      gameId: Date.now(),
      playerCards,
      dealerCards,
      playerScore,
      dealerScore,
      betAmount,
      netBet: 0,
      feeAmount: 0,
      payoutDue: 0,
      isClaimed: false,
      isFinished: false,
      result: 0,
    };

    const feeAmount = Math.floor(betAmount * this.feeBps / 10000);
    const netBet = betAmount - feeAmount;
    this.currentGame.netBet = netBet;
    this.currentGame.feeAmount = feeAmount;
    this.treasury += feeAmount;
    this.bankroll += netBet;
    this.saveTreasury();
    this.saveBankroll();
    this.saveCurrentGame();

    // Проверка на блэкджек
    if (playerScore === 21) {
      this.currentGame.isFinished = true;
      this.currentGame.result = 4; // Блэкджек

      // Выплата 2.5x (от полной ставки, комиссия уже снята отдельно)
      const payout = Math.floor(betAmount * 2.5);
      this.currentGame.payoutDue = payout;
      this.applyPayout(payout);
      this.currentGame.payoutDue = 0;
      this.currentGame.isClaimed = true;

      // Статистика
      this.stats.totalGames++;
      this.stats.wins++;
      this.stats.blackjacks++;
      this.stats.totalWon += payout - betAmount;
      this.saveStats();
      this.saveCurrentGame();
    }

    return this.currentGame;
  }

  // Взять карту
  async hit(): Promise<GameState> {
    if (!this.currentGame || this.currentGame.isFinished) {
      throw new Error("Нет активной игры");
    }

    await this.delay(200);

    // Добавляем карту
    const newCard = this.drawCard();
    this.currentGame.playerCards.push(newCard);
    this.currentGame.playerScore = this.calculateScore(this.currentGame.playerCards);

    // Проверка на перебор
    if (this.currentGame.playerScore > 21) {
      this.currentGame.isFinished = true;
      this.currentGame.result = 2; // Проигрыш
      this.currentGame.payoutDue = 0;
      this.currentGame.isClaimed = false;

      // Статистика
      this.stats.totalGames++;
      this.stats.losses++;
      this.stats.totalLost += this.currentGame.betAmount;
      this.saveStats();
      this.saveCurrentGame();
    } else {
      this.saveCurrentGame();
    }

    return this.currentGame;
  }

  // Остановиться
  async stand(): Promise<GameState> {
    if (!this.currentGame || this.currentGame.isFinished) {
      throw new Error("Нет активной игры");
    }

    await this.delay(300);

    // Ход дилера - берёт карты пока < 17
    while (this.currentGame.dealerScore < 17) {
      await this.delay(400);
      const newCard = this.drawCard();
      this.currentGame.dealerCards.push(newCard);
      this.currentGame.dealerScore = this.calculateScore(this.currentGame.dealerCards);
    }

    // Определение победителя
    const playerScore = this.currentGame.playerScore;
    const dealerScore = this.currentGame.dealerScore;
    const bet = this.currentGame.betAmount;

    let result: number;
    let payout: number;

    if (dealerScore > 21) {
      // Дилер перебрал
      result = 1;
      payout = bet * 2;
    } else if (playerScore > dealerScore) {
      // Игрок ближе к 21
      result = 1;
      payout = bet * 2;
    } else if (playerScore < dealerScore) {
      // Дилер ближе к 21
      result = 2;
      payout = 0;
    } else {
      // Ничья — возврат полной ставки
      result = 3;
      payout = bet;
    }

    this.currentGame.isFinished = true;
    this.currentGame.result = result;
    this.currentGame.payoutDue = payout;
    if (payout > 0) {
      this.applyPayout(payout);
      this.currentGame.payoutDue = 0;
      this.currentGame.isClaimed = true;
    } else {
      this.currentGame.isClaimed = false;
    }

    // Выплата по запросу

    // Статистика
    this.stats.totalGames++;
    if (result === 1) {
      this.stats.wins++;
      this.stats.totalWon += payout - bet;
    } else if (result === 2) {
      this.stats.losses++;
      this.stats.totalLost += bet;
    } else {
      this.stats.draws++;
    }
    this.saveStats();
    this.saveCurrentGame();

    return this.currentGame;
  }

  // Получить статистику
  async getStats(): Promise<PlayerStats> {
    return this.stats;
  }

  // Получить статистику синхронно (для UI)
  getCurrentStats(): PlayerStats {
    return this.stats;
  }

  // Форматирование карты для отображения
  formatCard(card: Card): string {
    return `${RANKS[card.rank]}${SUITS[card.suit]}`;
  }

  // Получить текст результата
  getResultText(result: number): string {
    return RESULTS[result as keyof typeof RESULTS] || "Неизвестно";
  }

  // Текущее состояние
  getCurrentGame(): GameState | null {
    return this.currentGame;
  }

  // Забрать выигрыш
  async claimPayout(): Promise<GameState> {
    if (!this.currentGame || !this.currentGame.isFinished) {
      throw new Error("Нет завершенной игры");
    }
    if (this.currentGame.payoutDue <= 0 || this.currentGame.isClaimed) {
      throw new Error("Нет выплаты");
    }
    await this.delay(200);
    const payout = this.currentGame.payoutDue;
    this.applyPayout(payout);
    this.currentGame.isClaimed = true;
    this.currentGame.payoutDue = 0;
    this.saveCurrentGame();
    return this.currentGame;
  }

  // Добавить баланс в EDS (для мультиплеера/демо)
  addBalanceEDS(eds: number): void {
    if (!Number.isFinite(eds) || eds <= 0) return;
    const amount = Math.floor(parseFloat(eds.toString()) * 100000000);
    if (amount <= 0) return;
    this.balance += amount;
    this.saveBalance();
  }

  // Claim on-chain (stub for integration)
  async claimPayoutOnChain(): Promise<void> {
    await this.delay(200);
  }

  private applyPayout(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.balance += amount;
    this.bankroll = Math.max(0, this.bankroll - amount);
    this.saveBalance();
    this.saveBankroll();
  }

  // Сохранение статистики
  private saveStats(): void {
    localStorage.setItem("pixelBlackjackStats", JSON.stringify(this.stats));
  }

  // Сохранение баланса
  private saveBalance(): void {
    localStorage.setItem("pixelBlackjackBalance", this.balance.toString());
  }

  private saveTreasury(): void {
    localStorage.setItem("pixelBlackjackTreasury", this.treasury.toString());
  }

  private saveBankroll(): void {
    localStorage.setItem("pixelBlackjackBankroll", this.bankroll.toString());
  }

  // Сохранение текущей игры и колоды
  private saveCurrentGame(): void {
    if (!this.currentGame) return;
    localStorage.setItem("pixelBlackjackCurrentGame", JSON.stringify(this.currentGame));
    localStorage.setItem("pixelBlackjackDeck", JSON.stringify(this.deck));
  }

  // Очистка сохранённой игры
  private clearCurrentGame(): void {
    localStorage.removeItem("pixelBlackjackCurrentGame");
    localStorage.removeItem("pixelBlackjackDeck");
  }

  // Сброс демо-данных
  resetDemo(): void {
    this.currentGame = null;
    this.stats = { ...this.defaultStats };
    this.balance = this.defaultBalance;
    this.treasury = this.defaultTreasury;
    this.bankroll = this.defaultBankroll;
    this.saveStats();
    this.saveBalance();
    this.saveTreasury();
    this.saveBankroll();
    this.clearCurrentGame();
  }

  // Сброс только текущей игры (без статистики и балансов)
  resetCurrentGame(): void {
    this.currentGame = null;
    this.deck = [];
    this.clearCurrentGame();
  }

  getTreasury(): number {
    return this.treasury;
  }

  getBankroll(): number {
    return this.bankroll;
  }

  getFeeBps(): number {
    return this.feeBps;
  }

  // Утилита задержки
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Экспорт singleton
export const game = new PixelBlackjack();
