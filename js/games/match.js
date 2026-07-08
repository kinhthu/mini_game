const MatchGame = {
    initialized: false,
    gridSize: 4, // default
    flippedCards: [],
    isLocked: false,
    matchedPairs: 0,
    moves: 0,
    seconds: 0,
    timer: null,
    gameStarted: false,
    
    init() {
        this.gridSize = 4;
        this.flippedCards = [];
        this.isLocked = false;
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.gameStarted = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Bind difficulty selector
        const diffBtns = document.querySelectorAll('.difficulty-selector .diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const gridAttr = btn.getAttribute('data-grid');
                this.gridSize = parseInt(gridAttr) || 4;
                this.reset();
            });
        });

        // Bind restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.reset());
        }

        // Initialize board
        this.createBoard();
        this.initialized = true;
    },

    reset() {
        this.flippedCards = [];
        this.isLocked = false;
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;
        this.gameStarted = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const movesDisplay = document.getElementById('moves');
        if (movesDisplay) movesDisplay.textContent = '0';
        const timeDisplay = document.getElementById('time');
        if (timeDisplay) timeDisplay.textContent = '0:00';

        this.createBoard();
    },

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    startTimer() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            const timeDisplay = document.getElementById('time');
            this.timer = setInterval(() => {
                this.seconds++;
                if (timeDisplay) {
                    timeDisplay.textContent = this.formatTime(this.seconds);
                }
            }, 1000);
        }
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    createBoard() {
        const grid = document.getElementById('memory-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const allEmojis = ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '👨‍🚀', '👽', '🌎', '⭐', '🌞', '🌙', '🌠', '🌩️', '☀️', '☁️', '❄️', '🔥'];
        const numPairs = (this.gridSize * this.gridSize) / 2;
        const selectedEmojis = allEmojis.slice(0, numPairs);
        let cards = [...selectedEmojis, ...selectedEmojis];
        cards = this.shuffle(cards);

        if (grid.style) {
            grid.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        }

        cards.forEach((emoji, index) => {
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

            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
        });
    },

    flipCard(card) {
        if (this.isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
        if (card === this.flippedCards[0]) return;

        this.startTimer();

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            const movesDisplay = document.getElementById('moves');
            if (movesDisplay) movesDisplay.textContent = this.moves;
            this.checkForMatch();
        }
    },

    checkForMatch() {
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.emoji === card2.dataset.emoji;

        if (isMatch) {
            this.disableCards();
        } else {
            this.unflipCards();
        }
    },

    disableCards() {
        const [card1, card2] = this.flippedCards;
        card1.classList.add('matched');
        card2.classList.add('matched');

        this.matchedPairs++;
        this.flippedCards = [];

        const numPairs = (this.gridSize * this.gridSize) / 2;
        if (this.matchedPairs === numPairs) {
            this.gameOver();
        }
    },

    unflipCards() {
        this.isLocked = true;
        const [card1, card2] = this.flippedCards;

        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    },

    gameOver() {
        this.stopTimer();
        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('match', true, { grid: this.gridSize, time: this.seconds });
        }

        setTimeout(() => {
            if (window.GameHub && window.GameHub.showModal) {
                window.GameHub.showModal({
                    title: "Level Cleared! 🎉",
                    message: `You completed the grid in ${this.moves} moves and ${this.formatTime(this.seconds)}.`,
                    confirmText: "Play Again",
                    cancelText: "Back to Lobby",
                    onConfirm: () => {
                        this.reset();
                    },
                    onCancel: () => {
                        if (window.GameHub && window.GameHub.showView) {
                            window.GameHub.showView('lobby-view');
                        }
                    }
                });
            }
        }, 500);
    }
};

window.MatchGame = MatchGame;
