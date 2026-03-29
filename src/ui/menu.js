'use strict';

const blessed = require('blessed');

const MENU_ITEMS = [
  '  1. Start / Stop',
  '  2. Stop on Win',
  '  3. Settings',
  '  4. Exit',
];

function createMenu(screen, callbacks) {
  const menuBox = blessed.box({
    parent: screen,
    label: ' Menu ',
    left: 0,
    top: 0,
    width: '22%',
    height: '100%',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
    },
  });

  const list = blessed.list({
    parent: menuBox,
    top: 1,
    left: 0,
    width: '100%-2',
    height: '100%-4',
    keys: true,
    vi: true,
    mouse: true,
    items: MENU_ITEMS,
    style: {
      selected: {
        bg: 'cyan',
        fg: 'black',
        bold: true,
      },
      item: {
        fg: 'white',
      },
    },
  });

  // Status line at bottom of menu
  const statusLine = blessed.text({
    parent: menuBox,
    bottom: 1,
    left: 1,
    width: '100%-4',
    content: ' Bot: {red-fg}STOPPED{/red-fg} ',
    tags: true,
    style: { fg: 'white' },
  });

  list.on('select', (item, index) => {
    switch (index) {
      case 0:
        if (callbacks.onStartStop) callbacks.onStartStop();
        break;
      case 1:
        if (callbacks.onStopOnWin) callbacks.onStopOnWin();
        break;
      case 2:
        if (callbacks.onSettings) callbacks.onSettings();
        break;
      case 3:
        if (callbacks.onExit) callbacks.onExit();
        break;
    }
    screen.render();
  });

  list.focus();

  function setRunning(running) {
    if (running) {
      statusLine.setContent(' Bot: {green-fg}RUNNING{/green-fg} ');
    } else {
      statusLine.setContent(' Bot: {red-fg}STOPPED{/red-fg} ');
    }
    updateStopOnWinLabel(null);
    screen.render();
  }

  function updateStopOnWinLabel(stopOnWin) {
    if (stopOnWin === null) return;
    const mark = stopOnWin ? '{green-fg}[ON]{/green-fg}' : '{gray-fg}[OFF]{/gray-fg}';
    MENU_ITEMS[1] = `  2. Stop on Win ${mark}`;
    list.setItems(MENU_ITEMS);
    screen.render();
  }

  function focus() {
    list.focus();
    screen.render();
  }

  return { menuBox, list, setRunning, updateStopOnWinLabel, focus };
}

module.exports = { createMenu };
