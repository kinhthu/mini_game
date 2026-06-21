document.addEventListener('DOMContentLoaded', () => {
    const lobbyScreen = document.getElementById('lobby-screen');
    const memoryGameContainer = document.getElementById('memory-game-container');
    const caroGameContainer = document.getElementById('caro-game-container');
    
    const playMemoryBtn = document.getElementById('play-memory-btn');
    const playCaroBtn = document.getElementById('play-caro-btn');
    
    const backToLobbyBtnMemory = document.getElementById('back-to-lobby-memory');
    const backToLobbyBtnCaro = document.getElementById('back-to-lobby-caro');
    
    function showLobby() {
        // Stop active games
        if (window.MemoryGame) {
            window.MemoryGame.stop();
        }
        if (window.CaroGame) {
            window.CaroGame.stop();
        }
        
        // Hide containers, show lobby
        memoryGameContainer.classList.add('hidden');
        caroGameContainer.classList.add('hidden');
        lobbyScreen.classList.remove('hidden');
    }
    
    function showMemoryGame() {
        lobbyScreen.classList.add('hidden');
        caroGameContainer.classList.add('hidden');
        memoryGameContainer.classList.remove('hidden');
        
        if (window.MemoryGame) {
            window.MemoryGame.init();
        }
    }
    
    function showCaroGame() {
        lobbyScreen.classList.add('hidden');
        memoryGameContainer.classList.add('hidden');
        caroGameContainer.classList.remove('hidden');
        
        if (window.CaroGame) {
            window.CaroGame.init();
        }
    }
    
    // Add Event Listeners
    if (playMemoryBtn) {
        playMemoryBtn.addEventListener('click', showMemoryGame);
    }
    
    if (playCaroBtn) {
        playCaroBtn.addEventListener('click', showCaroGame);
    }
    
    if (backToLobbyBtnMemory) {
        backToLobbyBtnMemory.addEventListener('click', showLobby);
    }
    
    if (backToLobbyBtnCaro) {
        backToLobbyBtnCaro.addEventListener('click', showLobby);
    }
    
    // Expose navigation to global for easy access (e.g. from inside Caro game if needed)
    window.Navigation = {
        showLobby,
        showMemoryGame,
        showCaroGame
    };
    
    // Start by showing the lobby
    showLobby();
});
