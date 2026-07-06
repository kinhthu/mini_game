/**
 * Cờ Ca Rô (Gomoku) Game Engine
 */

const CaroGame = {
    board: [],
    activeTurn: 'X', // 'X' or 'O'
    playMode: 'pve', // 'pvp' or 'pve'
    humanSymbol: 'X', // 'X' or 'O'
    aiSymbol: 'O', // opposite of humanSymbol
    history: [], // moves stack for Undo
    winState: false,
    initialized: false,
    aiThinking: false,

    init() {
        if (this.initialized) {
            this.reset();
            return;
        }

        // Bind Controls
        const modeSelect = document.getElementById('caro-mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.playMode = e.target.value;
                this.reset();
            });
        }

        const symbolX = document.getElementById('caro-symbol-x');
        const symbolO = document.getElementById('caro-symbol-o');
        
        if (symbolX && symbolO) {
            symbolX.addEventListener('click', () => {
                symbolX.classList.add('active');
                symbolO.classList.remove('active');
                this.humanSymbol = 'X';
                this.aiSymbol = 'O';
                this.reset();
            });

            symbolO.addEventListener('click', () => {
                symbolO.classList.add('active');
                symbolX.classList.remove('active');
                this.humanSymbol = 'O';
                this.aiSymbol = 'X';
                this.reset();
            });
        }

        const undoBtn = document.getElementById('caro-undo-btn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        const restartBtn = document.getElementById('caro-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.reset());
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
        this.activeTurn = 'X'; // X always plays first
        this.history = [];
        this.winState = false;
        this.aiThinking = false;

        // Clear Logs
        const logsEl = document.getElementById('caro-logs');
        if (logsEl) logsEl.innerHTML = '';

        this.addLog("Match initialized. System ready.");

        // Generate Board HTML
        this.generateBoard();
        this.updateUI();

        // If PvE and AI starts (meaning human is 'O')
        if (this.playMode === 'pve' && this.activeTurn === this.aiSymbol) {
            this.triggerAiMove();
        }
    },

    generateBoard() {
        const boardEl = document.getElementById('caro-board');
        if (!boardEl) return;

        boardEl.innerHTML = '';
        const starPoints = [
            { r: 3, c: 3 }, { r: 3, c: 11 },
            { r: 7, c: 7 },
            { r: 11, c: 3 }, { r: 11, c: 11 }
        ];

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'caro-cell';
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;

                // Check star points
                const isStar = starPoints.some(p => p.r === r && p.c === c);
                if (isStar) {
                    cellEl.classList.add('star-point');
                }

                cellEl.addEventListener('click', () => this.handleCellClick(r, c));
                boardEl.appendChild(cellEl);
            }
        }
    },

    updateUI() {
        const boardEl = document.getElementById('caro-board');
        const indicator = document.getElementById('caro-turn-indicator');
        
        if (boardEl) {
            boardEl.style.setProperty('--hover-symbol', `"${this.activeTurn}"`);
            boardEl.style.setProperty('--hover-color', this.activeTurn === 'X' ? 'var(--accent-cyan)' : 'var(--accent-coral)');
        }

        if (indicator) {
            indicator.textContent = `Turn: Player ${this.activeTurn}`;
            indicator.className = 'game-stat-val ' + (this.activeTurn === 'X' ? 'text-cyan' : 'text-coral');
        }
    },

    handleCellClick(r, c) {
        if (this.winState || this.aiThinking) return;
        if (this.board[r][c] !== null) return;

        // In PvE mode, prevent player from placing stone on AI turn
        if (this.playMode === 'pve' && this.activeTurn === this.aiSymbol) return;

        this.placeStone(r, c, this.activeTurn);
    },

    placeStone(r, c, symbol) {
        this.board[r][c] = symbol;
        
        // Find cell DOM element
        const boardEl = document.getElementById('caro-board');
        const cellEl = boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        
        if (cellEl) {
            cellEl.classList.add('taken');
            const stone = document.createElement('div');
            stone.className = `caro-stone stone-${symbol.toLowerCase()}`;
            cellEl.appendChild(stone);
        }

        // Add to history
        this.history.push({ r, c, symbol });

        // Add to log
        this.addLog(`Player ${symbol} placed stone at [${r + 1}, ${c + 1}]`);

        // Check Win
        const win = this.checkWin(r, c);
        if (win) {
            this.handleVictory(win);
            return;
        }

        // Check Draw (Board Full)
        if (this.history.length === 225) {
            this.handleDraw();
            return;
        }

        // Toggle Turn
        this.activeTurn = this.activeTurn === 'X' ? 'O' : 'X';
        this.updateUI();

        // Trigger AI if PvE
        if (this.playMode === 'pve' && this.activeTurn === this.aiSymbol) {
            this.triggerAiMove();
        }
    },

    triggerAiMove() {
        this.aiThinking = true;
        this.addLog("AI is scanning board configurations...");

        this.aiTimeout = setTimeout(() => {
            this.aiTimeout = null;
            const move = this.calculateAiMove();
            this.aiThinking = false;
            this.placeStone(move.r, move.c, this.aiSymbol);
        }, 600); // 600ms simulated thinking time
    },

    calculateAiMove() {
        // Special case: if first move, place stone at center
        if (this.board[7][7] === null) {
            return { r: 7, c: 7 };
        }

        let bestScore = -1;
        let bestMoves = [];

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (this.board[r][c] === null) {
                    const attack = this.evaluateCell(r, c, this.aiSymbol);
                    const defense = this.evaluateCell(r, c, this.humanSymbol);
                    
                    // Prioritize blocking human and completing AI strings
                    const score = attack + defense * 1.3;

                    if (score > bestScore) {
                        bestScore = score;
                        bestMoves = [{ r, c }];
                    } else if (score === bestScore) {
                        bestMoves.push({ r, c });
                    }
                }
            }
        }

        // Pick random from best moves to introduce variety
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    },

    evaluateCell(r, c, symbol) {
        const directions = [
            { dr: 0, dc: 1 },  // horizontal
            { dr: 1, dc: 0 },  // vertical
            { dr: 1, dc: 1 },  // diagonal down-right
            { dr: -1, dc: 1 }  // diagonal up-right
        ];

        let totalScore = 0;

        for (const { dr, dc } of directions) {
            let count = 1;
            let openEnds = 0;

            // Positive scan
            let currR = r + dr;
            let currC = c + dc;
            while (this.withinBounds(currR, currC) && this.board[currR][currC] === symbol) {
                count++;
                currR += dr;
                currC += dc;
            }
            if (this.withinBounds(currR, currC) && this.board[currR][currC] === null) {
                openEnds++;
            }

            // Negative scan
            currR = r - dr;
            currC = c - dc;
            while (this.withinBounds(currR, currC) && this.board[currR][currC] === symbol) {
                count++;
                currR -= dr;
                currC -= dc;
            }
            if (this.withinBounds(currR, currC) && this.board[currR][currC] === null) {
                openEnds++;
            }

            // Assign weights
            if (count >= 5) {
                totalScore += 100000;
            } else if (count === 4) {
                if (openEnds === 2) totalScore += 10000;
                else if (openEnds === 1) totalScore += 2500;
            } else if (count === 3) {
                if (openEnds === 2) totalScore += 1200;
                else if (openEnds === 1) totalScore += 200;
            } else if (count === 2) {
                if (openEnds === 2) totalScore += 150;
                else if (openEnds === 1) totalScore += 10;
            } else {
                totalScore += 1;
            }
        }

        return totalScore;
    },

    checkWin(r, c) {
        const symbol = this.board[r][c];
        if (!symbol) return null;

        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: -1, dc: 1 }
        ];

        for (const { dr, dc } of directions) {
            const stones = [{ r, c }];

            // Positive scan
            let currR = r + dr;
            let currC = c + dc;
            while (this.withinBounds(currR, currC) && this.board[currR][currC] === symbol) {
                stones.push({ r: currR, c: currC });
                currR += dr;
                currC += dc;
            }

            // Negative scan
            currR = r - dr;
            currC = c - dc;
            while (this.withinBounds(currR, currC) && this.board[currR][currC] === symbol) {
                stones.push({ r: currR, c: currC });
                currR -= dr;
                currC -= dc;
            }

            if (stones.length >= 5) {
                return { symbol, stones };
            }
        }

        return null;
    },

    withinBounds(r, c) {
        return r >= 0 && r < 15 && c >= 0 && c < 15;
    },

    handleVictory(win) {
        this.winState = true;
        
        // Highlight winning stones
        const boardEl = document.getElementById('caro-board');
        win.stones.forEach(p => {
            const cellEl = boardEl.querySelector(`[data-row="${p.r}"][data-col="${p.c}"]`);
            if (cellEl) cellEl.classList.add('winning-cell');
        });

        const isPlayerWin = this.playMode === 'pvp' || win.symbol === this.humanSymbol;
        const resultText = isPlayerWin ? 'win' : 'lose';

        // Record metrics to profile
        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('caro', isPlayerWin, { result: resultText });
        }

        // Show modals
        const modalTitle = isPlayerWin ? 'Victory! 🏆' : 'Defeat! 👾';
        const modalBody = this.playMode === 'pvp' 
            ? `Congratulations! Player <strong>${win.symbol}</strong> aligned 5 stones to win!`
            : win.symbol === this.humanSymbol 
                ? `Well played! You defeated the smart heuristic AI opponent!` 
                : `The AI calculated a winning line! Try again to refine your defense.`;

        this.addLog(`Match over. Winner: Player ${win.symbol}.`);

        setTimeout(() => {
            if (window.GameHub && typeof window.GameHub.showModal === 'function') {
                window.GameHub.showModal({
                    title: modalTitle,
                    body: modalBody,
                    confirmText: 'Play Again',
                    cancelText: 'Lobby',
                    onConfirm: () => this.reset(),
                    onCancel: () => window.GameHub.showView('lobby-view')
                });
            }
        }, 600);
    },

    handleDraw() {
        this.winState = true;
        this.addLog("Match over. It's a draw!");

        setTimeout(() => {
            if (window.GameHub && typeof window.GameHub.showModal === 'function') {
                window.GameHub.showModal({
                    title: 'Draw Match! 🤝',
                    body: 'The board is completely filled and no stones aligned 5. A perfect tie!',
                    confirmText: 'Restart',
                    cancelText: 'Lobby',
                    onConfirm: () => this.reset(),
                    onCancel: () => window.GameHub.showView('lobby-view')
                });
            }
        }, 500);
    },

    undo() {
        if (this.winState || this.aiThinking || this.history.length === 0) return;

        if (this.playMode === 'pvp') {
            // Pop 1 move
            this.popLastMove();
        } else {
            // PvE mode: pop last 2 moves (AI move and human move)
            if (this.history.length >= 2) {
                this.popLastMove(); // pop AI move
                this.popLastMove(); // pop Human move
            } else {
                // If only 1 move is made (e.g. AI went first and human hasn't placed anything)
                // We shouldn't pop if it's the AI's first turn since they started
                if (this.history[0].symbol === this.aiSymbol) {
                    window.GameHub.showNotification("Cannot undo starting AI move!", "⚠️");
                } else {
                    this.popLastMove();
                }
            }
        }

        this.updateUI();
        window.GameHub.showNotification("Undo applied!", "↩");
    },

    popLastMove() {
        const lastMove = this.history.pop();
        if (!lastMove) return;

        this.board[lastMove.r][lastMove.c] = null;
        
        // Remove DOM stone element
        const boardEl = document.getElementById('caro-board');
        const cellEl = boardEl.querySelector(`[data-row="${lastMove.r}"][data-col="${lastMove.c}"]`);
        if (cellEl) {
            cellEl.classList.remove('taken');
            cellEl.innerHTML = '';
        }

        // Toggle active turn back to move owner
        this.activeTurn = lastMove.symbol;

        // Remove from move logs DOM
        const logsEl = document.getElementById('caro-logs');
        if (logsEl && logsEl.lastChild) {
            logsEl.removeChild(logsEl.lastChild);
        }
    },

    addLog(text) {
        const logsEl = document.getElementById('caro-logs');
        if (!logsEl) return;

        const item = document.createElement('div');
        item.className = 'caro-log-item';
        item.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
        logsEl.appendChild(item);
        
        // Auto scroll to bottom
        logsEl.scrollTop = logsEl.scrollHeight;
    }
};

window.CaroGame = CaroGame;
