'use strict';

const blessed = require('blessed');

let _screen = null;

function createScreen() {
  if (_screen) return _screen;

  _screen = blessed.screen({
    smartCSR: true,
    title: 'WolfBet Dice Bot',
    fullUnicode: true,
    dockBorders: true,
    autoPadding: true,
  });

  // Global key handlers
  _screen.key(['C-c'], () => {
    process.exit(0);
  });

  return _screen;
}

function getScreen() {
  return _screen;
}

module.exports = { createScreen, getScreen };
