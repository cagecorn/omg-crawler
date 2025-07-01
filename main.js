// main.js
import { Game } from './src/game.js';
import { registerServiceWorker } from './src/utils/swRegister.js';

let game = null;

function initializeAudio() {
    if (game) {
        game.startBGM();
    }
}

window.onload = () => {
    registerServiceWorker();
    game = new Game();
    game.start();
    document.addEventListener('keydown', initializeAudio, { once: true });
    document.addEventListener('click', initializeAudio, { once: true });
};
