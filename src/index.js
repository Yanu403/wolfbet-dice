'use strict';

require('dotenv').config();

const config = require('./config');
const WolfBetAPI = require('./api/wolfbet');
const { createScreen } = require('./ui/screen');
const { createMenu } = require('./ui/menu');
const { createDashboard } = require('./ui/dashboard');
const { createLog } = require('./ui/log');
const { createSettings } = require('./ui/settings');
const { getStrategy } = require('./strategies');

// ─── State ────────────────────────────────────────────────────────────────────

let botRunning = false;
let stopAfterBet = false;

const dashState = {
  username: '-',
  balance: null,
  currency: null,
  currentBet: null,
  totalBets: 0,
  wins: 0,
  losses: 0,
  profit: 0,
  strategy: '-',
  winStreak: 0,
  lossStreak: 0,
  nonce: null,
  rateLimitRemaining: null,
  rateLimitLimit: null,
};

const betState = {
  baseBet: 0,
  currentBet: 0,
  lastResult: null,
  fibIndex: 0,
  config: {},
};

// ─── Init ─────────────────────────────────────────────────────────────────────

config.load();

const api = new WolfBetAPI(config.get().token);

const screen = createScreen();

const menu = createMenu(screen, {
  onStartStop: handleStartStop,
  onStopOnWin: handleStopOnWin,
  onSettings: handleSettings,
  onExit: handleExit,
});

const dashboard = createDashboard(screen);
const logPanel = createLog(screen);
const settings = createSettings(screen, () => {
  // On settings close — re-init with new config
  applyConfig();
  menu.focus();
});

// ─── Config Application ───────────────────────────────────────────────────────

function applyConfig() {
  const cfg = config.get();
  api.setToken(cfg.token);
  betState.baseBet = cfg.baseBet;
  betState.currentBet = cfg.baseBet;
  betState.config = cfg;
  dashState.currency = cfg.currency;
  dashState.strategy = cfg.strategy;
  dashState.currentBet = cfg.baseBet;
  menu.updateStopOnWinLabel(cfg.stopOnWin);
  dashboard.update(dashState);
}

applyConfig();

// ─── Menu Handlers ────────────────────────────────────────────────────────────

function handleStartStop() {
  if (botRunning) {
    stopAfterBet = true;
    logPanel.warn('Stop requested — waiting for current bet to finish...');
  } else {
    startBot();
  }
}

function handleStopOnWin() {
  const cfg = config.get();
  config.set({ stopOnWin: !cfg.stopOnWin });
  config.save();
  menu.updateStopOnWinLabel(config.get().stopOnWin);
  logPanel.info(`Stop on Win: ${config.get().stopOnWin ? 'ON' : 'OFF'}`);
  screen.render();
}

function handleSettings() {
  settings.show();
}

function handleExit() {
  botRunning = false;
  process.exit(0);
}

// ─── Bot Loop ─────────────────────────────────────────────────────────────────

async function startBot() {
  const cfg = config.get();

  if (!cfg.token) {
    logPanel.error('No API token set. Open Settings to configure your token.');
    return;
  }

  botRunning = true;
  stopAfterBet = false;
  menu.setRunning(true);
  logPanel.info('Bot started.');

  // Fetch initial balance
  await fetchBalance();

  while (botRunning && !stopAfterBet) {
    // Check rate limit
    if (api.isRateLimited()) {
      const wait = api.getRateLimitWaitMs();
      logPanel.warn(`Rate limit reached. Waiting ${Math.ceil(wait / 1000)}s...`);
      await sleep(wait);
      continue;
    }

    const currentCfg = config.get();
    betState.baseBet = currentCfg.baseBet;
    betState.config = currentCfg;

    // Calculate next bet amount using strategy
    const stratFn = getStrategy(currentCfg.strategy);
    const betAmount = stratFn(betState);
    betState.currentBet = betAmount;
    dashState.currentBet = betAmount;

    try {
      const result = await api.placeBet({
        currency: currentCfg.currency,
        amount: betAmount,
        rule: currentCfg.rule,
        multiplier: currentCfg.multiplier,
        bet_value: currentCfg.betValue,
      });

      processResult(result);

      // Update rate limit info
      dashState.rateLimitRemaining = api.rateLimitRemaining;
      dashState.rateLimitLimit = api.rateLimitLimit;
      dashboard.update(dashState);

      // Check stop on win
      if (config.get().stopOnWin && betState.lastResult === 'win') {
        logPanel.info('Stop on Win triggered. Bot stopped.');
        break;
      }
    } catch (err) {
      const msg = err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
      logPanel.error(`Bet failed: ${msg}`);

      if (err.response && err.response.status === 429) {
        logPanel.warn('Rate limited by server. Waiting 60s...');
        await sleep(60000);
      } else if (err.response && err.response.status === 401) {
        logPanel.error('Unauthorized — check your API token in Settings.');
        break;
      } else {
        // Brief pause before retry
        await sleep(2000);
      }
    }

    // Delay between bets
    const delay = Math.max(200, Number(currentCfg.betDelay) || 500);
    await sleep(delay);
  }

  botRunning = false;
  stopAfterBet = false;
  menu.setRunning(false);
  logPanel.info('Bot stopped.');
}

function processResult(result) {
  // WolfBet API may return { data: {...} } or the bet object directly.
  // Identify a bet object by requiring both `state` and `amount` properties.
  let bet = result;
  if (result && typeof result === 'object') {
    if (result.data && typeof result.data === 'object' &&
        result.data.state && result.data.amount !== undefined) {
      bet = result.data;
    } else if (result.bet && typeof result.bet === 'object' &&
               result.bet.state && result.bet.amount !== undefined) {
      bet = result.bet;
    }
  }

  const isWin = bet.state === 'win';

  betState.lastResult = isWin ? 'win' : 'loss';
  dashState.totalBets += 1;
  dashState.nonce = bet.nonce;

  if (isWin) {
    dashState.wins += 1;
    dashState.winStreak += 1;
    dashState.lossStreak = 0;
  } else {
    dashState.losses += 1;
    dashState.lossStreak += 1;
    dashState.winStreak = 0;
  }
  // Use the API's profit field directly (positive on win, negative on loss)
  dashState.profit += Number(bet.profit || 0);

  // Update balance from response
  if (bet.user_balance !== undefined && bet.user_balance !== null) {
    dashState.balance = Number(bet.user_balance);
  }

  logPanel.betResult(bet);
  dashboard.update(dashState);
}

async function fetchBalance() {
  try {
    const data = await api.getBalances();
    // Handle both { data: [...] } and plain array responses
    const balances = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
    const cfg = config.get();
    const entry = balances.find((b) => b.currency === cfg.currency);
    if (entry) {
      dashState.balance = Number(entry.amount);
      // Some balance entries include user info
      if (entry.user && entry.user.username) {
        dashState.username = entry.user.username;
      }
    }
    logPanel.info(`Balances fetched. ${cfg.currency.toUpperCase()}: ${dashState.balance !== null ? dashState.balance.toFixed(8) : '-'}`);
    dashboard.update(dashState);
  } catch (err) {
    const msg = err.response
      ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
      : err.message;
    logPanel.error(`Failed to fetch balances: ${msg}`);
    if (err.response && err.response.status === 401) {
      logPanel.error('Unauthorized — check your API token in Settings (option 3).');
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Startup ──────────────────────────────────────────────────────────────────

logPanel.info('WolfBet Dice Bot started. Use the menu on the left to get started.');
logPanel.info('Press Ctrl+C to exit at any time.');

if (!config.get().token) {
  logPanel.warn('No API token configured — open Settings (option 3) to set your token.');
}

screen.render();
