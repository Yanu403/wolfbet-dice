'use strict';

const blessed = require('blessed');
const config = require('../config');
const { getStrategyNames } = require('../strategies');

const CURRENCIES = ['btc', 'eth', 'ltc', 'doge', 'trx', 'bch', 'xrp', 'usdt', 'uni', 'sushi', 'xlm', 'etc', 'bnb', 'dot', 'ada', 'shib', 'matic', 'optim'];
const RULES = ['over', 'under'];

function createSettings(screen, onClose) {
  const cfg = config.get();

  // Overlay background
  const overlay = blessed.box({
    parent: screen,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black', transparent: false },
    hidden: true,
  });

  // Main settings box
  const box = blessed.box({
    parent: overlay,
    label: ' ⚙  Settings (Tab=next field, Enter=save, Esc=cancel) ',
    left: 'center',
    top: 'center',
    width: '80%',
    height: '90%',
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: false,
    mouse: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
      bg: 'black',
    },
  });

  let currentRow = 0;
  const fields = [];

  function addSectionHeader(text) {
    blessed.text({
      parent: box,
      top: currentRow,
      left: 1,
      content: `{bold}{yellow-fg}── ${text} ──{/yellow-fg}{/bold}`,
      tags: true,
      style: { bg: 'black' },
    });
    currentRow += 2;
  }

  function addLabel(text, row) {
    blessed.text({
      parent: box,
      top: row,
      left: 2,
      width: 22,
      content: `{cyan-fg}${text}{/cyan-fg}`,
      tags: true,
      style: { bg: 'black' },
    });
  }

  function addTextInput(label, defaultValue, key) {
    addLabel(label, currentRow);
    const input = blessed.textbox({
      parent: box,
      top: currentRow,
      left: 25,
      width: '60%-2',
      height: 1,
      keys: true,
      mouse: true,
      inputOnFocus: true,
      value: String(defaultValue || ''),
      style: {
        fg: 'white',
        bg: 'black',
        focus: { bg: 'blue', fg: 'white' },
        border: { fg: 'gray' },
      },
    });
    input._configKey = key;
    input._type = 'text';
    fields.push(input);
    currentRow += 2;
    return input;
  }

  function addSelectInput(label, options, defaultValue, key) {
    addLabel(label, currentRow);
    const selectedIdx = Math.max(0, options.indexOf(defaultValue));
    const select = blessed.list({
      parent: box,
      top: currentRow,
      left: 25,
      width: 20,
      height: 1,
      keys: true,
      mouse: true,
      items: options,
      style: {
        fg: 'white',
        bg: 'black',
        selected: { bg: 'blue', fg: 'white' },
        focus: { bg: 'blue' },
        item: { fg: 'white' },
      },
    });
    select.select(selectedIdx);
    select._configKey = key;
    select._type = 'select';
    select._options = options;
    fields.push(select);
    currentRow += 2;
    return select;
  }

  // ---- Build form ----
  addSectionHeader('Account Settings');
  const tokenInput = addTextInput('API Token:', cfg.token || '', 'token');

  addSectionHeader('Bet Settings');
  const currencySelect = addSelectInput('Currency:', CURRENCIES, cfg.currency, 'currency');
  const baseBetInput = addTextInput('Base Bet:', cfg.baseBet, 'baseBet');
  const ruleSelect = addSelectInput('Rule:', RULES, cfg.rule, 'rule');
  const multiplierInput = addTextInput('Multiplier:', cfg.multiplier, 'multiplier');
  const betValueInput = addTextInput('Bet Value:', cfg.betValue, 'betValue');
  const betDelayInput = addTextInput('Bet Delay (ms):', cfg.betDelay, 'betDelay');

  addSectionHeader('Strategy Settings');
  const strategySelect = addSelectInput('Strategy:', getStrategyNames(), cfg.strategy, 'strategy');

  addSectionHeader('Martingale Settings');
  const martMultInput = addTextInput('Loss Multiplier:', (cfg.martingale || {}).multiplierOnLoss || 2, 'martingale.multiplierOnLoss');
  const martMaxInput = addTextInput('Max Bet:', (cfg.martingale || {}).maxBet || 0.01, 'martingale.maxBet');

  addSectionHeader('Fibonacci Settings');
  const fibMaxInput = addTextInput('Max Bet:', (cfg.fibonacci || {}).maxBet || 0.01, 'fibonacci.maxBet');

  addSectionHeader("D'Alembert Settings");
  const dalUnitInput = addTextInput('Unit Size:', (cfg.dalembert || {}).unit || cfg.baseBet, 'dalembert.unit');
  const dalMaxInput = addTextInput('Max Bet:', (cfg.dalembert || {}).maxBet || 0.01, 'dalembert.maxBet');

  addSectionHeader('Custom Strategy Settings');
  const customWinInput = addTextInput('On-Win Multiplier:', (cfg.custom || {}).onWinMultiplier || 1, 'custom.onWinMultiplier');
  const customLossInput = addTextInput('On-Loss Multiplier:', (cfg.custom || {}).onLossMultiplier || 2, 'custom.onLossMultiplier');
  const customMaxInput = addTextInput('Max Bet:', (cfg.custom || {}).maxBet || 0.01, 'custom.maxBet');

  // Adjust content height
  box.height = Math.min(currentRow + 6, Math.floor(screen.height * 0.9));

  // Save & Cancel buttons
  const saveBtn = blessed.button({
    parent: box,
    bottom: 2,
    left: 'center',
    shrink: true,
    padding: { left: 2, right: 2 },
    content: ' Save ',
    mouse: true,
    keys: true,
    style: {
      fg: 'black',
      bg: 'green',
      hover: { bg: 'darkgreen' },
      focus: { bg: 'green', underline: true },
    },
  });

  const cancelBtn = blessed.button({
    parent: box,
    bottom: 2,
    right: 4,
    shrink: true,
    padding: { left: 2, right: 2 },
    content: ' Cancel ',
    mouse: true,
    keys: true,
    style: {
      fg: 'white',
      bg: 'red',
      hover: { bg: 'darkred' },
      focus: { bg: 'red', underline: true },
    },
  });

  function show() {
    overlay.show();
    tokenInput.focus();
    screen.render();
  }

  function hide() {
    overlay.hide();
    screen.render();
    if (onClose) onClose();
  }

  function collectAndSave() {
    const updates = {};
    for (const field of fields) {
      const key = field._configKey;
      let value;
      if (field._type === 'select') {
        value = field._options[field.selected];
      } else {
        value = field.getValue();
      }

      // Parse nested keys like "martingale.maxBet"
      if (key.includes('.')) {
        const parts = key.split('.');
        if (!updates[parts[0]]) updates[parts[0]] = {};
        updates[parts[0]][parts[1]] = _parseValue(value);
      } else {
        updates[key] = _parseValue(value);
      }
    }
    config.set(updates);
    config.save();
    hide();
  }

  function _parseValue(v) {
    if (v === '' || v === null || v === undefined) return v;
    const n = Number(v);
    if (!isNaN(n) && String(v).trim() !== '') return n;
    return v;
  }

  // Tab navigation through fields
  let focusIdx = 0;
  const allFocusable = [...fields, saveBtn, cancelBtn];

  function focusNext() {
    focusIdx = (focusIdx + 1) % allFocusable.length;
    allFocusable[focusIdx].focus();
    screen.render();
  }

  function focusPrev() {
    focusIdx = (focusIdx - 1 + allFocusable.length) % allFocusable.length;
    allFocusable[focusIdx].focus();
    screen.render();
  }

  // Keyboard handling on the overlay
  overlay.key(['tab'], focusNext);
  overlay.key(['S-tab'], focusPrev);
  overlay.key(['escape'], hide);

  box.key(['tab'], focusNext);
  box.key(['S-tab'], focusPrev);
  box.key(['escape'], hide);

  saveBtn.on('press', collectAndSave);
  saveBtn.key(['enter'], collectAndSave);
  cancelBtn.on('press', hide);
  cancelBtn.key(['enter'], hide);

  return { show, hide, overlay, box };
}

module.exports = { createSettings };
