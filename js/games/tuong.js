(function() {
    const TuongGame = {
        // Board is a 90-element array (9 columns x 10 rows)
        board: Array(90).fill(null),
        currentPlayer: 'r', // 'r' (Red goes first) or 'b' (Black/AI)
        gameMode: 'pvp',    // 'pvp' or 'pve'
        aiDifficulty: 'easy', // 'easy' or 'hard'
        isGameOver: false,
        isAiMoving: false,
        initialized: false,
        aiTimeout: null,
        
        selectedSquare: null,
        validMoves: [],
        history: [], // undo stack
        
        scores: {
            red: 0,
            draws: 0,
            black: 0
        },

        pieceDetails: {
            b: {
                K: { han: '将', latin: 'Tướng' },
                A: { han: '士', latin: 'Sĩ' },
                B: { han: '象', latin: 'Tượng' },
                N: { han: '马', latin: 'Mã' },
                R: { han: '车', latin: 'Xe' },
                C: { han: '炮', latin: 'Pháo' },
                P: { han: '卒', latin: 'Tốt' }
            },
            r: {
                K: { han: '帅', latin: 'Tướng' },
                A: { han: '仕', latin: 'Sĩ' },
                B: { han: '相', latin: 'Tượng' },
                N: { han: '傌', latin: 'Mã' },
                R: { han: '俥', latin: 'Xe' },
                C: { han: '炮', latin: 'Pháo' },
                P: { han: '兵', latin: 'Tốt' }
            }
        },

        init() {
            if (this.initialized) {
                this.reset();
                return;
            }

            // DOM elements
            this.boardEl = document.getElementById('tuong-board');
            this.statusEl = document.getElementById('tuong-status');
            this.undoBtn = document.getElementById('tuong-undo-btn');
            this.restartBtn = document.getElementById('tuong-restart-btn');
            this.clearBtn = document.getElementById('tuong-clear-btn');
            
            this.modePvpBtn = document.getElementById('tuong-mode-pvp-btn');
            this.modePveBtn = document.getElementById('tuong-mode-pve-btn');
            this.aiDifficultyGroup = document.getElementById('tuong-ai-difficulty-group');
            this.diffEasyBtn = document.getElementById('tuong-diff-easy-btn');
            this.diffHardBtn = document.getElementById('tuong-diff-hard-btn');

            this.scoreRedEl = document.getElementById('tuong-score-red');
            this.scoreBlackEl = document.getElementById('tuong-score-black');
            this.scoreDrawsEl = document.getElementById('tuong-score-draws');

            this.lblPlayerRed = document.getElementById('tuong-lbl-player-red');
            this.lblPlayerBlack = document.getElementById('tuong-lbl-player-black');

            // Event listeners
            if (this.boardEl && !this.boardEl.dataset.bound) {
                this.boardEl.addEventListener('click', (e) => this.handleSquareClick(e));
                
                this.modePvpBtn.addEventListener('click', () => this.switchMode('pvp'));
                this.modePveBtn.addEventListener('click', () => this.switchMode('pve'));
                this.diffEasyBtn.addEventListener('click', () => this.switchDifficulty('easy'));
                this.diffHardBtn.addEventListener('click', () => this.switchDifficulty('hard'));
                
                this.undoBtn.addEventListener('click', () => this.undoMove());
                this.restartBtn.addEventListener('click', () => this.reset());
                this.clearBtn.addEventListener('click', () => this.clearScore());

                this.boardEl.dataset.bound = true;
            }

            // Load configurations from storage
            this.gameMode = localStorage.getItem('tuong_game_mode') || 'pvp';
            this.aiDifficulty = localStorage.getItem('tuong_ai_diff') || 'easy';

            this.updateConfigUI();
            this.updateLabels();
            this.loadScores();
            this.setupInitialBoard();
            this.renderBoard();
            this.updateStatus();
            this.initialized = true;
        },

        setupInitialBoard() {
            this.board = Array(90).fill(null);
            this.currentPlayer = 'r'; // Red goes first
            this.isGameOver = false;
            this.isAiMoving = false;
            this.selectedSquare = null;
            this.validMoves = [];
            this.history = [];

            // Setup black pieces (rows 0, 2, 3)
            const bBack = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R'];
            for (let c = 0; c < 9; c++) {
                this.board[c] = { type: bBack[c], color: 'b' };
            }
            this.board[19] = { type: 'C', color: 'b' };
            this.board[25] = { type: 'C', color: 'b' };
            
            const bPawns = [27, 29, 31, 33, 35];
            bPawns.forEach(idx => {
                this.board[idx] = { type: 'P', color: 'b' };
            });

            // Setup red pieces (rows 9, 7, 6)
            const rBack = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R'];
            for (let c = 0; c < 9; c++) {
                this.board[81 + c] = { type: rBack[c], color: 'r' };
            }
            this.board[64] = { type: 'C', color: 'r' };
            this.board[70] = { type: 'C', color: 'r' };

            const rPawns = [54, 56, 58, 60, 62];
            rPawns.forEach(idx => {
                this.board[idx] = { type: 'P', color: 'r' };
            });

            if (this.aiTimeout) {
                clearTimeout(this.aiTimeout);
                this.aiTimeout = null;
            }
        },

        isPalaceDiagonal(row, col) {
            // Black Palace: rows 0-2, cols 3-5
            if (row >= 0 && row <= 2 && col >= 3 && col <= 5) {
                if ((row === 0 && col === 3) || (row === 2 && col === 5)) return 'palace-diagonal-1';
                if ((row === 0 && col === 5) || (row === 2 && col === 3)) return 'palace-diagonal-2';
                if (row === 1 && col === 4) return 'palace-diagonal-both';
            }
            // Red Palace: rows 7-9, cols 3-5
            if (row >= 7 && row <= 9 && col >= 3 && col <= 5) {
                if ((row === 7 && col === 3) || (row === 9 && col === 5)) return 'palace-diagonal-1';
                if ((row === 7 && col === 5) || (row === 9 && col === 3)) return 'palace-diagonal-2';
                if (row === 8 && col === 4) return 'palace-diagonal-both';
            }
            return '';
        },

        renderBoard() {
            if (!this.boardEl) return;
            this.boardEl.innerHTML = '';

            // Render 90 squares
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 9; c++) {
                    const idx = r * 9 + c;
                    const piece = this.board[idx];

                    const square = document.createElement('div');
                    square.className = 'tuong-square';
                    square.dataset.index = idx;

                    // Add palace diagonal borders if necessary
                    const palaceClass = this.isPalaceDiagonal(r, c);
                    if (palaceClass) {
                        square.classList.add(palaceClass);
                    }

                    if (piece) {
                        const pieceEl = document.createElement('div');
                        pieceEl.className = `tuong-piece ${piece.color === 'r' ? 'red-piece' : 'black-piece'}`;
                        
                        const details = this.pieceDetails[piece.color][piece.type];
                        
                        const hanSpan = document.createElement('span');
                        hanSpan.className = 'han-char';
                        hanSpan.textContent = details.han;
                        
                        const latinSpan = document.createElement('span');
                        latinSpan.className = 'latin-label';
                        latinSpan.textContent = details.latin;

                        pieceEl.appendChild(hanSpan);
                        pieceEl.appendChild(latinSpan);
                        square.appendChild(pieceEl);
                    }

                    if (this.selectedSquare === idx) {
                        square.classList.add('selected-square');
                    }

                    if (this.validMoves.includes(idx)) {
                        if (piece && piece.color !== this.currentPlayer) {
                            square.classList.add('valid-capture-square');
                        } else {
                            square.classList.add('valid-move-square');
                        }
                    }

                    // Highlight king in check
                    if (piece && piece.type === 'K' && piece.color === this.currentPlayer && this.isKingInCheck(this.currentPlayer)) {
                        square.classList.add('check-square');
                    }

                    this.boardEl.appendChild(square);
                }
            }

            // Draw the River
            const river = document.createElement('div');
            river.className = 'tuong-river';
            
            const shoText = document.createElement('span');
            shoText.textContent = '楚河'; // Sở Hà
            const hanText = document.createElement('span');
            hanText.textContent = '漢界'; // Hán Giới

            river.appendChild(shoText);
            river.appendChild(hanText);
            this.boardEl.appendChild(river);

            if (this.undoBtn) {
                this.undoBtn.disabled = this.history.length === 0 || this.isAiMoving;
            }
        },

        handleSquareClick(e) {
            if (this.isGameOver || this.isAiMoving) return;

            // Resolve square container clicked
            const square = e.target.closest('.tuong-square');
            if (!square) return;

            const idx = parseInt(square.dataset.index, 10);
            const piece = this.board[idx];

            if (this.selectedSquare === null) {
                // Select a piece
                if (piece && piece.color === this.currentPlayer) {
                    this.selectedSquare = idx;
                    this.validMoves = this.getLegalMoves(idx);
                    this.renderBoard();
                }
            } else {
                // Piece is selected, target click
                if (this.validMoves.includes(idx)) {
                    this.executeMove(this.selectedSquare, idx);
                } else if (piece && piece.color === this.currentPlayer) {
                    // Change selection
                    this.selectedSquare = idx;
                    this.validMoves = this.getLegalMoves(idx);
                    this.renderBoard();
                } else {
                    // Deselect
                    this.selectedSquare = null;
                    this.validMoves = [];
                    this.renderBoard();
                }
            }
        },

        executeMove(from, to) {
            // Push history state
            this.history.push({
                board: this.board.map(p => p ? { ...p } : null),
                currentPlayer: this.currentPlayer,
                isGameOver: this.isGameOver
            });

            // Perform move
            this.board[to] = this.board[from];
            this.board[from] = null;

            this.selectedSquare = null;
            this.validMoves = [];

            // Switch player
            this.currentPlayer = this.currentPlayer === 'r' ? 'b' : 'r';

            this.renderBoard();
            this.updateStatus();

            // Check game over
            if (this.checkGameEnd()) {
                return;
            }

            // Trigger AI if PvE
            if (this.gameMode === 'pve' && this.currentPlayer === 'b') {
                this.triggerAiMove();
            }
        },

        triggerAiMove() {
            this.isAiMoving = true;
            if (this.statusEl) this.statusEl.textContent = 'AI is thinking...';
            if (this.undoBtn) this.undoBtn.disabled = true;

            const delay = this.aiDifficulty === 'easy' ? 600 : 800;

            this.aiTimeout = setTimeout(() => {
                this.makeAiMove();
            }, delay);
        },

        makeAiMove() {
            const allMoves = [];
            for (let fromIdx = 0; fromIdx < 90; fromIdx++) {
                const piece = this.board[fromIdx];
                if (piece && piece.color === 'b') {
                    const targets = this.getLegalMoves(fromIdx);
                    targets.forEach(toIdx => {
                        allMoves.push({ from: fromIdx, to: toIdx });
                    });
                }
            }

            if (allMoves.length === 0) {
                // AI has no moves, Checkmate/Stalemate - Black loses
                this.isAiMoving = false;
                this.endGame('r', 'checkmate');
                return;
            }

            let selectedMove = null;

            if (this.aiDifficulty === 'easy') {
                // Easy difficulty: random move
                const rand = Math.floor(Math.random() * allMoves.length);
                selectedMove = allMoves[rand];
            } else {
                // Hard difficulty: Minimax with Alpha-Beta
                let bestVal = -Infinity;
                const bestMoves = [];

                for (const move of allMoves) {
                    const nextBoard = this.board.map(p => p ? { ...p } : null);
                    nextBoard[move.to] = nextBoard[move.from];
                    nextBoard[move.from] = null;

                    const val = this.minimax(nextBoard, 2, -Infinity, Infinity, false);
                    if (val > bestVal) {
                        bestVal = val;
                        bestMoves.length = 0; // Clear array
                        bestMoves.push(move);
                    } else if (val === bestVal) {
                        bestMoves.push(move);
                    }
                }

                // Randomly select among equally best moves
                const rand = Math.floor(Math.random() * bestMoves.length);
                selectedMove = bestMoves[rand];
            }

            // Perform the AI move
            if (selectedMove) {
                this.board[selectedMove.to] = this.board[selectedMove.from];
                this.board[selectedMove.from] = null;
            }

            this.currentPlayer = 'r';
            this.isAiMoving = false;

            this.renderBoard();
            this.updateStatus();
            this.checkGameEnd();
        },

        minimax(b, depth, alpha, beta, isMaximizing) {
            const hasRedMoves = this.hasAnyLegalMoves('r', b);
            const hasBlackMoves = this.hasAnyLegalMoves('b', b);
            
            if (depth === 0 || !hasRedMoves || !hasBlackMoves) {
                return this.evaluateBoard(b);
            }
            
            const color = isMaximizing ? 'b' : 'r';
            const allMoves = [];
            
            for (let fromIdx = 0; fromIdx < 90; fromIdx++) {
                const piece = b[fromIdx];
                if (piece && piece.color === color) {
                    const targets = this.getLegalMoves(fromIdx, b);
                    targets.forEach(toIdx => {
                        allMoves.push({ from: fromIdx, to: toIdx });
                    });
                }
            }
            
            if (allMoves.length === 0) {
                return this.evaluateBoard(b);
            }
            
            if (isMaximizing) {
                let maxEval = -Infinity;
                for (const move of allMoves) {
                    const nextBoard = b.map(p => p ? { ...p } : null);
                    nextBoard[move.to] = nextBoard[move.from];
                    nextBoard[move.from] = null;
                    
                    const evaluation = this.minimax(nextBoard, depth - 1, alpha, beta, false);
                    maxEval = Math.max(maxEval, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) {
                        break;
                    }
                }
                return maxEval;
            } else {
                let minEval = Infinity;
                for (const move of allMoves) {
                    const nextBoard = b.map(p => p ? { ...p } : null);
                    nextBoard[move.to] = nextBoard[move.from];
                    nextBoard[move.from] = null;
                    
                    const evaluation = this.minimax(nextBoard, depth - 1, alpha, beta, true);
                    minEval = Math.min(minEval, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) {
                        break;
                    }
                }
                return minEval;
            }
        },

        evaluateBoard(b) {
            let score = 0;
            const pieceWeights = { K: 10000, R: 90, C: 45, N: 40, A: 20, B: 20, P: 10 };
            
            for (let i = 0; i < 90; i++) {
                const p = b[i];
                if (!p) continue;
                const row = Math.floor(i / 9);
                const col = i % 9;
                let val = pieceWeights[p.type];
                
                // Pawn river crossing adjustment
                if (p.type === 'P') {
                    const crossed = (p.color === 'r' && row <= 4) || (p.color === 'b' && row >= 5);
                    if (crossed) {
                        val = 22;
                    }
                }
                
                // Center columns bonuses
                let posBonus = 0;
                if (col >= 3 && col <= 5) posBonus += 2;
                
                // Knight mobility
                if (p.type === 'N') {
                    const moves = this.getPseudoLegalMoves(i, b);
                    posBonus += moves.length;
                }
                
                const sign = p.color === 'b' ? 1 : -1;
                score += sign * (val + posBonus);
            }
            return score;
        },

        getPseudoLegalMoves(fromIdx, b = this.board) {
            const piece = b[fromIdx];
            if (!piece) return [];
            
            const moves = [];
            const fromRow = Math.floor(fromIdx / 9);
            const fromCol = fromIdx % 9;
            const color = piece.color;
            const opponent = color === 'r' ? 'b' : 'r';
            
            switch (piece.type) {
                case 'K': { // King
                    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dr, dc] of directions) {
                        const r = fromRow + dr;
                        const c = fromCol + dc;
                        if (r >= 0 && r < 10 && c >= 3 && c <= 5) {
                            if ((color === 'b' && r <= 2) || (color === 'r' && r >= 7)) {
                                const targetIdx = r * 9 + c;
                                const targetPiece = b[targetIdx];
                                if (!targetPiece || targetPiece.color === opponent) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'A': { // Advisor
                    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
                    for (const [dr, dc] of directions) {
                        const r = fromRow + dr;
                        const c = fromCol + dc;
                        if (r >= 0 && r < 10 && c >= 3 && c <= 5) {
                            if ((color === 'b' && r <= 2) || (color === 'r' && r >= 7)) {
                                const targetIdx = r * 9 + c;
                                const targetPiece = b[targetIdx];
                                if (!targetPiece || targetPiece.color === opponent) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'B': { // Elephant
                    const directions = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
                    for (const [dr, dc] of directions) {
                        const r = fromRow + dr;
                        const c = fromCol + dc;
                        if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                            // Cannot cross river
                            if ((color === 'b' && r <= 4) || (color === 'r' && r >= 5)) {
                                // Elephant eye check (cản mắt tượng)
                                const eyeRow = fromRow + dr / 2;
                                const eyeCol = fromCol + dc / 2;
                                const eyeIdx = eyeRow * 9 + eyeCol;
                                if (b[eyeIdx] === null) {
                                    const targetIdx = r * 9 + c;
                                    const targetPiece = b[targetIdx];
                                    if (!targetPiece || targetPiece.color === opponent) {
                                        moves.push(targetIdx);
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
                case 'N': { // Knight (Mã)
                    const potentials = [
                        { dr: 2, dc: 1, blockR: 1, blockC: 0 },
                        { dr: 2, dc: -1, blockR: 1, blockC: 0 },
                        { dr: -2, dc: 1, blockR: -1, blockC: 0 },
                        { dr: -2, dc: -1, blockR: -1, blockC: 0 },
                        { dr: 1, dc: 2, blockR: 0, blockC: 1 },
                        { dr: -1, dc: 2, blockR: 0, blockC: 1 },
                        { dr: 1, dc: -2, blockR: 0, blockC: -1 },
                        { dr: -1, dc: -2, blockR: 0, blockC: -1 }
                    ];
                    for (const p of potentials) {
                        const r = fromRow + p.dr;
                        const c = fromCol + p.dc;
                        if (r >= 0 && r < 10 && c >= 0 && c < 9) {
                            // Knight foot check (cản chân mã)
                            const blockIdx = (fromRow + p.blockR) * 9 + (fromCol + p.blockC);
                            if (b[blockIdx] === null) {
                                const targetIdx = r * 9 + c;
                                const targetPiece = b[targetIdx];
                                if (!targetPiece || targetPiece.color === opponent) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'R': { // Rook (Xe)
                    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dr, dc] of directions) {
                        let r = fromRow + dr;
                        let c = fromCol + dc;
                        while (r >= 0 && r < 10 && c >= 0 && c < 9) {
                            const targetIdx = r * 9 + c;
                            const targetPiece = b[targetIdx];
                            if (!targetPiece) {
                                moves.push(targetIdx);
                            } else {
                                if (targetPiece.color === opponent) {
                                    moves.push(targetIdx);
                                }
                                break;
                            }
                            r += dr;
                            c += dc;
                        }
                    }
                    break;
                }
                case 'C': { // Cannon (Pháo)
                    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                    for (const [dr, dc] of directions) {
                        let r = fromRow + dr;
                        let c = fromCol + dc;
                        let count = 0;
                        while (r >= 0 && r < 10 && c >= 0 && c < 9) {
                            const targetIdx = r * 9 + c;
                            const targetPiece = b[targetIdx];
                            if (targetPiece === null) {
                                if (count === 0) {
                                    moves.push(targetIdx);
                                }
                            } else {
                                count++;
                                if (count === 2) {
                                    if (targetPiece.color === opponent) {
                                        moves.push(targetIdx);
                                    }
                                    break;
                                }
                            }
                            r += dr;
                            c += dc;
                        }
                    }
                    break;
                }
                case 'P': { // Pawn (Binh/Tốt)
                    const forward = color === 'r' ? -1 : 1;
                    let r = fromRow + forward;
                    let c = fromCol;
                    if (r >= 0 && r < 10) {
                        const targetIdx = r * 9 + c;
                        const targetPiece = b[targetIdx];
                        if (!targetPiece || targetPiece.color === opponent) {
                            moves.push(targetIdx);
                        }
                    }
                    // Side moves allowed after crossing the river
                    const crossed = (color === 'r' && fromRow <= 4) || (color === 'b' && fromRow >= 5);
                    if (crossed) {
                        const sideCols = [fromCol - 1, fromCol + 1];
                        for (const sc of sideCols) {
                            if (sc >= 0 && sc < 9) {
                                const targetIdx = fromRow * 9 + sc;
                                const targetPiece = b[targetIdx];
                                if (!targetPiece || targetPiece.color === opponent) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }
                    break;
                }
            }
            
            return moves;
        },

        areKingsFacing(b) {
            let redKingIdx = -1;
            let blackKingIdx = -1;
            for (let i = 0; i < 90; i++) {
                const piece = b[i];
                if (piece && piece.type === 'K') {
                    if (piece.color === 'r') redKingIdx = i;
                    else blackKingIdx = i;
                }
            }
            if (redKingIdx === -1 || blackKingIdx === -1) return false;
            
            const redCol = redKingIdx % 9;
            const blackCol = blackKingIdx % 9;
            if (redCol !== blackCol) return false;
            
            const minRow = Math.min(Math.floor(redKingIdx / 9), Math.floor(blackKingIdx / 9));
            const maxRow = Math.max(Math.floor(redKingIdx / 9), Math.floor(blackKingIdx / 9));
            
            for (let r = minRow + 1; r < maxRow; r++) {
                if (b[r * 9 + redCol] !== null) {
                    return false;
                }
            }
            return true;
        },

        isKingInCheck(color, b = this.board) {
            let kingIdx = -1;
            for (let i = 0; i < 90; i++) {
                const piece = b[i];
                if (piece && piece.type === 'K' && piece.color === color) {
                    kingIdx = i;
                    break;
                }
            }
            if (kingIdx === -1) return false;
            
            const opponent = color === 'r' ? 'b' : 'r';
            for (let i = 0; i < 90; i++) {
                const piece = b[i];
                if (piece && piece.color === opponent) {
                    const pseudo = this.getPseudoLegalMoves(i, b);
                    if (pseudo.includes(kingIdx)) {
                        return true;
                    }
                }
            }
            return false;
        },

        getLegalMoves(fromIdx, b = this.board) {
            const piece = b[fromIdx];
            if (!piece) return [];
            
            const pseudo = this.getPseudoLegalMoves(fromIdx, b);
            const legal = [];
            const color = piece.color;
            
            for (const toIdx of pseudo) {
                // Clone the board
                const nextBoard = b.map(p => p ? { ...p } : null);
                // Make move
                nextBoard[toIdx] = nextBoard[fromIdx];
                nextBoard[fromIdx] = null;
                
                // Do not allow moves that result in Kings facing directly
                if (this.areKingsFacing(nextBoard)) {
                    continue;
                }
                
                // Do not allow moves that leave own King in check
                if (this.isKingInCheck(color, nextBoard)) {
                    continue;
                }
                
                legal.push(toIdx);
            }
            return legal;
        },

        hasAnyLegalMoves(color, b = this.board) {
            for (let i = 0; i < 90; i++) {
                const piece = b[i];
                if (piece && piece.color === color) {
                    const moves = this.getLegalMoves(i, b);
                    if (moves.length > 0) {
                        return true;
                    }
                }
            }
            return false;
        },

        checkGameEnd() {
            if (!this.hasAnyLegalMoves(this.currentPlayer)) {
                // Current player has no legal moves -> Loss (checkmate if in check, stalemate otherwise)
                const winner = this.currentPlayer === 'r' ? 'b' : 'r';
                const reason = this.isKingInCheck(this.currentPlayer) ? 'checkmate' : 'stalemate';
                this.endGame(winner, reason);
                return true;
            }
            return false;
        },

        endGame(winner, reason) {
            this.isGameOver = true;
            
            let statusText = '';
            if (winner === 'r') {
                statusText = reason === 'checkmate' ? 'Red wins by Checkmate! 🏆' : 'Red wins by Stalemate! 🏆';
                this.scores.red++;
            } else if (winner === 'b') {
                statusText = reason === 'checkmate' ? 'Black wins by Checkmate! 🏆' : 'Black wins by Stalemate! 🏆';
                this.scores.black++;
            } else {
                statusText = 'Game Drawn!';
                this.scores.draws++;
            }

            if (this.statusEl) this.statusEl.textContent = statusText;
            this.saveScores();
            this.updateScoresUI();
            this.savePlayedStats();
        },

        undoMove() {
            if (this.history.length === 0 || this.isAiMoving) return;

            if (this.gameMode === 'pve') {
                // In PvE: pop twice to revert both player and AI turns
                if (this.history.length >= 2) {
                    this.history.pop(); // Revert AI state
                    const playerState = this.history.pop(); // Revert player state
                    this.board = playerState.board;
                    this.currentPlayer = playerState.currentPlayer;
                    this.isGameOver = playerState.isGameOver;
                }
            } else {
                // In PvP: pop once
                const prevState = this.history.pop();
                this.board = prevState.board;
                this.currentPlayer = prevState.currentPlayer;
                this.isGameOver = prevState.isGameOver;
            }

            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
            this.updateStatus();
        },

        reset() {
            this.setupInitialBoard();
            this.renderBoard();
            this.updateStatus();
        },

        updateStatus() {
            if (this.isGameOver) return;
            
            let playerText = '';
            if (this.currentPlayer === 'r') {
                playerText = "Lượt của Đỏ (Red's Turn)";
            } else {
                playerText = this.gameMode === 'pve' ? "Lượt của Máy (AI's Turn)" : "Lượt của Đen (Black's Turn)";
            }

            if (this.isKingInCheck(this.currentPlayer)) {
                playerText += " - Chiếu Tướng! (CHECK)";
            }

            if (this.statusEl) this.statusEl.textContent = playerText;
        },

        switchMode(mode) {
            if (this.isAiMoving) return;
            this.gameMode = mode;
            localStorage.setItem('tuong_game_mode', mode);
            this.updateConfigUI();
            this.updateLabels();
            this.reset();
        },

        switchDifficulty(diff) {
            if (this.isAiMoving) return;
            this.aiDifficulty = diff;
            localStorage.setItem('tuong_ai_diff', diff);
            this.updateConfigUI();
            this.reset();
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

                if (this.aiDifficulty === 'easy') {
                    this.diffEasyBtn.classList.add('active');
                    this.diffHardBtn.classList.remove('active');
                } else {
                    this.diffEasyBtn.classList.remove('active');
                    this.diffHardBtn.classList.add('active');
                }
            }
        },

        updateLabels() {
            if (this.gameMode === 'pve') {
                this.lblPlayerRed.textContent = 'Red (Player)';
                this.lblPlayerBlack.textContent = 'Black (AI)';
            } else {
                this.lblPlayerRed.textContent = 'Red (P1)';
                this.lblPlayerBlack.textContent = 'Black (P2)';
            }
        },

        loadScores() {
            this.scores.red = parseInt(localStorage.getItem('tuong_score_red') || '0', 10);
            this.scores.black = parseInt(localStorage.getItem('tuong_score_black') || '0', 10);
            this.scores.draws = parseInt(localStorage.getItem('tuong_score_draws') || '0', 10);
            this.updateScoresUI();
        },

        saveScores() {
            localStorage.setItem('tuong_score_red', this.scores.red);
            localStorage.setItem('tuong_score_black', this.scores.black);
            localStorage.setItem('tuong_score_draws', this.scores.draws);
            
            // Sync overall wins
            localStorage.setItem('tuong_wins', this.scores.red);
        },

        savePlayedStats() {
            const played = parseInt(localStorage.getItem('tuong_played') || '0', 10) + 1;
            localStorage.setItem('tuong_played', played);
        },

        updateScoresUI() {
            if (this.scoreRedEl) this.scoreRedEl.textContent = this.scores.red;
            if (this.scoreBlackEl) this.scoreBlackEl.textContent = this.scores.black;
            if (this.scoreDrawsEl) this.scoreDrawsEl.textContent = this.scores.draws;
        },

        clearScore() {
            this.scores.red = 0;
            this.scores.black = 0;
            this.scores.draws = 0;
            this.saveScores();
            this.updateScoresUI();
            localStorage.setItem('tuong_played', 0);
            this.reset();
        }
    };

    window.TuongGame = TuongGame;
})();
