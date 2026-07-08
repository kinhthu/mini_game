(function() {
    const TicTacToe = {
        board: Array(9).fill(null),
        currentPlayer: 'X', // 'X' always starts
        gameMode: 'pvp',    // 'pvp' or 'pve'
        aiDifficulty: 'easy', // 'easy' or 'hard' (Unbeatable)
        history: [],        // stack of states for undo: each element is { board: [...], currentPlayer }
        isGameOver: false,
        isAiMoving: false,

        // Winning combinations
        winCombos: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ],

        init() {
            this.board = Array(9).fill(null);
            this.currentPlayer = 'X';
            this.history = [];
            this.isGameOver = false;
            this.isAiMoving = false;

            // DOM elements
            this.boardEl = document.getElementById('ttt-board');
            this.cells = document.querySelectorAll('.ttt-cell');
            this.statusEl = document.getElementById('ttt-status');
            this.undoBtn = document.getElementById('ttt-undo-btn');
            this.restartBtn = document.getElementById('ttt-restart-btn');
            this.clearBtn = document.getElementById('ttt-clear-btn');
            
            this.modePvpBtn = document.getElementById('mode-pvp-btn');
            this.modePveBtn = document.getElementById('mode-pve-btn');
            this.aiDifficultyGroup = document.getElementById('ai-difficulty-group');
            this.diffEasyBtn = document.getElementById('diff-easy-btn');
            this.diffHardBtn = document.getElementById('diff-hard-btn');

            this.scoreXEl = document.getElementById('ttt-score-x');
            this.scoreOEl = document.getElementById('ttt-score-o');
            this.scoreDrawsEl = document.getElementById('ttt-score-draws');

            this.lblPlayerX = document.getElementById('lbl-player-x');
            this.lblPlayerO = document.getElementById('lbl-player-o');

            // Setup listeners once (using data-bound flag to avoid double bind)
            if (this.boardEl && !this.boardEl.dataset.bound) {
                this.cells.forEach(cell => {
                    cell.addEventListener('click', (e) => this.handleCellClick(e));
                });
                
                this.modePvpBtn.addEventListener('click', () => this.switchMode('pvp'));
                this.modePveBtn.addEventListener('click', () => this.switchMode('pve'));
                this.diffEasyBtn.addEventListener('click', () => this.switchDifficulty('easy'));
                this.diffHardBtn.addEventListener('click', () => this.switchDifficulty('hard'));
                
                this.undoBtn.addEventListener('click', () => this.undoMove());
                this.restartBtn.addEventListener('click', () => this.resetMatch());
                this.clearBtn.addEventListener('click', () => this.clearScore());

                this.boardEl.dataset.bound = true;
            }

            // Load configurations
            this.gameMode = localStorage.getItem('ttt_game_mode') || 'pvp';
            this.aiDifficulty = localStorage.getItem('ttt_ai_diff') || 'easy';
            
            this.updateConfigUI();
            this.updateLabels();
            this.loadScores();
            this.resetBoard();
        },

        updateConfigUI() {
            if (this.gameMode === 'pvp') {
                this.modePvpBtn.classList.add('active');
                this.modePveBtn.classList.remove('active');
                this.aiDifficultyGroup.classList.add('hidden');
            } else {
                this.modePvpBtn.classList.remove('active');
                this.modePveBtn.classList.add('active');
                this.aiDifficultyGroup.classList.remove('hidden');
            }

            if (this.aiDifficulty === 'easy') {
                this.diffEasyBtn.classList.add('active');
                this.diffHardBtn.classList.remove('active');
            } else {
                this.diffEasyBtn.classList.remove('active');
                this.diffHardBtn.classList.add('active');
            }
        },

        updateLabels() {
            if (this.gameMode === 'pvp') {
                this.lblPlayerX.textContent = 'Player X';
                this.lblPlayerO.textContent = 'Player O';
            } else {
                const name = localStorage.getItem('player_nickname') || 'Player';
                this.lblPlayerX.textContent = name;
                this.lblPlayerO.textContent = 'AI (O)';
            }
        },

        switchMode(mode) {
            if (this.gameMode === mode) return;
            this.gameMode = mode;
            localStorage.setItem('ttt_game_mode', mode);
            this.updateConfigUI();
            this.updateLabels();
            this.loadScores();
            this.resetBoard();
        },

        switchDifficulty(diff) {
            if (this.aiDifficulty === diff) return;
            this.aiDifficulty = diff;
            localStorage.setItem('ttt_ai_diff', diff);
            this.updateConfigUI();
            this.resetBoard();
        },

        loadScores() {
            const prefix = this.gameMode;
            const wins = localStorage.getItem(`ttt_${prefix}_wins`) || '0';
            const losses = localStorage.getItem(`ttt_${prefix}_losses`) || '0';
            const draws = localStorage.getItem(`ttt_${prefix}_draws`) || '0';

            this.scoreXEl.textContent = wins;
            this.scoreOEl.textContent = losses;
            this.scoreDrawsEl.textContent = draws;
        },

        saveScore(winner) {
            const prefix = this.gameMode;
            if (winner === 'X') {
                const val = parseInt(localStorage.getItem(`ttt_${prefix}_wins`) || '0', 10) + 1;
                localStorage.setItem(`ttt_${prefix}_wins`, val);
                // Increments the overall profile games played
                const played = parseInt(localStorage.getItem('ttt_played_count') || '0', 10) + 1;
                localStorage.setItem('ttt_played_count', played);
                if (this.gameMode === 'pvp') {
                    localStorage.setItem('ttt_pvp_played', parseInt(localStorage.getItem('ttt_pvp_played') || '0', 10) + 1);
                } else {
                    localStorage.setItem('ttt_pve_played', parseInt(localStorage.getItem('ttt_pve_played') || '0', 10) + 1);
                }
            } else if (winner === 'O') {
                const val = parseInt(localStorage.getItem(`ttt_${prefix}_losses`) || '0', 10) + 1;
                localStorage.setItem(`ttt_${prefix}_losses`, val);
                if (this.gameMode === 'pvp') {
                    localStorage.setItem('ttt_pvp_played', parseInt(localStorage.getItem('ttt_pvp_played') || '0', 10) + 1);
                } else {
                    localStorage.setItem('ttt_pve_played', parseInt(localStorage.getItem('ttt_pve_played') || '0', 10) + 1);
                }
            } else {
                const val = parseInt(localStorage.getItem(`ttt_${prefix}_draws`) || '0', 10) + 1;
                localStorage.setItem(`ttt_${prefix}_draws`, val);
                if (this.gameMode === 'pvp') {
                    localStorage.setItem('ttt_pvp_played', parseInt(localStorage.getItem('ttt_pvp_played') || '0', 10) + 1);
                } else {
                    localStorage.setItem('ttt_pve_played', parseInt(localStorage.getItem('ttt_pve_played') || '0', 10) + 1);
                }
            }
            this.loadScores();
            
            // Sync Lobby UI
            if (window.ProfileManager) {
                window.ProfileManager.updateUI();
            }
        },

        clearScore() {
            const prefix = this.gameMode;
            localStorage.setItem(`ttt_${prefix}_wins`, '0');
            localStorage.setItem(`ttt_${prefix}_losses`, '0');
            localStorage.setItem(`ttt_${prefix}_draws`, '0');
            this.loadScores();
            if (window.ProfileManager) {
                window.ProfileManager.updateUI();
            }
        },

        resetBoard() {
            this.board = Array(9).fill(null);
            this.currentPlayer = 'X';
            this.history = [];
            this.isGameOver = false;
            this.isAiMoving = false;
            this.undoBtn.disabled = true;

            this.cells.forEach(cell => {
                cell.textContent = '';
                cell.className = 'ttt-cell';
            });

            this.updateStatus();
        },

        resetMatch() {
            this.resetBoard();
        },

        updateStatus() {
            if (this.isGameOver) return;

            if (this.gameMode === 'pvp') {
                this.statusEl.textContent = `Player ${this.currentPlayer}'s Turn`;
            } else {
                if (this.currentPlayer === 'X') {
                    this.statusEl.textContent = 'Your Turn';
                } else {
                    this.statusEl.textContent = 'AI is thinking...';
                }
            }
        },

        handleCellClick(e) {
            const index = parseInt(e.target.dataset.index, 10);
            if (this.board[index] || this.isGameOver || this.isAiMoving) return;
            
            // Player's move
            this.makeMove(index, this.currentPlayer);

            // If PvE and not game over, trigger AI
            if (this.gameMode === 'pve' && !this.isGameOver && this.currentPlayer === 'O') {
                this.triggerAiMove();
            }
        },

        makeMove(index, player) {
            // Save state to history for undo BEFORE making the move
            this.history.push({
                board: [...this.board],
                currentPlayer: this.currentPlayer
            });
            this.undoBtn.disabled = false;

            this.board[index] = player;
            const cell = this.cells[index];
            cell.textContent = player;
            cell.classList.add(player.toLowerCase());

            const winResult = this.checkWin(this.board, player);
            if (winResult) {
                this.endGame(player, winResult);
                return;
            }

            if (this.board.every(cell => cell !== null)) {
                this.endGame('draw');
                return;
            }

            // Toggle player
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
        },

        triggerAiMove() {
            this.isAiMoving = true;
            this.statusEl.textContent = 'AI is thinking...';

            setTimeout(() => {
                if (this.isGameOver) {
                    this.isAiMoving = false;
                    return;
                }
                const bestMove = this.aiDifficulty === 'easy' ? this.getRandomMove() : this.getMinimaxMove();
                if (bestMove !== null) {
                    this.makeMove(bestMove, 'O');
                }
                this.isAiMoving = false;
            }, 500);
        },

        getRandomMove() {
            const empties = this.board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
            if (empties.length === 0) return null;
            return empties[Math.floor(Math.random() * empties.length)];
        },

        getMinimaxMove() {
            let bestScore = -Infinity;
            let bestMove = null;
            
            for (let i = 0; i < 9; i++) {
                if (this.board[i] === null) {
                    this.board[i] = 'O'; // AI's move
                    let score = this.minimax(this.board, 0, false);
                    this.board[i] = null;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = i;
                    }
                }
            }
            return bestMove;
        },

        minimax(b, depth, isMaximizing) {
            // Terminals
            const winner = this.checkWinForScore(b);
            if (winner === 'O') return 10 - depth; // AI wins
            if (winner === 'X') return depth - 10; // Player wins
            if (b.every(cell => cell !== null)) return 0; // Draw

            if (isMaximizing) {
                let bestScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (b[i] === null) {
                        b[i] = 'O';
                        let score = this.minimax(b, depth + 1, false);
                        b[i] = null;
                        bestScore = Math.max(score, bestScore);
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (b[i] === null) {
                        b[i] = 'X';
                        let score = this.minimax(b, depth + 1, true);
                        b[i] = null;
                        bestScore = Math.min(score, bestScore);
                    }
                }
                return bestScore;
            }
        },

        checkWin(b, player) {
            for (let combo of this.winCombos) {
                if (b[combo[0]] === player && b[combo[1]] === player && b[combo[2]] === player) {
                    return combo;
                }
            }
            return null;
        },

        checkWinForScore(b) {
            for (let combo of this.winCombos) {
                if (b[combo[0]] !== null && b[combo[0]] === b[combo[1]] && b[combo[0]] === b[combo[2]]) {
                    return b[combo[0]];
                }
            }
            return null;
        },

        endGame(result, winCombo = null) {
            this.isGameOver = true;
            this.undoBtn.disabled = true;

            if (result === 'draw') {
                this.statusEl.textContent = "Match Draw! 🤝";
                this.saveScore('draw');
            } else {
                if (winCombo) {
                    winCombo.forEach(idx => {
                        this.cells[idx].classList.add('winning');
                    });
                }
                
                if (this.gameMode === 'pvp') {
                    this.statusEl.textContent = `Player ${result} Wins! 🎉`;
                } else {
                    if (result === 'X') {
                        this.statusEl.textContent = 'You Win! 🎉';
                    } else {
                        this.statusEl.textContent = 'AI Wins! 🤖';
                    }
                }
                this.saveScore(result);
            }
        },

        undoMove() {
            if (this.history.length === 0 || this.isGameOver || this.isAiMoving) return;

            if (this.gameMode === 'pvp') {
                // Pop 1 state
                const prevState = this.history.pop();
                this.board = prevState.board;
                this.currentPlayer = prevState.currentPlayer;
            } else {
                // PvE Mode: AI moves automatically after player. So history has player state, then AI state.
                // We want to revert both moves to let player make their choice again.
                // Pop the state before player's last move (which is 2 steps back in history list, or we just pop until player's turn)
                if (this.history.length >= 2) {
                    this.history.pop(); // Pop AI's move state
                    const prevState = this.history.pop(); // Pop Player's move state
                    this.board = prevState.board;
                    this.currentPlayer = prevState.currentPlayer;
                } else if (this.history.length === 1) {
                    // Just 1 move in history, should be player's move (e.g. AI hasn't moved yet or it was first)
                    const prevState = this.history.pop();
                    this.board = prevState.board;
                    this.currentPlayer = prevState.currentPlayer;
                }
            }

            // Sync Board DOM
            this.board.forEach((val, idx) => {
                const cell = this.cells[idx];
                cell.textContent = val || '';
                cell.className = 'ttt-cell';
                if (val) {
                    cell.classList.add(val.toLowerCase());
                }
            });

            this.undoBtn.disabled = this.history.length === 0;
            this.updateStatus();
        }
    };

    // Attach to window so it can be called by main.js
    window.TicTacToeGame = TicTacToe;
})();
