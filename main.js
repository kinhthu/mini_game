// Coordinator / router for games
document.addEventListener('DOMContentLoaded', () => {
    // Temporarily initialize MemoryMatch game directly
    const memoryMatchGame = new MemoryMatch('grid');
    memoryMatchGame.init();
    
    // Exposed globally if needed for testing or control
    window.currentGame = memoryMatchGame;
});
