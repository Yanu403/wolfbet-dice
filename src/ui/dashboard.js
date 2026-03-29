'use strict';

const blessed = require('blessed');

function createDashboard(screen) {
  const box = blessed.box({
    parent: screen,
    label: ' Dashboard ',
    left: '22%',
    top: 0,
    width: '78%',
    height: '45%',
    border: { type: 'line' },
    style: {
      border: { fg: 'yellow' },
      label: { fg: 'yellow', bold: true },
    },
  });

  const table = blessed.text({
    parent: box,
    top: 0,
    left: 1,
    width: '100%-2',
    height: '100%-2',
    tags: true,
    content: _buildContent({}),
    style: { fg: 'white' },
  });

  function _pad(label, value, labelWidth) {
    const l = label.padEnd(labelWidth || 20);
    return `{bold}{cyan-fg}${l}{/cyan-fg}{/bold} ${value}`;
  }

  function _buildContent(data) {
    const username = data.username || '-';
    const balance = data.balance !== undefined ? _formatNum(data.balance) : '-';
    const coin = data.currency || '-';
    const currentBet = data.currentBet !== undefined ? _formatNum(data.currentBet) : '-';
    const totalBets = data.totalBets !== undefined ? String(data.totalBets) : '0';
    const wins = data.wins !== undefined ? String(data.wins) : '0';
    const losses = data.losses !== undefined ? String(data.losses) : '0';
    const profit =
      data.profit !== undefined
        ? (data.profit >= 0 ? `{green-fg}+${_formatNum(data.profit)}{/green-fg}` : `{red-fg}${_formatNum(data.profit)}{/red-fg}`)
        : '-';
    const strategy = data.strategy || '-';
    const winStreak = data.winStreak !== undefined ? String(data.winStreak) : '0';
    const lossStreak = data.lossStreak !== undefined ? String(data.lossStreak) : '0';
    const nonce = data.nonce !== undefined ? String(data.nonce) : '-';
    const rateLimit =
      data.rateLimitRemaining !== null && data.rateLimitRemaining !== undefined
        ? `${data.rateLimitRemaining} / ${data.rateLimitLimit || '?'}`
        : '-';

    const col = 22;
    const lines = [
      _pad('Username:', username, col),
      _pad('Balance:', `${balance} ${coin.toUpperCase()}`, col),
      _pad('Currency:', coin.toUpperCase(), col),
      _pad('Current Bet:', `${currentBet} ${coin.toUpperCase()}`, col),
      _pad('Total Bets:', totalBets, col),
      _pad('Wins / Losses:', `{green-fg}${wins}{/green-fg} / {red-fg}${losses}{/red-fg}`, col),
      _pad('Profit/Loss:', profit, col),
      _pad('Strategy:', strategy, col),
      _pad('Win Streak:', `{green-fg}${winStreak}{/green-fg}`, col),
      _pad('Loss Streak:', `{red-fg}${lossStreak}{/red-fg}`, col),
      _pad('Nonce:', nonce, col),
      _pad('Rate Limit:', rateLimit, col),
    ];

    return lines.join('\n');
  }

  function _formatNum(n) {
    if (typeof n !== 'number') return String(n);
    return n.toFixed(8);
  }

  function update(data) {
    table.setContent(_buildContent(data));
    screen.render();
  }

  return { box, update };
}

module.exports = { createDashboard };
