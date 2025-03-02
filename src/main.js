import * as THREE from 'three';
import { Game } from './components/Game.js';
import { UI } from './components/UI.js';

// Initialize the game
const game = new Game();
const ui = new UI(game);

// Start the game
game.start();

// Handle window resize
window.addEventListener('resize', () => {
    game.onWindowResize();
}); 