# Endless Pixel Blackjack

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗███╗   ██╗██████╗ ██╗     ███████╗███████╗███████╗║
║     ██╔════╝████╗  ██║██╔══██╗██║     ██╔════╝██╔════╝██╔════╝║
║     █████╗  ██╔██╗ ██║██║  ██║██║     █████╗  ███████╗███████╗║
║     ██╔══╝  ██║╚██╗██║██║  ██║██║     ██╔══╝  ╚════██║╚════██║║
║     ███████╗██║ ╚████║██████╔╝███████╗███████╗███████║███████║║
║     ╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝║
║                                                               ║
║         ██████╗ ██╗██╗  ██╗███████╗██╗                        ║
║         ██╔══██╗██║╚██╗██╔╝██╔════╝██║                        ║
║         ██████╔╝██║ ╚███╔╝ █████╗  ██║                        ║
║         ██╔═══╝ ██║ ██╔██╗ ██╔══╝  ██║                        ║
║         ██║     ██║██╔╝ ██╗███████╗███████╗                   ║
║         ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝                   ║
║                                                               ║
║       ██████╗ ██╗      █████╗  ██████╗██╗  ██╗                ║
║       ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝                ║
║       ██████╔╝██║     ███████║██║     █████╔╝                 ║
║       ██╔══██╗██║     ██╔══██║██║     ██╔═██╗                 ║
║       ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗                ║
║       ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝                ║
║                         JACK                                  ║
║                                                               ║
║               Web3 Card Game on Endless Blockchain            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

## By Huckof1

[![GitHub](https://img.shields.io/badge/GitHub-huckof1-181717?style=for-the-badge&logo=github)](https://github.com/huckof1)
[![X](https://img.shields.io/badge/X-huckof1-000000?style=for-the-badge&logo=x)](https://x.com/huckof1)

---

## Description

**Endless Pixel Blackjack** — Web3 карточная игра с пиксельной графикой на блокчейне Endless:

- Ставки в токенах **EDS**
- Смарт-контракт на **Move**
- Статистика игрока на блокчейне
- Честная генерация карт
- 8-bit звуковые эффекты
- Адаптивный дизайн (Web + Mobile)

---

## Game Rules

| Правило | Описание |
|---------|----------|
| **Цель** | Набрать 21 очко или ближе к 21, чем дилер |
| **Карты** | 2-10 = номинал, J/Q/K = 10, Туз = 1 или 11 |
| **Hit** | Взять ещё карту |
| **Stand** | Остановиться |
| **Blackjack** | Туз + 10 = моментальная победа (x2.5) |
| **Bust** | Более 21 очка = проигрыш |

---

## Project Structure

```
GenGame/
├── move/
│   ├── sources/
│   │   └── blackjack.move    # Smart Contract (Move)
│   └── Move.toml             # Move Configuration
├── web/
│   ├── src/
│   │   ├── config.ts         # Configuration
│   │   ├── game.ts           # Game Logic + SDK
│   │   ├── sounds.ts         # Sound System
│   │   └── main.ts           # UI Logic
│   ├── index.html            # Pixel UI
│   ├── style.css             # Pixel Styles
│   ├── package.json          # Dependencies
│   └── .env.example          # Environment Variables
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Endless CLI](https://github.com/endless-labs/endless-release/releases)

### 1. Deploy Smart Contract

```bash
cd move

# Initialize account (select testnet)
endless init

# Compile contract
endless move compile

# Publish to testnet
endless move publish
```

Copy the contract address from output.

### 2. Setup Frontend

```bash
cd web

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env - add your contract address
# VITE_CONTRACT_ADDRESS=your_contract_address

# Start dev server
npm run dev
```

Open http://localhost:3000

---

## Technologies

| Component | Technology |
|-----------|------------|
| **Blockchain** | Endless |
| **Smart Contract** | Move |
| **Frontend** | TypeScript + Vite |
| **SDK** | @endlesslab/endless-ts-sdk |
| **Styling** | CSS (Press Start 2P font) |
| **Sound** | Web Audio API |

---

## Smart Contract Functions

### Entry Functions

| Function | Description |
|----------|-------------|
| `start_game(bet)` | Start new game with bet |
| `hit(game_id)` | Draw a card |
| `stand(game_id)` | End turn |

### View Functions

| Function | Description |
|----------|-------------|
| `get_game(id)` | Get game state |
| `get_player_stats(addr)` | Player statistics |
| `get_treasury_balance()` | Casino balance |

---

## Payouts

| Result | Payout |
|--------|--------|
| **Win** | x2 bet |
| **Blackjack** | x2.5 bet |
| **Draw** | Return bet |
| **Lose** | 0 |

---

## Sound Effects

8-bit style sounds from [Mixkit](https://mixkit.co/):
- Card dealing
- Chip sounds
- Win/Lose fanfares
- Blackjack celebration
- Background music (optional)

---

## Responsive Design

- **Desktop**: Full experience
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly UI
- **Landscape**: Compact mode
- **iPhone X+**: Safe area support

---

## Links

- [Endless Docs](https://docs.endless.link/)
- [Endless GitHub](https://github.com/endless-labs/)
- [Sabma Labs](https://github.com/sabma-labs)
- [Move Language](https://move-language.github.io/move/)

---

## License

MIT License

---

## Author

**Huckof1**

- GitHub: [github.com/huckof1](https://github.com/huckof1)
- X: [x.com/huckof1](https://x.com/huckof1)

---

<div align="center">

**Powered by Endless Blockchain**

[![Endless](https://img.shields.io/badge/Endless-Blockchain-8b5cf6?style=for-the-badge)](https://endless.link/)

</div>
