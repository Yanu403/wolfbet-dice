# WolfBet Dice Bot

A **Terminal User Interface (TUI)** bot for playing dice on [WolfBet](https://wolfbet.com), written in Node.js. Features a rich terminal interface powered by `blessed`, with real-time dashboards, bet logging, and multiple betting strategies.

---

## ⚠️ Disclaimer

This bot is for **educational purposes only**. Gambling carries significant financial risk. Never bet more than you can afford to lose. Use at your own risk.

---

## TUI Layout

```
┌─────────────────────┬─────────────────────────────────────────────┐
│  Menu               │  Dashboard                                  │
│                     │                                             │
│  1. Start / Stop    │  Username:     user123                      │
│  2. Stop on Win     │  Balance:      0.00123456 BTC               │
│  3. Settings        │  Currency:     BTC                          │
│  4. Exit            │  Current Bet:  0.00000100 BTC               │
│                     │  Total Bets:   42                           │
│                     │  Wins/Losses:  28 / 14                      │
│                     │  Profit/Loss:  +0.00004200 BTC              │
│  Bot: RUNNING       │  Strategy:     martingale                   │
│                     │  Win Streak:   3                            │
│                     │  Loss Streak:  0                            │
│                     │  Nonce:        1337                         │
│                     ├─────────────────────────────────────────────┤
│                     │  Log                                        │
│                     │  [12:34:56] Bot started.                    │
│                     │  [12:34:57] ✓ WIN  Bet: 0.00000100 | ...   │
│                     │  [12:34:58] ✗ LOSS Bet: 0.00000200 | ...   │
└─────────────────────┴─────────────────────────────────────────────┘
```

---

## Features

- **TUI Interface**: Rich terminal UI with left menu, dashboard, and live log panel
- **Multiple Strategies**:
  - **Flat** — Always bet the same base amount
  - **Martingale** — Double on loss, reset on win
  - **Fibonacci** — Follow Fibonacci sequence on loss, go back 2 steps on win
  - **D'Alembert** — Increase by unit on loss, decrease by unit on win
  - **Custom** — User-defined on-win and on-loss multipliers
- **Stop on Win** — Automatically stop after a win
- **Rate Limit Handling** — Auto-detects API rate limits and pauses betting
- **Config Persistence** — Settings saved to `config.json`
- **Real-time Dashboard** — Live balance, bets, profit/loss, streaks, nonce

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- A WolfBet account with an API Bearer Token

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Yanu403/wolfbet-dice.git
   cd wolfbet-dice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your API token**

   Copy the example env file and add your token:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```
   WOLFBET_TOKEN=your_bearer_token_here
   ```

   Or configure it via the **Settings** menu inside the bot.

4. **Run the bot**
   ```bash
   npm start
   ```

---

## Configuration

Settings can be configured via the in-app **Settings** menu (option 3) or by editing `config.json` directly.

| Setting | Description | Default |
|---------|-------------|---------|
| `token` | WolfBet API Bearer token | `""` |
| `currency` | Coin to bet with | `btc` |
| `baseBet` | Starting/base bet amount | `0.00000001` |
| `rule` | `over` or `under` | `over` |
| `multiplier` | Payout multiplier (e.g. 1.98) | `1.98` |
| `betValue` | Bet threshold value (e.g. 49.99) | `49.99` |
| `betDelay` | Delay between bets in ms | `500` |
| `strategy` | Betting strategy name | `flat` |
| `stopOnWin` | Auto-stop after a win | `false` |

### Strategy-specific settings

**Martingale:**
| Setting | Description | Default |
|---------|-------------|---------|
| `martingale.multiplierOnLoss` | Multiply bet by this on loss | `2` |
| `martingale.maxBet` | Maximum bet cap | `0.01` |

**Fibonacci:**
| Setting | Description | Default |
|---------|-------------|---------|
| `fibonacci.maxBet` | Maximum bet cap | `0.01` |

**D'Alembert:**
| Setting | Description | Default |
|---------|-------------|---------|
| `dalembert.unit` | Amount to increase/decrease per step | base bet |
| `dalembert.maxBet` | Maximum bet cap | `0.01` |

**Custom:**
| Setting | Description | Default |
|---------|-------------|---------|
| `custom.onWinMultiplier` | Multiply bet by this on win | `1` |
| `custom.onLossMultiplier` | Multiply bet by this on loss | `2` |
| `custom.maxBet` | Maximum bet cap (resets to base) | `0.01` |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate menu |
| `Enter` | Select menu item |
| `Ctrl+C` | Exit immediately |
| `Tab` | Next field in Settings |
| `Shift+Tab` | Previous field in Settings |
| `Esc` | Close Settings without saving |

---

## API Token

1. Log in to [wolfbet.com](https://wolfbet.com)
2. Go to your account settings / API section
3. Generate or copy your Bearer token
4. Set it in the Settings menu or `.env` file

---

## Project Structure

```
/src
  /api
    wolfbet.js        — WolfBet API client with rate limiting
  /strategies
    index.js          — All betting strategies (flat, martingale, fibonacci, dalembert, custom)
  /ui
    screen.js         — Main blessed screen setup
    menu.js           — Left panel menu
    dashboard.js      — Right top dashboard panel
    log.js            — Right bottom log panel
    settings.js       — Settings form/overlay
  /config
    index.js          — Config load/save management
  index.js            — Entry point and bot loop
package.json
.env.example
README.md
```

---

## License

MIT
