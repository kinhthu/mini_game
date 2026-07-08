const fs = require('fs');
const path = require('path');

// Mock window and document
global.window = global;

// Mock ProfileManager and GameHub
global.GameHub = {
    profile: {
        recordGameCalled: false,
        recordGame(gameId, won, stats) {
            this.recordGameCalled = { gameId, won, stats };
        }
    },
    showNotification(msg, icon) {
        this.notif = { msg, icon };
    },
    showModalCalled: false,
    showModal(config) {
        this.showModalCalled = config;
    }
};

const elements = {};
const eventListeners = {};

global.document = {
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                textContent: '',
                _innerHTML: '',
                get innerHTML() { return this._innerHTML; },
                set innerHTML(val) {
                    this._innerHTML = val;
                    if (val === '') this.children = [];
                },
                className: '',
                classList: {
                    add(cls) {
                        elements[id].classList.classes = elements[id].classList.classes || [];
                        elements[id].classList.classes.push(cls);
                    },
                    remove(cls) {
                        elements[id].classList.classes = (elements[id].classList.classes || []).filter(c => c !== cls);
                    }
                },
                appendChild(child) {
                    elements[id].children = elements[id].children || [];
                    elements[id].children.push(child);
                },
                addEventListener(evt, cb) {
                    eventListeners[`${id}-${evt}`] = cb;
                },
                querySelector(sel) {
                    // Simple selector matching data-row and data-col
                    const match = sel.match(/\[data-row="(\d+)"\]\[data-col="(\d+)"\]/);
                    if (match && this.children) {
                        const r = parseInt(match[1]);
                        const c = parseInt(match[2]);
                        return this.children.find(ch => ch.dataset && ch.dataset.row === r && ch.dataset.col === c);
                    }
                    return null;
                },
                querySelectorAll(sel) {
                    if (sel === '.caro-cell') {
                        return this.children || [];
                    }
                    return [];
                },
                style: {
                    setProperty(name, val) {
                        this[name] = val;
                    }
                }
            };
        }
        return elements[id];
    },
    createElement(tag) {
        const el = {
            tag: tag,
            className: '',
            dataset: {},
            children: [],
            classList: {
                classes: [],
                add(cls) {
                    this.classes.push(cls);
                    el.className += ' ' + cls;
                },
                remove(cls) {
                    this.classes = this.classes.filter(c => c !== cls);
                    el.className = this.classes.join(' ');
                },
                contains(cls) { return this.classes.includes(cls); }
            },
            appendChild(child) {
                this.children.push(child);
            },
            addEventListener(evt, cb) {
                el.onClick = cb;
            }
        };
        return el;
    }
};

// Mock localStorage
const localStorageStore = {};
global.localStorage = {
    getItem(key) {
        return localStorageStore[key] || null;
    },
    setItem(key, value) {
        localStorageStore[key] = String(value);
    },
    removeItem(key) {
        delete localStorageStore[key];
    }
};

// Load caro.js
const scriptPath = path.join(__dirname, 'js', 'games', 'caro.js');
const code = fs.readFileSync(scriptPath, 'utf8');
eval(code);

console.log("--- UNIT TESTS FOR js/games/caro.js ---");

// Test 1: init registers handlers
console.log("Test 1: Controls initialization");
CaroGame.init();
if (CaroGame.initialized) {
    console.log("  PASS: CaroGame initialized successfully.");
} else {
    console.error("  FAIL: CaroGame failed initialization.");
    process.exit(1);
}

// Test 2: Board Generation & Star Points
console.log("Test 2: Board Grid and Star Points");
const boardEl = document.getElementById('caro-board');
if (boardEl.children && boardEl.children.length === 225) {
    console.log("  PASS: Successfully generated 15x15 = 225 cells.");
} else {
    console.error("  FAIL: Incorrect cell count:", boardEl.children?.length);
    process.exit(1);
}

// Verify star points at [3,3], [3,11], [7,7], [11,3], [11,11]
const starPoints = [
    { r: 3, c: 3 }, { r: 3, c: 11 },
    { r: 7, c: 7 },
    { r: 11, c: 3 }, { r: 11, c: 11 }
];
let starsValid = true;
starPoints.forEach(p => {
    const cell = boardEl.children.find(c => c.dataset.row === p.r && c.dataset.col === p.c);
    if (!cell || !cell.classList.contains('star-point')) {
        starsValid = false;
        console.error(`  FAIL: Missing star point at [${p.r}, ${p.c}]`);
    }
});
if (starsValid) {
    console.log("  PASS: Star points are placed at correct Gomoku coordinates.");
} else {
    process.exit(1);
}

// Test 3: Turn indicator toggle & Hover styling
console.log("Test 3: Turn indicators and Hover updates");
CaroGame.activeTurn = 'X';
CaroGame.updateUI();
if (boardEl.style['--hover-symbol'] === '"X"' && boardEl.style['--hover-color'] === 'var(--accent-cyan)') {
    console.log("  PASS: Hover styles updated for turn 'X'.");
} else {
    console.error("  FAIL: Hover styles mismatch for turn 'X':", boardEl.style);
    process.exit(1);
}

// Test 4: Win check algorithm
console.log("Test 4: Win Check Algorithm");
CaroGame.reset();
// Set up 5 in a row horizontally
CaroGame.board[3][3] = 'X';
CaroGame.board[3][4] = 'X';
CaroGame.board[3][5] = 'X';
CaroGame.board[3][6] = 'X';
CaroGame.board[3][7] = 'X';

const winH = CaroGame.checkWin(3, 5);
if (winH && winH.symbol === 'X' && winH.stones.length === 5) {
    console.log("  PASS: Horizontal win detected correctly.");
} else {
    console.error("  FAIL: Horizontal win check failed.", winH);
    process.exit(1);
}

// Test 5: Heuristic AI Defense blocking human wins
console.log("Test 5: AI Heuristic Defense blocking human wins");
CaroGame.reset();
CaroGame.playMode = 'pve';
CaroGame.aiDifficulty = 'hard';
CaroGame.humanSymbol = 'X';
CaroGame.aiSymbol = 'O';

// Setup human threat: 3 in a row
// [5,5]=X, [5,6]=X, [5,7]=X
CaroGame.board[5][5] = 'X';
CaroGame.board[5][6] = 'X';
CaroGame.board[5][7] = 'X';
CaroGame.board[7][7] = 'O'; // take center so it doesn't trigger first-move center shortcut

// The next move for human could win if open-ended.
// The best block for AI is to place at [5,4] or [5,8]
const aiBestMove = CaroGame.calculateAiMove();
if ((aiBestMove.r === 5 && aiBestMove.c === 4) || (aiBestMove.r === 5 && aiBestMove.c === 8)) {
    console.log("  PASS: AI heuristic correctly blocked human threat at:", aiBestMove);
} else {
    console.error("  FAIL: AI failed to block human threat. Chosen move:", aiBestMove);
    process.exit(1);
}

// Test 6: Undo behavior
console.log("Test 6: Undo behavior (PvP vs PvE)");
// PvP mode
CaroGame.reset();
CaroGame.playMode = 'pvp';
// simulate cell click [0,0]
const cell00 = boardEl.children.find(c => c.dataset.row === 0 && c.dataset.col === 0);
cell00.onClick();
const cell01 = boardEl.children.find(c => c.dataset.row === 0 && c.dataset.col === 1);
cell01.onClick();

if (CaroGame.history.length === 2) {
    console.log("  PASS: Moves registered.");
}

CaroGame.undo();
if (CaroGame.history.length === 1 && CaroGame.board[0][1] === null && CaroGame.activeTurn === 'O') {
    console.log("  PASS: PvP undo removes exactly 1 move and reverts turn indicator.");
} else {
    console.error("  FAIL: PvP undo failure. History len:", CaroGame.history.length, "ActiveTurn:", CaroGame.activeTurn);
    process.exit(1);
}

// PvE mode
CaroGame.reset();
CaroGame.playMode = 'pve';
CaroGame.aiDifficulty = 'hard';
CaroGame.humanSymbol = 'X';
CaroGame.aiSymbol = 'O';
CaroGame.activeTurn = 'X';

// Player X places stone at [2,2]
const cell22 = boardEl.children.find(c => c.dataset.row === 2 && c.dataset.col === 2);
cell22.onClick();

// Now trigger the AI move timeout manually
if (CaroGame.aiTimeout) {
    // Clear timeout and simulate AI execution synchronously
    clearTimeout(CaroGame.aiTimeout);
    CaroGame.aiTimeout = null;
    CaroGame.isAiMoving = false;
    CaroGame.aiThinking = false;
    const move = CaroGame.calculateAiMove();
    CaroGame.placeStone(move.r, move.c, 'O');
}

if (CaroGame.history.length === 2) {
    console.log("  PASS: Player and AI moves registered in PvE.");
}

CaroGame.undo();
if (CaroGame.history.length === 0 && CaroGame.board[2][2] === null && CaroGame.activeTurn === 'X') {
    console.log("  PASS: PvE undo removes 2 moves (Player + AI) and reverts turn to human.");
} else {
    console.error("  FAIL: PvE undo failure. History len:", CaroGame.history.length, "ActiveTurn:", CaroGame.activeTurn);
    process.exit(1);
}

// Test 7: AI timeout cleared on resets
console.log("Test 7: AI timeout cleared on resets");
CaroGame.reset();
CaroGame.playMode = 'pve';
cell22.onClick(); // trigger AI move timer
if (CaroGame.aiTimeout) {
    console.log("  PASS: AI timer is active after player move.");
    CaroGame.reset();
    if (!CaroGame.aiTimeout) {
        console.log("  PASS: AI timer correctly cleared upon resetting the game.");
    } else {
        console.error("  FAIL: AI timer was NOT cleared on reset.");
        process.exit(1);
    }
} else {
    console.error("  FAIL: AI timer was not initialized.");
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
