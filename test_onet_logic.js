const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem(key) { return store[key] || null; },
        setItem(key, value) { store[key] = String(value); },
        clear() { store = {}; }
    };
})();

// Mock window and global document
global.window = global;
global.localStorage = localStorageMock;

// Mock ProfileManager
global.ProfileManager = {
    updateUICalled: false,
    updateUI() {
        this.updateUICalled = true;
    }
};

const elements = {};
global.document = {
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                textContent: '',
                _innerHTML: '',
                dataset: {},
                get innerHTML() { return this._innerHTML; },
                set innerHTML(val) {
                    this._innerHTML = val;
                    if (val === '') {
                        this.children = [];
                    }
                },
                classList: {
                    classes: [],
                    add(cls) {
                        this.classes.push(cls);
                    },
                    remove(cls) {
                        this.classes = this.classes.filter(c => c !== cls);
                    },
                    contains(cls) {
                        return this.classes.includes(cls);
                    }
                },
                style: {},
                children: [],
                appendChild(child) {
                    this.children.push(child);
                },
                addEventListener(evt, cb) {
                    this.listeners = this.listeners || {};
                    this.listeners[evt] = cb;
                },
                querySelector(selector) {
                    // Quick mock querySelector for data attributes
                    const match = selector.match(/\[data-row="(\d+)"\]\[data-col="(\d+)"\]/);
                    if (match) {
                        const r = parseInt(match[1], 10);
                        const c = parseInt(match[2], 10);
                        return this.children.find(child => 
                            child.dataset.row === r && child.dataset.col === c
                        );
                    }
                    return null;
                },
                getBoundingClientRect() {
                    return { left: 0, top: 0, width: 400, height: 400 };
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
                    if (!this.classes.includes(cls)) {
                        this.classes.push(cls);
                    }
                    el.className = this.classes.join(' ');
                },
                remove(cls) {
                    this.classes = this.classes.filter(c => c !== cls);
                    el.className = this.classes.join(' ');
                },
                contains(cls) {
                    return this.classes.includes(cls);
                }
            },
            setAttribute(name, value) {
                if (name === 'data-row') this.dataset.row = parseInt(value, 10);
                if (name === 'data-col') this.dataset.col = parseInt(value, 10);
                el[name] = value;
            },
            appendChild(child) {
                this.children.push(child);
            },
            addEventListener(evt, cb) {
                this.listeners = this.listeners || {};
                this.listeners[evt] = cb;
            },
            getBoundingClientRect() {
                // Mock client rect for center mapping
                const r = this.dataset.row || 0;
                const c = this.dataset.col || 0;
                return {
                    left: c * 50,
                    top: r * 50,
                    width: 40,
                    height: 40
                };
            }
        };
        return el;
    },
    createElementNS(ns, tag) {
        return this.createElement(tag);
    }
};

// Load onet.js
const onetScriptPath = path.join(__dirname, 'js', 'games', 'onet.js');
const code = fs.readFileSync(onetScriptPath, 'utf8');
eval(code);

console.log("--- UNIT TESTS FOR js/games/onet.js ---");

// Test 1: Initialization & Configurations
console.log("Test 1: Initialization");
OnetConnect.init();

if (OnetConnect.level === 1 && OnetConnect.score === 0 && OnetConnect.hints === 3 && OnetConnect.shuffles === 3) {
    console.log("  PASS: Initialized states correctly (level=1, score=0, hints=3, shuffles=3).");
} else {
    console.error("  FAIL: Initial state load mismatch:", OnetConnect);
    process.exit(1);
}

const config1 = OnetConnect.getLevelConfig(1);
if (config1.rows === 4 && config1.cols === 6 && config1.time === 180) {
    console.log("  PASS: Level 1 config correct (4x6, 180s).");
} else {
    console.error("  FAIL: Level 1 config mismatch:", config1);
    process.exit(1);
}

// Test 2: Grid Padding (H+2 x W+2) & Board boundaries
console.log("Test 2: Grid Padding & Boundary Initialization");
if (OnetConnect.grid.length === 6 && OnetConnect.grid[0].length === 8) {
    console.log("  PASS: Grid correctly initialized with size 6x8 (including padding for 4x6 active cells).");
} else {
    console.error("  FAIL: Padded grid size mismatch. rows x cols:", OnetConnect.grid.length, OnetConnect.grid[0]?.length);
    process.exit(1);
}

// Validate outer cells are empty (0)
let boundaryIsClear = true;
for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
        if (r === 0 || r === 5 || c === 0 || c === 7) {
            if (OnetConnect.grid[r][c] !== 0) {
                boundaryIsClear = false;
            }
        }
    }
}
if (boundaryIsClear) {
    console.log("  PASS: Boundary rows and columns are correctly initialized to 0.");
} else {
    console.error("  FAIL: Boundary cell holds active tile.");
    process.exit(1);
}

// Test 3: isPathClear helper correctness
console.log("Test 3: isPathClear correctness");
// Let's manually set up a custom grid for deterministic pathfinding testing
// Grid size 6x8. Active cells 1..4, 1..6
// 0 0 0 0 0 0 0 0
// 0 A 0 B 0 0 0 0
// 0 0 0 C 0 0 0 0
// 0 0 0 0 0 D 0 0
// 0 E F G H 0 0 0
// 0 0 0 0 0 0 0 0
OnetConnect.grid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, '🍇', 0, '🍇', 0, 0, 0, 0],
    [0, 0, 0, '🍉', 0, 0, 0, 0],
    [0, 0, 0, 0, 0, '🍍', 0, 0],
    [0, '🍊', '🍊', '🍊', '🍊', 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

// Straight checks
if (OnetConnect.isPathClear(1, 1, 1, 3)) {
    console.log("  PASS: isPathClear correctly identifies horizontal clear path between (1,1) and (1,3).");
} else {
    console.error("  FAIL: isPathClear horizontal failed.");
    process.exit(1);
}

// Horizontal blocked checks
if (!OnetConnect.isPathClear(4, 1, 4, 4)) {
    console.log("  PASS: isPathClear correctly identifies horizontal blocked path.");
} else {
    console.error("  FAIL: isPathClear horizontal block undetected.");
    process.exit(1);
}

// Vertical blocked check
if (!OnetConnect.isPathClear(1, 3, 4, 3)) {
    console.log("  PASS: isPathClear correctly identifies vertical blocked path.");
} else {
    console.error("  FAIL: isPathClear vertical block undetected.");
    process.exit(1);
}

// Test 4: findLink Pathfinder (0, 1, 2 turns)
console.log("Test 4: findLink correctness");

// 0-turn match (straight clear path, e.g. (1,1) to (1,3) which has clear cell (1,2) in between)
let path0 = OnetConnect.findLink(1, 1, 1, 3);
if (path0 && path0.length === 2) {
    console.log("  PASS: 0-turn straight path found and has correct structure.");
} else {
    console.error("  FAIL: 0-turn path not found or length wrong. Path:", path0);
    process.exit(1);
}

// 1-turn match (L-shaped, e.g. from (1,1)🍇 to (4,2)🍊 using path A(1,1)->C(4,1)->D(4,2)
// Let's check: (1,1) to (4,2).
// Column-wise path through col 1:
// A(1,1) -> C(1,1) -> D(4,1) -> B(4,2).
// Path is clear if (2,1), (3,1) are clear, and (4,1) is '🍊' but we are checking path to (4,2) which is also occupied.
// Wait! Let's clear the cell (4,1) first:
OnetConnect.grid[4][1] = 0; // Clear it to make it route-able
let path1 = OnetConnect.findLink(1, 1, 4, 2);
if (path1 && path1.length === 3) {
    console.log("  PASS: 1-turn path found and has correct turn points.");
} else {
    console.error("  FAIL: 1-turn path failed. Path:", path1);
    process.exit(1);
}

// 2-turn match (U-shaped path, using outer boundary)
// e.g. from (1,1)🍇 to (1,3)🍇. Wait, 0-turn exists.
// Let's block (1,2) by putting a tile '🍒' there.
OnetConnect.grid[1][2] = '🍒';
// Now, direct path is blocked. But can we go via row 0 (boundary)?
// (1,1) -> (0,1) -> (0,3) -> (1,3)
// Check if (0,1) and (0,3) are clear (boundaries are 0).
// And segments are: (1,1)->(0,1) (clear), (0,1)->(0,3) (clear), (0,3)->(1,3) (clear)
let path2 = OnetConnect.findLink(1, 1, 1, 3);
if (path2 && path2.length === 4 && path2[1].r === 0 && path2[2].r === 0) {
    console.log("  PASS: 2-turn path found through boundary row 0.");
} else {
    console.error("  FAIL: 2-turn path through boundary failed. Path:", path2);
    process.exit(1);
}

// Mismatch/Block check
// Try path between (1,1)🍇 and (3,5)🍍 (completely blocked or diagonal with too many turns)
OnetConnect.grid[3][4] = '🍒';
OnetConnect.grid[2][5] = '🍒';
OnetConnect.grid[4][5] = '🍒';
OnetConnect.grid[3][6] = '🍒'; // Block adjacent active cell
let pathBlocked = OnetConnect.findLink(1, 1, 3, 5);
if (pathBlocked === null) {
    console.log("  PASS: findLink correctly returns null for blocked/invalid links.");
} else {
    console.error("  FAIL: findLink returned path for blocked connection:", pathBlocked);
    process.exit(1);
}

// Test 5: Click Handling & Match execution
console.log("Test 5: Tile Click & Selection State Machine");
// Set grid back to a state where we have two matching 🍇 at (1,1) and (1,3)
OnetConnect.grid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, '🍇', 0, '🍇', 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];
OnetConnect.renderBoard();

// Click (1,1) - should select it
OnetConnect.handleTileClick(1, 1);
if (OnetConnect.selectedTile && OnetConnect.selectedTile.r === 1 && OnetConnect.selectedTile.c === 1) {
    console.log("  PASS: Clicking first tile selects it.");
} else {
    console.error("  FAIL: First tile selection failed.");
    process.exit(1);
}

// Click same tile (1,1) - should deselect
OnetConnect.handleTileClick(1, 1);
if (OnetConnect.selectedTile === null) {
    console.log("  PASS: Double click on same tile deselects it.");
} else {
    console.error("  FAIL: Double click deselection failed.");
    process.exit(1);
}

// Click (1,1) then click mismatch tile (e.g. if we set (1,3) to 🍍)
OnetConnect.grid[1][3] = '🍍';
OnetConnect.renderBoard();
OnetConnect.handleTileClick(1, 1);
OnetConnect.handleTileClick(1, 3);
if (OnetConnect.selectedTile && OnetConnect.selectedTile.r === 1 && OnetConnect.selectedTile.c === 3) {
    console.log("  PASS: Clicking mismatching tile switches selection to the new tile.");
} else {
    console.error("  FAIL: Mismatch selection swap failed.");
    process.exit(1);
}

// Set back to matching '🍇'
OnetConnect.grid[1][3] = '🍇';
OnetConnect.selectedTile = null;
OnetConnect.renderBoard();

// Click (1,1) then click matching (1,3)
OnetConnect.handleTileClick(1, 1);
OnetConnect.handleTileClick(1, 3);

// Since matching triggers executeMatch, which locks board and clears after 400ms:
if (OnetConnect.isBoardLocked) {
    console.log("  PASS: Matching locks board for execution delay.");
} else {
    console.error("  FAIL: Matching did not lock board.");
    process.exit(1);
}

// Verify grid is cleared immediately or after delay
if (OnetConnect.grid[1][1] === 0 && OnetConnect.grid[1][3] === 0) {
    console.log("  PASS: Matched tile values set to 0 in grid model.");
} else {
    console.error("  FAIL: Grid cells were not cleared.");
    process.exit(1);
}

if (OnetConnect.score === 10) {
    console.log("  PASS: Score incremented by +10.");
} else {
    console.error("  FAIL: Score not updated correctly:", OnetConnect.score);
    process.exit(1);
}

// Test 6: Auto-Shuffle & Manual Shuffle
console.log("Test 6: Shuffling logic");
// Reset grid to active tiles
OnetConnect.grid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, '🍇', '🍉', '🍍', '🍒', 0, 0, 0],
    [0, '🍇', '🍉', '🍍', '🍒', 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];
OnetConnect.renderBoard();
OnetConnect.shuffles = 3;
OnetConnect.isBoardLocked = false;

OnetConnect.manualShuffle();
if (OnetConnect.shuffles === 2) {
    console.log("  PASS: Manual shuffle decrements shuffles counter.");
} else {
    console.error("  FAIL: Shuffle counter did not decrement.");
    process.exit(1);
}

if (OnetConnect.hasValidMoves()) {
    console.log("  PASS: Shuffle guarantees a valid move remains available.");
} else {
    console.error("  FAIL: Shuffled board has no valid moves.");
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
