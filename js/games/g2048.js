/**
 * 2048 Game Engine
 */

const Game2048 = {
    board: [],
    score: 0,
    highScore: 0,
    history: [], // moves history for undo (max 3)
    mergedTilesList: [], // removed tiles waiting for slide-out animation
    gameOverState: false,
    victoryReached: false,
    initialized: false,
    touchStartX: 0,
    touchStartY: 0,

    init() {
        // Load high score from GameHub
        if (window.GameHub && window.GameHub.profile) {
            this.highScore = window.GameHub.profile.data.stats.g2048HighScore || 0;
        }

        if (this.initialized) {
            this.reset();
            return;
        }

        // Event bindings
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Touch gestures for mobile
        const boardEl = document.getElementById('g2048-board');
        if (boardEl) {
            boardEl.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }, { passive: true });

            boardEl.addEventListener('touchend', (e) => {
                const diffX = e.changedTouches[0].clientX - this.touchStartX;
                const diffY = e.changedTouches[0].clientY - this.touchStartY;
                this.handleSwipe(diffX, diffY);
            }, { passive: true });
        }

        // Restart & Undo button
        const restartBtn = document.getElementById('g2048-restart-btn');
        if (restartBtn) restartBtn.addEventListener('click', () => this.reset());

        const undoBtn = document.getElementById('g2048-undo-btn');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());

        // Window resize repositioning
        window.addEventListener('resize', () => {
            const view = document.getElementById('g2048-view');
            if (view && view.classList.contains('active')) {
                this.repositionTiles();
            }
        });

        this.initialized = true;
        this.reset();
    },

    getPosition(row, col) {
        const isMobile = window.innerWidth <= 600;
        const tileSize = isMobile ? 60 : 70;
        const gap = isMobile ? 8 : 12;
        const x = col * (tileSize + gap);
        const y = row * (tileSize + gap);
        return { x, y };
    },

    repositionTiles() {
        const container = document.getElementById('g2048-tile-container');
        if (!container) return;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const tile = this.board[r][c];
                if (tile) {
                    const tileEl = container.querySelector(`[data-id="${tile.id}"]`);
                    if (tileEl) {
                        const pos = this.getPosition(r, c);
                        tileEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
                    }
                }
            }
        }
    },

    reset() {
        this.board = Array(4).fill(null).map(() => Array(4).fill(null));
        this.score = 0;
        this.history = [];
        this.mergedTilesList = [];
        this.gameOverState = false;
        this.victoryReached = false;

        const container = document.getElementById('g2048-tile-container');
        if (container) container.innerHTML = '';

        this.updateUndoButton();
        this.spawnTile();
        this.spawnTile();
        this.render();
    },

    spawnTile() {
        const empties = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === null) {
                    empties.push({ r, c });
                }
            }
        }

        if (empties.length > 0) {
            const { r, c } = empties[Math.floor(Math.random() * empties.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            this.board[r][c] = {
                value,
                id: 'tile_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                row: r,
                col: c,
                merged: false
            };
        }
    },

    saveHistory() {
        // Deep copy board tiles
        const boardCopy = this.board.map(row => 
            row.map(tile => tile ? { ...tile } : null)
        );

        this.history.push({
            board: boardCopy,
            score: this.score
        });

        if (this.history.length > 3) {
            this.history.shift(); // keep max 3
        }

        this.updateUndoButton();
    },

    undo() {
        if (this.history.length === 0) return;

        const prevState = this.history.pop();
        this.board = prevState.board;
        this.score = prevState.score;
        this.gameOverState = false;

        this.updateUndoButton();
        
        // Wipe and recreate container DOM
        const container = document.getElementById('g2048-tile-container');
        if (container) container.innerHTML = '';
        
        this.render();

        if (window.GameHub) {
            window.GameHub.showNotification("Undo applied!", "↩");
        }
    },

    updateUndoButton() {
        const undoBtn = document.getElementById('g2048-undo-btn');
        if (undoBtn) {
            if (this.history.length === 0) {
                undoBtn.setAttribute('disabled', 'true');
                undoBtn.style.opacity = '0.5';
            } else {
                undoBtn.removeAttribute('disabled');
                undoBtn.style.opacity = '1';
            }
        }
    },

    handleKeyDown(e) {
        // Only run if active view is 2048
        const view = document.getElementById('g2048-view');
        if (!view || !view.classList.contains('active') || this.gameOverState) return;

        let direction = null;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                direction = 'right';
                break;
            default:
                return;
        }

        e.preventDefault();
        this.slide(direction);
    },

    handleSwipe(diffX, diffY) {
        const view = document.getElementById('g2048-view');
        if (!view || !view.classList.contains('active') || this.gameOverState) return;

        const threshold = 30; // min distance
        if (Math.hypot(diffX, diffY) < threshold) return;

        let direction = null;
        if (Math.abs(diffX) > Math.abs(diffY)) {
            direction = diffX > 0 ? 'right' : 'left';
        } else {
            direction = diffY > 0 ? 'down' : 'up';
        }

        if (direction) {
            this.slide(direction);
        }
    },

    slide(direction) {
        // Save state *prior* to movement as tentative history
        this.saveHistory();

        // Perform board slide
        this.slideBoard(direction);

        // Check if anything moved
        const lastHistory = this.history[this.history.length - 1];
        const prevBoardStr = JSON.stringify(lastHistory.board.map(row => row.map(t => t ? t.value : 0)));
        const currentBoardStr = JSON.stringify(this.board.map(row => row.map(t => t ? t.value : 0)));

        if (prevBoardStr === currentBoardStr) {
            // No moves occurred, discard history state
            this.history.pop();
            this.updateUndoButton();
            return;
        }

        // A valid slide took place!
        this.spawnTile();
        this.render();
        this.checkGameOver();
    },

    slideBoard(direction) {
        // Reset merged states on all active tiles
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c]) {
                    this.board[r][c].merged = false;
                }
            }
        }

        const vector = this.getVector(direction);
        const traversals = this.getTraversals(vector);

        traversals.rows.forEach(r => {
            traversals.cols.forEach(c => {
                const tile = this.board[r][c];
                if (tile) {
                    const { furthest, next } = this.findFarthestPosition(r, c, vector);
                    
                    let merged = false;
                    if (this.withinBounds(next)) {
                        const nextTile = this.board[next.r][next.c];
                        if (nextTile && nextTile.value === tile.value && !nextTile.merged) {
                            // Merge!
                            nextTile.value *= 2;
                            nextTile.merged = true;
                            
                            this.score += nextTile.value;

                            // Update High Score breakthroughs immediately
                            if (this.score > this.highScore) {
                                this.highScore = this.score;
                                if (window.GameHub && window.GameHub.profile) {
                                    window.GameHub.profile.data.stats.g2048HighScore = this.score;
                                    window.GameHub.profile.save();
                                }
                            }

                            // Slide current tile into destination
                            this.board[r][c] = null;
                            tile.row = next.r;
                            tile.col = next.c;
                            
                            // Push to animate removal
                            this.mergedTilesList.push(tile);
                            merged = true;

                            // Check 2048 win condition
                            if (nextTile.value === 2048 && !this.victoryReached) {
                                this.victoryReached = true;
                                this.triggerWinModal();
                            }
                        }
                    }

                    if (!merged) {
                        if (furthest.r !== r || furthest.c !== c) {
                            this.board[r][c] = null;
                            this.board[furthest.r][furthest.c] = tile;
                            tile.row = furthest.r;
                            tile.col = furthest.c;
                        }
                    }
                }
            });
        });
    },

    getVector(direction) {
        const vectors = {
            up: { r: -1, c: 0 },
            down: { r: 1, c: 0 },
            left: { r: 0, c: -1 },
            right: { r: 0, c: 1 }
        };
        return vectors[direction];
    },

    getTraversals(vector) {
        const traversals = {
            rows: [0, 1, 2, 3],
            cols: [0, 1, 2, 3]
        };

        if (vector.r === 1) traversals.rows.reverse(); // down
        if (vector.c === 1) traversals.cols.reverse(); // right

        return traversals;
    },

    findFarthestPosition(r, c, vector) {
        let prev;
        let curr = { r, c };
        do {
            prev = curr;
            curr = { r: prev.r + vector.r, c: prev.c + vector.c };
        } while (this.withinBounds(curr) && this.board[curr.r][curr.c] === null);

        return {
            furthest: prev,
            next: curr
        };
    },

    withinBounds(cell) {
        return cell.r >= 0 && cell.r < 4 && cell.c >= 0 && cell.c < 4;
    },

    render() {
        const container = document.getElementById('g2048-tile-container');
        if (!container) return;

        // Keep track of all active tile IDs
        const activeIds = new Set();
        
        // Render / Update active tiles
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const tile = this.board[r][c];
                if (tile) {
                    activeIds.add(tile.id);
                    let tileEl = container.querySelector(`[data-id="${tile.id}"]`);
                    
                    if (!tileEl) {
                        // Create new tile
                        tileEl = document.createElement('div');
                        tileEl.className = `g2048-tile tile-${tile.value}`;
                        tileEl.dataset.id = tile.id;
                        tileEl.textContent = tile.value;
                        container.appendChild(tileEl);
                    } else {
                        // Update existing tile value and styling
                        tileEl.className = `g2048-tile tile-${tile.value}`;
                        tileEl.textContent = tile.value;
                        if (tile.merged) {
                            tileEl.classList.add('tile-merged');
                        }
                    }
                    
                    // Update position
                    const pos = this.getPosition(r, c);
                    tileEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
                }
            }
        }

        // Handle sliding animation for merged-away tiles
        this.mergedTilesList.forEach(tile => {
            let tileEl = container.querySelector(`[data-id="${tile.id}"]`);
            if (tileEl) {
                // Move it to target position
                const pos = this.getPosition(tile.row, tile.col);
                tileEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
                
                // Fade out and remove after slide completes
                setTimeout(() => {
                    tileEl.remove();
                }, 120);
            }
        });
        this.mergedTilesList = []; // Reset after processing

        // Remove orphan tiles
        const allTileEls = container.querySelectorAll('.g2048-tile');
        allTileEls.forEach(el => {
            const id = el.dataset.id;
            if (!activeIds.has(id)) {
                // If it is not one of our merged tiles being animated away, delete it
                el.remove();
            }
        });

        // Update stats
        const scoreDisplay = document.getElementById('g2048-score');
        if (scoreDisplay) scoreDisplay.textContent = this.score;
        
        const bestDisplay = document.getElementById('g2048-best-score');
        if (bestDisplay) bestDisplay.textContent = this.highScore;
        
        const boardBestDisplay = document.getElementById('g2048-best-score');
        if (boardBestDisplay) boardBestDisplay.textContent = this.highScore;
    },

    triggerWinModal() {
        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('g2048', true, { score: this.score });
        }

        setTimeout(() => {
            if (window.GameHub && typeof window.GameHub.showModal === 'function') {
                window.GameHub.showModal({
                    title: 'Victory! 🏆',
                    body: `Incredible! You merged tiles to reach <strong>2048</strong>! Current score: <strong>${this.score}</strong>. Do you want to keep sliding for a higher score?`,
                    confirmText: 'Keep Playing',
                    cancelText: 'Lobby',
                    onConfirm: () => {
                        if (window.GameHub) window.GameHub.showNotification("Sliding onwards!", "🚀");
                    },
                    onCancel: () => window.GameHub.showView('lobby-view')
                });
            }
        }, 500);
    },

    checkGameOver() {
        // Check for empty cells
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c] === null) return;
            }
        }

        // Check for available merges
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const tile = this.board[r][c];
                if (tile) {
                    const directions = [
                        { r: -1, c: 0 },
                        { r: 1, c: 0 },
                        { r: 0, c: -1 },
                        { r: 0, c: 1 }
                    ];
                    for (const dir of directions) {
                        const next = { r: r + dir.r, c: c + dir.c };
                        if (this.withinBounds(next)) {
                            const nextTile = this.board[next.r][next.c];
                            if (nextTile && nextTile.value === tile.value) {
                                return; // merge available, not game over
                            }
                        }
                    }
                }
            }
        }

        // Board locked, game over!
        this.gameOverState = true;
        
        if (window.GameHub && window.GameHub.profile) {
            window.GameHub.profile.recordGame('g2048', false, { score: this.score });
        }

        setTimeout(() => {
            if (window.GameHub && typeof window.GameHub.showModal === 'function') {
                window.GameHub.showModal({
                    title: 'Game Over! 👾',
                    body: `No valid moves remaining on the board! Final Score: <strong>${this.score}</strong>.`,
                    confirmText: 'Try Again',
                    cancelText: 'Lobby',
                    onConfirm: () => this.reset(),
                    onCancel: () => window.GameHub.showView('lobby-view')
                });
            }
        }, 500);
    }
};

window.Game2048 = Game2048;
