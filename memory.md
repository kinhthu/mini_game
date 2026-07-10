# Memory: Mini Game Hub Integration

## Last Updated
2026-07-10

## Tech Stack
- HTML5 (Structure)
- CSS3 (Vanilla styles, Glassmorphism, Neon gold/cyan/coral/purple/blue glow)
- JavaScript (Vanilla ES6, client-side SPA routing)
- Node.js (Unit test suite execution)

## Key Architecture Decisions
- **SPA Architecture**: Converted the single-view Memory Match page into a multi-game SPA controlled by `GameHub` showing/hiding view containers (`#lobby-view`, `#memory-match-view`, `#tictactoe-view`, `#caro-view`, `#cangua-view`).
- **Profile & Statistics Sync**: Profile name edits, ranks, and match history are stored centrally in `localStorage` and shared/synchronized automatically across game modes (Memory Match, Tic Tac Toe, Caro, and Cờ Cá Ngựa) and the lobby dashboard.
- **Unbeatable Minimax AI**: Added Tic Tac Toe game with a depth-aware Minimax algorithm (O player maximizes, X player minimizes) ensuring unbeatable performance on the 3x3 board.
- **Heuristic Evaluation AI**: Added Caro (Gomoku 15x15) game with a fast Heuristic Evaluation algorithm weighing attacks and defenses on empty cells to block and win efficiently. Bypassed Minimax due to state-space size.
- **Cờ Cá Ngựa Heuristic AI & Multi-Dice Logic**: Implemented Cờ Cá Ngựa (Ludo) game with a 5-tier heuristic decision making AI (Kick -> Deploy -> Climb -> Advance furthest horse -> Random) and double dice rolling mechanics with deployment triggers (Double or 1-6) and capped consecutive rolls (max 3).
- **Artificial Delay**: Implemented a 300ms delay for Caro AI moves, a 500ms delay for Tic Tac Toe AI moves, and an 800ms delay for Cờ Cá Ngựa AI actions with status label feedback to ensure a natural gameplay flow.
- **Multi-step Undo**: Designed undo stacks supporting 1-step undo in PvP and 2-step undo in PvE to cleanly revert both AI and player moves.
- **Reconstructed Directory Layout**: Refactored scripts into clean subdirectories (`js/` and `js/games/`) to logically separate navigation logic and game engines.

## Key Files Map
- `index.html`: Holds the DOM views for the Lobby, Memory Match, Tic Tac Toe, Caro, and Cờ Cá Ngựa.
- `style.css`: Contains CSS rules, variables, glassmorphism cards, neon piece glows, win animations, 3D dice components, and board layouts.
- `js/main.js`: Hub navigation, Profile management, and central lobby stats bindings.
- `js/games/match.js`: Memory Match game logic with levels.
- `js/games/tictactoe.js`: Core Tic Tac Toe game controller, PvP/PvE logic, and AI minimax implementation.
- `js/games/caro.js`: Core Caro (Gomoku 15x15) game controller, PvP/PvE logic, and Heuristic AI.
- `js/games/cangua.js`: Core Cờ Cá Ngựa game engine, turn coordinator, and heuristic AI.
- `test_tictactoe_logic.js`: Unit tests verifying victory checks and minimax block/win decisions.
- `test_caro_logic.js`: Unit tests verifying Caro win check, Heuristic AI defense, and PvE undo stack.
- `test_match_logic.js`: Unit tests verifying Memory Match pair verification and victory logic.
- `test_cangua_logic.js`: Unit tests validating Ludo deployment, movement, kicking, stretch climbing, and win condition checks.
- `tasks.md`: Task checklist registered with the Project Manager.

## Recent Schema Changes
No database schema exists. LocalStorage schema keys are defined as follows:
- `player_nickname` (String)
- `memory_match_wins` / `memory_match_played` / `memory_match_level` (Integer)
- `ttt_game_mode` ('pvp' / 'pve')
- `ttt_ai_diff` ('easy' / 'hard')
- `ttt_pvp_wins` / `ttt_pvp_losses` / `ttt_pvp_draws` (Integer)
- `ttt_pve_wins` / `ttt_pve_losses` / `ttt_pve_draws` (Integer)
- `caro_game_mode` ('pvp' / 'pve')
- `caro_ai_diff` ('easy' / 'hard')
- `caro_pvp_wins` / `caro_pvp_losses` / `caro_pvp_draws` (Integer)
- `caro_pve_wins` / `caro_pve_losses` / `caro_pve_draws` (Integer)
- `cangua_wins` / `cangua_played` (Integer)

## API Contracts
Standard browser-based event-driven API and HTML5 LocalStorage interface.

## Pitfalls & Lessons
- **MCP SSE vs POST**: Avoided SSE streams for MCP server communication in helper scripts due to Python buffering hangs; used direct HTTP POST instead.
- **PvE Undo**: Undoing a move in PvE must pop two states (AI's move and player's move) to keep the turn with the player, whereas PvP only pops one.
- **UI Locking**: In PvE, board clicks must be disabled when AI is thinking (`isAiMoving = true`) to prevent race conditions.
- **Heuristic Weights**: The Caro AI weights must scale with the length of the matching run, prioritizing winning moves (5-in-a-row) and open-four threats over simple three-in-a-row blocks.
- **Safe DOM Text Value Parsing**: Parsing DOM elements (e.g. textContent) under Node.js testing requires strict safeguards (handling NaN and undefined objects) due to missing real DOM properties in simple test mocks.
