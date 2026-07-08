(function() {
    let board = Array(9).fill(null);
    let currentPlayer = 'X'; // X is player/starts first, O is Player2/AI
    let gameMode = 'pvp';
    let aiDifficulty = 'easy';
    let history = []; // stores board history: Array of { board: Array(9), currentPlayer: String }
    let isGameOver = false;
    let isAiMoving = false; // flag to prevent clicking during AI turn animation/delay
    
    // UI elements
    let boardEl, cells, modePvpBtn, modePveBtn, diffGroupEl, diffEasyBtn, diffHardBtn;
    let undoBtn, restartBtn, clearBtn, turnStatusEl;
    let scoreVal1, scoreVal2, scoreDraws, scoreLabel1, scoreLabel2;
    
    // Win combinations
    const WINNING_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    function init() {
        boardEl = document.getElementById('ttt-board');
        cells = document.querySelectorAll('.ttt-cell');
        modePvpBtn = document.getElementById('mode-pvp');
        modePveBtn = document.getElementById('mode-pve');
        diffGroupEl = document.getElementById('difficulty-group');
        diffEasyBtn = document.getElementById('diff-easy');
        diffHardBtn = document.getElementById('diff-hard');
        undoBtn = document.getElementById('ttt-undo');
        restartBtn = document.getElementById('ttt-restart');
        clearBtn = document.getElementById('ttt-clear');
        turnStatusEl = document.getElementById('turn-status');
        
        scoreVal1 = document.getElementById('score-val-1');
        scoreVal2 = document.getElementById('score-val-2');
        scoreDraws = document.getElementById('score-draws');
        scoreLabel1 = document.getElementById('score-label-1');
        scoreLabel2 = document.getElementById('score-label-2');
        
        // Add event listeners
        cells.forEach(cell => cell.addEventListener('click', handleCellClick));
        
        modePvpBtn.addEventListener('click', () => setGameMode('pvp'));
        modePveBtn.addEventListener('click', () => setGameMode('pve'));
        diffEasyBtn.addEventListener('click', () => setDifficulty('easy'));
        diffHardBtn.addEventListener('click', () => setDifficulty('hard'));
        
        undoBtn.addEventListener('click', undoMove);
        restartBtn.addEventListener('click', restartMatch);
        clearBtn.addEventListener('click', clearScores);
        
        loadScores();
        resetBoard();
    }
    
    // Expose init function
    window.initTicTacToe = function() {
        if (!boardEl) {
            init();
        } else {
            resetBoard();
        }
    };
    
    function loadScores() {
        if (gameMode === 'pvp') {
            scoreLabel1.textContent = 'Player X';
            scoreLabel2.textContent = 'Player O';
            scoreVal1.textContent = localStorage.getItem('ttt_pvp_x_wins') || '0';
            scoreVal2.textContent = localStorage.getItem('ttt_pvp_o_wins') || '0';
            scoreDraws.textContent = localStorage.getItem('ttt_pvp_draws') || '0';
        } else {
            scoreLabel1.textContent = 'You (X)';
            scoreLabel2.textContent = 'AI (O)';
            scoreVal1.textContent = localStorage.getItem('ttt_pve_player_wins') || '0';
            scoreVal2.textContent = localStorage.getItem('ttt_pve_ai_wins') || '0';
            scoreDraws.textContent = localStorage.getItem('ttt_pve_draws') || '0';
        }
    }
    
    function saveScore(winner) {
        if (gameMode === 'pvp') {
            if (winner === 'X') {
                let wins = parseInt(localStorage.getItem('ttt_pvp_x_wins') || '0') + 1;
                localStorage.setItem('ttt_pvp_x_wins', wins);
            } else if (winner === 'O') {
                let wins = parseInt(localStorage.getItem('ttt_pvp_o_wins') || '0') + 1;
                localStorage.setItem('ttt_pvp_o_wins', wins);
            } else {
                let draws = parseInt(localStorage.getItem('ttt_pvp_draws') || '0') + 1;
                localStorage.setItem('ttt_pvp_draws', draws);
            }
        } else {
            if (winner === 'X') {
                let wins = parseInt(localStorage.getItem('ttt_pve_player_wins') || '0') + 1;
                localStorage.setItem('ttt_pve_player_wins', wins);
            } else if (winner === 'O') {
                let wins = parseInt(localStorage.getItem('ttt_pve_ai_wins') || '0') + 1;
                localStorage.setItem('ttt_pve_ai_wins', wins);
            } else {
                let draws = parseInt(localStorage.getItem('ttt_pve_draws') || '0') + 1;
                localStorage.setItem('ttt_pve_draws', draws);
            }
        }
        loadScores();
        if (window.updateLobbyStats) {
            window.updateLobbyStats();
        }
    }
    
    function setGameMode(mode) {
        if (gameMode === mode) return;
        gameMode = mode;
        if (mode === 'pvp') {
            modePvpBtn.classList.add('active');
            modePveBtn.classList.remove('active');
            diffGroupEl.style.display = 'none';
        } else {
            modePvpBtn.classList.remove('active');
            modePveBtn.classList.add('active');
            diffGroupEl.style.display = 'flex';
        }
        loadScores();
        resetBoard();
    }
    
    function setDifficulty(diff) {
        if (aiDifficulty === diff) return;
        aiDifficulty = diff;
        if (diff === 'easy') {
            diffEasyBtn.classList.add('active');
            diffHardBtn.classList.remove('active');
        } else {
            diffEasyBtn.classList.remove('active');
            diffHardBtn.classList.add('active');
        }
        resetBoard();
    }
    
    function handleCellClick(e) {
        if (isGameOver || isAiMoving) return;
        const index = parseInt(e.target.dataset.index);
        if (board[index] !== null) return;
        
        makeMove(index, currentPlayer);
        
        if (!isGameOver && gameMode === 'pve' && currentPlayer === 'O') {
            triggerAiMove();
        }
    }
    
    function makeMove(index, player) {
        // Save history before move
        history.push({
            board: [...board],
            currentPlayer: currentPlayer
        });
        
        board[index] = player;
        updateUI();
        
        const winCombo = checkWin(board, player);
        if (winCombo) {
            endGame(player, winCombo);
        } else if (board.every(cell => cell !== null)) {
            endGame('draw');
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            turnStatusEl.textContent = `Player ${currentPlayer}'s Turn`;
            if (gameMode === 'pve') {
                turnStatusEl.textContent = currentPlayer === 'X' ? "Your Turn" : "AI is thinking...";
            }
        }
    }
    
    function triggerAiMove() {
        isAiMoving = true;
        setTimeout(() => {
            if (isGameOver) {
                isAiMoving = false;
                return;
            }
            let bestMove;
            if (aiDifficulty === 'easy') {
                bestMove = getRandomMove();
            } else {
                bestMove = getMinimaxMove();
            }
            
            if (bestMove !== undefined && bestMove !== null) {
                makeMove(bestMove, 'O');
            }
            isAiMoving = false;
        }, 500); // 500ms delay to make it feel natural
    }
    
    function getRandomMove() {
        const empties = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
        if (empties.length === 0) return null;
        return empties[Math.floor(Math.random() * empties.length)];
    }
    
    function getMinimaxMove() {
        let bestScore = -Infinity;
        let move;
        for (let i = 0; i < 9; i++) {
            if (board[i] === null) {
                board[i] = 'O';
                let score = minimax(board, 0, false);
                board[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
        return move;
    }
    
    function checkWin(b, player) {
        for (let combo of WINNING_COMBOS) {
            if (b[combo[0]] === player && b[combo[1]] === player && b[combo[2]] === player) {
                return combo;
            }
        }
        return null;
    }
    
    function checkWinForScore(b, player) {
        return WINNING_COMBOS.some(combo => 
            b[combo[0]] === player && b[combo[1]] === player && b[combo[2]] === player
        );
    }
    
    function minimax(b, depth, isMaximizing) {
        if (checkWinForScore(b, 'O')) return 10 - depth;
        if (checkWinForScore(b, 'X')) return depth - 10;
        if (b.every(cell => cell !== null)) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (b[i] === null) {
                    b[i] = 'O';
                    let score = minimax(b, depth + 1, false);
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
                    let score = minimax(b, depth + 1, true);
                    b[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    function updateUI() {
        cells.forEach((cell, idx) => {
            cell.textContent = board[idx] || '';
            cell.className = 'ttt-cell';
            if (board[idx] === 'X') cell.classList.add('x');
            if (board[idx] === 'O') cell.classList.add('o');
        });
    }
    
    function endGame(result, winCombo = null) {
        isGameOver = true;
        if (result === 'draw') {
            turnStatusEl.textContent = "It's a Draw! 🤝";
            saveScore('draw');
        } else {
            if (gameMode === 'pve') {
                turnStatusEl.textContent = result === 'X' ? "You Win! 🎉" : "AI Wins! 🤖";
            } else {
                turnStatusEl.textContent = `Player ${result} Wins! 🎉`;
            }
            saveScore(result);
            if (winCombo) {
                winCombo.forEach(idx => cells[idx].classList.add('winning'));
            }
        }
    }
    
    function undoMove() {
        if (isAiMoving || history.length === 0) return;
        
        let previousState = history.pop();
        
        // If PvE, we undo both the AI and the Player moves (since history has 1 step per player move)
        if (gameMode === 'pve' && previousState.currentPlayer === 'O' && history.length > 0) {
            board = previousState.board;
            previousState = history.pop();
        }
        
        board = previousState.board;
        currentPlayer = previousState.currentPlayer;
        isGameOver = false;
        
        updateUI();
        turnStatusEl.textContent = gameMode === 'pve' ? (currentPlayer === 'X' ? "Your Turn" : "AI is thinking...") : `Player ${currentPlayer}'s Turn`;
    }
    
    function restartMatch() {
        resetBoard();
    }
    
    function resetBoard() {
        board = Array(9).fill(null);
        currentPlayer = 'X';
        history = [];
        isGameOver = false;
        isAiMoving = false;
        updateUI();
        turnStatusEl.textContent = gameMode === 'pve' ? "Your Turn" : "Player X's Turn";
    }
    
    function clearScores() {
        if (gameMode === 'pvp') {
            localStorage.setItem('ttt_pvp_x_wins', '0');
            localStorage.setItem('ttt_pvp_o_wins', '0');
            localStorage.setItem('ttt_pvp_draws', '0');
        } else {
            localStorage.setItem('ttt_pve_player_wins', '0');
            localStorage.setItem('ttt_pve_ai_wins', '0');
            localStorage.setItem('ttt_pve_draws', '0');
        }
        loadScores();
        if (window.updateLobbyStats) {
            window.updateLobbyStats();
        }
    }
})();
