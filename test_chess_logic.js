const fs = require('fs');
const path = require('path');

// Read chess.js content
const chessPath = path.join(__dirname, 'js', 'games', 'chess.js');
const code = fs.readFileSync(chessPath, 'utf8');

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
                }
            };
        }
        return elements[id];
    },
    querySelectorAll(selector) {
        return [];
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

// Eval the game code to register window.ChessGame
eval(code);

const Game = global.window.ChessGame;

console.log("--- STARTING CHESS GAME LOGIC UNIT TESTS ---");

// Test 1: Initialize game and check starting layout
console.log("Test 1: Board setup and initial layout");
Game.setupInitialBoard();

// Verify white pawn on row 6 (index 48 to 55)
let pawnsCorrect = true;
for (let i = 48; i <= 55; i++) {
    if (!Game.board[i] || Game.board[i].type !== 'P' || Game.board[i].color !== 'w') {
        pawnsCorrect = false;
        break;
    }
}

// Verify black pawn on row 1 (index 8 to 15)
for (let i = 8; i <= 15; i++) {
    if (!Game.board[i] || Game.board[i].type !== 'P' || Game.board[i].color !== 'b') {
        pawnsCorrect = false;
        break;
    }
}

const whiteKing = Game.board[60]; // e1
const blackKing = Game.board[4];  // e8

if (pawnsCorrect && whiteKing && whiteKing.type === 'K' && whiteKing.color === 'w' &&
    blackKing && blackKing.type === 'K' && blackKing.color === 'b') {
    console.log("  PASS: Initial board pieces correctly set up.");
} else {
    console.error("  FAIL: Initial board pieces setup incorrect.", { pawnsCorrect, whiteKing, blackKing });
    process.exit(1);
}

// Test 2: Legal move generator
console.log("Test 2: Pawn legal moves from starting rank");
// Pawn at e2 (index 52). Possible moves: e3 (idx 44) and e4 (idx 36)
const moves = Game.getLegalMoves(52);
if (moves.includes(44) && moves.includes(36) && moves.length === 2) {
    console.log("  PASS: Pawn at e2 has exactly 2 valid starting moves (e3, e4).");
} else {
    console.error("  FAIL: Pawn valid moves incorrect:", moves);
    process.exit(1);
}

console.log("Test 3: Knight legal moves from starting rank");
// Knight at b1 (index 57). Possible moves: a3 (idx 40) and c3 (idx 42)
const knightMoves = Game.getLegalMoves(57);
if (knightMoves.includes(40) && knightMoves.includes(42) && knightMoves.length === 2) {
    console.log("  PASS: Knight at b1 has exactly 2 valid starting moves.");
} else {
    console.error("  FAIL: Knight moves incorrect:", knightMoves);
    process.exit(1);
}

// Test 4: Checkmate detection
console.log("Test 4: Fool's Mate checkmate verification");
// Setup Fool's Mate: 
// 1. f3 e5
// 2. g4 Qh4#
Game.setupInitialBoard();
// White pawn at f2 (idx 53) to f3 (idx 45)
Game.board[45] = Game.board[53]; Game.board[53] = null;
// Black pawn at e7 (idx 12) to e5 (idx 28)
Game.board[28] = Game.board[12]; Game.board[12] = null;
// White pawn at g2 (idx 54) to g4 (idx 38)
Game.board[38] = Game.board[54]; Game.board[54] = null;
// Black Queen at d8 (idx 3) to h4 (idx 39)
Game.board[39] = Game.board[3]; Game.board[3] = null;

// Set turn to white
Game.currentPlayer = 'w';
const inCheck = Game.isKingInCheck('w');
const hasMoves = Game.hasAnyLegalMoves('w');

if (inCheck && !hasMoves) {
    console.log("  PASS: Fool's Mate checkmate correctly detected.");
} else {
    console.error("  FAIL: Fool's mate not detected.", { inCheck, hasMoves });
    process.exit(1);
}

// Test 5: Stalemate detection
console.log("Test 5: Stalemate verification");
// Setup simple stalemate:
// White King at a8 (idx 0), White Pawn at a7 (idx 8), Black King at c8 (idx 2)
// If it's Black's turn and Black King moves to c7 (idx 10)
// Then White King is trapped with 0 moves, but not in check.
Game.board = Array(64).fill(null);
Game.board[0] = { type: 'K', color: 'w' };
Game.board[8] = { type: 'P', color: 'w' };
Game.board[10] = { type: 'K', color: 'b' }; // Black king at c7
Game.currentPlayer = 'w'; // White's turn

const checkState = Game.isKingInCheck('w');
const activeMoves = Game.hasAnyLegalMoves('w');

if (!checkState && !activeMoves) {
    console.log("  PASS: Stalemate correctly identified (0 moves, no check).");
} else {
    console.error("  FAIL: Stalemate verification failed.", { checkState, activeMoves });
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
