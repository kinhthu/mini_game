# Memory: Mini Game Hub Integration

## Last Updated
2026-07-12

## Tech Stack
- HTML5 (Structure)
- CSS3 (Vanilla styles, Glassmorphism, Neon gold/cyan/coral/purple/blue/green glow)
- JavaScript (Vanilla ES6, client-side SPA routing)
- Node.js (Unit test suite execution)

## Key Architecture Decisions
- **SPA Architecture**: Converted the single-view Memory Match page into a multi-game SPA controlled by `GameHub` showing/hiding view containers (`#lobby-view`, `#memory-match-view`, `#tictactoe-view`, `#caro-view`, `#cangua-view`, `#chess-view`, `#tuong-view`).
- **Profile & Statistics Sync**: Profile name edits, ranks, and match history are stored centrally in Central LocalStorage and shared/synchronized automatically across game modes (Memory Match, Tic Tac Toe, Caro, Cờ Cá Ngựa, Chess, and Cờ Tướng) and the lobby dashboard.
- **Unbeatable Minimax AI**: Added Tic Tac Toe game with a depth-aware Minimax algorithm (O player maximizes, X player minimizes) ensuring unbeatable performance on the 3x3 board.
- **Heuristic Evaluation AI**: Added Caro (Gomoku 15x15) game with a fast Heuristic Evaluation algorithm weighing attacks and defenses on empty cells to block and win efficiently. Bypassed Minimax due to state-space size.
- **Cờ Cá Ngựa Heuristic AI & Multi-Dice Logic**: Implemented Cờ Cá Ngựa (Ludo) game with a 5-tier heuristic decision making AI (Kick -> Deploy -> Climb -> Advance furthest horse -> Random) and double dice rolling mechanics with deployment triggers (Double or 1-6) and capped consecutive rolls (max 3).
- **Chess Minimax with Alpha-Beta Pruning**: Integrated Chess (Cờ Vua) with an 8x8 grid, full move rules (castling, en passant, promotion modal), and a depth-2 Minimax AI equipped with Alpha-Beta Pruning and positional evaluation tables for strategic play.
- **Chinese Chess Minimax with Alpha-Beta Pruning**: Integrated Cờ Tướng (Xiangqi) with a 9x10 grid, full move rules (advisor palace bounds, elephant river limits, elephant eye blocking, knight foot blocking, cannon capture screens, and King facing checks), and a depth-2 Minimax AI equipped with Alpha-Beta Pruning and positional evaluation heuristics (e.g. piece values, center columns bonuses, and knight mobility).
- **Artificial Delay**: Implemented delay timers for Caro AI (300ms), Tic Tac Toe AI (500ms), Ludo AI (800ms), Chess AI (700ms/400ms), and Cờ Tướng AI (600ms/800ms) with status label feedback to ensure a natural gameplay flow.
- **Multi-step Undo**: Designed undo stacks supporting 1-step undo in PvP and 2-step undo in PvE to cleanly revert both AI and player moves.
- **Reconstructed Directory Layout**: Refactored scripts into clean subdirectories (`js/` and `js/games/`) to logically separate navigation logic and game engines.
- **Lobby Navigation & Timer Safety**: Guarded the reset processes of game controllers (`Caro`, `Ludo`, `TicTacToe`, `Chess`, `TuongGame`) with initialization flags and individual try-catch blocks to prevent errors from uninitialized DOM elements and prevent background AI execution when returning to the lobby.

## Key Files Map
- `index.html`: Holds the DOM views for the Lobby, Memory Match, Tic Tac Toe, Caro, Cờ Cá Ngựa, Chess, and Cờ Tướng.
- `style.css`: Contains CSS rules, variables, glassmorphism cards, neon piece glows, win animations, 3D dice components, board layouts, Chess board aesthetics, and Cờ Tướng grid/pieces styling.
- `js/main.js`: Hub navigation, Profile management, and central lobby stats bindings.
- `js/games/match.js`: Memory Match game logic with levels.
- `js/games/tictactoe.js`: Core Tic Tac Toe game controller, PvP/PvE logic, and AI minimax implementation.
- `js/games/caro.js`: Core Caro (Gomoku 15x15) game controller, PvP/PvE logic, and Heuristic AI.
- `js/games/cangua.js`: Core Cờ Cá Ngựa game engine, turn coordinator, and heuristic AI.
- `js/games/chess.js`: Core Chess game engine, move calculations, promotion modal, and Alpha-Beta minimax AI.
- `js/games/tuong.js`: Core Cờ Tướng game engine, move calculations, and Alpha-Beta minimax AI.
- `test_tictactoe_logic.js`: Unit tests verifying victory checks and minimax block/win decisions.
- `test_caro_logic.js`: Unit tests verifying Caro win check, Heuristic AI defense, and PvE undo stack.
- `test_match_logic.js`: Unit tests verifying Memory Match pair verification and victory logic.
- `test_cangua_logic.js`: Unit tests validating Ludo deployment, movement, kicking, stretch climbing, and win condition checks.
- `test_chess_logic.js`: Unit tests validating Chess initial setup, pawn/knight legal moves, Fool's mate checkmate, and stalemate.
- `test_tuong_logic.js`: Unit tests validating Cờ Tướng setup, blocking, cannon captures with screen, King facing rules, and checkmate/stalemate.
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
- `chess_wins` / `chess_played` / `chess_game_mode` / `chess_ai_diff` (Integer/String)
- `tuong_wins` / `tuong_played` / `tuong_game_mode` / `tuong_ai_diff` (Integer/String)

## API Contracts
Standard browser-based event-driven API and HTML5 LocalStorage interface.

## Pitfalls & Lessons
- **MCP SSE vs POST**: Avoided SSE streams for MCP server communication in helper scripts due to Python buffering hangs; used direct HTTP POST instead.
- **PvE Undo**: Undoing a move in PvE must pop two states (AI's move and player's move) to keep the turn with the player, whereas PvP only pops one.
- **UI Locking**: In PvE, board clicks must be disabled when AI is thinking (`isAiMoving = true`) to prevent race conditions.
- **Heuristic Weights**: The Caro AI weights must scale with the length of the matching run, prioritizing winning moves (5-in-a-row) and open-four threats over simple three-in-a-row blocks.
- **Safe DOM Text Value Parsing**: Parsing DOM elements (e.g. textContent) under Node.js testing requires strict safeguards (handling NaN and undefined objects) due to missing real DOM properties in simple test mocks.
- **Uninitialized DOM Controllers**: When implementing SPA view switching, calling cleanups/resets on all pages during transitions can trigger exceptions if a page has never been opened. Always gate cleanups behind an `initialized` flag or wrap them in individual `try...catch` blocks to protect navigation flows.
- **Leaking Async Timers**: When navigating away from a game view, any scheduled AI timeout or async loop must be explicitly cleared to prevent background executions that might corrupt state or throw exceptions when elements disappear.
- **Powershell Double Quotes**: Passing inline JSON arguments to Python MCP calling scripts via Powershell can strip quotes and cause JSONDecodeError; write JSON parameters to local temporary files instead.
- **Chinese Chess King Facing (Lộ mặt tướng)**: Two Kings facing directly on the same column with no pieces in between is illegal. This must be evaluated on the simulated next board during move validation to filter out illegal moves that expose the Kings.
- **Chinese Chess Elephant & Knight Blocking**: Elephants are blocked by occupying their diagonal intersection "eye" (`(from + to) / 2`), and Knights are blocked by occupying their adjacent orthogonal "foot". Correct 9x10 grid coordinate mapping is crucial to avoid offset errors.
