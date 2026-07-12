(function() {
    const Chess = {
        // Board is a 64-element array. 
        // Pieces: { type: 'P'|'R'|'N'|'B'|'Q'|'K', color: 'w'|'b' }
        board: Array(64).fill(null),
        currentPlayer: 'w', // 'w' (White) or 'b' (Black)
        gameMode: 'pvp',    // 'pvp' or 'pve'
        aiDifficulty: 'easy', // 'easy' or 'hard'
        isGameOver: false,
        isAiMoving: false,
        initialized: false,
        aiTimeout: null,
        
        // Selected square index
        selectedSquare: null,
        // Valid move indices for selected piece
        validMoves: [],
        
        // History stack of states for undo:
        // Each state contains copy of board, currentPlayer, castlingRights, enPassantTarget, moveHistory
        history: [],
        
        // Castling rights
        castlingRights: {
            wK: true, // White king side
            wQ: true, // White queen side
            bK: true, // Black king side
            bQ: true  // Black queen side
        },
        
        // En Passant target square index (square behind the pawn that just jumped 2 squares)
        enPassantTarget: null,
        
        // Track moves to check for draws or repetition (50-move rule/draw)
        halfMoveClock: 0,
        fullMoveNumber: 1,
        
        // Score stats (tracked locally)
        scores: {
            white: 0,
            draws: 0,
            black: 0
        },

        // Unicode piece display characters
        pieceGlyphs: {
            w: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' },
            b: { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' }
        },

        init() {
            if (this.initialized) {
                this.reset();
                return;
            }

            // DOM elements
            this.boardEl = document.getElementById('chess-board');
            this.statusEl = document.getElementById('chess-status');
            this.undoBtn = document.getElementById('chess-undo-btn');
            this.restartBtn = document.getElementById('chess-restart-btn');
            this.clearBtn = document.getElementById('chess-clear-btn');
            
            this.modePvpBtn = document.getElementById('chess-mode-pvp-btn');
            this.modePveBtn = document.getElementById('chess-mode-pve-btn');
            this.aiDifficultyGroup = document.getElementById('chess-ai-difficulty-group');
            this.diffEasyBtn = document.getElementById('chess-diff-easy-btn');
            this.diffHardBtn = document.getElementById('chess-diff-hard-btn');

            this.scoreWhiteEl = document.getElementById('chess-score-white');
            this.scoreBlackEl = document.getElementById('chess-score-black');
            this.scoreDrawsEl = document.getElementById('chess-score-draws');

            this.lblPlayerWhite = document.getElementById('chess-lbl-player-white');
            this.lblPlayerBlack = document.getElementById('chess-lbl-player-black');
            
            this.promotionModal = document.getElementById('chess-promotion-modal');

            // Setup listeners (bound once)
            if (this.boardEl && !this.boardEl.dataset.bound) {
                // Event listener on board delegated to squares
                this.boardEl.addEventListener('click', (e) => this.handleSquareClick(e));
                
                this.modePvpBtn.addEventListener('click', () => this.switchMode('pvp'));
                this.modePveBtn.addEventListener('click', () => this.switchMode('pve'));
                this.diffEasyBtn.addEventListener('click', () => this.switchDifficulty('easy'));
                this.diffHardBtn.addEventListener('click', () => this.switchDifficulty('hard'));
                
                this.undoBtn.addEventListener('click', () => this.undoMove());
                this.restartBtn.addEventListener('click', () => this.reset());
                this.clearBtn.addEventListener('click', () => this.clearScore());

                // Setup promotion option clicks
                const promoButtons = this.promotionModal.querySelectorAll('.promotion-btn');
                promoButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pieceType = btn.dataset.piece;
                        this.completePromotion(pieceType);
                    });
                });

                this.boardEl.dataset.bound = true;
            }

            // Load config
            this.gameMode = localStorage.getItem('chess_game_mode') || 'pvp';
            this.aiDifficulty = localStorage.getItem('chess_ai_diff') || 'easy';
            
            this.updateConfigUI();
            this.updateLabels();
            this.loadScores();
            this.setupInitialBoard();
            this.renderBoard();
            this.updateStatus();
            this.initialized = true;
        },

        setupInitialBoard() {
            this.board = Array(64).fill(null);
            this.currentPlayer = 'w';
            this.isGameOver = false;
            this.isAiMoving = false;
            this.selectedSquare = null;
            this.validMoves = [];
            this.history = [];
            this.enPassantTarget = null;
            this.halfMoveClock = 0;
            this.fullMoveNumber = 1;
            this.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };

            const setupRow = (row, color) => {
                const pieces = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
                for (let col = 0; col < 8; col++) {
                    this.board[row * 8 + col] = { type: pieces[col], color: color };
                }
            };

            const setupPawns = (row, color) => {
                for (let col = 0; col < 8; col++) {
                    this.board[row * 8 + col] = { type: 'P', color: color };
                }
            };

            setupRow(0, 'b');
            setupPawns(1, 'b');
            setupPawns(6, 'w');
            setupRow(7, 'w');
            
            if (this.aiTimeout) {
                clearTimeout(this.aiTimeout);
                this.aiTimeout = null;
            }
        },

        renderBoard() {
            if (!this.boardEl) return;
            this.boardEl.innerHTML = '';
            
            // Loop through rows 0 to 7
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const idx = row * 8 + col;
                    const piece = this.board[idx];
                    
                    const square = document.createElement('div');
                    square.className = `chess-square ${(row + col) % 2 === 0 ? 'light-square' : 'dark-square'}`;
                    square.dataset.index = idx;
                    
                    if (piece) {
                        const pieceEl = document.createElement('span');
                        pieceEl.className = `chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`;
                        pieceEl.textContent = this.pieceGlyphs[piece.color][piece.type];
                        square.appendChild(pieceEl);
                    }
                    
                    // Highlight selected square
                    if (this.selectedSquare === idx) {
                        square.classList.add('selected-square');
                    }
                    
                    // Highlight valid moves
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
            
            this.undoBtn.disabled = this.history.length === 0 || this.isAiMoving;
        },

        handleSquareClick(e) {
            if (this.isGameOver || this.isAiMoving) return;
            
            const squareEl = e.target.closest('.chess-square');
            if (!squareEl) return;
            
            const idx = parseInt(squareEl.dataset.index, 10);
            const piece = this.board[idx];
            
            // If click on current player's piece, select it
            if (piece && piece.color === this.currentPlayer) {
                this.selectedSquare = idx;
                this.validMoves = this.getLegalMoves(idx);
                this.renderBoard();
            } else if (this.selectedSquare !== null && this.validMoves.includes(idx)) {
                // Perform move
                this.makeMove(this.selectedSquare, idx);
            } else {
                // Clear selection
                this.selectedSquare = null;
                this.validMoves = [];
                this.renderBoard();
            }
        },

        // Make move on board. Handles castling, en passant, promotion trigger, history push.
        makeMove(fromIdx, toIdx, promotionPiece = null) {
            const piece = this.board[fromIdx];
            if (!piece) return;

            // Push to undo stack before executing
            this.pushHistory();

            const isCapture = this.board[toIdx] !== null;
            const isPawnMove = piece.type === 'P';

            // Reset half-move clock on pawn move or capture, otherwise increment
            if (isPawnMove || isCapture) {
                this.halfMoveClock = 0;
            } else {
                this.halfMoveClock++;
            }

            // Handle Castling
            if (piece.type === 'K' && Math.abs(fromIdx - toIdx) === 2) {
                const isKingSide = toIdx > fromIdx;
                const rookFrom = isKingSide ? fromIdx + 3 : fromIdx - 4;
                const rookTo = isKingSide ? fromIdx + 1 : fromIdx - 1;
                this.board[rookTo] = this.board[rookFrom];
                this.board[rookFrom] = null;
            }

            // Handle En Passant capture
            if (piece.type === 'P' && toIdx === this.enPassantTarget) {
                const capturedPawnIdx = this.currentPlayer === 'w' ? toIdx + 8 : toIdx - 8;
                this.board[capturedPawnIdx] = null;
            }

            // Set new En Passant target
            if (piece.type === 'P' && Math.abs(fromIdx - toIdx) === 16) {
                this.enPassantTarget = this.currentPlayer === 'w' ? fromIdx - 8 : fromIdx + 8;
            } else {
                this.enPassantTarget = null;
            }

            // Move piece
            this.board[toIdx] = piece;
            this.board[fromIdx] = null;

            // Handle Castling Rights updates
            if (piece.type === 'K') {
                if (piece.color === 'w') {
                    this.castlingRights.wK = false;
                    this.castlingRights.wQ = false;
                } else {
                    this.castlingRights.bK = false;
                    this.castlingRights.bQ = false;
                }
            } else if (piece.type === 'R') {
                if (fromIdx === 56) this.castlingRights.wQ = false;
                if (fromIdx === 63) this.castlingRights.wK = false;
                if (fromIdx === 0) this.castlingRights.bQ = false;
                if (fromIdx === 7) this.castlingRights.bK = false;
            }

            // Handle Rook captures updates castling rights
            if (toIdx === 56) this.castlingRights.wQ = false;
            if (toIdx === 63) this.castlingRights.wK = false;
            if (toIdx === 0) this.castlingRights.bQ = false;
            if (toIdx === 7) this.castlingRights.bK = false;

            // Handle Pawn Promotion Trigger
            const isPromotionRow = (piece.color === 'w' && Math.floor(toIdx / 8) === 0) || 
                                   (piece.color === 'b' && Math.floor(toIdx / 8) === 7);
            
            if (isPawnMove && isPromotionRow) {
                if (promotionPiece) {
                    this.board[toIdx].type = promotionPiece;
                    this.finalizeTurn();
                } else if (this.gameMode === 'pve' && this.currentPlayer === 'b') {
                    // AI promotes to Queen automatically
                    this.board[toIdx].type = 'Q';
                    this.finalizeTurn();
                } else {
                    // Show Promotion Modal
                    this.isAiMoving = true; // Lock UI
                    this.promotionTargetIdx = toIdx;
                    this.promotionModal.classList.add('active');
                }
                return;
            }

            this.finalizeTurn();
        },

        completePromotion(pieceType) {
            if (this.promotionTargetIdx !== null) {
                this.board[this.promotionTargetIdx].type = pieceType;
                this.promotionTargetIdx = null;
            }
            this.promotionModal.classList.remove('active');
            this.isAiMoving = false; // Unlock UI
            this.finalizeTurn();
        },

        finalizeTurn() {
            // Switch turns
            this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
            if (this.currentPlayer === 'w') {
                this.fullMoveNumber++;
            }

            this.selectedSquare = null;
            this.validMoves = [];
            
            this.checkGameEnd();
            this.renderBoard();
            this.updateStatus();

            // Trigger AI if PvE mode and current turn is Black
            if (!this.isGameOver && this.gameMode === 'pve' && this.currentPlayer === 'b') {
                this.triggerAi();
            }
        },

        pushHistory() {
            this.history.push({
                board: this.board.map(cell => cell ? { ...cell } : null),
                currentPlayer: this.currentPlayer,
                castlingRights: { ...this.castlingRights },
                enPassantTarget: this.enPassantTarget,
                halfMoveClock: this.halfMoveClock,
                fullMoveNumber: this.fullMoveNumber
            });
            if (this.history.length > 50) {
                this.history.shift(); // Limit history stack size
            }
        },

        undoMove() {
            if (this.history.length === 0 || this.isAiMoving) return;

            if (this.gameMode === 'pvp') {
                const prevState = this.history.pop();
                this.restoreState(prevState);
            } else {
                // PvE Mode: Pop both player and AI moves
                if (this.history.length >= 2) {
                    this.history.pop(); // Pop AI's move
                    const prevState = this.history.pop(); // Pop Player's move
                    this.restoreState(prevState);
                } else {
                    const prevState = this.history.pop();
                    this.restoreState(prevState);
                }
            }

            this.isGameOver = false;
            this.selectedSquare = null;
            this.validMoves = [];
            this.renderBoard();
            this.updateStatus();
        },

        restoreState(state) {
            this.board = state.board;
            this.currentPlayer = state.currentPlayer;
            this.castlingRights = state.castlingRights;
            this.enPassantTarget = state.enPassantTarget;
            this.halfMoveClock = state.halfMoveClock;
            this.fullMoveNumber = state.fullMoveNumber;
        },

        reset() {
            this.setupInitialBoard();
            this.renderBoard();
            this.updateStatus();
        },

        checkGameEnd() {
            const hasMoves = this.hasAnyLegalMoves(this.currentPlayer);
            const inCheck = this.isKingInCheck(this.currentPlayer);

            if (!hasMoves) {
                this.isGameOver = true;
                if (inCheck) {
                    // Checkmate
                    const winner = this.currentPlayer === 'w' ? 'b' : 'w';
                    this.saveResult(winner);
                } else {
                    // Stalemate
                    this.saveResult('draw');
                }
            } else if (this.halfMoveClock >= 100) {
                // 50-move rule
                this.isGameOver = true;
                this.saveResult('draw');
            } else if (this.isDrawByMaterial()) {
                this.isGameOver = true;
                this.saveResult('draw');
            }
        },

        isDrawByMaterial() {
            // Simple check: Only Kings, or King+Bishop vs King, or King+Knight vs King
            let whitePieces = [];
            let blackPieces = [];
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece) {
                    if (piece.color === 'w') whitePieces.push(piece.type);
                    else blackPieces.push(piece.type);
                }
            }

            if (whitePieces.length === 1 && blackPieces.length === 1) return true; // King vs King
            if (whitePieces.length === 2 && blackPieces.length === 1 && (whitePieces.includes('B') || whitePieces.includes('N'))) return true;
            if (blackPieces.length === 2 && whitePieces.length === 1 && (blackPieces.includes('B') || blackPieces.includes('N'))) return true;
            return false;
        },

        saveResult(winner) {
            // Local stats update
            const playedKey = 'chess_played';
            const winsKey = 'chess_wins';

            const playedCount = parseInt(localStorage.getItem(playedKey) || '0', 10);
            localStorage.setItem(playedKey, playedCount + 1);

            if (winner === 'draw') {
                this.scores.draws++;
            } else if (this.gameMode === 'pvp') {
                if (winner === 'w') {
                    this.scores.white++;
                    const winsCount = parseInt(localStorage.getItem(winsKey) || '0', 10);
                    localStorage.setItem(winsKey, winsCount + 1);
                } else {
                    this.scores.black++;
                }
            } else { // PvE mode
                if (winner === 'w') {
                    this.scores.white++;
                    const winsCount = parseInt(localStorage.getItem(winsKey) || '0', 10);
                    localStorage.setItem(winsKey, winsCount + 1);
                } else {
                    this.scores.black++;
                }
            }

            this.saveScores();
            this.updateScoresUI();
            
            // Sync with global rank/stats
            if (window.ProfileManager) {
                window.ProfileManager.updateUI();
            }
        },

        updateStatus() {
            if (!this.statusEl) return;

            if (this.isGameOver) {
                const hasMoves = this.hasAnyLegalMoves(this.currentPlayer);
                const inCheck = this.isKingInCheck(this.currentPlayer);

                if (!hasMoves) {
                    if (inCheck) {
                        const winnerName = this.currentPlayer === 'w' ? (this.gameMode === 'pve' ? 'Black (AI)' : 'Player Đen') : 'Player Trắng';
                        this.statusEl.innerHTML = `<span style="color: var(--accent-coral)">Chiếu bí! ${winnerName} Thắng! 🎉</span>`;
                    } else {
                        this.statusEl.innerHTML = `<span style="color: var(--accent-gold)">Hòa cờ (Stalemate)! 🤝</span>`;
                    }
                } else if (this.halfMoveClock >= 100) {
                    this.statusEl.innerHTML = `<span style="color: var(--accent-gold)">Hòa cờ (Luật 50 nước)! 🤝</span>`;
                } else {
                    this.statusEl.innerHTML = `<span style="color: var(--accent-gold)">Hòa cờ (Thiếu quân)! 🤝</span>`;
                }
                return;
            }

            if (this.isAiMoving) {
                this.statusEl.innerHTML = `<span style="color: var(--accent-chess-green)">AI Đang tính toán nước đi... ⏳</span>`;
                return;
            }

            const activeName = this.currentPlayer === 'w' ? 'Trắng' : (this.gameMode === 'pve' ? 'Đen (AI)' : 'Đen');
            const inCheck = this.isKingInCheck(this.currentPlayer);

            if (inCheck) {
                this.statusEl.innerHTML = `<span style="color: var(--danger-color); font-weight: 800; animation: blink 1s infinite;">⚠️ Vua của ${activeName} đang bị chiếu!</span>`;
            } else {
                this.statusEl.textContent = `Lượt của ${activeName}`;
            }
        },

        // --- Core Chess Logic calculations ---

        // Get legal moves (pseudo-legal moves filtered by whether they put our King in check)
        getLegalMoves(squareIdx) {
            const piece = this.board[squareIdx];
            if (!piece) return [];

            const pseudoMoves = this.getPseudoLegalMoves(squareIdx);
            const legalMoves = [];

            for (const toIdx of pseudoMoves) {
                // Simulate move
                const originalPieceTo = this.board[toIdx];
                const originalEP = this.enPassantTarget;
                const originalRights = { ...this.castlingRights };
                
                // Perform move locally
                this.board[toIdx] = piece;
                this.board[squareIdx] = null;
                
                // En Passant capture simulation
                let capturedEP = null;
                let capturedEPIdx = null;
                if (piece.type === 'P' && toIdx === originalEP) {
                    capturedEPIdx = piece.color === 'w' ? toIdx + 8 : toIdx - 8;
                    capturedEP = this.board[capturedEPIdx];
                    this.board[capturedEPIdx] = null;
                }

                const kingSafe = !this.isKingInCheck(piece.color);

                // Revert move
                this.board[squareIdx] = piece;
                this.board[toIdx] = originalPieceTo;
                if (capturedEPIdx !== null) {
                    this.board[capturedEPIdx] = capturedEP;
                }
                this.enPassantTarget = originalEP;
                this.castlingRights = originalRights;

                if (kingSafe) {
                    legalMoves.push(toIdx);
                }
            }

            return legalMoves;
        },

        hasAnyLegalMoves(color) {
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece && piece.color === color) {
                    const moves = this.getLegalMoves(i);
                    if (moves.length > 0) return true;
                }
            }
            return false;
        },

        isKingInCheck(color) {
            // Find king index
            let kingIdx = -1;
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece && piece.type === 'K' && piece.color === color) {
                    kingIdx = i;
                    break;
                }
            }

            if (kingIdx === -1) return false; // Shouldn't happen
            return this.isSquareUnderAttack(kingIdx, color === 'w' ? 'b' : 'w');
        },

        isSquareUnderAttack(squareIdx, attackerColor) {
            // Standard approach: Check if any piece of attackerColor can attack squareIdx
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece && piece.color === attackerColor) {
                    const moves = this.getPseudoLegalMoves(i, true); // true = attack mode (ignores check/king)
                    if (moves.includes(squareIdx)) {
                        return true;
                    }
                }
            }
            return false;
        },

        getPseudoLegalMoves(idx, isCheckingAttacks = false) {
            const piece = this.board[idx];
            if (!piece) return [];

            const moves = [];
            const r = Math.floor(idx / 8);
            const c = idx % 8;
            const color = piece.color;
            const enemyColor = color === 'w' ? 'b' : 'w';

            switch (piece.type) {
                case 'P': {
                    const dir = color === 'w' ? -1 : 1;
                    const startRow = color === 'w' ? 6 : 1;

                    // One square forward (only if not checking attacks)
                    if (!isCheckingAttacks) {
                        const forward1 = idx + dir * 8;
                        if (forward1 >= 0 && forward1 < 64 && this.board[forward1] === null) {
                            moves.push(forward1);
                            
                            // Two squares forward
                            const forward2 = idx + dir * 16;
                            if (r === startRow && this.board[forward2] === null) {
                                moves.push(forward2);
                            }
                        }
                    }

                    // Diagonal captures
                    const diagonals = [-1, 1];
                    for (const d of diagonals) {
                        const targetCol = c + d;
                        if (targetCol >= 0 && targetCol < 8) {
                            const diagIdx = idx + dir * 8 + d;
                            if (diagIdx >= 0 && diagIdx < 64) {
                                const targetPiece = this.board[diagIdx];
                                if (targetPiece && targetPiece.color === enemyColor) {
                                    moves.push(diagIdx);
                                }
                                // En Passant capture
                                if (diagIdx === this.enPassantTarget) {
                                    moves.push(diagIdx);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'N': {
                    const offsets = [-17, -15, -10, -6, 6, 10, 15, 17];
                    for (const off of offsets) {
                        const targetIdx = idx + off;
                        if (targetIdx >= 0 && targetIdx < 64) {
                            const targetCol = targetIdx % 8;
                            const targetRow = Math.floor(targetIdx / 8);
                            // Avoid wrap-around
                            if (Math.abs(targetCol - c) <= 2 && Math.abs(targetRow - r) <= 2) {
                                const targetPiece = this.board[targetIdx];
                                if (!targetPiece || targetPiece.color === enemyColor || isCheckingAttacks) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }
                    break;
                }
                case 'B': {
                    this.addSlidingMoves(moves, idx, [-9, -7, 7, 9], enemyColor, isCheckingAttacks);
                    break;
                }
                case 'R': {
                    this.addSlidingMoves(moves, idx, [-8, -1, 1, 8], enemyColor, isCheckingAttacks);
                    break;
                }
                case 'Q': {
                    this.addSlidingMoves(moves, idx, [-9, -8, -7, -1, 1, 7, 8, 9], enemyColor, isCheckingAttacks);
                    break;
                }
                case 'K': {
                    const offsets = [-9, -8, -7, -1, 1, 7, 8, 9];
                    for (const off of offsets) {
                        const targetIdx = idx + off;
                        if (targetIdx >= 0 && targetIdx < 64) {
                            const targetCol = targetIdx % 8;
                            const targetRow = Math.floor(targetIdx / 8);
                            if (Math.abs(targetCol - c) <= 1 && Math.abs(targetRow - r) <= 1) {
                                const targetPiece = this.board[targetIdx];
                                if (!targetPiece || targetPiece.color === enemyColor || isCheckingAttacks) {
                                    moves.push(targetIdx);
                                }
                            }
                        }
                    }

                    // Castling (only if not checking attacks directly)
                    if (!isCheckingAttacks) {
                        const isKingInOriginalPos = color === 'w' ? idx === 60 : idx === 4;
                        if (isKingInOriginalPos && !this.isKingInCheck(color)) {
                            // King side castling
                            const rightsK = color === 'w' ? this.castlingRights.wK : this.castlingRights.bK;
                            if (rightsK) {
                                const f1 = idx + 1;
                                const g1 = idx + 2;
                                if (this.board[f1] === null && this.board[g1] === null) {
                                    // Make sure intermediate squares are not under attack
                                    if (!this.isSquareUnderAttack(f1, enemyColor) && !this.isSquareUnderAttack(g1, enemyColor)) {
                                        moves.push(g1);
                                    }
                                }
                            }

                            // Queen side castling
                            const rightsQ = color === 'w' ? this.castlingRights.wQ : this.castlingRights.bQ;
                            if (rightsQ) {
                                const d1 = idx - 1;
                                const c1 = idx - 2;
                                const b1 = idx - 3;
                                if (this.board[d1] === null && this.board[c1] === null && this.board[b1] === null) {
                                    if (!this.isSquareUnderAttack(d1, enemyColor) && !this.isSquareUnderAttack(c1, enemyColor)) {
                                        moves.push(c1);
                                    }
                                }
                            }
                        }
                    }
                    break;
                }
            }

            return moves;
        },

        addSlidingMoves(moves, idx, directions, enemyColor, isCheckingAttacks) {
            const startCol = idx % 8;
            const startRow = Math.floor(idx / 8);

            for (const dir of directions) {
                let currentIdx = idx;
                let currentCol = startCol;
                let currentRow = startRow;

                while (true) {
                    currentIdx += dir;
                    if (currentIdx < 0 || currentIdx >= 64) break;

                    const nextCol = currentIdx % 8;
                    const nextRow = Math.floor(currentIdx / 8);

                    // Ensure we don't warp around borders
                    if (Math.abs(nextCol - currentCol) > 1 || Math.abs(nextRow - currentRow) > 1) {
                        break;
                    }

                    currentCol = nextCol;
                    currentRow = nextRow;

                    const piece = this.board[currentIdx];
                    if (piece === null) {
                        moves.push(currentIdx);
                    } else {
                        if (piece.color === enemyColor || isCheckingAttacks) {
                            moves.push(currentIdx);
                        }
                        break; // Blocked by piece
                    }
                }
            }
        },

        // --- Match Setup / Configuration logic ---

        switchMode(mode) {
            if (this.gameMode === mode || this.isAiMoving) return;
            this.gameMode = mode;
            localStorage.setItem('chess_game_mode', mode);
            this.updateConfigUI();
            this.updateLabels();
            this.reset();
        },

        switchDifficulty(diff) {
            if (this.aiDifficulty === diff || this.isAiMoving) return;
            this.aiDifficulty = diff;
            localStorage.setItem('chess_ai_diff', diff);
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
            const nickname = window.ProfileManager ? window.ProfileManager.getNickname() : 'Player';
            if (this.gameMode === 'pvp') {
                this.lblPlayerWhite.textContent = `${nickname} (Trắng)`;
                this.lblPlayerBlack.textContent = 'Player Đen';
            } else {
                this.lblPlayerWhite.textContent = `${nickname} (Trắng)`;
                this.lblPlayerBlack.textContent = 'Đen (AI)';
            }
        },

        loadScores() {
            this.scores.white = parseInt(localStorage.getItem('chess_score_w') || '0', 10);
            this.scores.black = parseInt(localStorage.getItem('chess_score_b') || '0', 10);
            this.scores.draws = parseInt(localStorage.getItem('chess_score_draws') || '0', 10);
            this.updateScoresUI();
        },

        saveScores() {
            localStorage.setItem('chess_score_w', this.scores.white);
            localStorage.setItem('chess_score_b', this.scores.black);
            localStorage.setItem('chess_score_draws', this.scores.draws);
        },

        clearScore() {
            if (this.isAiMoving) return;
            this.scores.white = 0;
            this.scores.black = 0;
            this.scores.draws = 0;
            this.saveScores();
            this.updateScoresUI();
        },

        updateScoresUI() {
            if (this.scoreWhiteEl) this.scoreWhiteEl.textContent = this.scores.white;
            if (this.scoreBlackEl) this.scoreBlackEl.textContent = this.scores.black;
            if (this.scoreDrawsEl) this.scoreDrawsEl.textContent = this.scores.draws;
        },

        // --- AI Implementation ---

        triggerAi() {
            this.isAiMoving = true;
            this.updateStatus();

            const delay = this.aiDifficulty === 'easy' ? 400 : 700;
            this.aiTimeout = setTimeout(() => {
                const move = this.getAiMove();
                if (move) {
                    this.makeMove(move.from, move.to, move.promotion);
                }
                this.isAiMoving = false;
                this.aiTimeout = null;
            }, delay);
        },

        getAiMove() {
            const allMoves = [];
            // Collect all legal moves for black
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece && piece.color === 'b') {
                    const legal = this.getLegalMoves(i);
                    for (const to of legal) {
                        // Support promotion check
                        const isPromo = piece.type === 'P' && Math.floor(to / 8) === 7;
                        if (isPromo) {
                            allMoves.push({ from: i, to: to, promotion: 'Q' });
                        } else {
                            allMoves.push({ from: i, to: to });
                        }
                    }
                }
            }

            if (allMoves.length === 0) return null;

            if (this.aiDifficulty === 'easy') {
                // Easy: select random legal move
                const rnd = Math.floor(Math.random() * allMoves.length);
                return allMoves[rnd];
            } else {
                // Hard AI: Minimax evaluation with depth 2/3 and piece values + position tables
                return this.getMinimaxMove(allMoves);
            }
        },

        getMinimaxMove(allMoves) {
            let bestMove = null;
            let bestVal = -Infinity;

            // Sort moves to speed up alpha-beta pruning (captures first)
            allMoves.sort((a, b) => {
                const aCapture = this.board[a.to] ? 1 : 0;
                const bCapture = this.board[b.to] ? 1 : 0;
                return bCapture - aCapture;
            });

            const depth = 2; // depth 2 is perfectly fast and smart in client browser

            for (const move of allMoves) {
                // Simulate move
                const originalTo = this.board[move.to];
                const originalFrom = this.board[move.from];
                const originalRights = { ...this.castlingRights };
                const originalEP = this.enPassantTarget;

                this.board[move.to] = originalFrom;
                if (move.promotion) this.board[move.to].type = move.promotion;
                this.board[move.from] = null;
                
                // EP Capture simulate
                let capturedEP = null;
                let capturedEPIdx = null;
                if (originalFrom.type === 'P' && move.to === originalEP) {
                    capturedEPIdx = move.to - 8; // Black capturing white EP
                    capturedEP = this.board[capturedEPIdx];
                    this.board[capturedEPIdx] = null;
                }

                // Minimax evaluation (Black maximizes, so depth-1 is white's turn, minimizing)
                let val = this.minimax(depth - 1, -Infinity, Infinity, false);

                // Revert move
                this.board[move.from] = originalFrom;
                this.board[move.to] = originalTo;
                if (capturedEPIdx !== null) {
                    this.board[capturedEPIdx] = capturedEP;
                }
                this.castlingRights = originalRights;
                this.enPassantTarget = originalEP;

                if (val > bestVal) {
                    bestVal = val;
                    bestMove = move;
                }
            }

            return bestMove;
        },

        minimax(depth, alpha, beta, isMaximizing) {
            if (depth === 0) {
                return this.evaluateBoard();
            }

            const color = isMaximizing ? 'b' : 'w';
            const allMoves = [];
            
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece && piece.color === color) {
                    const legal = this.getLegalMoves(i);
                    for (const to of legal) {
                        const isPromo = piece.type === 'P' && ((color === 'w' && Math.floor(to / 8) === 0) || (color === 'b' && Math.floor(to / 8) === 7));
                        if (isPromo) {
                            allMoves.push({ from: i, to: to, promotion: 'Q' });
                        } else {
                            allMoves.push({ from: i, to: to });
                        }
                    }
                }
            }

            if (allMoves.length === 0) {
                // Game over evaluation
                const check = this.isKingInCheck(color);
                if (check) {
                    return isMaximizing ? -20000 + (3 - depth) : 20000 - (3 - depth); // Checkmate
                }
                return 0; // Stalemate
            }

            if (isMaximizing) {
                let maxEval = -Infinity;
                for (const move of allMoves) {
                    const originalTo = this.board[move.to];
                    const originalFrom = this.board[move.from];
                    const originalRights = { ...this.castlingRights };
                    const originalEP = this.enPassantTarget;

                    this.board[move.to] = originalFrom;
                    if (move.promotion) this.board[move.to].type = move.promotion;
                    this.board[move.from] = null;

                    let capturedEP = null;
                    let capturedEPIdx = null;
                    if (originalFrom.type === 'P' && move.to === originalEP) {
                        capturedEPIdx = move.to - 8;
                        capturedEP = this.board[capturedEPIdx];
                        this.board[capturedEPIdx] = null;
                    }

                    const currentEval = this.minimax(depth - 1, alpha, beta, false);

                    // Revert
                    this.board[move.from] = originalFrom;
                    this.board[move.to] = originalTo;
                    if (capturedEPIdx !== null) {
                        this.board[capturedEPIdx] = capturedEP;
                    }
                    this.castlingRights = originalRights;
                    this.enPassantTarget = originalEP;

                    maxEval = Math.max(maxEval, currentEval);
                    alpha = Math.max(alpha, currentEval);
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
                return maxEval;
            } else {
                let minEval = Infinity;
                for (const move of allMoves) {
                    const originalTo = this.board[move.to];
                    const originalFrom = this.board[move.from];
                    const originalRights = { ...this.castlingRights };
                    const originalEP = this.enPassantTarget;

                    this.board[move.to] = originalFrom;
                    if (move.promotion) this.board[move.to].type = move.promotion;
                    this.board[move.from] = null;

                    let capturedEP = null;
                    let capturedEPIdx = null;
                    if (originalFrom.type === 'P' && move.to === originalEP) {
                        capturedEPIdx = move.to + 8;
                        capturedEP = this.board[capturedEPIdx];
                        this.board[capturedEPIdx] = null;
                    }

                    const currentEval = this.minimax(depth - 1, alpha, beta, true);

                    // Revert
                    this.board[move.from] = originalFrom;
                    this.board[move.to] = originalTo;
                    if (capturedEPIdx !== null) {
                        this.board[capturedEPIdx] = capturedEP;
                    }
                    this.castlingRights = originalRights;
                    this.enPassantTarget = originalEP;

                    minEval = Math.min(minEval, currentEval);
                    beta = Math.min(beta, currentEval);
                    if (beta <= alpha) break; // Alpha-beta pruning
                }
                return minEval;
            }
        },

        // Evaluate board state from Black's perspective (positive is black advantage, negative is white)
        evaluateBoard() {
            const pieceValues = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

            // Positional evaluation tables (adapted for index 0-63 which is top-down a8-h1)
            // Pawn position values
            const pawnTable = [
                0,  0,  0,  0,  0,  0,  0,  0,
                50, 50, 50, 50, 50, 50, 50, 50,
                10, 10, 20, 30, 30, 20, 10, 10,
                 5,  5, 10, 25, 25, 10,  5,  5,
                 0,  0,  0, 20, 20,  0,  0,  0,
                 5, -5,-10,  0,  0,-10, -5,  5,
                 5, 10, 10,-20,-20, 10, 10,  5,
                 0,  0,  0,  0,  0,  0,  0,  0
            ];

            // Knight position values
            const knightTable = [
                -50,-40,-30,-30,-30,-30,-40,-50,
                -40,-20,  0,  0,  0,  0,-20,-40,
                -30,  0, 10, 15, 15, 10,  0,-30,
                -30,  5, 15, 20, 20, 15,  5,-30,
                -30,  0, 15, 20, 20, 15,  0,-30,
                -30,  5, 10, 15, 15, 10,  5,-30,
                -40,-20,  0,  5,  5,  0,-20,-40,
                -50,-40,-30,-30,-30,-30,-40,-50
            ];

            // Bishop position values
            const bishopTable = [
                -20,-10,-10,-10,-10,-10,-10,-20,
                -10,  0,  0,  0,  0,  0,  0,-10,
                -10,  0,  5, 10, 10,  5,  0,-10,
                -10,  5,  5, 10, 10,  5,  5,-10,
                -10,  0, 10, 10, 10, 10,  0,-10,
                -10, 10, 10, 10, 10, 10, 10,-10,
                -10,  5,  0,  0,  0,  0,  5,-10,
                -20,-10,-10,-10,-10,-10,-10,-20
            ];

            // Rook position values
            const rookTable = [
                  0,  0,  0,  0,  0,  0,  0,  0,
                  5, 10, 10, 10, 10, 10, 10,  5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                 -5,  0,  0,  0,  0,  0,  0, -5,
                  0,  0,  0,  5,  5,  5,  0,  0
            ];

            // Queen position values
            const queenTable = [
                -20,-10,-10, -5, -5,-10,-10,-20,
                -10,  0,  0,  0,  0,  0,  0,-10,
                -10,  0,  5,  5,  5,  5,  0,-10,
                 -5,  0,  5,  5,  5,  5,  0, -5,
                  0,  0,  5,  5,  5,  5,  0, -5,
                -10,  5,  5,  5,  5,  5,  0,-10,
                -10,  0,  5,  0,  0,  5,  0,-10,
                -20,-10,-10, -5, -5,-10,-10,-20
            ];

            // King position values (mid-game table)
            const kingTable = [
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -30,-40,-40,-50,-50,-40,-40,-30,
                -20,-30,-30,-40,-40,-30,-30,-20,
                -10,-20,-20,-20,-20,-20,-20,-10,
                 20, 20,  0,  0,  0,  0, 20, 20,
                 20, 30, 10,  0,  0, 10, 30, 20
            ];

            let score = 0;
            
            for (let i = 0; i < 64; i++) {
                const piece = this.board[i];
                if (piece) {
                    const type = piece.type;
                    const val = pieceValues[type];
                    
                    let posVal = 0;
                    if (type === 'P') posVal = pawnTable[piece.color === 'w' ? 63 - i : i];
                    else if (type === 'N') posVal = knightTable[piece.color === 'w' ? 63 - i : i];
                    else if (type === 'B') posVal = bishopTable[piece.color === 'w' ? 63 - i : i];
                    else if (type === 'R') posVal = rookTable[piece.color === 'w' ? 63 - i : i];
                    else if (type === 'Q') posVal = queenTable[piece.color === 'w' ? 63 - i : i];
                    else if (type === 'K') posVal = kingTable[piece.color === 'w' ? 63 - i : i];

                    if (piece.color === 'b') {
                        score += val + posVal;
                    } else {
                        score -= (val + posVal);
                    }
                }
            }

            return score;
        }
    };

    // Attach to global window
    window.ChessGame = Chess;
})();
