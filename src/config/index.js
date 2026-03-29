'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

const DEFAULTS = {
  token: '',
  currency: 'btc',
  baseBet: 0.00000001,
  rule: 'over',
  multiplier: 1.98,
  betValue: 49.99,
  strategy: 'flat',
  stopOnWin: false,
  betDelay: 500,
  martingale: {
    multiplierOnLoss: 2,
    maxBet: 0.01,
  },
  fibonacci: {
    maxBet: 0.01,
  },
  dalembert: {
    unit: 0.00000001,
    maxBet: 0.01,
  },
  custom: {
    onWinMultiplier: 1,
    onLossMultiplier: 2,
    maxBet: 0.01,
  },
};

let _config = Object.assign({}, DEFAULTS);

function load() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
      const saved = JSON.parse(raw);
      _config = deepMerge(DEFAULTS, saved);
    }
  } catch (e) {
    // ignore corrupt config
  }
  // Also load token from .env if not set
  if (!_config.token && process.env.WOLFBET_TOKEN) {
    _config.token = process.env.WOLFBET_TOKEN;
  }
  return _config;
}

function save() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(_config, null, 2), 'utf8');
  } catch (e) {
    // ignore write errors
  }
}

function get() {
  return _config;
}

function set(updates) {
  _config = deepMerge(_config, updates);
}

function deepMerge(target, source) {
  const out = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      out[key] = deepMerge(target[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

module.exports = { load, save, get, set, DEFAULTS };
