const CaroGame = {
    initialized: false,
    board: null,
    activeTurn: 'X',
    playMode: 'pvp',
    humanSymbol: 'X',
    aiSymbol: 'O',
    history: [],
    winState: false,
    aiThinking: false,
    aiTimeout: null,

    init() {
        if (this.initialized) return;

        // Bind control select inputs
        const modeSelect = document.getElementById('caro-mode');
        if (modeSelect) {
            modeSelect.value = this.playMode;
            modeSelect.onchange = (e) => {
                this.playMode = e.target.value;
                this.reset();
            };
        }

        const symbolSelect = document.getElementById('caro-symbol');
        if (symbolSelect) {
            symbolSelect.value = this.humanSymbol;
            symbolSelect.onchange = (e) => {
                this.humanSymbol = e.target.value;
                this.aiSymbol = this.humanSymbol === 'X' ? 'O' : 'X';
                this.reset();
            };
        }

        // Bind buttons
        const resetBtn = document.getElementById('caro-reset-btn');
        if (resetBtn) {
            resetBtn.onclick = () => this.reset();
        }

        const undoBtn = document.getElementById('caro-undo-btn');
        if (undoBtn) {
            undoBtn.onclick = () => this.undo();
        }

        this.initialized = true;
        this.reset();
    },

    reset() {
        if (this.aiTimeout) {
            clearTimeout(this.aiTimeout);
            this.aiTimeout = null;
        }

        this.board = Array(15).fill(null).map(() => Array(15).fill(null));
        this.activeTurn = 'X';
        this.history = [];
        this.winState = false;
        this.aiThinking = false;

        // Draw cells dynamically
        const boardEl = document.getElementById('caro-board');
        if (boardEl) {
            boardEl.innerHTML = '';
            
            // Set Gomoku star points coordinates (0-indexed)
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

                    // Add star points
                    const isStar = starPoints.some(p => p.r === r && p.c === c);
                    if (isStar) {
                        cell.classList.add('star-point');
                    }

                    // Hover ghosts previews
                    cell.addEventListener('mouseenter', () => {
                        if (this.winState || this.aiThinking || this.board[r][c] !== null) return;
                        cell.classList.add('hover-preview');
                    });
                    
                    cell.addEventListener('mouseleave', () => {
                        cell.classList.remove('hover-preview');
                    });

                    cell.addEventListener('click', () => this.handleCellClick(r, c));
                    boardEl.appendChild(cell);
                }
            }
        }

        this.updateUI();

        // Trigger AI move if human plays as O (so AI starts first as X)
        if (this.playMode === 'pve' && this.humanSymbol === 'O') {
            this.triggerAiMove();
        }
    },

    updateUI() {
        const turnDisplay = document.getElementById('caro-turn-display');
        if (turnDisplay) {
            if (this.winState) {
                turnDisplay.textContent = 'Game Over';
            } else {
                turnDisplay.textContent = `${this.activeTurn}'s Turn`;
            }
        }

        const boardEl = document.getElementById('caro-board');
        if (boardEl) {
            // Set dynamic CSS hover preview values
            boardEl.style.setProperty('--hover-symbol', `"${this.activeTurn}"`);
            boardEl.style.setProperty('--hover-color', this.activeTurn === 'X' ? 'var(--accent-cyan)' : 'var(--accent-coral)');
        }
    },

    handleCellClick(r, c) {
        if (this.winState || this.aiThinking || this.board[r][c] !== null) return;

        this.placeStone(r, c, this.activeTurn);

        const win = this.checkWin(r, c);
        if (win) {
            this.handleWin(win);
            return;
        }

        if (this.checkDraw()) {
            this.handleDraw();
            return;
        }

        this.activeTurn = this.activeTurn === 'X' ? 'O' : 'X';
        this.updateUI();

        if (this.playMode === 'pve' && this.activeTurn === this.aiSymbol) {
            this.triggerAiMove();
        }
    },

    triggerAiMove() {
        this.aiThinking = true;
        this.aiTimeout = setTimeout(() => {
            this.aiTimeout = null;
            this.aiThinking = false;

            const move = this.calculateAiMove();
            this.placeStone(move.r, move.c, this.aiSymbol);

            const win = this.checkWin(move.r, move.c);
            if (win) {
                this.handleWin(win);
                return;
            }

            if (this.checkDraw()) {
                this.handleDraw();
                return;
            }

            this.activeTurn = this.humanSymbol;
            this.updateUI();
        }, 300);
    },

    placeStone(r, c, symbol) {
        this.board[r][c] = symbol;
        this.history.push({ r, c, symbol });

        const boardEl = document.getElementById('caro-board');
        if (boardEl) {
            const cell = boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.innerHTML = '';
                cell.classList.remove('hover-preview');
                const span = document.createElement('span');
                span.className = symbol === 'X' ? 'stone-x' : 'stone-o';
                span.textContent = symbol;
                cell.appendChild(span);
            }
        }
    },

    checkWin(r, c) {
        const symbol = this.board[r][c];
        if (!symbol) return null;

        const directions = [
            { dr: 0, dc: 1 },  // Horizontal
            { dr: 1, dc: 0 },  // Vertical
            { dr: 1, dc: 1 },  // Diagonal Down-Right
            { dr: 1, dc: -1 }  // Diagonal Up-Right
        ];

        for (let dir of directions) {
            const { dr, dc } = dir;
            const stones = [{ r, c }];

            // Positive direction
            let pr = r + dr;
            let pc = c + dc;
            while (pr >= 0 && pr < 15 && pc >= 0 && pc < 15 && this.board[pr][pc] === symbol) {
                stones.push({ r: pr, c: pc });
                pr += dr;
                pc += dc;
            }

            // Negative direction
            let nr = r - dr;
            let nc = c - dc;
            while (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] === symbol) {
                stones.push({ r: nr, c: nc });
                nr -= dr;
                nc -= dc;
            }

            if (stones.length >= 5) {
                // Sort stones coordinates to find extremes
                stones.sort((a, b) => {
                    if (a.r !== b.r) return a.r - b.r;
                    return a.c - b.c;
                });

                const first = stones[0];
                const last = stones[stones.length - 1];

                const stepR = dr;
                const stepC = dc;

                // Find cells outside first and last
                const end1_r = first.r - stepR;
                const end1_c = first.c - stepC;
                const end2_r = last.r + stepR;
                const end2_c = last.c + stepC;

                const opponent = symbol === 'X' ? 'O' : 'X';

                const blocked1 = (end1_r >= 0 && end1_r < 15 && end1_c >= 0 && end1_c < 15 && this.board[end1_r][end1_c] === opponent);
                const blocked2 = (end2_r >= 0 && end2_r < 15 && end2_c >= 0 && end2_c < 15 && this.board[end2_r][end2_c] === opponent);

                // Vietnamese rule: not blocked at both ends
                if (!(blocked1 && blocked2)) {
                    return { symbol, stones };
                }
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

    handleWin(win) {
        this.winState = true;
        this.updateUI();

        // Highlight winning cells
        const boardEl = document.getElementById('caro-board');
        if (boardEl) {
            win.stones.forEach(s => {
                const cell = boardEl.querySelector(`[data-row="${s.r}"][data-col="${s.c}"]`);
                if (cell) cell.classList.add('winning-cell');
            });
        }

        const humanWon = (this.playMode === 'pvp') || (win.symbol === this.humanSymbol);

        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('caro', humanWon, { result: humanWon ? 'win' : 'lose' });
        }

        setTimeout(() => {
            if (window.GameHub && window.GameHub.showModal) {
                window.GameHub.showModal({
                    title: "Game Over! 🎉",
                    message: `${win.symbol} Wins!`,
                    confirmText: "Play Again",
                    cancelText: "Back to Lobby",
                    onConfirm: () => this.reset(),
                    onCancel: () => {
                        if (window.GameHub && window.GameHub.showView) {
                            window.GameHub.showView('lobby-view');
                        }
                    }
                });
            }
        }, 600);
    },

    handleDraw() {
        this.winState = true;
        this.updateUI();

        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('caro', false, { result: 'draw' });
        }

        setTimeout(() => {
            if (window.GameHub && window.GameHub.showModal) {
                window.GameHub.showModal({
                    title: "Game Over! 🤝",
                    message: "It's a Draw!",
                    confirmText: "Play Again",
                    cancelText: "Back to Lobby",
                    onConfirm: () => this.reset(),
                    onCancel: () => {
                        if (window.GameHub && window.GameHub.showView) {
                            window.GameHub.showView('lobby-view');
                        }
                    }
                });
            }
        }, 600);
    },

    calculateAiMove() {
        let bestScore = -1;
        let bestMoves = [];

        const ai = this.aiSymbol;
        const human = this.humanSymbol;

        // Proximity/distance check: only consider cells nearby placed stones
        let boardEmpty = true;
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (this.board[r][c] !== null) {
                    boardEmpty = false;
                    break;
                }
            }
            if (!boardEmpty) break;
        }

        if (boardEmpty) {
            return { r: 7, c: 7 }; // play center on empty board
        }

        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (this.board[r][c] !== null) continue;

                // Fast proximity filter
                let hasNearby = false;
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && this.board[nr][nc] !== null) {
                            hasNearby = true;
                            break;
                        }
                    }
                    if (hasNearby) break;
                }
                if (!hasNearby) continue;

                let score = 0;

                for (let dir of directions) {
                    const { dr, dc } = dir;

                    for (let offset = -4; offset <= 0; offset++) {
                        let valid = true;
                        let aiCount = 0;
                        let humanCount = 0;

                        for (let step = 0; step < 5; step++) {
                            const wr = r + (offset + step) * dr;
                            const wc = c + (offset + step) * dc;

                            if (wr < 0 || wr >= 15 || wc < 0 || wc >= 15) {
                                valid = false;
                                break;
                            }

                            const stone = this.board[wr][wc];
                            if (stone === ai) {
                                aiCount++;
                            } else if (stone === human) {
                                humanCount++;
                            }
                        }

                        if (valid) {
                            if (aiCount > 0 && humanCount > 0) {
                                continue;
                            }
                            if (humanCount === 0) {
                                if (aiCount === 4) score += 50000;
                                else if (aiCount === 3) score += 1000;
                                else if (aiCount === 2) score += 100;
                                else if (aiCount === 1) score += 10;
                                else score += 1;
                            } else if (aiCount === 0) {
                                if (humanCount === 4) score += 20000;
                                else if (humanCount === 3) score += 800;
                                else if (humanCount === 2) score += 50;
                                else if (humanCount === 1) score += 5;
                                else score += 1;
                            }
                        }
                    }
                }

                // Add small center proximity bonus to break ties
                score += (7 - Math.abs(r - 7)) + (7 - Math.abs(c - 7));

                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ r, c }];
                } else if (score === bestScore) {
                    bestMoves.push({ r, c });
                }
            }
        }

        const index = Math.floor(Math.random() * bestMoves.length);
        return bestMoves[index];
    },

    undo() {
        if (this.history.length === 0 || this.aiThinking) return;

        if (this.aiTimeout) {
            clearTimeout(this.aiTimeout);
            this.aiTimeout = null;
        }

        const boardEl = document.getElementById('caro-board');

        if (this.playMode === 'pvp') {
            const lastMove = this.history.pop();
            this.board[lastMove.r][lastMove.c] = null;

            if (boardEl) {
                const cell = boardEl.querySelector(`[data-row="${lastMove.r}"][data-col="${lastMove.c}"]`);
                if (cell) cell.innerHTML = '';
            }

            this.activeTurn = lastMove.symbol;
            this.winState = false;

            // Remove winning cell highlights if any
            if (boardEl) {
                if (typeof boardEl.querySelectorAll === 'function') {
                    const winningCells = boardEl.querySelectorAll('.winning-cell');
                    winningCells.forEach(cell => cell.classList.remove('winning-cell'));
                } else if (boardEl.children) {
                    boardEl.children.forEach(cell => {
                        if (cell.classList && typeof cell.classList.remove === 'function') {
                            cell.classList.remove('winning-cell');
                        }
                    });
                }
            }

            this.updateUI();
        } else {
            // PVE Mode: undo 2 moves (AI move + Player move)
            if (this.history.length < 2) return;

            const aiMove = this.history.pop();
            const playerMove = this.history.pop();

            this.board[aiMove.r][aiMove.c] = null;
            this.board[playerMove.r][playerMove.c] = null;

            if (boardEl) {
                const cellAi = boardEl.querySelector(`[data-row="${aiMove.r}"][data-col="${aiMove.c}"]`);
                if (cellAi) cellAi.innerHTML = '';
                const cellPlayer = boardEl.querySelector(`[data-row="${playerMove.r}"][data-col="${playerMove.c}"]`);
                if (cellPlayer) cellPlayer.innerHTML = '';
            }

            this.activeTurn = this.humanSymbol;
            this.winState = false;

            if (boardEl) {
                if (typeof boardEl.querySelectorAll === 'function') {
                    const winningCells = boardEl.querySelectorAll('.winning-cell');
                    winningCells.forEach(cell => cell.classList.remove('winning-cell'));
                } else if (boardEl.children) {
                    boardEl.children.forEach(cell => {
                        if (cell.classList && typeof cell.classList.remove === 'function') {
                            cell.classList.remove('winning-cell');
                        }
                    });
                }
            }

            this.updateUI();
        }
    }
};

window.CaroGame = CaroGame;
