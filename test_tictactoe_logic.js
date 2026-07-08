const fs = require('fs');
const path = require('path');

// Read tictactoe.js content
const tttPath = path.join(__dirname, 'js', 'games', 'tictactoe.js');
const code = fs.readFileSync(tttPath, 'utf8');

// Mock DOM elements
const elements = {};
global.document = {
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                textContent: '',
                className: '',
                classList: {
                    add(cls) {
                        this.classes = this.classes || [];
                        this.classes.push(cls);
                    },
                    remove(cls) {
                        this.classes = this.classes || [];
                        this.classes = this.classes.filter(c => c !== cls);
                    }
                },
                style: {},
                dataset: {},
                addEventListener() {},
                setAttribute() {},
                removeAttribute() {}
            };
        }
        return elements[id];
    },
    querySelectorAll(selector) {
        // Return 9 mock cells
        const cells = [];
        for (let i = 0; i < 9; i++) {
            cells.push({
                dataset: { index: i.toString() },
                textContent: '',
                className: 'ttt-cell',
                classList: {
                    add(cls) {
                        this.classes = this.classes || [];
                        this.classes.push(cls);
                    },
                    remove(cls) {
                        this.classes = this.classes || [];
                        this.classes = this.classes.filter(c => c !== cls);
                    }
                }
            });
        }
        return cells;
    }
};

global.localStorage = {
    store: {},
    getItem(key) {
        return this.store[key] || null;
    },
    setItem(key, value) {
        this.store[key] = value.toString();
    },
    clear() {
        this.store = {};
    }
};

global.window = global;

// Eval the game code to register TicTacToeGame on window
eval(code);

const Game = global.window.TicTacToeGame;

console.log("--- STARTING TICTACTOE GAME LOGIC UNIT TESTS ---");

// Test 1: Win detection (checkWin)
console.log("Test 1: checkWin verification");
const winBoard = ['X', 'X', 'X', null, null, null, null, null, null];
const noWinBoard = ['X', 'O', 'X', null, null, null, null, null, null];

const resultWin = Game.checkWin(winBoard, 'X');
const resultNoWin = Game.checkWin(noWinBoard, 'X');

if (resultWin && Array.isArray(resultWin) && resultWin.join(',') === '0,1,2' && !resultNoWin) {
    console.log("  PASS: checkWin correctly identifies win and non-win states");
} else {
    console.error("  FAIL: checkWin returned incorrect results", { resultWin, resultNoWin });
    process.exit(1);
}

// Test 2: AI blocking logic (minimax)
// Player X is at 0, 1. AI (O) must block by playing at 2.
console.log("Test 2: AI blocking decision");
const blockBoard = ['X', 'X', null, null, 'O', null, null, null, null];
let bestScore = -Infinity;
let bestMove = null;

for (let i = 0; i < 9; i++) {
    if (blockBoard[i] === null) {
        blockBoard[i] = 'O';
        let score = Game.minimax(blockBoard, 0, false);
        blockBoard[i] = null;
        if (score > bestScore) {
            bestScore = score;
            bestMove = i;
        }
    }
}

if (bestMove === 2) {
    console.log("  PASS: AI correctly prioritizes blocking player at index 2");
} else {
    console.error("  FAIL: AI failed to block threat, chose index:", bestMove);
    process.exit(1);
}

// Test 3: AI winning move logic (minimax)
// AI (O) has pieces at 4, 5. AI should take the immediate win at 3.
console.log("Test 3: AI immediate winning move decision");
const winImmediateBoard = [null, null, null, null, 'O', 'O', 'X', 'X', null]; // X at 6, 7
bestScore = -Infinity;
bestMove = null;

for (let i = 0; i < 9; i++) {
    if (winImmediateBoard[i] === null) {
        winImmediateBoard[i] = 'O';
        let score = Game.minimax(winImmediateBoard, 0, false);
        winImmediateBoard[i] = null;
        if (score > bestScore) {
            bestScore = score;
            bestMove = i;
        }
    }
}

// AI (O) winning moves: 4, 5 -> 3 wins (row: 3, 4, 5)
if (bestMove === 3) {
    console.log("  PASS: AI correctly takes immediate win at index 3");
} else {
    console.error("  FAIL: AI failed to take immediate win, chose index:", bestMove);
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
