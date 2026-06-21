// main.js - Core router and controller for the Web Mini-Games platform

let memoryGame = null;

document.addEventListener('DOMContentLoaded', () => {
    // For now, since Memory Match is the only game, initialize and run it.
    // In future tasks, main.js will act as the router between Lobby and Games.
    memoryGame = new MemoryGame();
    memoryGame.init();
});
