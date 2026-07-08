(function() {
    const Caro = {
        board: [],
        activeTurn: 'X', // 'X' always starts
        playMode: 'pvp', // 'pvp' or 'pve'
        aiDifficulty: 'easy', // 'easy' or 'hard'
        humanSymbol: 'X',
        aiSymbol: 'O',
        history: [], // stack of { r, c, player }
        isGameOver: false,
        isAiMoving: false,
        aiTimeout: null,
        initialized: false,
        
        init() {
            if (this.initialized) return;
            
            // DOM Elements
            this.boardEl = document.getElementById('caro-board');
            this.statusEl = document.getElementById('caro-status');
            this.undoBtn = document.getElementById('caro-undo-btn');
            this.restartBtn = document.getElementById('caro-restart-btn');
            this.clearBtn = document.getElementById('caro-clear-btn');
            
            this.modePvpBtn = document.getElementById('caro-mode-pvp-btn');
            this.modePveBtn = document.getElementById('caro-mode-pve-btn');
            this.aiDifficultyGroup = document.getElementById('caro-ai-difficulty-group');
            this.diffEasyBtn = document.getElementById('caro-diff-easy-btn');
            this.diffHardBtn = document.getElementById('caro-diff-hard-btn');
            
            this.scoreXEl = document.getElementById('caro-score-x');
            this.scoreOEl = document.getElementById('caro-score-o');
            this.scoreDrawsEl = document.getElementById('caro-score-draws');
            
            this.lblPlayerX = document.getElementById('caro-lbl-player-x');
            this.lblPlayerO = document.getElementById('caro-lbl-player-o');
            
            // Register listeners
            this.modePvpBtn.addEventListener('click', () => this.switchMode('pvp'));
            this.modePveBtn.addEventListener('click', () => this.switchMode('pve'));
            if (this.diffEasyBtn) this.diffEasyBtn.addEventListener('click', () => this.switchDifficulty('easy'));
            if (this.diffHardBtn) this.diffHardBtn.addEventListener('click', () => this.switchDifficulty('hard'));
            
            this.undoBtn.addEventListener('click', () => this.undo());
            this.restartBtn.addEventListener('click', () => this.reset());
            this.clearBtn.addEventListener('click', () => this.clearScores());
            
            // Load configurations
            this.gameMode = localStorage.getItem('caro_game_mode') || 'pvp';
            this.playMode = this.gameMode; // Keep both in sync
            this.aiDifficulty = localStorage.getItem('caro_ai_diff') || 'easy';
            
            this.updateConfigUI();
            this.updateLabels();
            this.loadScores();
            
            this.generateBoard();
            this.reset();
            
            this.initialized = true;
        },
        
        switchMode(mode) {
            if (this.isAiMoving) return;
            this.playMode = mode;
            this.gameMode = mode;
            localStorage.setItem('caro_game_mode', mode);
            this.updateConfigUI();
            this.updateLabels();
            this.reset();
        },
        
        switchDifficulty(diff) {
            if (this.isAiMoving) return;
            this.aiDifficulty = diff;
            localStorage.setItem('caro_ai_diff', diff);
            this.updateConfigUI();
            this.reset();
        },
        
        updateConfigUI() {
            if (this.playMode === 'pvp') {
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
            if (this.playMode === 'pvp') {
                this.lblPlayerX.textContent = 'Player X';
                this.lblPlayerO.textContent = 'Player O';
            } else {
                const name = localStorage.getItem('player_nickname') || 'Player';
                this.lblPlayerX.textContent = name;
                this.lblPlayerO.textContent = 'AI';
            }
        },
        
        loadScores() {
            const mode = this.playMode;
            const wins = localStorage.getItem(`caro_${mode}_wins`) || '0';
            const losses = localStorage.getItem(`caro_${mode}_losses`) || '0';
            const draws = localStorage.getItem(`caro_${mode}_draws`) || '0';
            
            this.scoreXEl.textContent = wins;
            this.scoreOEl.textContent = losses;
            this.scoreDrawsEl.textContent = draws;
        },
        
        saveScore(result) {
            const mode = this.playMode;
            if (result === 'draw') {
                const key = `caro_${mode}_draws`;
                localStorage.setItem(key, parseInt(localStorage.getItem(key) || '0', 10) + 1);
            } else if (result === 'X') {
                const key = `caro_${mode}_wins`;
                localStorage.setItem(key, parseInt(localStorage.getItem(key) || '0', 10) + 1);
            } else if (result === 'O') {
                const key = `caro_${mode}_losses`;
                localStorage.setItem(key, parseInt(localStorage.getItem(key) || '0', 10) + 1);
            }
            this.loadScores();
            if (window.ProfileManager) {
                window.ProfileManager.updateUI();
            }
        },
        
        clearScores() {
            const mode = this.playMode;
            localStorage.setItem(`caro_${mode}_wins`, '0');
            localStorage.setItem(`caro_${mode}_losses`, '0');
            localStorage.setItem(`caro_${mode}_draws`, '0');
            this.loadScores();
            if (window.ProfileManager) {
                window.ProfileManager.updateUI();
            }
        },
        
        generateBoard() {
            this.boardEl.innerHTML = '';
            this.boardEl.className = 'caro-grid';
            
            const starPoints = [
                { r: 3, c: 3 }, { r: 3, c: 11 },
                { r: 7, c: 7 },
                { r: 11, c: 3 }, { r: 11, c: 11 }
            ];
            
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'caro-cell';
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    
                    const isStar = starPoints.some(p => p.r === r && p.c === c);
                    if (isStar) {
                        cell.classList.add('star-point');
                    }
                    
                    cell.addEventListener('click', () => this.handleCellClick(r, c));
                    this.boardEl.appendChild(cell);
                }
            }
        },
        
        reset() {
            if (this.aiTimeout) {
                clearTimeout(this.aiTimeout);
                this.aiTimeout = null;
            }
            
            this.board = Array(15).fill(null).map(() => Array(15).fill(null));
            this.activeTurn = 'X';
            this.history = [];
            this.isGameOver = false;
            this.isAiMoving = false;
            
            const cells = this.boardEl.querySelectorAll('.caro-cell');
            cells.forEach(cell => {
                cell.className = cell.classList.contains('star-point') ? 'caro-cell star-point' : 'caro-cell';
                cell.textContent = '';
            });
            
            this.boardEl.classList.remove('locked');
            this.undoBtn.disabled = true;
            this.updateUI();
        },
        
        updateUI() {
            // Update turn indicator
            if (!this.isGameOver) {
                if (this.playMode === 'pvp') {
                    this.statusEl.textContent = `Lượt của Player ${this.activeTurn}`;
                } else {
                    if (this.activeTurn === this.humanSymbol) {
                        const name = localStorage.getItem('player_nickname') || 'Player';
                        this.statusEl.textContent = `Lượt của bạn (${this.humanSymbol})`;
                    } else {
                        this.statusEl.textContent = 'AI đang suy nghĩ... 🤖';
                    }
                }
            }
            
            // Set hover preview symbol & color on parent board
            if (this.boardEl) {
                const hoverColor = this.activeTurn === 'X' ? 'var(--accent-cyan)' : 'var(--accent-coral)';
                this.boardEl.style.setProperty('--hover-symbol', `"${this.activeTurn}"`);
                this.boardEl.style.setProperty('--hover-color', hoverColor);
            }
        },
        
        handleCellClick(r, c) {
            if (this.isGameOver || this.isAiMoving) return;
            if (this.board[r][c] !== null) return;
            
            this.placeStone(r, c, this.activeTurn);
            
            const win = this.checkWin(r, c);
            if (win) {
                this.endGame(win);
                return;
            }
            
            if (this.checkDraw()) {
                this.endGame('draw');
                return;
            }
            
            // Toggle turn
            this.activeTurn = this.activeTurn === 'X' ? 'O' : 'X';
            this.updateUI();
            this.undoBtn.disabled = false;
            
            if (this.playMode === 'pve' && this.activeTurn === this.aiSymbol) {
                this.triggerAiMove();
            }
        },
        
        placeStone(r, c, player) {
            this.board[r][c] = player;
            this.history.push({ r, c, player });
            
            const cell = this.boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.textContent = player;
                cell.classList.add(player.toLowerCase());
            }
        },
        
        checkWin(r, c) {
            const player = this.board[r][c];
            if (!player) return null;
            
            const directions = [
                { dr: 0, dc: 1 },  // horizontal
                { dr: 1, dc: 0 },  // vertical
                { dr: 1, dc: 1 },  // diagonal \
                { dr: 1, dc: -1 }  // diagonal /
            ];
            
            for (let { dr, dc } of directions) {
                const stones = [[r, c]];
                
                // positive direction
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
                    stones.push([nr, nc]);
                    nr += dr;
                    nc += dc;
                }
                
                // negative direction
                nr = r - dr;
                nc = c - dc;
                while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
                    stones.push([nr, nc]);
                    nr -= dr;
                    nc -= dc;
                }
                
                if (stones.length >= 5) {
                    return { symbol: player, stones };
                }
            }
            
            return null;
        },
        
        checkDraw() {
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    if (this.board[r][c] === null) return false;
                }
            }
            return true;
        },
        
        endGame(win) {
            this.isGameOver = true;
            this.boardEl.classList.add('locked');
            this.undoBtn.disabled = true;
            
            if (win === 'draw') {
                this.statusEl.textContent = 'Trận đấu hòa! 🤝';
                this.saveScore('draw');
            } else {
                win.stones.forEach(([r, c]) => {
                    const cell = this.boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        cell.classList.add('winning');
                    }
                });
                
                if (this.playMode === 'pvp') {
                    this.statusEl.textContent = `Player ${win.symbol} Thắng! 🎉`;
                } else {
                    if (win.symbol === this.humanSymbol) {
                        this.statusEl.textContent = 'Bạn đã thắng! 🎉';
                    } else {
                        this.statusEl.textContent = 'AI đã thắng! 🤖';
                    }
                }
                this.saveScore(win.symbol);
            }
        },
        
        undo() {
            if (this.history.length === 0 || this.isGameOver || this.isAiMoving) return;
            
            if (this.playMode === 'pvp') {
                const last = this.history.pop();
                this.board[last.r][last.c] = null;
                const cell = this.boardEl.querySelector(`[data-row="${last.r}"][data-col="${last.c}"]`);
                if (cell) {
                    cell.textContent = '';
                    cell.className = cell.classList.contains('star-point') ? 'caro-cell star-point' : 'caro-cell';
                }
                this.activeTurn = last.player;
            } else {
                // PvE Mode: pop 2 moves
                if (this.history.length >= 2) {
                    // Pop AI move
                    const lastAi = this.history.pop();
                    this.board[lastAi.r][lastAi.c] = null;
                    let cell = this.boardEl.querySelector(`[data-row="${lastAi.r}"][data-col="${lastAi.c}"]`);
                    if (cell) {
                        cell.textContent = '';
                        cell.className = cell.classList.contains('star-point') ? 'caro-cell star-point' : 'caro-cell';
                    }
                    
                    // Pop Human move
                    const lastHuman = this.history.pop();
                    this.board[lastHuman.r][lastHuman.c] = null;
                    cell = this.boardEl.querySelector(`[data-row="${lastHuman.r}"][data-col="${lastHuman.c}"]`);
                    if (cell) {
                        cell.textContent = '';
                        cell.className = cell.classList.contains('star-point') ? 'caro-cell star-point' : 'caro-cell';
                    }
                    this.activeTurn = this.humanSymbol;
                } else if (this.history.length === 1) {
                    const last = this.history.pop();
                    this.board[last.r][last.c] = null;
                    const cell = this.boardEl.querySelector(`[data-row="${last.r}"][data-col="${last.c}"]`);
                    if (cell) {
                        cell.textContent = '';
                        cell.className = cell.classList.contains('star-point') ? 'caro-cell star-point' : 'caro-cell';
                    }
                    this.activeTurn = this.humanSymbol;
                }
            }
            
            this.undoBtn.disabled = this.history.length === 0;
            this.updateUI();
        },
        
        triggerAiMove() {
            this.isAiMoving = true;
            this.boardEl.classList.add('locked');
            this.updateUI();
            
            // Record game played if human made first move
            if (this.history.length === 1) {
                const played = parseInt(localStorage.getItem('caro_pve_played') || '0', 10);
                localStorage.setItem('caro_pve_played', played + 1);
            }
            
            this.aiTimeout = setTimeout(() => {
                const move = this.calculateAiMove();
                this.placeStone(move.r, move.c, this.aiSymbol);
                
                const win = this.checkWin(move.r, move.c);
                if (win) {
                    this.isAiMoving = false;
                    this.endGame(win);
                    return;
                }
                
                if (this.checkDraw()) {
                    this.isAiMoving = false;
                    this.endGame('draw');
                    return;
                }
                
                this.activeTurn = this.humanSymbol;
                this.isAiMoving = false;
                this.boardEl.classList.remove('locked');
                this.updateUI();
            }, 300);
        },
        
        calculateAiMove() {
            // First move optimization: take center
            if (this.board[7][7] === null) {
                return { r: 7, c: 7 };
            }
            
            if (this.aiDifficulty === 'easy') {
                const empty = [];
                for (let r = 0; r < 15; r++) {
                    for (let c = 0; c < 15; c++) {
                        if (this.board[r][c] === null) empty.push({ r, c });
                    }
                }
                return empty[Math.floor(Math.random() * empty.length)];
            }
            
            // Heuristic Evaluation for Hard AI
            let bestScore = -1;
            let bestMoves = [];
            
            for (let r = 0; r < 15; r++) {
                for (let c = 0; c < 15; c++) {
                    if (this.board[r][c] !== null) continue;
                    
                    const attackScore = this.evaluateCell(r, c, this.aiSymbol);
                    const defenseScore = this.evaluateCell(r, c, this.humanSymbol);
                    const totalScore = attackScore * 1.1 + defenseScore;
                    
                    if (totalScore > bestScore) {
                        bestScore = totalScore;
                        bestMoves = [{ r, c }];
                    } else if (totalScore === bestScore) {
                        bestMoves.push({ r, c });
                    }
                }
            }
            
            return bestMoves[Math.floor(Math.random() * bestMoves.length)];
        },
        
        evaluateCell(r, c, player) {
            const opponent = player === 'X' ? 'O' : 'X';
            let score = 0;
            
            const directions = [
                { dr: 0, dc: 1 },  // horizontal
                { dr: 1, dc: 0 },  // vertical
                { dr: 1, dc: 1 },  // diagonal \
                { dr: 1, dc: -1 }  // diagonal /
            ];
            
            for (let { dr, dc } of directions) {
                let count = 1;
                let openEnds = 0;
                
                // Positive direction
                let nr = r + dr;
                let nc = c + dc;
                while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
                    count++;
                    nr += dr;
                    nc += dc;
                }
                if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === null) {
                    openEnds++;
                }
                
                // Negative direction
                nr = r - dr;
                nc = c - dc;
                while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === player) {
                    count++;
                    nr -= dr;
                    nc -= dc;
                }
                if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === null) {
                    openEnds++;
                }
                
                // Score evaluation weights
                if (count >= 5) {
                    score += 100000;
                } else if (count === 4) {
                    if (openEnds === 2) score += 10000;
                    else if (openEnds === 1) score += 1000;
                } else if (count === 3) {
                    if (openEnds === 2) score += 1000;
                    else if (openEnds === 1) score += 100;
                } else if (count === 2) {
                    if (openEnds === 2) score += 100;
                    else if (openEnds === 1) score += 10;
                } else {
                    if (openEnds === 2) score += 10;
                    else if (openEnds === 1) score += 1;
                }
            }
            return score;
        }
    };
    
    window.CaroGame = Caro;
})();
