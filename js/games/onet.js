// --- Onet Connect Game Logic (Encapsulated) ---
const OnetConnect = {
    // Game States
    level: 1,
    score: 0,
    hints: 3,
    shuffles: 3,
    grid: [],
    rows: 0,
    cols: 0,
    selectedTile: null,
    timeLeft: 0,
    timerInterval: null,
    isBoardLocked: false,
    
    // Config for Levels
    levelConfigs: {
        1: { rows: 4, cols: 6, time: 180 },
        2: { rows: 6, cols: 8, time: 240 },
        3: { rows: 6, cols: 10, time: 300 },
        4: { rows: 8, cols: 10, time: 360 },
        5: { rows: 8, cols: 12, time: 420 }
    },

    // Emoji pool for tiles matching
    emojisPool: [
        '🥑', '🍍', '🍓', '🍇', '🍉', '🍊', '🍋', '🍌', '🍒', '🍑', 
        '🥭', '🍎', '🍏', '🍐', '🥝', '🥥', '🍅', '🍆', '🥦', '🥬', 
        '🌽', '🥕', '🧄', '🧅', '🍄', '🥜', '🌰', '🥐', '🍞', '🥖', 
        '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', 
        '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥚', '🍳', '🍿', '🍣'
    ],

    init() {
        // Cache DOM Selectors
        this.gridElement = document.getElementById('onet-grid');
        this.boardContainer = document.getElementById('onet-board-container');
        this.scoreDisplay = document.getElementById('onet-score');
        this.hintsDisplay = document.getElementById('onet-hints');
        this.shufflesDisplay = document.getElementById('onet-shuffles');
        this.timerBar = document.getElementById('onet-timer-bar');
        this.levelDisplay = document.getElementById('onet-current-level');
        
        this.winModal = document.getElementById('onet-win-modal');
        this.loseModal = document.getElementById('onet-lose-modal');
        
        this.finalScoreDisplay = document.getElementById('onet-final-score');
        this.gameoverScoreDisplay = document.getElementById('onet-gameover-score');
        
        // Bind event listeners once using dataset.bound guard
        const hintBtn = document.getElementById('onet-hint-btn');
        if (hintBtn && !hintBtn.dataset.bound) {
            hintBtn.addEventListener('click', () => this.useHint());
            hintBtn.dataset.bound = true;
        }
        
        const shuffleBtn = document.getElementById('onet-shuffle-btn');
        if (shuffleBtn && !shuffleBtn.dataset.bound) {
            shuffleBtn.addEventListener('click', () => this.manualShuffle());
            shuffleBtn.dataset.bound = true;
        }
        
        const restartBtn = document.getElementById('onet-restart-btn');
        if (restartBtn && !restartBtn.dataset.bound) {
            restartBtn.addEventListener('click', () => this.restartGame());
            restartBtn.dataset.bound = true;
        }
        
        const retryBtn = document.getElementById('onet-retry-btn');
        if (retryBtn && !retryBtn.dataset.bound) {
            retryBtn.addEventListener('click', () => this.retryLevel());
            retryBtn.dataset.bound = true;
        }
        
        const nextLevelBtn = document.getElementById('onet-next-level-btn');
        if (nextLevelBtn && !nextLevelBtn.dataset.bound) {
            nextLevelBtn.addEventListener('click', () => this.nextLevel());
            nextLevelBtn.dataset.bound = true;
        }

        // Support loading stats from localStorage
        this.level = parseInt(localStorage.getItem('onet_level') || '1', 10);
        this.score = 0;
        this.hints = 3;
        this.shuffles = 3;
        this.selectedTile = null;
        this.isBoardLocked = false;
        
        this.setupLevel();
    },

    getLevelConfig(level) {
        return this.levelConfigs[level] || this.levelConfigs[5];
    },

    setupLevel() {
        // Hide modals
        if (this.winModal) this.winModal.classList.remove('active');
        if (this.loseModal) this.loseModal.classList.remove('active');
        
        // Clear SVG lines
        const svg = document.getElementById('onet-svg-overlay');
        if (svg) svg.innerHTML = '';
        
        // Load Level Config
        const config = this.getLevelConfig(this.level);
        this.rows = config.rows;
        this.cols = config.cols;
        this.timeLeft = config.time;
        
        // Reset timer warning
        if (this.timerBar) {
            this.timerBar.style.width = '100%';
            this.timerBar.classList.remove('warning');
        }
        
        // Set up padded grid array (H+2 x W+2) filled with 0
        this.grid = [];
        for (let r = 0; r < this.rows + 2; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols + 2; c++) {
                this.grid[r][c] = 0;
            }
        }
        
        // Reset selection
        this.selectedTile = null;
        this.isBoardLocked = false;
        
        // Generate board with active tiles and guarantee valid moves
        this.generateBoard();
        
        // Update Displays
        if (this.levelDisplay) this.levelDisplay.textContent = this.level;
        this.updateStatsDisplay();
        
        // Start Game Loop (Timer)
        this.startTimer();
        
        // Record Game Played
        const played = parseInt(localStorage.getItem('onet_played') || '0', 10);
        localStorage.setItem('onet_played', played + 1);
        if (window.ProfileManager) window.ProfileManager.updateUI();
    },

    generateBoard() {
        const numPairs = (this.rows * this.cols) / 2;
        
        // Select random emojis from pool
        const pool = [...this.emojisPool];
        this.shuffleArray(pool);
        
        const selected = [];
        for (let i = 0; i < numPairs; i++) {
            selected.push(pool[i % pool.length]);
        }
        
        // Make matching pairs
        const tiles = [...selected, ...selected];
        
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            this.shuffleArray(tiles);
            
            // Assign tiles to the inner cells of the padded grid
            let index = 0;
            for (let r = 1; r <= this.rows; r++) {
                for (let c = 1; c <= this.cols; c++) {
                    this.grid[r][c] = tiles[index++];
                }
            }
            attempts++;
        } while (!this.hasValidMoves() && attempts < maxAttempts);
        
        // Render the UI board
        this.renderBoard();
    },

    renderBoard() {
        if (!this.gridElement) return;
        this.gridElement.innerHTML = '';
        
        // Set CSS Grid Template Columns (total width = cols + 2 boundary padding)
        this.gridElement.style.gridTemplateColumns = `repeat(${this.cols + 2}, 1fr)`;
        
        for (let r = 0; r < this.rows + 2; r++) {
            for (let c = 0; c < this.cols + 2; c++) {
                const tileEl = document.createElement('div');
                tileEl.classList.add('onet-tile');
                tileEl.setAttribute('data-row', r);
                tileEl.setAttribute('data-col', c);
                
                const value = this.grid[r][c];
                if (value === 0) {
                    tileEl.classList.add('empty');
                } else {
                    tileEl.textContent = value;
                    tileEl.addEventListener('click', () => this.handleTileClick(r, c));
                    
                    // Restore visual selection if matching selected coordinates
                    if (this.selectedTile && this.selectedTile.r === r && this.selectedTile.c === c) {
                        tileEl.classList.add('selected');
                    }
                }
                
                this.gridElement.appendChild(tileEl);
            }
        }
    },

    handleTileClick(r, c) {
        if (this.isBoardLocked) return;
        
        // Prevent click on empty tiles
        if (this.grid[r][c] === 0) return;
        
        const tileEl = this.gridElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!tileEl) return;
        
        if (!this.selectedTile) {
            // First tile selection
            this.selectedTile = { r, c };
            tileEl.classList.add('selected');
        } else {
            const prevR = this.selectedTile.r;
            const prevC = this.selectedTile.c;
            const prevTileEl = this.gridElement.querySelector(`[data-row="${prevR}"][data-col="${prevC}"]`);
            
            if (prevR === r && prevC === c) {
                // Clicked same tile -> deselect
                tileEl.classList.remove('selected');
                this.selectedTile = null;
            } else {
                const valA = this.grid[prevR][prevC];
                const valB = this.grid[r][c];
                
                if (valA === valB) {
                    // Try to find a link
                    const path = this.findLink(prevR, prevC, r, c);
                    if (path) {
                        // Match!
                        if (prevTileEl) prevTileEl.classList.remove('selected');
                        this.executeMatch(prevR, prevC, r, c, path);
                    } else {
                        // Same emoji but no path -> change selection to the new tile
                        if (prevTileEl) prevTileEl.classList.remove('selected');
                        this.selectedTile = { r, c };
                        tileEl.classList.add('selected');
                    }
                } else {
                    // Mismatch -> change selection to the new tile
                    if (prevTileEl) prevTileEl.classList.remove('selected');
                    this.selectedTile = { r, c };
                    tileEl.classList.add('selected');
                }
            }
        }
    },

    executeMatch(r1, c1, r2, c2, path) {
        this.isBoardLocked = true;
        
        // Draw the laser connection line in the SVG overlay
        this.drawPathLine(path);
        
        // Add matching animation classes to the tiles
        const tile1 = this.gridElement.querySelector(`[data-row="${r1}"][data-col="${c1}"]`);
        const tile2 = this.gridElement.querySelector(`[data-row="${r2}"][data-col="${c2}"]`);
        if (tile1) tile1.classList.add('matched');
        if (tile2) tile2.classList.add('matched');
        
        // Remove cells from the grid model
        this.grid[r1][c1] = 0;
        this.grid[r2][c2] = 0;
        
        // Add score (+10)
        this.score += 10;
        this.updateStatsDisplay();
        
        // Delay to allow path visual & tile fading animations to display
        setTimeout(() => {
            const svg = document.getElementById('onet-svg-overlay');
            if (svg) svg.innerHTML = '';
            
            this.selectedTile = null;
            this.isBoardLocked = false;
            
            // Re-render board representation
            this.renderBoard();
            
            // Check win condition or auto-shuffle trigger
            if (this.isBoardEmpty()) {
                this.levelCleared();
            } else if (!this.hasValidMoves()) {
                this.autoShuffle();
            }
        }, 400);
    },

    drawPathLine(path) {
        if (!path || path.length < 2) return;
        
        const svg = document.getElementById('onet-svg-overlay');
        if (!svg) return;
        
        svg.innerHTML = '';
        
        let d = '';
        for (let i = 0; i < path.length; i++) {
            const pt = this.getTileCenter(path[i].r, path[i].c);
            if (i === 0) {
                d += `M ${pt.x} ${pt.y}`;
            } else {
                d += ` L ${pt.x} ${pt.y}`;
            }
        }
        
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', d);
        pathEl.setAttribute('class', 'onet-connection-path');
        
        svg.appendChild(pathEl);
    },

    getTileCenter(r, c) {
        const tileEl = this.gridElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (!tileEl) return { x: 0, y: 0 };
        
        const tileRect = tileEl.getBoundingClientRect();
        const boardRect = this.boardContainer.getBoundingClientRect();
        
        // Calculate center relative to the board container
        const x = tileRect.left - boardRect.left + tileRect.width / 2;
        const y = tileRect.top - boardRect.top + tileRect.height / 2;
        
        return { x, y };
    },

    // Pathfinder Algorithm (findLink)
    findLink(r1, c1, r2, c2) {
        // A pair cannot link to itself
        if (r1 === r2 && c1 === c2) return null;
        
        const validPaths = [];
        
        // Helper to deduplicate consecutive identical points
        const deduplicate = (path) => {
            const result = [];
            for (const pt of path) {
                if (result.length === 0) {
                    result.push(pt);
                } else {
                    const last = result[result.length - 1];
                    if (last.r !== pt.r || last.c !== pt.c) {
                        result.push(pt);
                    }
                }
            }
            return result;
        };
        
        // Scan horizontally (intermediate rows from 0 to H+1)
        for (let r = 0; r <= this.rows + 1; r++) {
            const isCEmpty = (r === r1) || (this.grid[r][c1] === 0);
            const isDEmpty = (r === r2) || (this.grid[r][c2] === 0);
            
            if (isCEmpty && isDEmpty) {
                if (this.isPathClear(r1, c1, r, c1) &&
                    this.isPathClear(r, c1, r, c2) &&
                    this.isPathClear(r, c2, r2, c2)) {
                    
                    const rawPath = [
                        { r: r1, c: c1 },
                        { r: r,  c: c1 },
                        { r: r,  c: c2 },
                        { r: r2, c: c2 }
                    ];
                    validPaths.push(deduplicate(rawPath));
                }
            }
        }
        
        // Scan vertically (intermediate cols from 0 to W+1)
        for (let c = 0; c <= this.cols + 1; c++) {
            const isCEmpty = (c === c1) || (this.grid[r1][c] === 0);
            const isDEmpty = (c === c2) || (this.grid[r2][c] === 0);
            
            if (isCEmpty && isDEmpty) {
                if (this.isPathClear(r1, c1, r1, c) &&
                    this.isPathClear(r1, c, r2, c) &&
                    this.isPathClear(r2, c, r2, c2)) {
                    
                    const rawPath = [
                        { r: r1, c: c1 },
                        { r: r1, c: c },
                        { r: r2, c: c },
                        { r: r2, c: c2 }
                    ];
                    validPaths.push(deduplicate(rawPath));
                }
            }
        }
        
        if (validPaths.length === 0) return null;
        
        // Sort paths by number of turns (fewer turns is cleaner) and then by segment distance
        validPaths.sort((pathA, pathB) => {
            const turnsA = pathA.length - 2;
            const turnsB = pathB.length - 2;
            if (turnsA !== turnsB) return turnsA - turnsB;
            
            const getDistance = (path) => {
                let dist = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    dist += Math.abs(path[i].r - path[i+1].r) + Math.abs(path[i].c - path[i+1].c);
                }
                return dist;
            };
            return getDistance(pathA) - getDistance(pathB);
        });
        
        return validPaths[0];
    },

    isPathClear(r1, c1, r2, c2) {
        if (r1 === r2) {
            // Horizontal straight check
            const minC = Math.min(c1, c2);
            const maxC = Math.max(c1, c2);
            for (let c = minC + 1; c < maxC; c++) {
                if (this.grid[r1][c] !== 0) return false;
            }
            return true;
        } else if (c1 === c2) {
            // Vertical straight check
            const minR = Math.min(r1, r2);
            const maxR = Math.max(r1, r2);
            for (let r = minR + 1; r < maxR; r++) {
                if (this.grid[r][c1] !== 0) return false;
            }
            return true;
        }
        return false;
    },

    hasValidMoves() {
        for (let r1 = 1; r1 <= this.rows; r1++) {
            for (let c1 = 1; c1 <= this.cols; c1++) {
                const val1 = this.grid[r1][c1];
                if (val1 === 0) continue;
                
                for (let r2 = r1; r2 <= this.rows; r2++) {
                    const startC = (r2 === r1) ? c1 + 1 : 1;
                    for (let c2 = startC; c2 <= this.cols; c2++) {
                        const val2 = this.grid[r2][c2];
                        if (val2 === val1) {
                            const path = this.findLink(r1, c1, r2, c2);
                            if (path) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    },

    isBoardEmpty() {
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c] !== 0) return false;
            }
        }
        return true;
    },

    useHint() {
        if (this.isBoardLocked || this.hints <= 0) return;
        
        let foundPair = null;
        for (let r1 = 1; r1 <= this.rows; r1++) {
            for (let c1 = 1; c1 <= this.cols; c1++) {
                const val1 = this.grid[r1][c1];
                if (val1 === 0) continue;
                
                for (let r2 = r1; r2 <= this.rows; r2++) {
                    const startC = (r2 === r1) ? c1 + 1 : 1;
                    for (let c2 = startC; c2 <= this.cols; c2++) {
                        const val2 = this.grid[r2][c2];
                        if (val2 === val1) {
                            const path = this.findLink(r1, c1, r2, c2);
                            if (path) {
                                foundPair = { r1, c1, r2, c2 };
                                break;
                            }
                        }
                    }
                    if (foundPair) break;
                }
                if (foundPair) break;
            }
        }
        
        if (foundPair) {
            const { r1, c1, r2, c2 } = foundPair;
            const tile1 = this.gridElement.querySelector(`[data-row="${r1}"][data-col="${c1}"]`);
            const tile2 = this.gridElement.querySelector(`[data-row="${r2}"][data-col="${c2}"]`);
            
            if (tile1 && tile2) {
                tile1.classList.add('hint-highlight');
                tile2.classList.add('hint-highlight');
                
                setTimeout(() => {
                    tile1.classList.remove('hint-highlight');
                    tile2.classList.remove('hint-highlight');
                }, 2000);
            }
            
            this.hints--;
            this.updateStatsDisplay();
        } else {
            // No moves found -> shuffle
            this.autoShuffle();
        }
    },

    manualShuffle() {
        if (this.isBoardLocked || this.shuffles <= 0) return;
        
        const coords = [];
        const values = [];
        
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c] !== 0) {
                    coords.push({ r, c });
                    values.push(this.grid[r][c]);
                }
            }
        }
        
        if (coords.length === 0) return;
        
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            this.shuffleArray(values);
            for (let i = 0; i < coords.length; i++) {
                const { r, c } = coords[i];
                this.grid[r][c] = values[i];
            }
            attempts++;
        } while (!this.hasValidMoves() && attempts < maxAttempts && values.length > 1);
        
        this.shuffles--;
        this.selectedTile = null;
        this.updateStatsDisplay();
        this.renderBoard();
    },

    autoShuffle() {
        const coords = [];
        const values = [];
        
        for (let r = 1; r <= this.rows; r++) {
            for (let c = 1; c <= this.cols; c++) {
                if (this.grid[r][c] !== 0) {
                    coords.push({ r, c });
                    values.push(this.grid[r][c]);
                }
            }
        }
        
        if (coords.length <= 1) return;
        
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            this.shuffleArray(values);
            for (let i = 0; i < coords.length; i++) {
                const { r, c } = coords[i];
                this.grid[r][c] = values[i];
            }
            attempts++;
        } while (!this.hasValidMoves() && attempts < maxAttempts);
        
        this.selectedTile = null;
        this.renderBoard();
    },

    startTimer() {
        this.stopTimer();
        
        const config = this.getLevelConfig(this.level);
        const totalTime = config.time;
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            
            if (this.timerBar) {
                const percentage = Math.max(0, (this.timeLeft / totalTime) * 100);
                this.timerBar.style.width = `${percentage}%`;
                
                if (this.timeLeft <= 30) {
                    this.timerBar.classList.add('warning');
                } else {
                    this.timerBar.classList.remove('warning');
                }
            }
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.handleLoseCondition();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    handleLoseCondition() {
        this.stopTimer();
        this.isBoardLocked = true;
        
        if (this.gameoverScoreDisplay) this.gameoverScoreDisplay.textContent = this.score;
        if (this.loseModal) this.loseModal.classList.add('active');
    },

    levelCleared() {
        this.stopTimer();
        this.isBoardLocked = true;
        
        // Save stats
        const wins = parseInt(localStorage.getItem('onet_wins') || '0', 10);
        localStorage.setItem('onet_wins', wins + 1);
        
        if (this.finalScoreDisplay) this.finalScoreDisplay.textContent = this.score;
        
        // Support dynamic win levels and win again buttons if they ever exist
        const winLevelText = document.getElementById('onet-win-level');
        if (winLevelText) winLevelText.textContent = this.level;
        
        const winAgainBtn = document.getElementById('onet-win-again-btn');
        if (winAgainBtn && !winAgainBtn.dataset.bound) {
            winAgainBtn.addEventListener('click', () => this.restartGame());
            winAgainBtn.dataset.bound = true;
        }
        
        if (this.winModal) this.winModal.classList.add('active');
        if (window.ProfileManager) window.ProfileManager.updateUI();
    },

    nextLevel() {
        this.level++;
        localStorage.setItem('onet_level', this.level);
        
        // Reset specs for the new level
        this.hints = 3;
        this.shuffles = 3;
        this.setupLevel();
    },

    retryLevel() {
        this.score = 0;
        this.hints = 3;
        this.shuffles = 3;
        this.setupLevel();
    },

    restartGame() {
        this.score = 0;
        this.hints = 3;
        this.shuffles = 3;
        this.setupLevel();
    },

    reset() {
        this.stopTimer();
        if (this.winModal) this.winModal.classList.remove('active');
        if (this.loseModal) this.loseModal.classList.remove('active');
    },

    updateStatsDisplay() {
        if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
        if (this.hintsDisplay) this.hintsDisplay.textContent = this.hints;
        if (this.shufflesDisplay) this.shufflesDisplay.textContent = this.shuffles;
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

// Export to window object
window.OnetConnect = OnetConnect;
