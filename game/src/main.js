// Entry point: boot the game on the page's canvas.

import { Game } from './game.js';

const canvas = document.getElementById('game');
window.__game = new Game(canvas);
