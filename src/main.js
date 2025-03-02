import * as THREE from 'three';
import { Game } from './components/Game.js';
import { UI } from './components/UI.js';

// Initialize the game
const game = new Game();
const ui = new UI(game);

// Note: The game will now start after the loading screen and start button click
// The actual game start is handled by the UI class through the startGame method

// Handle window resize
window.addEventListener('resize', () => {
    game.onWindowResize();
}); 