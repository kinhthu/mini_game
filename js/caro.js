(function() {
    const BOARD_SIZE = 15;
    let boardState = [];
    let currentPlayer = 'X';
    let gameActive = true;
    let scores = { X: 0, O: 0, ties: 0 };
    
    let boardElement, turnIndicator, scoreXElement, scoreOElement, scoreTiesElement;
    let resetBtn, winModal, winTitle, winMessage, modalRestartBtn;
    let modeSelect, ruleSelect;
    let undoBtn, resetScoreBtn;
    
    let initialized = false;
    let isAiThinking = false;
    let aiTimeout = null;
    let moveHistory = [];

    // Web Audio API Sound Effects
    let audioCtx = null;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    function playClickSound() {
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }
    
    function playWinSound() {
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const now = audioCtx.currentTime;
            const notes = [293.66, 329.63, 349.23, 392.00, 523.25]; // D4, E4, F4, G4, C5
            const durations = [0.1, 0.1, 0.1, 0.1, 0.35];
            
            let time = now;
            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, time);
                
                gain.gain.setValueAtTime(0.1, time);
                gain.gain.exponentialRampToValueAtTime(0.005, time + durations[index]);
                
                osc.start(time);
                osc.stop(time + durations[index]);
                
                time += durations[index] * 0.85;
            });
        } catch (e) {
            console.warn('Audio play failed:', e);
        }
    }

    // Initialize/Reset board state array
    function resetBoardState() {
        boardState = [];
        for (let i = 0; i < BOARD_SIZE; i++) {
            boardState.push(Array(BOARD_SIZE).fill(null));
        }
    }

    // Dynamic grid generation
    function createBoard() {
        if (!boardElement) return;
        boardElement.innerHTML = '';
        
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const cell = document.createElement('div');
                cell.classList.add('caro-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // Add event listeners for play and preview
                cell.addEventListener('mouseenter', handleCellMouseEnter);
                cell.addEventListener('mouseleave', handleCellMouseLeave);
                cell.addEventListener('click', handleCellClick);
                
                boardElement.appendChild(cell);
            }
        }
    }

    // Ghost Preview - Show low opacity X/O when hovering empty cells
    function handleCellMouseEnter() {
        if (!gameActive || isAiThinking) return;
        const r = parseInt(this.dataset.row);
        const c = parseInt(this.dataset.col);
        
        if (boardState[r][c] === null) {
            this.textContent = currentPlayer;
            this.classList.add('ghost');
            if (currentPlayer === 'X') {
                this.classList.add('x-ghost');
            } else {
                this.classList.add('o-ghost');
            }
        }
    }

    function handleCellMouseLeave() {
        const r = parseInt(this.dataset.row);
        const c = parseInt(this.dataset.col);
        
        // Remove ghost classes if cell hasn't been played
        if (boardState[r][c] === null) {
            this.textContent = '';
            this.classList.remove('ghost', 'x-ghost', 'o-ghost');
        }
    }

    // Play Move on Click
    function handleCellClick() {
        if (!gameActive || isAiThinking) return;
        
        const r = parseInt(this.dataset.row);
        const c = parseInt(this.dataset.col);
        
        if (boardState[r][c] !== null) return; // Prevent double moves
        
        makeMove(r, c);
    }

    function makeMove(r, c) {
        if (!gameActive) return;

        // Play click sound
        playClickSound();

        // Register move
        boardState[r][c] = currentPlayer;
        
        const cell = boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            cell.textContent = currentPlayer;
            cell.classList.remove('ghost', 'x-ghost', 'o-ghost');
            cell.classList.add('played');
            
            if (currentPlayer === 'X') {
                cell.classList.add('x-mark');
            } else {
                cell.classList.add('o-mark');
            }
        }
        
        // Check win
        const winResult = checkWin(r, c);
        const isTie = !winResult && checkTie();
        
        // Add to history
        moveHistory.push({
            row: r,
            col: c,
            player: currentPlayer,
            wasWin: !!winResult,
            wasTie: isTie
        });
        
        if (winResult) {
            handleGameWin(winResult);
            isAiThinking = false;
        } else if (isTie) {
            handleGameTie();
            isAiThinking = false;
        } else {
            // Switch Turn
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateTurnIndicator();
            
            const mode = modeSelect ? modeSelect.value : 'pvp';
            if (mode === 'pve' && currentPlayer === 'O') {
                triggerAiMove();
            } else {
                isAiThinking = false;
            }
        }
    }

    function triggerAiMove() {
        isAiThinking = true;
        
        // Disable human clicks / hover
        aiTimeout = setTimeout(() => {
            aiTimeout = null;
            if (!gameActive || !isAiThinking) {
                isAiThinking = false;
                return;
            }
            
            const rule = ruleSelect ? ruleSelect.value : 'standard';
            const bestMove = window.CaroAI.getBestMove(boardState, 'O', 'X', rule);
            if (bestMove) {
                const { row, col } = bestMove;
                makeMove(row, col);
            } else {
                isAiThinking = false;
            }
        }, 400);
    }

    // Turn Indicator UI updates
    function updateTurnIndicator() {
        if (!turnIndicator) return;
        
        const markClass = currentPlayer === 'X' ? 'X-mark' : 'O-mark';
        turnIndicator.innerHTML = `Lượt chơi: <span class="turn-mark ${markClass}">${currentPlayer}</span>`;
    }

    // Win Checker Algorithm
    function checkWin(row, col) {
        const symbol = boardState[row][col];
        if (!symbol) return null;
        
        const rule = ruleSelect ? ruleSelect.value : 'standard';
        
        const directions = [
            { dr: 0, dc: 1 },   // Horizontal
            { dr: 1, dc: 0 },   // Vertical
            { dr: 1, dc: 1 },   // Diagonal Down-Right
            { dr: 1, dc: -1 }   // Diagonal Down-Left
        ];
        
        for (let { dr, dc } of directions) {
            let count = 1;
            let winningCells = [[row, col]];
            
            // Positive direction
            let r = row + dr;
            let c = col + dc;
            let posCount = 0;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === symbol) {
                count++;
                posCount++;
                winningCells.push([r, c]);
                r += dr;
                c += dc;
            }
            
            // Negative direction
            r = row - dr;
            c = col - dc;
            let negCount = 0;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && boardState[r][c] === symbol) {
                count++;
                negCount++;
                winningCells.push([r, c]);
                r -= dr;
                c -= dc;
            }
            
            if (count >= 5) {
                // If Vietnamese rule is active, check if blocked at both ends
                if (rule === 'vietnamese') {
                    const opponent = symbol === 'X' ? 'O' : 'X';
                    
                    let blockBefore = false;
                    let rBefore = row - (negCount + 1) * dr;
                    let cBefore = col - (negCount + 1) * dc;
                    if (rBefore >= 0 && rBefore < BOARD_SIZE && cBefore >= 0 && cBefore < BOARD_SIZE) {
                        if (boardState[rBefore][cBefore] === opponent) {
                            blockBefore = true;
                        }
                    }
                    
                    let blockAfter = false;
                    let rAfter = row + (posCount + 1) * dr;
                    let cAfter = col + (posCount + 1) * dc;
                    if (rAfter >= 0 && rAfter < BOARD_SIZE && cAfter >= 0 && cAfter < BOARD_SIZE) {
                        if (boardState[rAfter][cAfter] === opponent) {
                            blockAfter = true;
                        }
                    }
                    
                    if (blockBefore && blockAfter) {
                        // Blocked at both ends: not a win under Vietnamese rules
                        continue;
                    }
                }
                
                return { symbol, cells: winningCells };
            }
        }
        
        return null;
    }

    // Tie Checker
    function checkTie() {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (boardState[r][c] === null) return false;
            }
        }
        return true;
    }

    // Handle Win
    function handleGameWin(winResult) {
        gameActive = false;
        
        // Play victory sound
        playWinSound();
        
        // Highlight winning cells
        winResult.cells.forEach(([r, c]) => {
            const cell = boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) {
                cell.classList.add('winner');
                cell.classList.add(winResult.symbol === 'X' ? 'x-winner' : 'o-winner');
            }
        });
        
        // Update score
        scores[winResult.symbol]++;
        updateScoreboard();
        
        // Show Win Modal
        setTimeout(() => {
            if (winTitle) winTitle.textContent = `Chiến thắng! 🎉`;
            if (winMessage) winMessage.textContent = `Người chơi ${winResult.symbol} đã giành chiến thắng!`;
            if (winModal) winModal.classList.add('active');
        }, 800);
    }

    // Handle Tie
    function handleGameTie() {
        gameActive = false;
        scores.ties++;
        updateScoreboard();
        
        // Play click sound for tie
        playClickSound();
        
        setTimeout(() => {
            if (winTitle) winTitle.textContent = `Hòa cờ! 🤝`;
            if (winMessage) winMessage.textContent = `Không còn ô trống. Trận đấu kết thúc với kết quả hòa!`;
            if (winModal) winModal.classList.add('active');
        }, 800);
    }

    // Undo moves
    function undoMove() {
        if (!gameActive && moveHistory.length === 0) return;
        if (isAiThinking) return;
        if (moveHistory.length === 0) return;

        const mode = modeSelect ? modeSelect.value : 'pvp';
        
        if (mode === 'pve') {
            if (moveHistory.length > 0) {
                const lastMove = moveHistory[moveHistory.length - 1];
                if (lastMove.player === 'O') {
                    undoSingleMove();
                    undoSingleMove();
                } else {
                    undoSingleMove();
                }
                currentPlayer = 'X';
            }
        } else {
            const lastMove = moveHistory[moveHistory.length - 1];
            undoSingleMove();
            if (lastMove) {
                currentPlayer = lastMove.player;
            }
        }
        
        updateTurnIndicator();
        playClickSound();
    }

    function undoSingleMove() {
        const lastMove = moveHistory.pop();
        if (!lastMove) return;

        const { row, col, player, wasWin, wasTie } = lastMove;
        
        // Restore board state
        boardState[row][col] = null;
        
        // Restore DOM
        const cell = boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = '';
            cell.classList.remove('played', 'x-mark', 'o-mark', 'winner', 'x-winner', 'o-winner');
        }
        
        if (wasWin) {
            scores[player]--;
            if (scores[player] < 0) scores[player] = 0;
            updateScoreboard();
            gameActive = true;
            if (winModal) winModal.classList.remove('active');
            
            const winners = boardElement.querySelectorAll('.winner');
            winners.forEach(w => w.classList.remove('winner', 'x-winner', 'o-winner'));
        } else if (wasTie) {
            scores.ties--;
            if (scores.ties < 0) scores.ties = 0;
            updateScoreboard();
            gameActive = true;
            if (winModal) winModal.classList.remove('active');
        }
    }

    // Update Scoreboard UI
    function updateScoreboard() {
        if (scoreXElement) scoreXElement.textContent = scores.X;
        if (scoreOElement) scoreOElement.textContent = scores.O;
        if (scoreTiesElement) scoreTiesElement.textContent = scores.ties;
    }

    // Reset Game (Board Only, keep scores)
    function resetGame() {
        resetBoardState();
        moveHistory = [];
        currentPlayer = 'X';
        gameActive = true;
        
        if (aiTimeout) {
            clearTimeout(aiTimeout);
            aiTimeout = null;
        }
        isAiThinking = false;
        
        if (winModal) winModal.classList.remove('active');
        
        createBoard();
        updateTurnIndicator();
    }

    // Full Reset (including scores)
    function fullReset() {
        scores = { X: 0, O: 0, ties: 0 };
        updateScoreboard();
        resetGame();
    }

    // Initialization
    function initCaroGame() {
        boardElement = document.getElementById('caro-board');
        turnIndicator = document.getElementById('caro-turn-indicator');
        scoreXElement = document.getElementById('score-x');
        scoreOElement = document.getElementById('score-o');
        scoreTiesElement = document.getElementById('score-ties');
        
        resetBtn = document.getElementById('caro-reset-btn');
        winModal = document.getElementById('caro-win-modal');
        winTitle = document.getElementById('caro-win-title');
        winMessage = document.getElementById('caro-win-message');
        modalRestartBtn = document.getElementById('caro-modal-restart-btn');
        
        modeSelect = document.getElementById('caro-mode');
        ruleSelect = document.getElementById('caro-rule');
        
        undoBtn = document.getElementById('caro-undo-btn');
        resetScoreBtn = document.getElementById('caro-reset-score-btn');

        if (!initialized) {
            if (resetBtn) {
                resetBtn.addEventListener('click', resetGame);
            }
            if (modalRestartBtn) {
                modalRestartBtn.addEventListener('click', resetGame);
            }
            if (undoBtn) {
                undoBtn.addEventListener('click', undoMove);
            }
            if (resetScoreBtn) {
                resetScoreBtn.addEventListener('click', fullReset);
            }
            if (modeSelect) {
                modeSelect.addEventListener('change', () => {
                    fullReset();
                });
            }
            if (ruleSelect) {
                ruleSelect.addEventListener('change', () => {
                    fullReset();
                });
            }
            initialized = true;
        }

        fullReset();
    }

    function stopCaroGame() {
        if (winModal) {
            winModal.classList.remove('active');
        }
        if (aiTimeout) {
            clearTimeout(aiTimeout);
            aiTimeout = null;
        }
        isAiThinking = false;
    }

    window.CaroGame = {
        init: initCaroGame,
        stop: stopCaroGame
    };
})();
