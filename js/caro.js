(function() {
    // Game State Structure (for upcoming tasks, defined here to keep code clean)
    const state = {
        board: [], // 12x12 grid containing null, 'X', or 'O'
        currentPlayer: 'X',
        gameMode: 'bot', // 'bot' or 'pvp'
        isGameOver: false,
        history: [],
        scores: { X: 0, O: 0, Draws: 0 },
        timerInterval: null,
        seconds: 0
    };

    // DOM Elements References
    let boardEl = null;
    let turnEl = null;
    let timerEl = null;
    let scoreXEl = null;
    let scoreOEl = null;
    let scoreDrawsEl = null;
    let modePveBtn = null;
    let modePvpBtn = null;
    let undoBtn = null;
    let restartBtn = null;

    // Initialize references to DOM elements inside the Caro section
    function initDOMElements() {
        boardEl = document.getElementById('caro-board');
        turnEl = document.getElementById('caro-turn');
        timerEl = document.getElementById('caro-time');
        scoreXEl = document.getElementById('caro-score-x');
        scoreOEl = document.getElementById('caro-score-o');
        scoreDrawsEl = document.getElementById('caro-score-draws');
        modePveBtn = document.getElementById('caro-mode-pve');
        modePvpBtn = document.getElementById('caro-mode-pvp');
        undoBtn = document.getElementById('caro-undo-btn');
        restartBtn = document.getElementById('caro-restart-btn');
    }

    // Render the 12x12 empty board cells
    function renderEmptyBoard() {
        if (!boardEl) return;
        boardEl.innerHTML = '';
        
        // Ensure class indicates current turn for hover preview CSS
        boardEl.className = 'caro-board turn-' + state.currentPlayer.toLowerCase();

        // Build 12x12 grid cells
        for (let r = 0; r < 12; r++) {
            state.board[r] = [];
            for (let c = 0; c < 12; c++) {
                state.board[r][c] = null;
                
                const cell = document.createElement('div');
                cell.className = 'caro-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                
                // Add event listeners for interaction
                cell.addEventListener('click', handleCellClick);
                cell.addEventListener('mouseenter', handleCellMouseEnter);
                cell.addEventListener('mouseleave', handleCellMouseLeave);
                
                boardEl.appendChild(cell);
            }
        }
    }

    // Temporary handler for clicking a cell (toggles X/O and updates turn for testing hover preview)
    function handleCellClick(e) {
        if (state.isGameOver) return;

        const cell = e.target;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Check if cell is already occupied
        if (cell.classList.contains('x') || cell.classList.contains('o')) {
            return;
        }

        console.log(`Cell clicked: row ${row}, col ${col}`);

        // Update local board state
        state.board[row][col] = state.currentPlayer;

        // Visual update
        cell.classList.add(state.currentPlayer.toLowerCase());
        cell.textContent = state.currentPlayer;

        // Cycle turn (For Task 2 testing purposes only)
        state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
        
        // Update board turn indicator classes
        if (boardEl) {
            boardEl.className = 'caro-board turn-' + state.currentPlayer.toLowerCase();
        }
        if (turnEl) {
            turnEl.innerHTML = `<span class="turn-indicator turn-${state.currentPlayer.toLowerCase()}">${state.currentPlayer}</span>`;
        }
    }

    function handleCellMouseEnter(e) {
        // Can be used for custom JS hover preview behaviors in the future
    }

    function handleCellMouseLeave(e) {
        // Can be used for custom JS hover preview behaviors in the future
    }

    // Set up controls event listeners
    function setupEventListeners() {
        if (modePveBtn) {
            modePveBtn.addEventListener('click', () => {
                modePveBtn.classList.add('active');
                if (modePvpBtn) modePvpBtn.classList.remove('active');
                state.gameMode = 'bot';
                console.log("Game mode switched to Bot");
            });
        }
        if (modePvpBtn) {
            modePvpBtn.addEventListener('click', () => {
                modePvpBtn.classList.add('active');
                if (modePveBtn) modePveBtn.classList.remove('active');
                state.gameMode = 'pvp';
                console.log("Game mode switched to PvP");
            });
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                console.log("Restart clicked");
                state.currentPlayer = 'X';
                state.isGameOver = false;
                if (turnEl) {
                    turnEl.innerHTML = `<span class="turn-indicator turn-x">X</span>`;
                }
                renderEmptyBoard();
            });
        }
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                console.log("Undo clicked (stub)");
            });
        }
    }

    // Public API exposed via window.CaroGame Namespace
    window.CaroGame = {
        init: function() {
            console.log("Caro Game Initialized");
            initDOMElements();
            renderEmptyBoard();
            setupEventListeners();
        },
        stop: function() {
            console.log("Caro Game Stopped");
            if (state.timerInterval) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
            }
            // Do NOT wipe the container innerHTML because index.html now contains the static structure.
        }
    };
})();
