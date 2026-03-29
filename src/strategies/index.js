'use strict';

/**
 * Flat strategy — always bet the same base amount.
 */
function flat(state) {
  return state.baseBet;
}

/**
 * Martingale — double on loss, reset on win.
 */
function martingale(state) {
  const cfg = state.config.martingale || {};
  const multiplier = cfg.multiplierOnLoss || 2;
  const maxBet = cfg.maxBet || Infinity;

  if (state.lastResult === 'loss') {
    const next = state.currentBet * multiplier;
    return Math.min(next, maxBet);
  }
  return state.baseBet;
}

/**
 * Fibonacci — follow Fibonacci sequence on loss, go back 2 on win.
 */
function fibonacci(state) {
  const cfg = state.config.fibonacci || {};
  const maxBet = cfg.maxBet || Infinity;

  // Fibonacci sequence stored in state.fibIndex
  const seq = generateFibSequence(50, state.baseBet);
  let idx = state.fibIndex || 0;

  if (state.lastResult === 'loss') {
    idx = Math.min(idx + 1, seq.length - 1);
  } else if (state.lastResult === 'win') {
    idx = Math.max(idx - 2, 0);
  }

  state.fibIndex = idx;
  return Math.min(seq[idx], maxBet);
}

function generateFibSequence(count, base) {
  const seq = [base, base];
  for (let i = 2; i < count; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq;
}

/**
 * D'Alembert — increase by unit on loss, decrease by unit on win.
 */
function dalembert(state) {
  const cfg = state.config.dalembert || {};
  const unit = cfg.unit || state.baseBet;
  const maxBet = cfg.maxBet || Infinity;

  let next = state.currentBet;
  if (state.lastResult === 'loss') {
    next = state.currentBet + unit;
  } else if (state.lastResult === 'win') {
    next = Math.max(state.currentBet - unit, state.baseBet);
  } else {
    next = state.baseBet;
  }
  return Math.min(next, maxBet);
}

/**
 * Custom — user-defined on-win and on-loss multipliers.
 */
function custom(state) {
  const cfg = state.config.custom || {};
  const onWinMultiplier = cfg.onWinMultiplier || 1;
  const onLossMultiplier = cfg.onLossMultiplier || 2;
  const maxBet = cfg.maxBet || Infinity;

  let next = state.currentBet;
  if (state.lastResult === 'win') {
    next = state.currentBet * onWinMultiplier;
  } else if (state.lastResult === 'loss') {
    next = state.currentBet * onLossMultiplier;
  } else {
    next = state.baseBet;
  }

  if (next > maxBet) {
    return state.baseBet;
  }
  return next;
}

const STRATEGIES = {
  flat,
  martingale,
  fibonacci,
  dalembert,
  custom,
};

function getStrategy(name) {
  return STRATEGIES[name] || flat;
}

function getStrategyNames() {
  return Object.keys(STRATEGIES);
}

module.exports = { getStrategy, getStrategyNames, flat, martingale, fibonacci, dalembert, custom };
