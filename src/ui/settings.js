'use strict';

const blessed = require('blessed');
const config = require('../config');
const { getStrategyNames } = require('../strategies');

const CURRENCIES = ['btc', 'eth', 'ltc', 'doge', 'trx', 'bch', 'xrp', 'usdt', 'uni', 'sushi', 'xlm', 'etc', 'bnb', 'dot', 'ada', 'shib', 'matic', 'optim'];
const RULES = ['over', 'under'];

function createSettings(screen, onClose) {
  // ── Overlay ──────────────────────────────────────────────────────────────
  const overlay = blessed.box({
    parent: screen,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    style: { bg: 'black' },
    hidden: true,
  });

  // ── Main scrollable box ───────────────────────────────────────────────────
  const box = blessed.box({
    parent: overlay,
    label: ' ⚙  Settings — ↑/↓ navigate · Enter=edit · Esc=cancel/close ',
    left: 'center',
    top: 1,
    width: '80%',
    height: screen.height - 4,
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    keys: false,
    mouse: true,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
      bg: 'black',
    },
  });

  // ── Field bookkeeping ─────────────────────────────────────────────────────
  let currentRow = 0;
  const fields = [];   // { widget, type, configKey, options? }
  let focusIdx = 0;
  let isEditing = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
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
    const row = currentRow;
    addLabel(label, row);

    const input = blessed.textbox({
      parent: box,
      top: row,
      left: 25,
      width: '60%-2',
      height: 1,
      // inputOnFocus: false — we control when to enter edit mode ourselves
      inputOnFocus: false,
      value: String(defaultValue ?? ''),
      style: {
        fg: 'white',
        bg: 'black',
        focus: { bg: 'blue', fg: 'white' },
      },
    });

    fields.push({ widget: input, type: 'text', configKey: key });
    currentRow += 2;
    return input;
  }

  function addSelectInput(label, options, defaultValue, key) {
    const row = currentRow;
    addLabel(label, row);

    // Show current value in a text widget; user cycles with ← → or Enter
    const selectedIdx = Math.max(0, options.indexOf(String(defaultValue)));
    const display = blessed.text({
      parent: box,
      top: row,
      left: 25,
      width: 22,
      height: 1,
      content: _buildSelectContent(options, selectedIdx),
      tags: true,
      style: {
        fg: 'white',
        bg: 'black',
        focus: { bg: 'blue', fg: 'white' },
      },
    });

    display._selectedIdx = selectedIdx;
    display._options = options;

    // Cycle forward with right arrow or Space / backward with left arrow
    display.key(['right', 'space'], () => {
      if (isEditing) return;
      display._selectedIdx = (display._selectedIdx + 1) % options.length;
      display.setContent(_buildSelectContent(options, display._selectedIdx));
      screen.render();
    });
    display.key(['left'], () => {
      if (isEditing) return;
      display._selectedIdx = (display._selectedIdx - 1 + options.length) % options.length;
      display.setContent(_buildSelectContent(options, display._selectedIdx));
      screen.render();
    });

    fields.push({ widget: display, type: 'select', configKey: key });
    currentRow += 2;
    return display;
  }

  function _buildSelectContent(options, idx) {
    return `◀ {bold}${options[idx]}{/bold} ▶`;
  }

  // ── Build form ─────────────────────────────────────────────────────────────
  addSectionHeader('Account Settings');
  const cfg = config.get();
  addTextInput('API Token:', cfg.token || '', 'token');

  addSectionHeader('Bet Settings');
  addSelectInput('Currency:', CURRENCIES, cfg.currency, 'currency');
  addTextInput('Base Bet:', cfg.baseBet, 'baseBet');
  addSelectInput('Rule:', RULES, cfg.rule, 'rule');
  addTextInput('Multiplier:', cfg.multiplier, 'multiplier');
  addTextInput('Bet Value:', cfg.betValue, 'betValue');
  addTextInput('Bet Delay (ms):', cfg.betDelay, 'betDelay');

  addSectionHeader('Strategy Settings');
  addSelectInput('Strategy:', getStrategyNames(), cfg.strategy, 'strategy');

  addSectionHeader('Martingale Settings');
  addTextInput('Loss Multiplier:', (cfg.martingale || {}).multiplierOnLoss || 2, 'martingale.multiplierOnLoss');
  addTextInput('Max Bet:', (cfg.martingale || {}).maxBet || 0.01, 'martingale.maxBet');

  addSectionHeader('Fibonacci Settings');
  addTextInput('Max Bet:', (cfg.fibonacci || {}).maxBet || 0.01, 'fibonacci.maxBet');

  addSectionHeader("D'Alembert Settings");
  addTextInput('Unit Size:', (cfg.dalembert || {}).unit || cfg.baseBet, 'dalembert.unit');
  addTextInput('Max Bet:', (cfg.dalembert || {}).maxBet || 0.01, 'dalembert.maxBet');

  addSectionHeader('Custom Strategy Settings');
  addTextInput('On-Win Multiplier:', (cfg.custom || {}).onWinMultiplier || 1, 'custom.onWinMultiplier');
  addTextInput('On-Loss Multiplier:', (cfg.custom || {}).onLossMultiplier || 2, 'custom.onLossMultiplier');
  addTextInput('Max Bet:', (cfg.custom || {}).maxBet || 0.01, 'custom.maxBet');

  // ── Buttons ───────────────────────────────────────────────────────────────
  const btnRow = currentRow + 1;

  const saveBtn = blessed.button({
    parent: box,
    top: btnRow,
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
      focus: { bg: 'green', bold: true },
    },
  });

  const cancelBtn = blessed.button({
    parent: box,
    top: btnRow,
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
      focus: { bg: 'red', bold: true },
    },
  });

  const allFocusable = [...fields.map((f) => f.widget), saveBtn, cancelBtn];

  // ── Focus helpers ─────────────────────────────────────────────────────────
  function focusField(idx) {
    focusIdx = (idx + allFocusable.length) % allFocusable.length;
    const widget = allFocusable[focusIdx];
    widget.focus();
    // Scroll so the field is visible
    const top = typeof widget.top === 'number' ? widget.top : 0;
    if (top !== undefined) box.scrollTo(top);
    screen.render();
  }

  function focusNext() {
    if (isEditing) return;
    focusField(focusIdx + 1);
  }

  function focusPrev() {
    if (isEditing) return;
    focusField(focusIdx - 1);
  }

  // ── Keyboard navigation (screen-level, active only when overlay is shown) ─
  const _navHandlers = [];

  function _addNavKey(keys, fn) {
    const handler = (ch, key) => {
      if (!overlay.visible) return;
      fn(ch, key);
    };
    screen.key(keys, handler);
    _navHandlers.push({ keys, handler });
  }

  _addNavKey(['tab', 'down'], focusNext);
  _addNavKey(['S-tab', 'up'], focusPrev);
  _addNavKey(['escape'], () => {
    if (isEditing) return; // let textbox handle its own Esc
    hide();
  });

  // ── Text input editing ────────────────────────────────────────────────────
  for (let i = 0; i < fields.length; i++) {
    const { widget, type } = fields[i];

    if (type === 'text') {
      // Press Enter to start editing
      widget.key(['enter', 'return'], () => {
        if (isEditing) return;
        isEditing = true;
        // Store current value so we can restore it on cancel
        const prev = widget.getValue();
        widget.style.bg = 'blue';
        screen.render();

        widget.readInput((err, value) => {
          isEditing = false;
          widget.style.bg = 'black';
          if (!err && value !== null && value !== undefined) {
            widget.setValue(value);
          } else {
            // Restore on cancel
            widget.setValue(prev);
          }
          screen.render();
          // Move to next field automatically after confirming
          if (!err && value !== null) focusNext();
        });
      });
    }
  }

  // ── Button actions ────────────────────────────────────────────────────────
  saveBtn.on('press', collectAndSave);
  saveBtn.key(['enter', 'return'], collectAndSave);
  cancelBtn.on('press', hide);
  cancelBtn.key(['enter', 'return'], hide);

  // ── Collect & Save ────────────────────────────────────────────────────────
  function collectAndSave() {
    const updates = {};
    for (const { widget, type, configKey } of fields) {
      let value;
      if (type === 'select') {
        value = widget._options[widget._selectedIdx];
      } else {
        value = widget.getValue();
      }

      if (configKey.includes('.')) {
        const [ns, prop] = configKey.split('.');
        if (!updates[ns]) updates[ns] = {};
        updates[ns][prop] = _parseValue(value);
      } else {
        updates[configKey] = _parseValue(value);
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

  // ── Show / Hide ───────────────────────────────────────────────────────────
  function show() {
    // Refresh field values from current config before showing
    const latest = config.get();
    const valueMap = {
      token: latest.token || '',
      currency: latest.currency,
      baseBet: latest.baseBet,
      rule: latest.rule,
      multiplier: latest.multiplier,
      betValue: latest.betValue,
      betDelay: latest.betDelay,
      strategy: latest.strategy,
      'martingale.multiplierOnLoss': (latest.martingale || {}).multiplierOnLoss || 2,
      'martingale.maxBet': (latest.martingale || {}).maxBet || 0.01,
      'fibonacci.maxBet': (latest.fibonacci || {}).maxBet || 0.01,
      'dalembert.unit': (latest.dalembert || {}).unit || latest.baseBet,
      'dalembert.maxBet': (latest.dalembert || {}).maxBet || 0.01,
      'custom.onWinMultiplier': (latest.custom || {}).onWinMultiplier || 1,
      'custom.onLossMultiplier': (latest.custom || {}).onLossMultiplier || 2,
      'custom.maxBet': (latest.custom || {}).maxBet || 0.01,
    };

    for (const { widget, type, configKey } of fields) {
      const val = valueMap[configKey];
      if (val === undefined) continue;
      if (type === 'select') {
        const idx = Math.max(0, widget._options.indexOf(String(val)));
        widget._selectedIdx = idx;
        widget.setContent(_buildSelectContent(widget._options, idx));
      } else {
        widget.setValue(String(val ?? ''));
      }
    }

    overlay.show();
    focusIdx = 0;
    focusField(0);
    screen.render();
  }

  function hide() {
    isEditing = false;
    overlay.hide();
    screen.render();
    if (onClose) onClose();
  }

  return { show, hide, overlay, box };
}

module.exports = { createSettings };
