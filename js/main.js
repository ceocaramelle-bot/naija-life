import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    try {
        window.naijaLifeGame = new Game();
    } catch (err) {
        console.error("Fatal error initializing NAIJA LIFE:", err);
    }
});
