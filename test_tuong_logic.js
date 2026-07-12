const fs = require('fs');
const path = require('path');

// Read tuong.js content
const tuongPath = path.join(__dirname, 'js', 'games', 'tuong.js');
const code = fs.readFileSync(tuongPath, 'utf8');

// Mock DOM elements
const elements = {};
global.document = {
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                textContent: '',
                innerHTML: '',
                className: '',
                classList: {
                    add(cls) {
                        this.classes = this.classes || [];
                        if (!this.classes.includes(cls)) this.classes.push(cls);
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
                removeAttribute() {},
                querySelectorAll() {
                    return [];
                },
                appendChild() {}
            };
        }
        return elements[id];
    },
    querySelectorAll(selector) {
        return [];
    },
    createElement(tag) {
        return {
            className: '',
            dataset: {},
            appendChild() {},
            classList: {
                add() {},
                remove() {}
            }
        };
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

// Eval the game code to register window.TuongGame
eval(code);

const Game = global.window.TuongGame;

console.log("--- STARTING CỜ TƯỚNG GAME LOGIC UNIT TESTS ---");

// Test 1: Initialize game and check starting layout
console.log("Test 1: Board setup and initial layout");
Game.setupInitialBoard();

// Verify Black pieces on row 0
let blackBackCorrect = true;
const expectedBBack = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R'];
for (let c = 0; c < 9; c++) {
    if (!Game.board[c] || Game.board[c].type !== expectedBBack[c] || Game.board[c].color !== 'b') {
        blackBackCorrect = false;
        break;
    }
}

// Verify Red pieces on row 9
let redBackCorrect = true;
const expectedRBack = ['R', 'N', 'B', 'A', 'K', 'A', 'B', 'N', 'R'];
for (let c = 0; c < 9; c++) {
    if (!Game.board[81 + c] || Game.board[81 + c].type !== expectedRBack[c] || Game.board[81 + c].color !== 'r') {
        redBackCorrect = false;
        break;
    }
}

// Verify Cannons
const cannonsCorrect = (Game.board[19] && Game.board[19].type === 'C' && Game.board[19].color === 'b') &&
                      (Game.board[25] && Game.board[25].type === 'C' && Game.board[25].color === 'b') &&
                      (Game.board[64] && Game.board[64].type === 'C' && Game.board[64].color === 'r') &&
                      (Game.board[70] && Game.board[70].type === 'C' && Game.board[70].color === 'r');

if (blackBackCorrect && redBackCorrect && cannonsCorrect) {
    console.log("  PASS: Initial Cờ Tướng board pieces correctly set up.");
} else {
    console.error("  FAIL: Initial board pieces setup incorrect.", { blackBackCorrect, redBackCorrect, cannonsCorrect });
    process.exit(1);
}

// Test 2: Knight blocking (cản chân mã) and Elephant blocking (cản mắt tượng)
console.log("Test 2: Knight & Elephant blocking checks");

// Clear board
Game.board = Array(90).fill(null);

// Place Black Elephant (B) at index 2 (row 0, col 2)
Game.board[2] = { type: 'B', color: 'b' };
// Diagonal target is index 22 (row 2, col 4)
let elephantMoves = Game.getLegalMoves(2);
let elephantFree = elephantMoves.includes(22);

// Place blocking piece at the eye of the Elephant: index 12 (row 1, col 3)
Game.board[12] = { type: 'P', color: 'r' };
elephantMoves = Game.getLegalMoves(2);
let elephantBlocked = !elephantMoves.includes(22);

// Place Black Knight (N) at index 18 (row 2, col 0)
// L-move target is index 29 (row 3, col 2). Foot blocking cell is index 19 (row 2, col 1).
Game.board[18] = { type: 'N', color: 'b' };
let knightMoves = Game.getLegalMoves(18);
let knightFree = knightMoves.includes(29);

// Place blocking piece at Knight foot: index 19
Game.board[19] = { type: 'P', color: 'r' };
knightMoves = Game.getLegalMoves(18);
let knightBlocked = !knightMoves.includes(29);

if (elephantFree && elephantBlocked && knightFree && knightBlocked) {
    console.log("  PASS: Elephant eye block and Knight foot block work correctly.");
} else {
    console.error("  FAIL: Blocking rules incorrect.", { elephantFree, elephantBlocked, knightFree, knightBlocked });
    process.exit(1);
}

// Test 3: Cannon captures require a screen (ngòi pháo)
console.log("Test 3: Cannon captures require screen checks");
Game.board = Array(90).fill(null);
// Place Black Cannon (C) at index 18 (row 2, col 0)
// Place Red target Pawn (P) at index 21 (row 2, col 3)
Game.board[18] = { type: 'C', color: 'b' };
Game.board[21] = { type: 'P', color: 'r' };

let cannonMoves = Game.getLegalMoves(18);
let cannonNoCapture = !cannonMoves.includes(21); // Should not capture directly without a screen

// Place screen piece at index 20 (row 2, col 2)
Game.board[20] = { type: 'A', color: 'b' };
cannonMoves = Game.getLegalMoves(18);
let cannonCanCapture = cannonMoves.includes(21); // Should capture with a screen

if (cannonNoCapture && cannonCanCapture) {
    console.log("  PASS: Cannon captures correctly validated with screen requirement.");
} else {
    console.error("  FAIL: Cannon capture rules incorrect.", { cannonNoCapture, cannonCanCapture });
    process.exit(1);
}

// Test 4: Two Kings facing directly (Lộ mặt tướng)
console.log("Test 4: Kings direct facing (Lộ mặt tướng) check");
Game.board = Array(90).fill(null);
// Black King at index 4 (row 0, col 4), Red King at index 85 (row 9, col 4)
Game.board[4] = { type: 'K', color: 'b' };
Game.board[85] = { type: 'K', color: 'r' };

// Place blocking Red Rook (R) at index 49 (row 5, col 4)
Game.board[49] = { type: 'R', color: 'r' };

// Red Rook attempts to move left to index 48 (row 5, col 3), exposing the Kings
let rookMoves = Game.getLegalMoves(49);
let exposeBlocked = !rookMoves.includes(48);

if (exposeBlocked) {
    console.log("  PASS: Exposing Kings directly facing each other is blocked.");
} else {
    console.error("  FAIL: Exposing Kings directly facing allowed.", { exposeBlocked });
    process.exit(1);
}

// Test 5: Checkmate & Stalemate detection
console.log("Test 5: Checkmate and Stalemate detection");
Game.board = Array(90).fill(null);
// Place Black King at index 3 (row 0, col 3), Red King at index 84 (row 9, col 3)
Game.board[3] = { type: 'K', color: 'b' };
Game.board[84] = { type: 'K', color: 'r' };

// Place checking Red Rook (R) at index 12 (row 1, col 3)
// Place another Red Rook (R) at index 22 (row 2, col 4) to cover escaping square index 13 (row 1, col 4)
Game.board[12] = { type: 'R', color: 'r' };
Game.board[22] = { type: 'R', color: 'r' };

Game.currentPlayer = 'b';
let isCheck = Game.isKingInCheck('b');
let hasMoves = Game.hasAnyLegalMoves('b');

if (isCheck && !hasMoves) {
    console.log("  PASS: Checkmate correctly detected.");
} else {
    console.error("  FAIL: Checkmate detection failed.", { isCheck, hasMoves });
    process.exit(1);
}

// Setup stalemate: Black King at index 3 (row 0, col 3), Red King at index 84 (row 9, col 3)
// Red Pawn at index 48 (row 5, col 3) to block the direct Kings facing
// Red Rook at index 13 (row 1, col 4) - controlling index 4
// Red Rook at index 14 (row 1, col 5) - controlling index 12 (row 1, col 3)
// This leaves King at index 3 safe (no check) but with 0 legal moves.
Game.board = Array(90).fill(null);
Game.board[3] = { type: 'K', color: 'b' };
Game.board[84] = { type: 'K', color: 'r' };
Game.board[48] = { type: 'P', color: 'r' };
Game.board[13] = { type: 'R', color: 'r' };
Game.board[14] = { type: 'R', color: 'r' };

Game.currentPlayer = 'b';
isCheck = Game.isKingInCheck('b');
hasMoves = Game.hasAnyLegalMoves('b');

if (!isCheck && !hasMoves) {
    console.log("  PASS: Stalemate correctly identified.");
} else {
    console.error("  FAIL: Stalemate detection failed.", { isCheck, hasMoves });
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
