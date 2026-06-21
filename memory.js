(() => {
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

    let grid = null;
    let movesDisplay = null;
    let timeDisplay = null;
    let restartBtn = null;
    let modalOverlay = null;
    let playAgainBtn = null;
    let nextLevelBtn = null;
    let finalMoves = null;
    let finalTime = null;
    let currentLevelDisplay = null;

    function getDOMElements() {
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
    }

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
                if (timeDisplay) {
                    timeDisplay.textContent = formatTime(seconds);
                }
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
            if (movesDisplay) {
                movesDisplay.textContent = moves;
            }
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
        
        setTimeout(() => {
            if (flippedCards[0] && flippedCards[1]) {
                flippedCards[0].classList.remove('flipped');
                flippedCards[1].classList.remove('flipped');
            }
            
            flippedCards = [];
            isLocked = false;
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

    const onRestartClick = () => {
        currentLevel = 1;
        if (currentLevelDisplay) {
            currentLevelDisplay.textContent = currentLevel;
        }
        resetGame();
    };

    const onPlayAgainClick = () => {
        resetGame();
    };

    const onNextLevelClick = () => {
        currentLevel++;
        if (currentLevelDisplay) {
            currentLevelDisplay.textContent = currentLevel;
        }
        resetGame();
    };

    window.MemoryGame = {
        init() {
            getDOMElements();
            
            // Show the game container if it was hidden
            const container = document.querySelector('.game-container');
            if (container) {
                container.style.display = '';
            }

            // Update level display
            if (currentLevelDisplay) {
                currentLevelDisplay.textContent = currentLevel;
            }

            // Bind Event Listeners
            if (restartBtn) restartBtn.addEventListener('click', onRestartClick);
            if (playAgainBtn) playAgainBtn.addEventListener('click', onPlayAgainClick);
            if (nextLevelBtn) nextLevelBtn.addEventListener('click', onNextLevelClick);

            resetGame();
        },
        destroy() {
            stopTimer();

            // Unbind Event Listeners
            if (restartBtn) restartBtn.removeEventListener('click', onRestartClick);
            if (playAgainBtn) playAgainBtn.removeEventListener('click', onPlayAgainClick);
            if (nextLevelBtn) nextLevelBtn.removeEventListener('click', onNextLevelClick);

            // Clean up card listeners
            if (grid) {
                const cardsElements = grid.querySelectorAll('.card');
                cardsElements.forEach(card => {
                    card.removeEventListener('click', flipCard);
                });
                grid.innerHTML = '';
            }

            // Hide modal overlay if active
            if (modalOverlay) {
                modalOverlay.classList.remove('active');
            }

            // Hide the game container if needed
            const container = document.querySelector('.game-container');
            if (container) {
                container.style.display = 'none';
            }
        },
        reset() {
            resetGame();
        }
    };
})();
