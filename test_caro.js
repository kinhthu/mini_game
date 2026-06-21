const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- STARTING CARO QA TEST SUITE ---');

const elements = {};

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      classes: new Set(),
      add: (...names) => names.forEach(n => this.classList.classes.add(n)),
      remove: (...names) => names.forEach(n => this.classList.classes.delete(n)),
      contains: (name) => this.classList.classes.has(name)
    };
    this.dataset = {};
    this.listeners = {};
    this.children = [];
    this.value = '';
    this._textContent = '';
    this._innerHTML = '';
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(val) {
    this._textContent = val;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
  }

  addEventListener(event, handler) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  dispatchEvent(eventName) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(handler => {
        handler.call(this);
      });
    }
  }

  appendChild(child) {
    this.children.push(child);
  }

  querySelector(selector) {
    const match = selector.match(/\[data-row="(\d+)"\]\[data-col="(\d+)"\]/);
    if (match) {
      const r = parseInt(match[1]);
      const c = parseInt(match[2]);
      return this.children.find(child => child.dataset.row == r && child.dataset.col == c);
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === '.winner') {
      return this.children.filter(child => child.classList.contains('winner'));
    }
    return [];
  }
}

function getElement(id) {
  if (!elements[id]) {
    elements[id] = new MockElement();
    elements[id].id = id;
  }
  return elements[id];
}

const windowMock = {
  AudioContext: class {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.destination = {};
    }
    resume() { return Promise.resolve(); }
    createOscillator() {
      return {
        connect: () => {},
        frequency: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {}
        },
        type: 'sine',
        start: () => {},
        stop: () => {}
      };
    }
    createGain() {
      return {
        connect: () => {},
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {}
        }
      };
    }
  }
};
windowMock.webkitAudioContext = windowMock.AudioContext;
const documentMock = {
  getElementById: getElement,
  createElement: (tagName) => new MockElement(tagName),
};

const context = vm.createContext({
  window: windowMock,
  document: documentMock,
  console: console,
  setTimeout: (callback, delay) => {
    // Run immediately for tests!
    callback();
  },
  clearTimeout: clearTimeout
});

// Load and execute js/caro-ai.js
const aiCode = fs.readFileSync(path.join(__dirname, 'js/caro-ai.js'), 'utf8');
vm.runInContext(aiCode, context);

// Load and execute js/caro.js
const code = fs.readFileSync(path.join(__dirname, 'js/caro.js'), 'utf8');
vm.runInContext(code, context);

const CaroGame = windowMock.CaroGame;
if (!CaroGame) {
  console.error('FAIL: window.CaroGame not defined');
  process.exit(1);
}

// Helper to get board cells
function getCells() {
  return elements['caro-board'].children;
}

function getCell(r, c) {
  return getCells().find(cell => cell.dataset.row == r && cell.dataset.col == c);
}

// Run CaroGame.init
CaroGame.init();

// --- TEST CASES ---
const results = [];

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    results.push({ name: message, status: 'PASS' });
  } else {
    console.error(`[FAIL] ${message}`);
    results.push({ name: message, status: 'FAIL' });
  }
}

// 1. Verify 15x15 board generation
const cells = getCells();
assert(cells.length === 225, `Board has exactly 225 cells (got ${cells.length})`);

let correctMetadata = true;
for (let r = 0; r < 15; r++) {
  for (let c = 0; c < 15; c++) {
    const cell = getCell(r, c);
    if (!cell || cell.dataset.row != r || cell.dataset.col != c || !cell.classList.contains('caro-cell')) {
      correctMetadata = false;
    }
  }
}
assert(correctMetadata, 'All cells are generated with correct row/col datasets and "caro-cell" class');


// 2. PvP empty cell clicks alternate X and O, preventing double moves
const cell_0_0 = getCell(0, 0);
const cell_0_1 = getCell(0, 1);

// Initially X's turn
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'Initial turn indicator shows X');

// Player X clicks (0, 0)
cell_0_0.dispatchEvent('click');
assert(cell_0_0.textContent === 'X', 'Cell (0,0) textContent is X');
assert(cell_0_0.classList.contains('played'), 'Cell (0,0) has "played" class');
assert(cell_0_0.classList.contains('x-mark'), 'Cell (0,0) has "x-mark" class');
assert(elements['caro-turn-indicator'].innerHTML.includes('O'), 'Turn indicator updated to O');

// Player X tries to click (0, 0) again
cell_0_0.dispatchEvent('click');
assert(cell_0_0.textContent === 'X', 'Cell (0,0) remains X after double click');
assert(elements['caro-turn-indicator'].innerHTML.includes('O'), 'Turn remains O');

// Player O clicks (0, 1)
cell_0_1.dispatchEvent('click');
assert(cell_0_1.textContent === 'O', 'Cell (0,1) textContent is O');
assert(cell_0_1.classList.contains('played'), 'Cell (0,1) has "played" class');
assert(cell_0_1.classList.contains('o-mark'), 'Cell (0,1) has "o-mark" class');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'Turn indicator updated back to X');


// 3. Ghost preview on hover
const cell_1_1 = getCell(1, 1);

// Hover (mouseenter)
cell_1_1.dispatchEvent('mouseenter');
assert(cell_1_1.textContent === 'X', 'On hover, cell (1,1) shows current player mark X');
assert(cell_1_1.classList.contains('ghost'), 'On hover, cell (1,1) has "ghost" class');
assert(cell_1_1.classList.contains('x-ghost'), 'On hover, cell (1,1) has "x-ghost" class');

// Leave hover (mouseleave)
cell_1_1.dispatchEvent('mouseleave');
assert(cell_1_1.textContent === '', 'On mouseleave, cell (1,1) text is cleared');
assert(!cell_1_1.classList.contains('ghost'), 'On mouseleave, cell (1,1) "ghost" class is removed');
assert(!cell_1_1.classList.contains('x-ghost'), 'On mouseleave, cell (1,1) "x-ghost" class is removed');

// Move made at cell (1,1) by player X clicking
cell_1_1.dispatchEvent('click'); // X plays (1,1), turn becomes O

// Hover on already played cell (1,1)
cell_1_1.dispatchEvent('mouseenter');
assert(cell_1_1.textContent === 'X', 'Hovering on played cell (1,1) keeps mark X');
assert(!cell_1_1.classList.contains('ghost'), 'Hovering on played cell does not add "ghost" class');

cell_1_1.dispatchEvent('mouseleave');
assert(cell_1_1.textContent === 'X', 'Leaving hover on played cell (1,1) keeps mark X');


// 4. Turn indicator update correctly tested in Step 2, adding extra check here
// Currently O's turn
assert(elements['caro-turn-indicator'].innerHTML.includes('O'), 'Turn indicator shows O');


// 5. Reset button clears board, keeps scores
// Let's first make X win to update score. X is at (0,0) and (1,1).
// Current turn is O.
// Let's place O moves and X moves to get X a 5-in-a-row.
// X moves: (0,0), (1,1), (0,2), (0,3), (0,4), (0,5)
// O moves: (2,2), (2,3), (2,4), (2,5)
// Let's clear board state and do it cleanly.
CaroGame.init(); // Resets and initializes (scores to 0,0)

// Let's play standard PvP sequence for X win:
// X (0,0), O (1,0), X (0,1), O (1,1), X (0,2), O (1,2), X (0,3), O (1,3), X (0,4)
getCell(0, 0).dispatchEvent('click'); // X
getCell(1, 0).dispatchEvent('click'); // O
getCell(0, 1).dispatchEvent('click'); // X
getCell(1, 1).dispatchEvent('click'); // O
getCell(0, 2).dispatchEvent('click'); // X
getCell(1, 2).dispatchEvent('click'); // O
getCell(0, 3).dispatchEvent('click'); // X
getCell(1, 3).dispatchEvent('click'); // O
getCell(0, 4).dispatchEvent('click'); // X -> X wins!

assert(elements['score-x'].textContent == 1, `Score X is 1 (got ${elements['score-x'].textContent})`);
assert(elements['score-o'].textContent == 0, 'Score O is 0');
assert(elements['caro-win-modal'].classList.contains('active'), 'Win modal is active');
assert(elements['caro-win-message'].textContent.includes('X'), 'Win message mentions X');

// Highlight verification
let winningCellsHighlighted = true;
for (let c = 0; c <= 4; c++) {
  if (!getCell(0, c).classList.contains('winner')) {
    winningCellsHighlighted = false;
  }
}
assert(winningCellsHighlighted, 'Winning 5 cells horizontal line are highlighted with class "winner"');

// Reset game using reset button
elements['caro-reset-btn'].dispatchEvent('click');

assert(elements['score-x'].textContent == 1, 'Score X is kept as 1 after reset');
assert(!elements['caro-win-modal'].classList.contains('active'), 'Win modal is closed');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'Turn indicator resets to X');

// Board cells should be empty
let allEmpty = true;
for (let r = 0; r < 15; r++) {
  for (let c = 0; c < 15; c++) {
    const cell = getCell(r, c);
    if (cell.textContent !== '' || cell.classList.contains('played') || cell.classList.contains('winner')) {
      allEmpty = false;
    }
  }
}
assert(allEmpty, 'All board cells are cleared after reset');


// --- ADDITIONAL WIN CHECKER & VIETNAMESE RULE TESTS ---

console.log('\n--- STARTING ADDITIONAL WIN CHECKER & VIETNAMESE RULE TESTS ---');

function runCaroTestSequence(name, rule, moves, expectedWin, expectedWinnerSymbol) {
  // Set rule
  elements['caro-rule'].value = rule;
  
  // Reset game to clear everything
  elements['caro-reset-btn'].dispatchEvent('click');
  elements['caro-win-modal'].classList.remove('active');
  
  for (const [r, c] of moves) {
    const cell = getCell(r, c);
    if (!cell) {
      console.error(`Invalid cell coordinate (${r}, ${c})`);
      continue;
    }
    cell.dispatchEvent('click');
  }
  
  const winDetected = elements['caro-win-modal'].classList.contains('active');
  
  if (expectedWin) {
    assert(winDetected === true, `${name}: Win should be detected`);
    if (expectedWinnerSymbol) {
      assert(elements['caro-win-message'].textContent.includes(expectedWinnerSymbol), `${name}: Winner should be ${expectedWinnerSymbol}`);
      
      const playedWinnerCells = getCells().filter(cell => cell.classList.contains('winner'));
      let correctWinnerClass = true;
      const expectedClass = expectedWinnerSymbol === 'X' ? 'x-winner' : 'o-winner';
      playedWinnerCells.forEach(cell => {
        if (!cell.classList.contains(expectedClass)) {
          correctWinnerClass = false;
        }
      });
      assert(correctWinnerClass && playedWinnerCells.length >= 5, `${name}: Winning cells have class ${expectedClass}`);
    }
  } else {
    assert(winDetected === false, `${name}: Win should NOT be detected`);
  }
}

// A. Standard Rule - Vertical Win (not blocked)
runCaroTestSequence(
  'Test A (Standard Vertical)',
  'standard',
  [
    [1, 1], [10, 10],
    [2, 1], [10, 11],
    [3, 1], [10, 12],
    [4, 1], [10, 13],
    [5, 1]
  ],
  true,
  'X'
);

// B. Standard Rule - Horizontal Win (not blocked)
runCaroTestSequence(
  'Test B (Standard Horizontal)',
  'standard',
  [
    [2, 2], [10, 10],
    [2, 3], [10, 11],
    [2, 4], [10, 12],
    [2, 5], [10, 13],
    [2, 6]
  ],
  true,
  'X'
);

// C. Standard Rule - Diagonal Down-Right Win
runCaroTestSequence(
  'Test C (Standard Diagonal DR)',
  'standard',
  [
    [1, 1], [10, 10],
    [2, 2], [10, 11],
    [3, 3], [10, 12],
    [4, 4], [10, 13],
    [5, 5]
  ],
  true,
  'X'
);

// D. Standard Rule - Diagonal Down-Left Win
runCaroTestSequence(
  'Test D (Standard Diagonal DL)',
  'standard',
  [
    [1, 5], [10, 10],
    [2, 4], [10, 11],
    [3, 3], [10, 12],
    [4, 2], [10, 13],
    [5, 1]
  ],
  true,
  'X'
);

// E. Vietnamese Rule - 6-in-a-row (blocked at only one end)
runCaroTestSequence(
  'Test E (Vietnamese 6-in-a-row 1-end blocked)',
  'vietnamese',
  [
    [2, 2], [2, 1],      // X plays, O blocks before
    [2, 3], [10, 10],
    [2, 4], [10, 11],
    [2, 5], [10, 12],
    [2, 7], [10, 13],    // X leaves a gap at index 6, plays index 7
    [2, 6]               // X plays index 6 to complete 6-in-a-row (indices 2 to 7, blocked only at index 1 by O)
  ],
  true,
  'X'
);

// F. Vietnamese Rule - 5-in-a-row, blocked at one end by opponent, other end free
runCaroTestSequence(
  'Test F (Vietnamese 5-in-a-row 1-end blocked)',
  'vietnamese',
  [
    [3, 2], [3, 1],      // X plays, O blocks before at (3,1)
    [3, 3], [10, 10],
    [3, 4], [10, 11],
    [3, 5], [10, 12],
    [3, 6]               // X plays to complete 5-in-a-row, (3,7) is empty
  ],
  true,
  'X'
);

// G. Vietnamese Rule - 5-in-a-row, blocked at both ends by opponent
runCaroTestSequence(
  'Test G (Vietnamese 5-in-a-row 2-ends blocked)',
  'vietnamese',
  [
    [4, 2], [4, 1],      // X plays, O blocks before at (4,1)
    [4, 3], [4, 7],      // X plays, O blocks after at (4,7)
    [4, 4], [10, 10],
    [4, 5], [10, 11],
    [4, 6]               // X completes 5-in-a-row, blocked at (4,1) and (4,7)
  ],
  false
);

// H. Vietnamese Rule - 5-in-a-row, blocked at one end by edge, other end free
runCaroTestSequence(
  'Test H (Vietnamese 5-in-a-row edge block)',
  'vietnamese',
  [
    [5, 0], [10, 10],
    [5, 1], [10, 11],
    [5, 2], [10, 12],
    [5, 3], [10, 13],
    [5, 4]               // X completes 5-in-a-row from column 0 to 4. Column 5 is free. Column -1 is off-board.
  ],
  true,
  'X'
);

// I. Vietnamese Rule - 5-in-a-row, blocked at one end by edge, other end blocked by opponent
runCaroTestSequence(
  'Test I (Vietnamese 5-in-a-row edge and opponent block)',
  'vietnamese',
  [
    [6, 0], [6, 5],      // X plays col 0, O blocks after at col 5
    [6, 1], [10, 10],
    [6, 2], [10, 11],
    [6, 3], [10, 12],
    [6, 4]               // X completes 5-in-a-row. Bounded by edge at col 0, blocked by O at col 5. Still a win!
  ],
  true,
  'X'
);

// J. Vietnamese Rule - 6-in-a-row, blocked at both ends by opponent
runCaroTestSequence(
  'Test J (Vietnamese 6-in-a-row 2-ends blocked)',
  'vietnamese',
  [
    [7, 2], [7, 1],      // X plays, O blocks before at (7,1)
    [7, 3], [7, 8],      // X plays, O blocks after at (7,8)
    [7, 4], [10, 10],
    [7, 5], [10, 11],
    [7, 7], [10, 12],    // X plays index 7
    [7, 6]               // X completes 6-in-a-row, blocked at both (7,1) and (7,8)
  ],
  false
);

// K. Standard Rule - 5-in-a-row, blocked at both ends by opponent (should win)
runCaroTestSequence(
  'Test K (Standard 5-in-a-row 2-ends blocked)',
  'standard',
  [
    [8, 2], [8, 1],      // X plays, O blocks before at (8,1)
    [8, 3], [8, 7],      // X plays, O blocks after at (8,7)
    [8, 4], [10, 10],
    [8, 5], [10, 11],
    [8, 6]               // X completes 5-in-a-row, blocked at both ends but in standard mode -> wins!
  ],
  true,
  'X'
);

// L. PvE Mode Test
console.log('\n--- STARTING PVE MODE TESTS ---');

// Set mode to PvE
elements['caro-mode'].value = 'pve';

// Reset game to clear any previous state and apply PvE mode
elements['caro-reset-btn'].dispatchEvent('click');

// Initial turn should be X
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvE: Initial turn indicator shows X');

// Player X clicks (7, 7)
const cell_7_7 = getCell(7, 7);
cell_7_7.dispatchEvent('click');

// Check that cell (7,7) has X, and some other cell has O (placed by AI)
assert(cell_7_7.textContent === 'X', 'PvE: Cell (7,7) has X after player click');

const allPlayedCells = getCells().filter(cell => cell.classList.contains('played'));
assert(allPlayedCells.length === 2, `PvE: Board has exactly 2 played cells (got ${allPlayedCells.length})`);

const playedO = allPlayedCells.find(cell => cell.textContent === 'O');
assert(playedO !== undefined, 'PvE: AI successfully placed O');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvE: Turn returned to player X');

// Reset game mode back to PvP to keep tests clean
elements['caro-mode'].value = 'pvp';
elements['caro-reset-btn'].dispatchEvent('click');

// --- NEW TESTS FOR UNDO AND RESET SCORE (TASK 5) ---
console.log('\n--- STARTING TASK 5 UNDO & RESET SCORE TESTS ---');

// M. PvP Undo basic test
elements['caro-mode'].value = 'pvp';
elements['caro-reset-score-btn'].dispatchEvent('click');

getCell(7, 7).dispatchEvent('click'); // X
getCell(7, 8).dispatchEvent('click'); // O

assert(getCell(7, 7).textContent === 'X', 'PvP Undo: (7,7) is X before undo');
assert(getCell(7, 8).textContent === 'O', 'PvP Undo: (7,8) is O before undo');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvP Undo: Next player is X before undo');

// Click Undo -> O's move at (7,8) should be reverted
elements['caro-undo-btn'].dispatchEvent('click');
assert(getCell(7, 8).textContent === '', 'PvP Undo: (7,8) text is cleared after first undo');
assert(!getCell(7, 8).classList.contains('played'), 'PvP Undo: (7,8) is not marked as played');
assert(elements['caro-turn-indicator'].innerHTML.includes('O'), 'PvP Undo: currentPlayer reverted back to O');

// Click Undo again -> X's move at (7,7) should be reverted
elements['caro-undo-btn'].dispatchEvent('click');
assert(getCell(7, 7).textContent === '', 'PvP Undo: (7,7) text is cleared after second undo');
assert(!getCell(7, 7).classList.contains('played'), 'PvP Undo: (7,7) is not marked as played');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvP Undo: currentPlayer reverted back to X');


// N. PvP Undo after Win test
elements['caro-mode'].value = 'pvp';
elements['caro-reset-score-btn'].dispatchEvent('click');

// Win sequence for X:
getCell(0, 0).dispatchEvent('click'); // X
getCell(1, 0).dispatchEvent('click'); // O
getCell(0, 1).dispatchEvent('click'); // X
getCell(1, 1).dispatchEvent('click'); // O
getCell(0, 2).dispatchEvent('click'); // X
getCell(1, 2).dispatchEvent('click'); // O
getCell(0, 3).dispatchEvent('click'); // X
getCell(1, 3).dispatchEvent('click'); // O
getCell(0, 4).dispatchEvent('click'); // X -> X wins!

assert(elements['score-x'].textContent == 1, 'PvP Undo Win: Score X is 1 after win');
assert(elements['caro-win-modal'].classList.contains('active'), 'PvP Undo Win: Win modal is active after win');

// Click Undo -> Should undo last move and revert win state
elements['caro-undo-btn'].dispatchEvent('click');
assert(getCell(0, 4).textContent === '', 'PvP Undo Win: (0,4) is cleared after undo');
assert(!getCell(0, 4).classList.contains('played'), 'PvP Undo Win: (0,4) is not marked as played');
assert(elements['score-x'].textContent == 0, 'PvP Undo Win: Score X is reverted to 0 after undo');
assert(!elements['caro-win-modal'].classList.contains('active'), 'PvP Undo Win: Win modal is closed after undo');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvP Undo Win: Turn is back to X');
assert(!getCell(0, 0).classList.contains('winner'), 'PvP Undo Win: Winner highlights are cleared');


// O. PvE Undo test (2 moves)
elements['caro-mode'].value = 'pve';
elements['caro-reset-btn'].dispatchEvent('click');

// X plays (7,7), AI plays O
getCell(7, 7).dispatchEvent('click');

const playedCellsBeforeUndo = getCells().filter(cell => cell.classList.contains('played'));
assert(playedCellsBeforeUndo.length === 2, 'PvE Undo: Board has 2 played cells before undo');

// Click Undo -> Should undo both AI move and Player move
elements['caro-undo-btn'].dispatchEvent('click');

const playedCellsAfterUndo = getCells().filter(cell => cell.classList.contains('played'));
assert(playedCellsAfterUndo.length === 0, 'PvE Undo: Board has 0 played cells after undo');
assert(getCell(7, 7).textContent === '', 'PvE Undo: Player cell text is cleared after undo');
assert(elements['caro-turn-indicator'].innerHTML.includes('X'), 'PvE Undo: Turn is back to player X');


// P. Reset Score test
elements['caro-mode'].value = 'pvp';
elements['caro-reset-btn'].dispatchEvent('click');

// Set score manually by forcing a win
getCell(0, 0).dispatchEvent('click'); // X
getCell(1, 0).dispatchEvent('click'); // O
getCell(0, 1).dispatchEvent('click'); // X
getCell(1, 1).dispatchEvent('click'); // O
getCell(0, 2).dispatchEvent('click'); // X
getCell(1, 2).dispatchEvent('click'); // O
getCell(0, 3).dispatchEvent('click'); // X
getCell(1, 3).dispatchEvent('click'); // O
getCell(0, 4).dispatchEvent('click'); // X -> X wins!

assert(elements['score-x'].textContent == 1, 'Reset Score: Score X is 1');

// Click Reset Score button
elements['caro-reset-score-btn'].dispatchEvent('click');
assert(elements['score-x'].textContent == 0, 'Reset Score: Score X is reset to 0');
assert(elements['score-o'].textContent == 0, 'Reset Score: Score O is reset to 0');
assert(elements['score-ties'].textContent == 0, 'Reset Score: Score Ties is reset to 0');

// Cleanup for next steps
elements['caro-mode'].value = 'pvp';
elements['caro-reset-btn'].dispatchEvent('click');


// Summary of tests
console.log('\n--- FINAL SUMMARY ---');
const total = results.length;
const passed = results.filter(r => r.status === 'PASS').length;
console.log(`Passed: ${passed}/${total}`);

if (passed === total) {
  console.log('ALL TESTS PASSED.');
  process.exit(0);
} else {
  console.error('SOME TESTS FAILED.');
  process.exit(1);
}
