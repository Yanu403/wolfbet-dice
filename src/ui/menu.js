'use strict';

const blessed = require('blessed');

const MENU_ITEMS = [
  '  1. Start / Stop',
  '  2. Stop on Win',
  '  3. Settings',
  '  4. Exit',
];

function createMenu(screen, callbacks) {
  // Use a single list widget with border/label — avoids the double-render
  // artifact that occurs when nesting a list inside a box.
  const list = blessed.list({
    parent: screen,
    label: ' Menu ',
    left: 0,
    top: 0,
    width: '22%',
    height: '100%-2',
    border: { type: 'line' },
    keys: true,
    vi: false,
    mouse: true,
    items: MENU_ITEMS,
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan', bold: true },
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

  // Status line sits below the list, still within the left column.
  const statusLine = blessed.text({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '22%',
    height: 1,
    content: ' Bot: {red-fg}STOPPED{/red-fg} ',
    tags: true,
    style: { fg: 'white', bg: 'black' },
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

  return { list, setRunning, updateStopOnWinLabel, focus };
}

module.exports = { createMenu };
