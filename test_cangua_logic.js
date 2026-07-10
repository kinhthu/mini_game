const fs = require('fs');
const path = require('path');

// Read cangua.js content
const canguaPath = path.join(__dirname, 'js', 'games', 'cangua.js');
const code = fs.readFileSync(canguaPath, 'utf8');

// Mock DOM elements
const elements = {};
global.document = {
    createElement(tag) {
        return {
            tagName: tag.toUpperCase(),
            classList: {
                add(cls) {
                    this.classes = this.classes || [];
                    if (!this.classes.includes(cls)) this.classes.push(cls);
                },
                remove(cls) {
                    this.classes = this.classes || [];
                    this.classes = this.classes.filter(c => c !== cls);
                },
                contains(cls) {
                    this.classes = this.classes || [];
                    return this.classes.includes(cls);
                }
            },
            style: {},
            dataset: {},
            textContent: '',
            appendChild() {},
            onclick: null
        };
    },
    getElementById(id) {
        if (!elements[id]) {
            elements[id] = {
                id: id,
                textContent: '',
                className: '',
                classList: {
                    add(cls) {
                        this.classes = this.classes || [];
                        if (!this.classes.includes(cls)) this.classes.push(cls);
                    },
                    remove(cls) {
                        this.classes = this.classes || [];
                        this.classes = this.classes.filter(c => c !== cls);
                    },
                    contains(cls) {
                        this.classes = this.classes || [];
                        return this.classes.includes(cls);
                    }
                },
                style: {},
                dataset: {},
                addEventListener() {},
                setAttribute() {},
                removeAttribute() {},
                appendChild() {},
                disabled: false,
                querySelector(selector) {
                    return {
                        classList: {
                            add() {},
                            remove() {},
                            contains() { return false; }
                        },
                        dataset: {},
                        onclick: null,
                        appendChild() {}
                    };
                },
                querySelectorAll(selector) {
                    return [];
                }
            };
        }
        return elements[id];
    },
    querySelectorAll(selector) {
        return [];
    },
    querySelector(selector) {
        // Return dummy cell or element
        return {
            classList: {
                add() {},
                remove() {},
                contains() { return false; }
            },
            dataset: {},
            onclick: null
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

global.alert = (msg) => { console.log(`  [Alert Mocked]: ${msg}`); };
global.confirm = (msg) => { return true; };
global.window = global;

// Eval the game code to register CanGuaGame on window
eval(code);

const Game = global.window.CanGuaGame;

console.log("--- STARTING CỜ CÁ NGỰA GAME LOGIC UNIT TESTS ---");

// Test 1: Initialization & Settings loading
console.log("Test 1: Initialization and setupPlayers");
Game.numPlayers = 4;
Game.mode = 'pvp';
Game.init();

if (Game.horses.length === 16 && Game.players.length === 4 && Game.activePlayerIdx === 0) {
    console.log("  PASS: Game state and 16 horses initialized successfully.");
} else {
    console.error("  FAIL: Initialization failed.", { horsesLen: Game.horses.length, playersLen: Game.players.length });
    process.exit(1);
}

// Test 2: Deployment rule
console.log("Test 2: Deployment options on Double / 1-6 throws");
Game.activePlayerIdx = 0; // Red
// Mock a Double: [6, 6]
Game.diceValues = [6, 6];
Game.movesLeft = [6, 6];
let moves = Game.getHorseValidMoves(0); // Red horse 0 in stable

let hasDeploy = moves.some(m => m.type === 'deploy' && m.targetPos === Game.START_INDEXES[0]);
if (hasDeploy) {
    console.log("  PASS: Deployment option computed correctly for Double roll [6,6].");
} else {
    console.error("  FAIL: Deployment option not found for Double roll.");
    process.exit(1);
}

// Mock a 1-6: [1, 6]
Game.diceValues = [1, 6];
Game.movesLeft = [1, 6];
moves = Game.getHorseValidMoves(0);
hasDeploy = moves.some(m => m.type === 'deploy' && m.targetPos === Game.START_INDEXES[0]);
if (hasDeploy) {
    console.log("  PASS: Deployment option computed correctly for 1-6 roll [1,6].");
} else {
    console.error("  FAIL: Deployment option not found for 1-6 roll.");
    process.exit(1);
}

// Mock non-deployment roll: [2, 3]
Game.diceValues = [2, 3];
Game.movesLeft = [2, 3];
moves = Game.getHorseValidMoves(0);
hasDeploy = moves.some(m => m.type === 'deploy');
if (!hasDeploy) {
    console.log("  PASS: Horse remains locked in stable for non-deployable roll [2,3].");
} else {
    console.error("  FAIL: Erroneously computed deploy option for non-deployable roll [2,3].");
    process.exit(1);
}

// Test 3: Clockwise track movement & options
console.log("Test 3: Track movement valid options and sum move");
// Deploy Red horse 0 to pos 1
const horse0 = Game.horses[0];
horse0.state = 'track';
horse0.position = 1;
horse0.distance = 0;

Game.movesLeft = [3, 4];
moves = Game.getHorseValidMoves(0);

// We expect options to move by 3 (pos 4), by 4 (pos 5), or by 7 (pos 8)
const targets = moves.map(m => m.targetPos);
const hasPos4 = targets.includes(4);
const hasPos5 = targets.includes(5);
const hasPos8 = targets.includes(8);

if (hasPos4 && hasPos5 && hasPos8) {
    console.log("  PASS: Valid move calculations computed for individual dice values and sum.");
} else {
    console.error("  FAIL: Track moves did not include expected positions [4, 5, 8]. Got:", targets);
    process.exit(1);
}

// Test 4: Kicking opponents
console.log("Test 4: Kicking opponent horses");
// Place Red horse at pos 10
horse0.position = 10;
horse0.distance = 9;

// Place Green horse at pos 15 (Green is player 1)
const greenHorse = Game.horses[4];
greenHorse.state = 'track';
greenHorse.position = 15;
greenHorse.distance = 2;

// Red rolls a 5 and clicks/executes landing on Green at pos 15
Game.activePlayerIdx = 0;
const moveKick = {
    type: 'move',
    targetState: 'track',
    targetPos: 15,
    targetDistance: 14,
    spendMoves: [5]
};
Game.movesLeft = [5];
Game.executeMove(0, moveKick);

if (horse0.position === 15 && greenHorse.state === 'stable') {
    console.log("  PASS: Red horse moves to pos 15, and Green horse is successfully kicked back to stable.");
} else {
    console.error("  FAIL: Kicking failed.", { redPos: horse0.position, greenState: greenHorse.state });
    process.exit(1);
}

// Test 5: Entering Home Stretch and Climbing
console.log("Test 5: Home stretch entry and climbing rules");
// Place Red horse at end of track (pos 0, distance 51)
horse0.position = 0;
horse0.distance = 51;

Game.movesLeft = [3];
moves = Game.getHorseValidMoves(0);

// Should be able to enter step 3 of home stretch
const hasHome3 = moves.some(m => m.type === 'enter_home' && m.targetPos === 3);
if (hasHome3) {
    console.log("  PASS: Horse can enter home stretch step 3 directly if rolling a 3.");
} else {
    console.error("  FAIL: Missing home stretch step 3 entry option.");
    process.exit(1);
}

// Perform entry
Game.executeMove(0, moves.find(m => m.type === 'enter_home' && m.targetPos === 3));

// Now horse 0 is in home stretch at step 3. Let's test climbing rules.
Game.movesLeft = [1, 5]; // 1 can climb to 4, 5 can jump to 5 (since 5 > 3)
moves = Game.getHorseValidMoves(0);

const hasClimb4 = moves.some(m => m.type === 'climb_home' && m.targetPos === 4);
const hasJump5 = moves.some(m => m.type === 'jump_home' && m.targetPos === 5);

if (hasClimb4 && hasJump5) {
    console.log("  PASS: Home stretch climbing (by 1 step with dice 1) and jumping (to step Y with dice Y) work correctly.");
} else {
    console.error("  FAIL: Missing climbing or jumping options in home stretch.", moves);
    process.exit(1);
}

// Test 6: Win Condition detection
console.log("Test 6: Win condition detection");
// Place Red horses (0, 1, 2, 3) on home stretch at steps 6, 5, 4, 3
Game.horses[0].state = 'home'; Game.horses[0].position = 6;
Game.horses[1].state = 'home'; Game.horses[1].position = 5;
Game.horses[2].state = 'home'; Game.horses[2].position = 4;
Game.horses[3].state = 'home'; Game.horses[3].position = 3;

const winPlayer = Game.checkWinCondition();
if (winPlayer === 0) {
    console.log("  PASS: Win condition successfully detected when Red has horses on steps 6, 5, 4, 3.");
} else {
    console.error("  FAIL: Win condition not detected. Got:", winPlayer);
    process.exit(1);
}

console.log("ALL TESTS COMPLETED SUCCESSFULLY! VERDICT: PASS");
process.exit(0);
