/**
 * Find Match - Memory Card Game
 */

const MatchGame = {
    allEmojis: [
        '👾', '🤖', '🎃', '👽', '🦊', '🐱', '🦁', '🐯',
        '🦄', '🐙', '🦖', '🐉', '🐼', '🐨', '🐸', '🐵',
        '⭐', '🌙', '🔮', '💎', '🔑', '🎨', '🚀', '🛸',
        '🍒', '🍉', '🍍', '🥑', '🍔', '🍕', '🧁', '🍦'
    ],
    gridSize: 4, // 4, 6, or 8
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    seconds: 0,
    timer: null,
    gameStarted: false,
    isLocked: false,
    initialized: false,

    init() {
        if (this.initialized) {
            this.reset();
            return;
        }

        // Bind difficulty selection
        const diffButtons = document.querySelectorAll('.difficulty-selector .diff-btn');
        diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                diffButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.gridSize = parseInt(btn.getAttribute('data-grid'), 10);
                this.reset();
            });
        });

        // Restart button
        const restartBtn = document.getElementById('match-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.reset());
        }

        this.initialized = true;
        this.reset();
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
            this.timer = setInterval(() => {
                this.seconds++;
                const timeDisplay = document.getElementById('match-time');
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

    reset() {
        this.stopTimer();
        this.gameStarted = false;
        this.isLocked = false;
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.seconds = 0;

        // Reset stats UI
        const movesDisplay = document.getElementById('match-moves');
        if (movesDisplay) movesDisplay.textContent = '0';
        
        const timeDisplay = document.getElementById('match-time');
        if (timeDisplay) timeDisplay.textContent = '0:00';

        this.generateBoard();
    },

    generateBoard() {
        const gridEl = document.getElementById('memory-grid');
        if (!gridEl) return;

        gridEl.innerHTML = '';
        
        // Clean layout classes and set correct grid class
        gridEl.className = 'memory-grid';
        gridEl.classList.add(`grid-${this.gridSize}x${this.gridSize}`);

        const numPairs = (this.gridSize * this.gridSize) / 2;
        
        // Select distinct emojis
        const selectedEmojis = this.allEmojis.slice(0, numPairs);
        this.cards = [...selectedEmojis, ...selectedEmojis];
        
        // Shuffle
        this.shuffle(this.cards);

        // Render card items
        this.cards.forEach((emoji, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'memory-card';
            cardEl.dataset.emoji = emoji;
            cardEl.dataset.index = index;

            const frontEl = document.createElement('div');
            frontEl.className = 'memory-card-face memory-card-front';

            const backEl = document.createElement('div');
            backEl.className = 'memory-card-face memory-card-back';
            backEl.textContent = emoji;

            cardEl.appendChild(frontEl);
            cardEl.appendChild(backEl);

            cardEl.addEventListener('click', () => this.handleCardClick(cardEl));
            gridEl.appendChild(cardEl);
        });
    },

    handleCardClick(cardEl) {
        if (this.isLocked) return;
        if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
        if (this.flippedCards.length > 0 && this.flippedCards[0] === cardEl) return;

        this.startTimer();

        cardEl.classList.add('flipped');
        this.flippedCards.push(cardEl);

        if (this.flippedCards.length === 2) {
            this.moves++;
            const movesDisplay = document.getElementById('match-moves');
            if (movesDisplay) movesDisplay.textContent = this.moves;
            this.checkMatch();
        }
    },

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.emoji === card2.dataset.emoji;

        if (isMatch) {
            // Match
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.flippedCards = [];

            const numPairs = (this.gridSize * this.gridSize) / 2;
            if (this.matchedPairs === numPairs) {
                this.victory();
            }
        } else {
            // Mismatch
            this.isLocked = true;
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    },

    victory() {
        this.stopTimer();
        
        // Save record to profile
        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('match', true, {
                grid: this.gridSize,
                time: this.seconds
            });
        }

        setTimeout(() => {
            if (window.GameHub && typeof window.GameHub.showModal === 'function') {
                window.GameHub.showModal({
                    title: 'Victory! 🏆',
                    body: `Congratulations! You solved the <strong>${this.gridSize}x${this.gridSize}</strong> grid in <strong>${this.moves}</strong> moves and <strong>${this.formatTime(this.seconds)}</strong>!`,
                    confirmText: 'Play Again',
                    cancelText: 'Back to Lobby',
                    onConfirm: () => this.reset(),
                    onCancel: () => window.GameHub.showView('lobby-view')
                });
            } else {
                alert(`Victory! Time: ${this.formatTime(this.seconds)}, Moves: ${this.moves}`);
            }
        }, 500);
    }
};

// Bind to window context
window.MatchGame = MatchGame;
