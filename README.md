# Endless Pixel Blackjack v2.0

**Multiplayer Edition** - Web3 Card Game on Endless Blockchain

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

## 🎮 Quick Start

**Scan QR code with Luffa app to start playing:**

![QR Code](qr/endless-black-qr.png)

**Or visit:** https://endless-black.vercel.app/

**Don't have Luffa?** Download at https://www.luffa.im/

---

## 👥 PvP Invitation

**To play with a friend:**

1. Click **"INVITE TO GAME"** in the app
2. Enter your bet amount
3. Click **"SEND INVITE"**
4. Download the QR code and send it to your friend
5. Your friend scans the QR with Luffa app
6. Game starts when both players are ready!

**The invitation QR contains:**
- Your username
- Bet amount
- Room ID
- Game mode (testnet/mainnet)

---

## Description

**Endless Pixel Blackjack** is a Web3 card game with pixel graphics on the Endless blockchain:

- Bet in **EDS** tokens
- Smart contract in **Move**
- Player stats on-chain
- Fair card generation
- 8-bit sound effects
- Adaptive design (Web + Mobile)

---

## Game Rules

| Rule | Description |
|------|-------------|
| **Goal** | Get 21 points or closer to 21 than the dealer |
| **Cards** | 2-10 = face value, J/Q/K = 10, Ace = 1 or 11 |
| **Hit** | Take another card |
| **Stand** | Hold your hand |
| **Blackjack** | Ace + 10 = instant win (x2.5) |
| **Bust** | Over 21 points = loss |

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

> ### macOS Note (project rule)
> On this project we do **not** use local `endless` CLI on macOS (binary compatibility issues).
> Contract deployment is done **manually via GitHub Actions** (`.github/workflows/deploy-contract.yml`).
> Use workflow dispatch and confirm with input: `deploy`.

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
