class MemoryGame {
    constructor() {
        this.allEmojis = ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '👨‍🚀', '👽', '🌎', '⭐', '🌞', '🌙', '🌠', '🌩️', '☀️', '☁️', '❄️', '🔥'];
        this.currentLevel = 1;
        this.currentEmojis = [];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = null;
        this.seconds = 0;
        this.gameStarted = false;
        this.isLocked = false;

        // DOM elements cache
        this.grid = null;
        this.movesDisplay = null;
        this.timeDisplay = null;
        this.restartBtn = null;
        this.modalOverlay = null;
        this.playAgainBtn = null;
        this.nextLevelBtn = null;
        this.finalMoves = null;
        this.finalTime = null;
        this.currentLevelDisplay = null;

        // Bound event listeners
        this.boundFlipCard = this.flipCard.bind(this);
        this.boundRestart = this.handleRestart.bind(this);
        this.boundPlayAgain = this.handlePlayAgain.bind(this);
        this.boundNextLevel = this.handleNextLevel.bind(this);
    }

    init() {
        // Query elements and cache them
        this.grid = document.getElementById('grid');
        this.movesDisplay = document.getElementById('moves');
        this.timeDisplay = document.getElementById('time');
        this.restartBtn = document.getElementById('restart-btn');
        this.modalOverlay = document.getElementById('win-modal');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.nextLevelBtn = document.getElementById('next-level-btn');
        this.finalMoves = document.getElementById('final-moves');
        this.finalTime = document.getElementById('final-time');
        this.currentLevelDisplay = document.getElementById('current-level');

        // Add event listeners
        if (this.restartBtn) this.restartBtn.addEventListener('click', this.boundRestart);
        if (this.playAgainBtn) this.playAgainBtn.addEventListener('click', this.boundPlayAgain);
        if (this.nextLevelBtn) this.nextLevelBtn.addEventListener('click', this.boundNextLevel);

        this.resetGame();
    }

    cleanup() {
        this.stopTimer();
        // Remove event listeners to prevent memory leaks
        if (this.restartBtn) this.restartBtn.removeEventListener('click', this.boundRestart);
        if (this.playAgainBtn) this.playAgainBtn.removeEventListener('click', this.boundPlayAgain);
        if (this.nextLevelBtn) this.nextLevelBtn.removeEventListener('click', this.boundNextLevel);

        // Remove click event listeners from cards and clear grid
        if (this.grid) {
            const cards = this.grid.querySelectorAll('.card');
            cards.forEach(card => {
                card.removeEventListener('click', this.boundFlipCard);
            });
            this.grid.innerHTML = '';
        }
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.timer = setInterval(() => {
                this.seconds++;
                if (this.timeDisplay) {
                    this.timeDisplay.textContent = this.formatTime(this.seconds);
                }
            }, 1000);
        }
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    getGridDimensions(numPairs) {
        if (numPairs <= 6) return 4;
        if (numPairs <= 8) return 4;
        if (numPairs <= 10) return 5;
        if (numPairs <= 12) return 6;
        if (numPairs <= 15) return 6;
        return 6;
    }

    createBoard() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        
        let numPairs = 6 + (this.currentLevel - 1) * 2;
        if (numPairs > this.allEmojis.length) {
            numPairs = this.allEmojis.length;
        }
        
        this.currentEmojis = this.allEmojis.slice(0, numPairs);
        this.cards = [...this.currentEmojis, ...this.currentEmojis];
        
        const shuffledCards = this.shuffle([...this.cards]);
        
        const cols = this.getGridDimensions(numPairs);
        this.grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        
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
            
            card.addEventListener('click', this.boundFlipCard);
            
            this.grid.appendChild(card);
        });
    }

    flipCard(event) {
        const clickedCard = event.currentTarget;
        if (this.isLocked) return;
        if (clickedCard === this.flippedCards[0]) return;
        
        this.startTimer();
        
        clickedCard.classList.add('flipped');
        this.flippedCards.push(clickedCard);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            if (this.movesDisplay) {
                this.movesDisplay.textContent = this.moves;
            }
            this.checkForMatch();
        }
    }

    checkForMatch() {
        let isMatch = this.flippedCards[0].dataset.emoji === this.flippedCards[1].dataset.emoji;
        
        if (isMatch) {
            this.disableCards();
        } else {
            this.unflipCards();
        }
    }

    disableCards() {
        this.flippedCards[0].removeEventListener('click', this.boundFlipCard);
        this.flippedCards[1].removeEventListener('click', this.boundFlipCard);
        
        this.flippedCards[0].classList.add('matched');
        this.flippedCards[1].classList.add('matched');
        
        this.matchedPairs++;
        this.flippedCards = [];
        
        if (this.matchedPairs === this.currentEmojis.length) {
            this.gameOver();
        }
    }

    unflipCards() {
        this.isLocked = true;
        
        setTimeout(() => {
            if (this.flippedCards[0]) this.flippedCards[0].classList.remove('flipped');
            if (this.flippedCards[1]) this.flippedCards[1].classList.remove('flipped');
            
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    }

    gameOver() {
        this.stopTimer();
        setTimeout(() => {
            if (this.finalMoves) this.finalMoves.textContent = this.moves;
            if (this.finalTime) this.finalTime.textContent = this.formatTime(this.seconds);
            if (this.modalOverlay) this.modalOverlay.classList.add('active');
        }, 500);
    }

    resetGame() {
        this.stopTimer();
        this.gameStarted = false;
        this.isLocked = false;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        
        if (this.movesDisplay) this.movesDisplay.textContent = '0';
        if (this.timeDisplay) this.timeDisplay.textContent = '0:00';
        if (this.modalOverlay) this.modalOverlay.classList.remove('active');
        
        this.createBoard();
    }

    handleRestart() {
        this.currentLevel = 1;
        if (this.currentLevelDisplay) {
            this.currentLevelDisplay.textContent = this.currentLevel;
        }
        this.resetGame();
    }

    handlePlayAgain() {
        this.resetGame();
    }

    handleNextLevel() {
        this.currentLevel++;
        if (this.currentLevelDisplay) {
            this.currentLevelDisplay.textContent = this.currentLevel;
        }
        this.resetGame();
    }

    reset() {
        this.resetGame();
    }
}
