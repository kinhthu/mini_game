# Memory Match & Gomoku Portal Memory

## Project Context
This is a game portal workspace featuring two games:
1. **Memory Match**: A matching puzzle game with dynamic level scaling.
2. **Cờ Ca Rô (Gomoku)**: A grid strategy game with AI play (under implementation).

## Architecture & Layout
- **index.html**: Single Page Application container dividing screens into distinct blocks:
  - `#lobby-screen`: Main portal/lobby.
  - `#memory-game-container`: Hidden initially, containing the memory board.
  - `#caro-game-container`: Hidden initially, containing the Gomoku board.
- **style.css**: Shared Glassmorphism stylesheet containing:
  - Custom color variables.
  - Cards with zoom transition and radial glow styling.
  - Game grid layouts and visibility utility classes.
- **js/**: JavaScript source directory containing decoupled components:
  - `js/memory.js`: Memory Match game logic, encapsulated under the `window.MemoryGame` namespace.
  - `js/caro.js`: Placeholder implementation for the Gomoku game, exposing `window.CaroGame`.
  - `js/app.js`: Main router managing screen transitions, navigation state, and event mappings.

## Task 1 Implementation Details
- Modularized code structure to keep game code isolated.
- Replaced the single-game view with a beautiful lobby dashboard layout using Glassmorphism design and glow micro-animations.
- Implemented "Back to Lobby" logic for seamless game pausing and timer cleanup.
- **Bugfix (Revision 1)**: Fixed a memory leak where `unflipCards` timeout remained active after restarting the game or going back to the lobby, which caused unexpected state resets. Added module-level tracking of `unflipTimeout` and guaranteed its clearance inside `resetGame` and `stopMemoryGame`.

## Task 2 Implementation Details
- **HTML Layout**: Added Caro UI container with mode (PvP/PvE) and rule (Standard/Vietnamese) selectors, score counters (X, O, Ties), turn indicators, reset buttons, and a win dialog modal.
- **CSS Styling**: Added a modern responsive 15x15 Caro Board. Added hover preview styles showing low opacity ghost indicators, glow highlights for X (#fb7185) and O (#10b981), and pulse animation on win.
- **Modular JavaScript**: Replaced the empty placeholder `js/caro.js` with dynamic board setup, 2D board state matrix tracking, human-alternating PvP turns, modular turn indicators, scoreboard update, and custom modal handling.
- **Win & Tie Algorithms**: Developed an optimized search-from-position win checker checking horizontal, vertical, and diagonals for 5 in a row. Added early integration of Vietnamese blocked-ends rule check.

## Task 2 QA Verification Details
- **Test Suite**: Created `test_caro.js` using a lightweight DOM mocking context in Node.js to verify the game components, styling classes, state logic, turn toggling, win check triggers, and board reset operations.
- **Verification Result**: Passed all 32 assertions verifying 5/5 of the required acceptance criteria:
  1. The 15x15 board (225 cells) is dynamically generated inside the container.
  2. Clicking cells registers correct turns (X vs O) and prevents double moves on already played cells.
  3. Ghost previews are correctly rendered on hover and removed on mouseleave.
  4. Turn indicator changes color and updates text dynamically based on the active player.
  5. Reset button restarts the board, clears cell classes, and resets turn to X while keeping scoreboard scores intact.
- **Status**: QA verdict reported as `PASS` and task item marked as `done` in the control plane.

## Task 3 Implementation & Verification Details
- **Win Checker & Vietnamese Rule Filter**: Verified the core `checkWin` logic under standard rules (5 or more in a row across horizontal, vertical, and both diagonals) and Vietnamese rules (having 5 or more pieces in a row blocked at both ends by the opponent's symbol).
- **Winning Highlight Optimization**: Updated `js/caro.js` and `style.css` to add player-specific winner classes (`x-winner` and `o-winner`). Configured distinct animations: a rose-colored pulse glow for Player X (`winnerPulseX`) and an emerald-green pulse glow for Player O (`winnerPulseO`).
- **Rigorous Test Coverage**: Extended the test suite in `test_caro.js` from 32 assertions to 61 assertions by adding 11 detailed win-checking test sequences. The new tests verify:
  1. Standard vertical, horizontal, diagonal down-right, and diagonal down-left wins.
  2. 6-in-a-row wins.
  3. Vietnamese rule scenarios: blocked at one end by opponent (win), blocked at both ends by opponent (no win), blocked by board edge (win), blocked by board edge + opponent (win), and 6-in-a-row blocked at both ends (no win).
  4. Standard rule verification under blocked-ends configuration (retains win).
- **Test Status**: All 61 assertions run and pass successfully in the mocked Node.js test environment.

## Task 4 Implementation & Verification Details
- **AI Heuristic Engine**: Created `js/caro-ai.js` exposing `window.CaroAI.getBestMove`. Designed a 5-cell window evaluation algorithm scoring attack (`aiSymbol`) and defense (`opponentSymbol`) states using specified strategic weights (5-in-a-row: 100,000; Live 4: 10,000; Blocked 4/Live 3: 1,000; Blocked 3/Live 2: 100; Single piece: 10).
- **Vietnamese Rule Support**: Enhanced window evaluation to detect blocked-ends at both ends by the opponent's symbol. Integrates with the core win checker to dynamically filter out blocked 5-in-a-rows from winning evaluations.
- **PvE Game Loop**: Integrated the AI engine in `js/caro.js`. X plays first, O is AI. Added:
  - `isAiThinking` lock preventing board interactions (click/hover) during AI thinking phase.
  - Simulated async delay of 400ms mimicking natural play.
  - Active timeout tracking (`aiTimeout`) cleared on reset, screen transitions, or game stop to ensure zero memory leaks.
- **QA Verification**: Extended the test suite in `test_caro.js` from 61 to 66 assertions, adding a dedicated PvE integration flow verifying player clicks, simulated AI response, correct piece rendering (X and O), and turn handover. All 66 assertions pass successfully.
- **Reviewer Verification**: Verified script loading sequence in `index.html`, AI loop lock `isAiThinking` and timeout cleanup in `js/caro.js`, Vietnamese rule window scoring logic in `js/caro-ai.js`, and QA coverage in `test_caro.js`. All checks passed. Verdict: `APPROVED`.

## Task 5 Implementation & Verification Details
- **Undo Logic**: Implemented the `moveHistory` array in [caro.js](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/js/caro.js). Handled undo logic for PvP (reverts 1 move) and PvE (reverts 2 moves by default, or 1 move if player won in the last turn). Cleaned up winning highlights, turn indicators, and reverted scores appropriately on undoing victory moves.
- **Scoreboard Reset**: Added a dedicated `Reset Score` button in [index.html](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/index.html) allowing players to wipe all wins/losses and start fresh. Connected to `fullReset` in [caro.js](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/js/caro.js).
- **Sound Effects**: Integrated rich synthesized sound effects utilizing Web Audio API directly in [caro.js](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/js/caro.js), eliminating external audio file dependencies. Built functions `playClickSound()` and `playWinSound()`.
- **Responsive Layout**: Added CSS media queries in [style.css](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/style.css) to dynamically shrink the Caro board size to fit smaller mobile screen widths, avoiding layout breakages or horizontal overflows on 480px-wide devices.
- **QA Verification**: Extended [test_caro.js](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/test_caro.js) test cases to 91 assertions. Verified PvP basic undo, PvP undo after win, PvE undo, and Reset Score functionality. All tests pass successfully.

## Task 6 Final Verification & Quality Assurance
- **Integrity Check**: Verified script loading sequence, DOM element references, and styling overrides. Checked for regression on Memory Match game; verified routing and navigation transitions in [app.js](file:///D:/workspace/wt-6c7ee045bf964b3a912c2e0e23489e8d/js/app.js) are stable.
- **Mock Tests**: Executed the expanded test suite using the Node.js context and verified that all 91 test assertions passed cleanly.
- **Rules Compliance**: Followed isolated branch workflow, reflection guidelines, and MCP control signals correctly. Updated project memory file.
