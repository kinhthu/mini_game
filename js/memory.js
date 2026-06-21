(function() {
    const allEmojis = ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '👨‍🚀', '👽', '🌎', '⭐', '🌞', '🌙', '🌠', '🌩️', '☀️', '☁️', '❄️', '🔥'];
    let currentLevel = 1;
    let currentEmojis = [];
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;
    let timer = null;
    let seconds = 0;
    let gameStarted = false;
    let isLocked = false;
    let unflipTimeout = null;
    
    let grid, movesDisplay, timeDisplay, restartBtn, modalOverlay, playAgainBtn, nextLevelBtn, finalMoves, finalTime, currentLevelDisplay;
    let initialized = false;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (!gameStarted) {
            gameStarted = true;
            timer = setInterval(() => {
                seconds++;
                timeDisplay.textContent = formatTime(seconds);
            }, 1000);
        }
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function getGridDimensions(numPairs) {
        if (numPairs <= 6) return 4;
        if (numPairs <= 8) return 4;
        if (numPairs <= 10) return 5;
        if (numPairs <= 12) return 6;
        if (numPairs <= 15) return 6;
        return 6;
    }

    function createBoard() {
        if (!grid) return;
        grid.innerHTML = '';
        
        // Determine number of pairs for current level
        let numPairs = 6 + (currentLevel - 1) * 2;
        if (numPairs > allEmojis.length) {
            numPairs = allEmojis.length;
        }
        
        currentEmojis = allEmojis.slice(0, numPairs);
        cards = [...currentEmojis, ...currentEmojis];
        
        const shuffledCards = shuffle([...cards]);
        
        const cols = getGridDimensions(numPairs);
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
        shuffledCards.forEach((emoji, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.emoji = emoji;
            card.dataset.index = index;
            
            const front = document.createElement('div');
            front.classList.add('card-face', 'card-front');
            
            const back = document.createElement('div');
            back.classList.add('card-face', 'card-back');
            back.textContent = emoji;
            
            card.appendChild(front);
            card.appendChild(back);
            
            card.addEventListener('click', flipCard);
            
            grid.appendChild(card);
        });
    }

    function flipCard() {
        if (isLocked) return;
        if (this === flippedCards[0]) return;
        
        startTimer();
        
        this.classList.add('flipped');
        flippedCards.push(this);
        
        if (flippedCards.length === 2) {
            moves++;
            if (movesDisplay) movesDisplay.textContent = moves;
            checkForMatch();
        }
    }

    function checkForMatch() {
        let isMatch = flippedCards[0].dataset.emoji === flippedCards[1].dataset.emoji;
        
        if (isMatch) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        flippedCards[0].removeEventListener('click', flipCard);
        flippedCards[1].removeEventListener('click', flipCard);
        
        flippedCards[0].classList.add('matched');
        flippedCards[1].classList.add('matched');
        
        matchedPairs++;
        flippedCards = [];
        
        if (matchedPairs === currentEmojis.length) {
            gameOver();
        }
    }

    function unflipCards() {
        isLocked = true;
        
        unflipTimeout = setTimeout(() => {
            if (flippedCards[0]) flippedCards[0].classList.remove('flipped');
            if (flippedCards[1]) flippedCards[1].classList.remove('flipped');
            
            flippedCards = [];
            isLocked = false;
            unflipTimeout = null;
        }, 1000);
    }

    function gameOver() {
        stopTimer();
        setTimeout(() => {
            if (finalMoves) finalMoves.textContent = moves;
            if (finalTime) finalTime.textContent = formatTime(seconds);
            if (modalOverlay) modalOverlay.classList.add('active');
        }, 500);
    }

    function resetGame() {
        stopTimer();
        if (unflipTimeout) {
            clearTimeout(unflipTimeout);
            unflipTimeout = null;
        }
        gameStarted = false;
        isLocked = false;
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        seconds = 0;
        
        if (movesDisplay) movesDisplay.textContent = '0';
        if (timeDisplay) timeDisplay.textContent = '0:00';
        if (modalOverlay) modalOverlay.classList.remove('active');
        
        createBoard();
    }

    function initMemoryGame() {
        grid = document.getElementById('grid');
        movesDisplay = document.getElementById('moves');
        timeDisplay = document.getElementById('time');
        restartBtn = document.getElementById('restart-btn');
        modalOverlay = document.getElementById('win-modal');
        playAgainBtn = document.getElementById('play-again-btn');
        nextLevelBtn = document.getElementById('next-level-btn');
        finalMoves = document.getElementById('final-moves');
        finalTime = document.getElementById('final-time');
        currentLevelDisplay = document.getElementById('current-level');

        if (!initialized) {
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    currentLevel = 1;
                    if (currentLevelDisplay) currentLevelDisplay.textContent = currentLevel;
                    resetGame();
                });
            }
            
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', () => {
                    resetGame();
                });
            }
            
            if (nextLevelBtn) {
                nextLevelBtn.addEventListener('click', () => {
                    currentLevel++;
                    if (currentLevelDisplay) currentLevelDisplay.textContent = currentLevel;
                    resetGame();
                });
            }

            initialized = true;
        }
        
        currentLevel = 1;
        if (currentLevelDisplay) {
            currentLevelDisplay.textContent = currentLevel;
        }
        resetGame();
    }

    function stopMemoryGame() {
        stopTimer();
        if (unflipTimeout) {
            clearTimeout(unflipTimeout);
            unflipTimeout = null;
        }
    }

    window.MemoryGame = {
        init: initMemoryGame,
        stop: stopMemoryGame
    };
})();
