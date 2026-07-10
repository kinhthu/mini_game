// Cờ Cá Ngựa (Ludo) Game Controller
const CanGuaGame = {
    // 52 track cells coordinates around the board (clockwise)
    TRACK_PATH: [
        [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
        [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
        [0, 7],
        [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
        [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
        [7, 14],
        [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
        [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
        [14, 7],
        [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
        [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
        [7, 0]
    ],

    // Player settings
    PLAYER_COLORS: ['red', 'green', 'yellow', 'blue'],
    PLAYER_NAMES: ['Đỏ', 'Xanh Lá', 'Vàng', 'Xanh Dương'],
    
    // Start indexes on TRACK_PATH for each player
    START_INDEXES: [1, 14, 27, 40], // Red starts at (6,1), Green at (1,8), Yellow at (8,13), Blue at (13,6)
    
    // End indexes on TRACK_PATH (right before home stretch entry)
    END_INDEXES: [0, 13, 26, 39], // Red ends at (6,0), Green at (0,8), Yellow at (8,14), Blue at (14,6)

    // Home stretch coordinates (Stairs 1 to 6)
    STRETCH_PATH: {
        0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]], // Red (left to right)
        1: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]], // Green (top to bottom)
        2: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]], // Yellow (right to left)
        3: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]  // Blue (bottom to top)
    },

    // Yard (Stable) cell coordinates for 4 horses of each player
    YARD_COORDS: {
        0: [[2, 2], [2, 3], [3, 2], [3, 3]],       // Red
        1: [[2, 11], [2, 12], [3, 11], [3, 12]],   // Green
        2: [[11, 11], [11, 12], [12, 11], [12, 12]], // Yellow
        3: [[11, 2], [11, 3], [12, 2], [12, 3]]     // Blue
    },

    // Game state
    numPlayers: 4,
    mode: 'pvp', // 'pvp' or 'pve'
    players: [], // Array of { id, color, name, type: 'human'/'ai' }
    activePlayerIdx: 0,
    horses: [], // Array of 16 horses: { id, player, num, state: 'stable'/'track'/'home', position, distance }
    diceValues: [1, 1],
    movesLeft: [], // Moves left from current roll: e.g. [d1, d2]
    consecutiveRolls: 0,
    isRolling: false,
    selectedHorseId: null,
    highlightedTargets: [], // Array of { cellType, pos, x, y, spendMoves }
    isGameOver: false,
    aiTimer: null,

    init() {
        this.resetState();
        this.bindEvents();
        this.loadSettings();
        this.setupPlayers();
        this.initHorses();
        this.drawBoard();
        this.updateUI();
        
        // Save initial stats if not existing
        if (!localStorage.getItem('cangua_wins')) localStorage.setItem('cangua_wins', '0');
        if (!localStorage.getItem('cangua_played')) localStorage.setItem('cangua_played', '0');

        // Check if first player is AI and start turn
        this.checkAiTurn();
    },

    reset() {
        this.resetState();
        this.setupPlayers();
        this.initHorses();
        this.drawBoard();
        this.updateUI();
        this.checkAiTurn();
    },

    resetState() {
        if (this.aiTimer) {
            clearTimeout(this.aiTimer);
            this.aiTimer = null;
        }
        this.activePlayerIdx = 0;
        this.diceValues = [1, 1];
        this.movesLeft = [];
        this.consecutiveRolls = 0;
        this.isRolling = false;
        this.selectedHorseId = null;
        this.highlightedTargets = [];
        this.isGameOver = false;
    },

    loadSettings() {
        // Mode setting
        const modeBtnPve = document.getElementById('cangua-mode-pve-btn');
        if (modeBtnPve && modeBtnPve.classList.contains('active')) {
            this.mode = 'pve';
        } else {
            this.mode = 'pvp';
        }

        const activePlayerCountBtn = document.querySelector('#cangua-players-group .segment-btn.active');
        if (activePlayerCountBtn && activePlayerCountBtn.textContent) {
            const parsed = parseInt(activePlayerCountBtn.textContent.trim(), 10);
            this.numPlayers = isNaN(parsed) ? 4 : parsed;
        } else {
            this.numPlayers = 4;
        }
    },

    setupPlayers() {
        this.players = [];
        for (let i = 0; i < this.numPlayers; i++) {
            let type = 'human';
            if (this.mode === 'pve' && i > 0) {
                type = 'ai';
            }
            this.players.push({
                id: i,
                color: this.PLAYER_COLORS[i],
                name: type === 'ai' ? `${this.PLAYER_NAMES[i]} (Máy)` : (this.numPlayers === 4 ? this.PLAYER_NAMES[i] : `Người chơi ${i + 1}`),
                type: type
            });
        }
    },

    initHorses() {
        this.horses = [];
        for (let p = 0; p < 4; p++) {
            for (let h = 0; h < 4; h++) {
                this.horses.push({
                    id: p * 4 + h,
                    player: p,
                    num: h + 1,
                    state: 'stable',
                    position: h, // Yard position index (0-3)
                    distance: -1 // Distance traveled on track (-1 in yard)
                });
            }
        }
    },

    bindEvents() {
        // Mode buttons
        const modePvPBtn = document.getElementById('cangua-mode-pvp-btn');
        const modePvEBtn = document.getElementById('cangua-mode-pve-btn');
        
        if (modePvPBtn && modePvEBtn) {
            modePvPBtn.onclick = () => {
                modePvPBtn.classList.add('active');
                modePvEBtn.classList.remove('active');
                this.mode = 'pvp';
                this.reset();
            };
            modePvEBtn.onclick = () => {
                modePvEBtn.classList.add('active');
                modePvPBtn.classList.remove('active');
                this.mode = 'pve';
                this.reset();
            };
        }

        // Players count buttons
        for (let num = 2; num <= 4; num++) {
            const btn = document.getElementById(`cangua-players-${num}-btn`);
            if (btn) {
                btn.onclick = () => {
                    document.querySelectorAll('#cangua-players-group .segment-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.numPlayers = num;
                    this.reset();
                };
            }
        }

        // Roll dice button
        const rollBtn = document.getElementById('cangua-roll-btn');
        if (rollBtn) {
            rollBtn.onclick = () => {
                if (this.isRolling || this.isGameOver || this.players[this.activePlayerIdx].type === 'ai') return;
                // Only allow rolling if movesLeft is empty
                if (this.movesLeft.length > 0) return;
                this.rollDice();
            };
        }

        // Restart button
        const restartBtn = document.getElementById('cangua-restart-btn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                if (confirm('Bạn muốn bắt đầu lại ván đấu?')) {
                    this.reset();
                }
            };
        }

        // Clear score button
        const clearBtn = document.getElementById('cangua-clear-btn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                if (confirm('Xóa sạch điểm số lưu trữ?')) {
                    localStorage.setItem('cangua_wins', '0');
                    localStorage.setItem('cangua_played', '0');
                    document.getElementById('cangua-score-red').textContent = '0';
                    document.getElementById('cangua-score-green').textContent = '0';
                    document.getElementById('cangua-score-yellow').textContent = '0';
                    document.getElementById('cangua-score-blue').textContent = '0';
                    if (window.ProfileManager) {
                        window.ProfileManager.updateUI();
                    }
                }
            };
        }
    },

    drawBoard() {
        const board = document.getElementById('cangua-board');
        if (!board) return;
        board.innerHTML = '';

        // Generate 15x15 cell structure
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.className = 'cangua-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                // 1. Check if track cell
                const trackIdx = this.findTrackIndex(r, c);
                if (trackIdx !== -1) {
                    cell.classList.add('track-cell');
                    // Add start indicators
                    if (trackIdx === this.START_INDEXES[0]) cell.classList.add('start-red');
                    if (trackIdx === this.START_INDEXES[1]) cell.classList.add('start-green');
                    if (trackIdx === this.START_INDEXES[2]) cell.classList.add('start-yellow');
                    if (trackIdx === this.START_INDEXES[3]) cell.classList.add('start-blue');
                } 
                // 2. Check if home stretch
                else {
                    const stretchInfo = this.findStretchInfo(r, c);
                    if (stretchInfo) {
                        cell.classList.add('home-stretch-cell');
                        cell.textContent = stretchInfo.step;
                        if (stretchInfo.player === 0) cell.classList.add('red-stretch');
                        if (stretchInfo.player === 1) cell.classList.add('green-stretch');
                        if (stretchInfo.player === 2) cell.classList.add('yellow-stretch');
                        if (stretchInfo.player === 3) cell.classList.add('blue-stretch');
                    }
                    // 3. Check if yard cell
                    else {
                        const yardInfo = this.findYardInfo(r, c);
                        if (yardInfo) {
                            cell.classList.add('yard-cell');
                            if (yardInfo.player === 0) cell.classList.add('red-yard');
                            if (yardInfo.player === 1) cell.classList.add('green-yard');
                            if (yardInfo.player === 2) cell.classList.add('yellow-yard');
                            if (yardInfo.player === 3) cell.classList.add('blue-yard');
                        } else {
                            // Empty background cell
                            cell.classList.add('empty-cell');
                        }
                    }
                }

                // Add grid positions for styling
                cell.style.gridRowStart = r + 1;
                cell.style.gridColumnStart = c + 1;

                board.appendChild(cell);
            }
        }

        // Draw horses
        this.horses.forEach(horse => {
            if (horse.player >= this.numPlayers) return; // Ignore inactive players' horses
            const coords = this.getHorseCoords(horse);
            if (coords) {
                const cell = board.querySelector(`[data-row="${coords[0]}"][data-col="${coords[1]}"]`);
                if (cell) {
                    const horseEl = document.createElement('div');
                    horseEl.className = `horse ${this.PLAYER_COLORS[horse.player]}-horse`;
                    horseEl.dataset.id = horse.id;
                    horseEl.innerHTML = `🐴<sup>${horse.num}</sup>`;
                    
                    // Bind click for move selection
                    horseEl.onclick = (e) => {
                        e.stopPropagation();
                        this.handleHorseClick(horse.id);
                    };

                    cell.appendChild(horseEl);
                }
            }
        });
    },

    findTrackIndex(r, c) {
        return this.TRACK_PATH.findIndex(coord => coord[0] === r && coord[1] === c);
    },

    findStretchInfo(r, c) {
        for (let p = 0; p < 4; p++) {
            const steps = this.STRETCH_PATH[p];
            const idx = steps.findIndex(coord => coord[0] === r && coord[1] === c);
            if (idx !== -1) {
                return { player: p, step: idx + 1 };
            }
        }
        return null;
    },

    findYardInfo(r, c) {
        for (let p = 0; p < 4; p++) {
            const coords = this.YARD_COORDS[p];
            const idx = coords.findIndex(coord => coord[0] === r && coord[1] === c);
            if (idx !== -1) {
                return { player: p, position: idx };
            }
        }
        return null;
    },

    getHorseCoords(horse) {
        if (horse.state === 'stable') {
            return this.YARD_COORDS[horse.player][horse.position];
        } else if (horse.state === 'track') {
            return this.TRACK_PATH[horse.position];
        } else if (horse.state === 'home') {
            return this.STRETCH_PATH[horse.player][horse.position - 1];
        }
        return null;
    },

    rollDice() {
        this.isRolling = true;
        
        // Remove highlighting
        this.clearHighlights();

        const rollBtn = document.getElementById('cangua-roll-btn');
        if (rollBtn) rollBtn.disabled = true;

        const dice1El = document.getElementById('dice-1');
        const dice2El = document.getElementById('dice-2');

        if (dice1El) dice1El.classList.add('rolling');
        if (dice2El) dice2El.classList.add('rolling');

        setTimeout(() => {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;

            this.diceValues = [d1, d2];
            this.movesLeft = [d1, d2];

            if (dice1El) {
                dice1El.classList.remove('rolling');
                this.setDiceTransform(dice1El, d1);
            }
            if (dice2El) {
                dice2El.classList.remove('rolling');
                this.setDiceTransform(dice2El, d2);
            }

            this.isRolling = false;
            
            // Check double roll or 1-6 combinations (Deployment conditions)
            const isDouble = d1 === d2;
            const isOneSix = (d1 === 1 && d2 === 6) || (d1 === 6 && d2 === 1);
            
            if (isDouble || isOneSix) {
                this.consecutiveRolls++;
                // Vietnamese Ludo grants additional turns on deployable throws, capped at 3 rolls.
                if (this.consecutiveRolls >= 3) {
                    this.consecutiveRolls = 0; // reset
                    this.movesLeft = []; // Lose turn
                }
            } else {
                this.consecutiveRolls = 0; // Reset consecutive counter
            }

            this.updateUI();
            
            // Calculate moves and either continue, auto-pass, or prompt AI
            const hasMoves = this.calculateValidPlayerMoves();
            if (!hasMoves) {
                // If no moves, switch turn automatically after 1 second
                setTimeout(() => {
                    this.switchTurn();
                }, 1200);
            } else {
                if (this.players[this.activePlayerIdx].type === 'ai') {
                    // AI continues its play sequence
                    setTimeout(() => {
                        this.aiSelectAndMove();
                    }, 1000);
                } else {
                    // Highlight horses that can make moves
                    this.highlightMovableHorses();
                }
            }
        }, 1000);
    },

    setDiceTransform(el, val) {
        // Apply rotations to align correct dot face of 3D cube
        const rotations = {
            1: 'rotateX(0deg) rotateY(0deg)',
            2: 'rotateX(-90deg) rotateY(0deg)',
            3: 'rotateX(0deg) rotateY(-90deg)',
            4: 'rotateX(0deg) rotateY(90deg)',
            5: 'rotateX(90deg) rotateY(0deg)',
            6: 'rotateX(180deg) rotateY(0deg)'
        };
        el.style.transform = rotations[val] || 'rotateX(0deg)';
        el.querySelector('.front').textContent = val; // Always show current number in the center face too
    },

    calculateValidPlayerMoves() {
        let hasAnyMove = false;
        this.horses.forEach(horse => {
            if (horse.player !== this.activePlayerIdx) return;
            const moves = this.getHorseValidMoves(horse.id);
            if (moves.length > 0) hasAnyMove = true;
        });
        return hasAnyMove;
    },

    highlightMovableHorses() {
        this.horses.forEach(horse => {
            if (horse.player !== this.activePlayerIdx) return;
            const horseEl = document.querySelector(`.horse[data-id="${horse.id}"]`);
            if (horseEl) {
                const moves = this.getHorseValidMoves(horse.id);
                if (moves.length > 0) {
                    horseEl.classList.add('can-move');
                }
            }
        });
    },

    getHorseValidMoves(horseId) {
        const horse = this.horses[horseId];
        if (horse.player !== this.activePlayerIdx || this.movesLeft.length === 0) return [];

        const validMoves = [];
        const p = horse.player;
        const d1 = this.movesLeft[0];
        const d2 = this.movesLeft.length > 1 ? this.movesLeft[1] : null;

        // 1. Stable (in Yard)
        if (horse.state === 'stable') {
            // Deploy conditions: requires Double (equal values) or a 1 and 6, and start cell is not blocked by own horse.
            const hasStartTrigger = (d1 === d2) || (d1 === 1 && d2 === 6) || (d1 === 6 && d2 === 1);
            if (hasStartTrigger) {
                const startPos = this.START_INDEXES[p];
                const blockHorse = this.findHorseAt('track', startPos);
                if (!blockHorse || blockHorse.player !== p) {
                    validMoves.push({
                        type: 'deploy',
                        targetPos: startPos,
                        spendMoves: [...this.movesLeft] // Deploys consumes the entire throw (both dice)
                    });
                }
            }
            return validMoves;
        }

        // Helper check for blockades of own horses
        const isBlockedBySelf = (state, pos) => {
            const hAt = this.findHorseAt(state, pos);
            return hAt && hAt.player === p;
        };

        // 2. Track Movement
        if (horse.state === 'track') {
            // Function to check track travel step by step
            const getTrackNextPos = (currPos, steps) => {
                const limit = this.END_INDEXES[p];
                let tempPos = currPos;
                let distance = horse.distance;

                for (let i = 1; i <= steps; i++) {
                    // Check if horse reached its home stretch entrance
                    if (tempPos === limit) {
                        // Beyond this step, it must enter home stretch, which is not allowed directly from sum steps
                        // unless it is an exact step to the home stretch entrance.
                        if (i === steps) {
                            return { state: 'track', pos: tempPos, dist: distance };
                        } else {
                            // Attempting to overshoot home stretch boundary
                            return null;
                        }
                    }
                    tempPos = (tempPos + 1) % 52;
                    distance++;
                }
                return { state: 'track', pos: tempPos, dist: distance };
            };

            // Single Dice moves
            this.movesLeft.forEach(dice => {
                const path = getTrackNextPos(horse.position, dice);
                if (path && !isBlockedBySelf('track', path.pos)) {
                    validMoves.push({
                        type: 'move',
                        targetState: 'track',
                        targetPos: path.pos,
                        targetDistance: path.dist,
                        spendMoves: [dice]
                    });
                }
            });

            // Sum Move (if 2 dice remaining)
            if (this.movesLeft.length === 2) {
                const sum = d1 + d2;
                const path = getTrackNextPos(horse.position, sum);
                if (path && !isBlockedBySelf('track', path.pos)) {
                    validMoves.push({
                        type: 'move',
                        targetState: 'track',
                        targetPos: path.pos,
                        targetDistance: path.dist,
                        spendMoves: [d1, d2]
                    });
                }
            }

            // Enter Home Stretch (if on the end track cell)
            if (horse.position === this.END_INDEXES[p]) {
                // If standing exactly on end cell, can enter stairs.
                // Requires dice value corresponding exactly to stairs step (1 to 6).
                this.movesLeft.forEach(dice => {
                    const blockHorse = this.findHorseAt('home', dice);
                    if (!blockHorse || blockHorse.player !== p) {
                        validMoves.push({
                            type: 'enter_home',
                            targetPos: dice, // Steps 1 to 6
                            spendMoves: [dice]
                        });
                    }
                });
            }
        }

        // 3. Home Stretch Movement
        if (horse.state === 'home') {
            const currStep = horse.position; // 1 to 6
            
            // Can climb 1 step with dice value 1
            if (this.movesLeft.includes(1) && currStep < 6) {
                const target = currStep + 1;
                if (!isBlockedBySelf('home', target)) {
                    validMoves.push({
                        type: 'climb_home',
                        targetPos: target,
                        spendMoves: [1]
                    });
                }
            }

            // Can jump directly to step Y if dice value Y (where Y > current step)
            this.movesLeft.forEach(dice => {
                if (dice > currStep && dice <= 6) {
                    if (!isBlockedBySelf('home', dice)) {
                        // Ensure path from currStep+1 to dice-1 is free of own horses
                        let pathBlocked = false;
                        for (let step = currStep + 1; step < dice; step++) {
                            if (isBlockedBySelf('home', step)) {
                                pathBlocked = true;
                                break;
                            }
                        }
                        if (!pathBlocked) {
                            validMoves.push({
                                type: 'jump_home',
                                targetPos: dice,
                                spendMoves: [dice]
                            });
                        }
                    }
                }
            });
        }

        return validMoves;
    },

    findHorseAt(state, pos) {
        return this.horses.find(h => h.player < this.numPlayers && h.state === state && h.position === pos);
    },

    handleHorseClick(horseId) {
        if (this.isRolling || this.isGameOver || this.players[this.activePlayerIdx].type === 'ai') return;
        
        // Clear highlights first
        this.clearHighlights();

        const horse = this.horses[horseId];
        if (horse.player !== this.activePlayerIdx) return;

        const validMoves = this.getHorseValidMoves(horseId);
        if (validMoves.length === 0) return;

        this.selectedHorseId = horseId;
        this.highlightedTargets = [];

        // Highlight horse clicked
        document.querySelector(`.horse[data-id="${horseId}"]`).classList.add('selected-horse');

        // Draw highlights on target cells
        validMoves.forEach(move => {
            let coords = null;
            if (move.type === 'deploy' || (move.type === 'move' && move.targetState === 'track')) {
                coords = this.TRACK_PATH[move.targetPos];
            } else if (move.type === 'enter_home' || move.type === 'climb_home' || move.type === 'jump_home') {
                coords = this.STRETCH_PATH[this.activePlayerIdx][move.targetPos - 1];
            }

            if (coords) {
                const cell = document.querySelector(`.cangua-cell[data-row="${coords[0]}"][data-col="${coords[1]}"]`);
                if (cell) {
                    cell.classList.add('highlight-target');
                    
                    // Store move description
                    this.highlightedTargets.push({
                        cell: cell,
                        move: move
                    });

                    // Add click event for selection target
                    cell.onclick = () => {
                        this.executeMove(horseId, move);
                    };
                }
            }
        });
    },

    clearHighlights() {
        this.selectedHorseId = null;
        document.querySelectorAll('.horse').forEach(h => h.classList.remove('selected-horse'));
        document.querySelectorAll('.cangua-cell').forEach(cell => {
            cell.classList.remove('highlight-target');
            cell.onclick = null;
        });
        this.highlightedTargets = [];
    },

    executeMove(horseId, move) {
        this.clearHighlights();
        
        const horse = this.horses[horseId];
        const p = this.activePlayerIdx;

        // Perform move animations/logic
        if (move.type === 'deploy') {
            horse.state = 'track';
            horse.position = this.START_INDEXES[p];
            horse.distance = 0;
        } else if (move.type === 'move') {
            // Check kick target (if opponent horse on target position)
            const targetHorse = this.findHorseAt('track', move.targetPos);
            if (targetHorse && targetHorse.player !== p) {
                this.kickHorse(targetHorse.id);
            }
            horse.state = 'track';
            horse.position = move.targetPos;
            horse.distance = move.targetDistance;
        } else if (move.type === 'enter_home' || move.type === 'climb_home' || move.type === 'jump_home') {
            const targetHorse = this.findHorseAt('home', move.targetPos);
            if (targetHorse && targetHorse.player !== p) {
                this.kickHorse(targetHorse.id);
            }
            horse.state = 'home';
            horse.position = move.targetPos;
            horse.distance = -1;
        }

        // Deduct spent dice
        move.spendMoves.forEach(dice => {
            const idx = this.movesLeft.indexOf(dice);
            if (idx !== -1) {
                this.movesLeft.splice(idx, 1);
            }
        });

        // Redraw board to show changes
        this.drawBoard();

        // Check victory
        const winner = this.checkWinCondition();
        if (winner !== -1) {
            this.handleVictory(winner);
            return;
        }

        // Continue or switch turn
        if (this.movesLeft.length > 0) {
            // Check if remaining moves are valid for any horse
            const hasMoves = this.calculateValidPlayerMoves();
            if (!hasMoves) {
                setTimeout(() => {
                    this.switchTurn();
                }, 1000);
            } else {
                if (this.players[p].type === 'ai') {
                    // AI continues moving
                    setTimeout(() => {
                        this.aiSelectAndMove();
                    }, 1000);
                } else {
                    this.highlightMovableHorses();
                }
            }
        } else {
            // Switch turn
            setTimeout(() => {
                this.switchTurn();
            }, 1000);
        }
    },

    kickHorse(kickId) {
        const victim = this.horses[kickId];
        victim.state = 'stable';
        victim.distance = -1;
        
        // Find empty slot in yard
        const playerHorses = this.horses.filter(h => h.player === victim.player && h.id !== kickId);
        const occupiedSlots = playerHorses.filter(h => h.state === 'stable').map(h => h.position);
        
        for (let i = 0; i < 4; i++) {
            if (!occupiedSlots.includes(i)) {
                victim.position = i;
                break;
            }
        }
    },

    switchTurn() {
        if (this.isGameOver) return;
        this.clearHighlights();

        const rollBtn = document.getElementById('cangua-roll-btn');

        // Check if player gets consecutive extra roll
        const isDouble = this.diceValues[0] === this.diceValues[1];
        const isOneSix = (this.diceValues[0] === 1 && this.diceValues[1] === 6) || (this.diceValues[0] === 6 && this.diceValues[1] === 1);
        const getExtraRoll = (isDouble || isOneSix) && this.consecutiveRolls > 0;

        if (getExtraRoll) {
            this.movesLeft = [];
            this.updateUI();
            this.checkAiTurn();
        } else {
            // Next player
            this.consecutiveRolls = 0;
            this.activePlayerIdx = (this.activePlayerIdx + 1) % this.numPlayers;
            this.movesLeft = [];
            this.updateUI();
            this.checkAiTurn();
        }
    },

    checkAiTurn() {
        if (this.isGameOver) return;
        
        const activePlayer = this.players[this.activePlayerIdx];
        if (activePlayer.type === 'ai') {
            // Disable roll button for humans
            const rollBtn = document.getElementById('cangua-roll-btn');
            if (rollBtn) rollBtn.disabled = true;

            // Trigger AI roll after 800ms
            this.aiTimer = setTimeout(() => {
                this.rollDice();
            }, 800);
        } else {
            // Human turn, enable roll button
            const rollBtn = document.getElementById('cangua-roll-btn');
            if (rollBtn) rollBtn.disabled = false;
        }
    },

    aiSelectAndMove() {
        if (this.isGameOver || this.movesLeft.length === 0) return;

        // Collect all possible valid moves for all AI horses
        const allAiMoves = [];
        this.horses.forEach(horse => {
            if (horse.player !== this.activePlayerIdx) return;
            const validMoves = this.getHorseValidMoves(horse.id);
            validMoves.forEach(move => {
                allAiMoves.push({
                    horseId: horse.id,
                    move: move
                });
            });
        });

        if (allAiMoves.length === 0) {
            // No moves, end turn
            this.switchTurn();
            return;
        }

        // Apply Heuristic priorities:
        // Priority 1: Kick opponent horse
        // Priority 2: Deploy horse from Stable
        // Priority 3: Climb home stretch to higher slots
        // Priority 4: Move closest horse to Home entry
        // Priority 5: Random move
        let selected = null;

        // 1. Check Kicks
        const kicks = allAiMoves.filter(item => {
            if (item.move.type === 'move') {
                const target = this.findHorseAt('track', item.move.targetPos);
                return target && target.player !== this.activePlayerIdx;
            }
            if (item.move.type === 'enter_home' || item.move.type === 'climb_home' || item.move.type === 'jump_home') {
                const target = this.findHorseAt('home', item.move.targetPos);
                return target && target.player !== this.activePlayerIdx;
            }
            return false;
        });
        if (kicks.length > 0) {
            selected = kicks[0]; // Take first kick
        }

        // 2. Check Deployments
        if (!selected) {
            const deploys = allAiMoves.filter(item => item.move.type === 'deploy');
            if (deplays.length > 0) {
                selected = deploys[0];
            }
        }

        // 3. Check Home Stretch climbs
        if (!selected) {
            const climbs = allAiMoves.filter(item => 
                item.move.type === 'climb_home' || item.move.type === 'jump_home' || item.move.type === 'enter_home'
            );
            if (climbs.length > 0) {
                // Sort by target position descending (prefer higher steps like 6, 5...)
                climbs.sort((a, b) => b.move.targetPos - a.move.targetPos);
                selected = climbs[0];
            }
        }

        // 4. Check track movements (prioritize furthest distance)
        if (!selected) {
            const moves = allAiMoves.filter(item => item.move.type === 'move');
            if (moves.length > 0) {
                // Prefer horses with higher distance traveled (closer to home)
                moves.sort((a, b) => {
                    const hA = this.horses[a.horseId];
                    const hB = this.horses[b.horseId];
                    return hB.distance - hA.distance;
                });
                selected = moves[0];
            }
        }

        // 5. Default fallback
        if (!selected) {
            selected = allAiMoves[Math.floor(Math.random() * allAiMoves.length)];
        }

        // Highlight AI selected horse briefly, then execute
        const horseEl = document.querySelector(`.horse[data-id="${selected.horseId}"]`);
        if (horseEl) {
            horseEl.classList.add('selected-horse');
        }

        setTimeout(() => {
            this.executeMove(selected.horseId, selected.move);
        }, 800);
    },

    checkWinCondition() {
        // A player wins if their 4 horses occupy positions 6, 5, 4, 3 on their home stretch
        for (let p = 0; p < this.numPlayers; p++) {
            const playerHorses = this.horses.filter(h => h.player === p);
            const homePositions = playerHorses.filter(h => h.state === 'home').map(h => h.position);
            
            // Check if positions 6, 5, 4, 3 are occupied
            const hasWin = [6, 5, 4, 3].every(pos => homePositions.includes(pos));
            if (hasWin) {
                return p;
            }
        }
        return -1;
    },

    handleVictory(winnerIdx) {
        this.isGameOver = true;
        
        // Show winner status
        const statusEl = document.getElementById('cangua-status');
        if (statusEl) {
            statusEl.textContent = `🎉 NGƯỜI CHƠI ${this.PLAYER_NAMES[winnerIdx].toUpperCase()} CHIẾN THẮNG! 🎉`;
        }

        // Save stat wins if winner is human (P1 / idx 0)
        if (winnerIdx === 0) {
            const wins = parseInt(localStorage.getItem('cangua_wins') || '0', 10) + 1;
            localStorage.setItem('cangua_wins', wins.toString());
        }

        const played = parseInt(localStorage.getItem('cangua_played') || '0', 10) + 1;
        localStorage.setItem('cangua_played', played.toString());

        // Update score indicators
        const colors = ['red', 'green', 'yellow', 'blue'];
        const scoreEl = document.getElementById(`cangua-score-${colors[winnerIdx]}`);
        if (scoreEl) {
            scoreEl.textContent = parseInt(scoreEl.textContent, 10) + 1;
        }

        // Update Global Rank dashboard
        if (window.ProfileManager) {
            window.ProfileManager.updateUI();
        }

        alert(`Trò chơi kết thúc! Đội ${this.PLAYER_NAMES[winnerIdx]} đã đưa tất cả ngựa về đích!`);
    },

    updateUI() {
        // 1. Update turns
        const activePlayer = this.players[this.activePlayerIdx];
        
        // Update stats active-turn highlighting
        document.querySelectorAll('.cangua-stats .stat-box').forEach((box, idx) => {
            if (idx === this.activePlayerIdx) {
                box.classList.add('active-turn');
            } else {
                box.classList.remove('active-turn');
            }
        });

        // Update status text
        const statusEl = document.getElementById('cangua-status');
        if (statusEl && !this.isGameOver) {
            let statusText = `Lượt của ${activePlayer.name}: `;
            if (this.movesLeft.length > 0) {
                statusText += `Di chuyển ngựa [ ${this.movesLeft.join(', ')} ]`;
            } else {
                statusText += `Chờ tung xúc xắc`;
            }
            statusEl.textContent = statusText;
        }

        // Update Roll Button status
        const rollBtn = document.getElementById('cangua-roll-btn');
        if (rollBtn) {
            rollBtn.disabled = this.isRolling || this.isGameOver || (this.movesLeft.length > 0) || (activePlayer.type === 'ai');
        }
    }
};

window.CanGuaGame = CanGuaGame;
