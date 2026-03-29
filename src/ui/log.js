'use strict';

const blessed = require('blessed');

function createLog(screen) {
  const box = blessed.box({
    parent: screen,
    label: ' Log ',
    left: '22%',
    top: '45%',
    width: '78%',
    height: '55%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    style: {
      border: { fg: 'magenta' },
      label: { fg: 'magenta', bold: true },
    },
  });

  const log = blessed.log({
    parent: box,
    top: 0,
    left: 1,
    width: '100%-2',
    height: '100%-2',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    keys: true,
    vi: true,
    scrollbar: {
      ch: '│',
      style: { fg: 'cyan' },
    },
    style: { fg: 'white' },
  });

  function _timestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `{gray-fg}[${hh}:${mm}:${ss}]{/gray-fg}`;
  }

  function info(msg) {
    log.log(`${_timestamp()} ${msg}`);
    screen.render();
  }

  function win(msg) {
    log.log(`${_timestamp()} {green-fg}✓ WIN{/green-fg} ${msg}`);
    screen.render();
  }

  function loss(msg) {
    log.log(`${_timestamp()} {red-fg}✗ LOSS{/red-fg} ${msg}`);
    screen.render();
  }

  function error(msg) {
    log.log(`${_timestamp()} {red-fg}[ERROR]{/red-fg} ${msg}`);
    screen.render();
  }

  function warn(msg) {
    log.log(`${_timestamp()} {yellow-fg}[WARN]{/yellow-fg} ${msg}`);
    screen.render();
  }

  function betResult(result) {
    const state = result.state === 'win' ? 'win' : 'loss';
    const amount = Number(result.amount || 0).toFixed(8);
    const profit = Number(result.profit || 0).toFixed(8);
    const roll = Number(result.result_value || 0).toFixed(2);
    const nonce = result.nonce || '-';
    const profitStr =
      state === 'win'
        ? `{green-fg}+${profit}{/green-fg}`
        : `{red-fg}${profit}{/red-fg}`;

    if (state === 'win') {
      win(`Bet: ${amount} | Roll: ${roll} | Profit: ${profitStr} | Nonce: ${nonce}`);
    } else {
      loss(`Bet: ${amount} | Roll: ${roll} | Profit: ${profitStr} | Nonce: ${nonce}`);
    }
  }

  function clear() {
    log.setContent('');
    screen.render();
  }

  return { box, log, info, win, loss, error, warn, betResult, clear };
}

module.exports = { createLog };
