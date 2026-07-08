// Global state for Profile and Stats
const ProfileManager = {
    getNickname() {
        return localStorage.getItem('player_nickname') || 'CyberPlayer';
    },
    setNickname(name) {
        if (name && name.trim()) {
            localStorage.setItem('player_nickname', name.trim());
            this.updateUI();
        }
    },
    getRank(wins) {
        if (wins >= 15) return 'Grandmaster 🏆';
        if (wins >= 10) return 'Pro Gamer ⚡';
        if (wins >= 5) return 'Challenger 🌟';
        return 'Beginner 🎮';
    },
    updateUI() {
        const nicknameEl = document.getElementById('player-nickname');
        const rankEl = document.getElementById('player-rank');
        if (nicknameEl) nicknameEl.textContent = this.getNickname();
        
        // Calculate global wins to set rank
        const memoryWins = parseInt(localStorage.getItem('memory_match_wins') || '0', 10);
        const tttWins = parseInt(localStorage.getItem('ttt_pve_wins') || '0', 10) + 
                        parseInt(localStorage.getItem('ttt_pvp_wins') || '0', 10);
        const totalWins = memoryWins + tttWins;
        if (rankEl) rankEl.textContent = this.getRank(totalWins);

        // Update Lobby stats
        const memoryPlayed = parseInt(localStorage.getItem('memory_match_played') || '0', 10);
        const tttPlayed = parseInt(localStorage.getItem('ttt_pve_played') || '0', 10) + 
                          parseInt(localStorage.getItem('ttt_pvp_played') || '0', 10);
        
        const totalPlayed = memoryPlayed + tttPlayed;
        const globalPlayedEl = document.getElementById('global-played');
        if (globalPlayedEl) globalPlayedEl.textContent = totalPlayed;

        const globalWinrateEl = document.getElementById('global-winrate');
        if (globalWinrateEl) {
            const wr = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
            globalWinrateEl.textContent = `${wr}%`;
        }

        // Update Memory Match specific stats on Lobby
        const memoryWinsEl = document.getElementById('stats-memory-wins');
        if (memoryWinsEl) memoryWinsEl.textContent = memoryWins;
        const memoryLevelEl = document.getElementById('stats-memory-level');
        if (memoryLevelEl) memoryLevelEl.textContent = localStorage.getItem('memory_match_level') || '1';

        // Update Tic Tac Toe specific stats on Lobby
        const tttWinsEl = document.getElementById('stats-ttt-wins');
        if (tttWinsEl) tttWinsEl.textContent = tttWins;
        const tttDrawsEl = document.getElementById('stats-ttt-draws');
        if (tttDrawsEl) {
            const draws = parseInt(localStorage.getItem('ttt_pve_draws') || '0', 10) + 
                          parseInt(localStorage.getItem('ttt_pvp_draws') || '0', 10);
            tttDrawsEl.textContent = draws;
        }
    }
};

// Navigation controller
const GameHub = {
    showView(viewId) {
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.add('hidden');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
        }
        
        // Refresh Lobby stats if navigated back
        if (viewId === 'lobby-view') {
            ProfileManager.updateUI();
        }
    }
};

// --- Memory Match Game Logic (Encapsulated) ---
const MemoryMatch = {
    allEmojis: ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '👨‍🚀', '👽', '🌎', '⭐', '🌞', '🌙', '🌠', '🌩️', '☀️', '☁️', '❄️', '🔥'],
    currentLevel: 1,
    currentEmojis: [],
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    timer: null,
    seconds: 0,
    gameStarted: false,
    isLocked: false,

    init() {
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

        // Bind events once
        if (this.restartBtn && !this.restartBtn.dataset.bound) {
            this.restartBtn.addEventListener('click', () => {
                this.currentLevel = 1;
                if (this.currentLevelDisplay) this.currentLevelDisplay.textContent = this.currentLevel;
                localStorage.setItem('memory_match_level', this.currentLevel);
                this.resetGame();
            });
            this.restartBtn.dataset.bound = true;
        }

        if (this.playAgainBtn && !this.playAgainBtn.dataset.bound) {
            this.playAgainBtn.addEventListener('click', () => {
                this.resetGame();
            });
            this.playAgainBtn.dataset.bound = true;
        }

        if (this.nextLevelBtn && !this.nextLevelBtn.dataset.bound) {
            this.nextLevelBtn.addEventListener('click', () => {
                this.currentLevel++;
                if (this.currentLevelDisplay) this.currentLevelDisplay.textContent = this.currentLevel;
                localStorage.setItem('memory_match_level', this.currentLevel);
                this.resetGame();
            });
            this.nextLevelBtn.dataset.bound = true;
        }
        
        // Load level from localStorage
        this.currentLevel = parseInt(localStorage.getItem('memory_match_level') || '1', 10);
        if (this.currentLevelDisplay) this.currentLevelDisplay.textContent = this.currentLevel;

        this.resetGame();
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
            // Record game played
            const played = parseInt(localStorage.getItem('memory_match_played') || '0', 10);
            localStorage.setItem('memory_match_played', played + 1);

            this.timer = setInterval(() => {
                this.seconds++;
                if (this.timeDisplay) this.timeDisplay.textContent = this.formatTime(this.seconds);
            }, 1000);
        }
    },

    stopTimer() {
        clearInterval(this.timer);
    },

    getGridDimensions(numPairs) {
        if (numPairs <= 6) return 4;
        if (numPairs <= 8) return 4;
        if (numPairs <= 10) return 5;
        if (numPairs <= 12) return 6;
        if (numPairs <= 15) return 6;
        return 6;
    },

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
            
            card.addEventListener('click', this.flipCard.bind(this, card));
            
            this.grid.appendChild(card);
        });
    },

    flipCard(cardEl) {
        if (this.isLocked) return;
        if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;
        if (cardEl === this.flippedCards[0]) return;
        
        this.startTimer();
        
        cardEl.classList.add('flipped');
        this.flippedCards.push(cardEl);
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            if (this.movesDisplay) this.movesDisplay.textContent = this.moves;
            this.checkForMatch();
        }
    },

    checkForMatch() {
        let isMatch = this.flippedCards[0].dataset.emoji === this.flippedCards[1].dataset.emoji;
        
        if (isMatch) {
            this.disableCards();
        } else {
            this.unflipCards();
        }
    },

    disableCards() {
        this.flippedCards[0].classList.add('matched');
        this.flippedCards[1].classList.add('matched');
        
        this.matchedPairs++;
        this.flippedCards = [];
        
        if (this.matchedPairs === this.currentEmojis.length) {
            this.gameOver();
        }
    },

    unflipCards() {
        this.isLocked = true;
        
        setTimeout(() => {
            this.flippedCards[0].classList.remove('flipped');
            this.flippedCards[1].classList.remove('flipped');
            
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    },

    gameOver() {
        this.stopTimer();
        
        // Save victory stat
        const wins = parseInt(localStorage.getItem('memory_match_wins') || '0', 10);
        localStorage.setItem('memory_match_wins', wins + 1);

        setTimeout(() => {
            if (this.finalMoves) this.finalMoves.textContent = this.moves;
            if (this.finalTime) this.finalTime.textContent = this.formatTime(this.seconds);
            if (this.modalOverlay) this.modalOverlay.classList.add('active');
        }, 500);
    },

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
};

// Initialize App navigation and listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Navigation binds
    const playMemoryBtn = document.getElementById('play-memory-btn');
    if (playMemoryBtn) {
        playMemoryBtn.addEventListener('click', () => {
            GameHub.showView('memory-match-view');
            MemoryMatch.init();
        });
    }

    const playTttBtn = document.getElementById('play-ttt-btn');
    if (playTttBtn) {
        playTttBtn.addEventListener('click', () => {
            GameHub.showView('tictactoe-view');
            if (window.TicTacToeGame) {
                window.TicTacToeGame.init();
            }
        });
    }

    document.querySelectorAll('.back-to-lobby-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Stop timers/games if applicable
            MemoryMatch.stopTimer();
            GameHub.showView('lobby-view');
        });
    });

    // Nickname Edit Bind
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    if (editNicknameBtn) {
        editNicknameBtn.addEventListener('click', () => {
            const currentName = ProfileManager.getNickname();
            const newName = prompt('Enter your new nickname:', currentName);
            if (newName !== null) {
                ProfileManager.setNickname(newName);
            }
        });
    }

    // Initial Profile & Stats Load
    ProfileManager.updateUI();
});
