// Game Coordinator and Router
document.addEventListener('DOMContentLoaded', () => {
    // For now, initialize the Memory Match game
    if (window.MemoryGame) {
        window.MemoryGame.init();
    } else {
        console.error('MemoryGame is not defined. Make sure memory.js is loaded.');
    }
});
