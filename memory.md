# Memory: Mini Game Hub Integration

## Last Updated
2026-07-08

## Tech Stack
- HTML5 (Structure)
- CSS3 (Vanilla styles, Glassmorphism, Neon gold/cyan/coral/purple glow)
- JavaScript (Vanilla ES6, client-side SPA routing)
- Node.js (Unit test suite execution)

## Key Architecture Decisions
- **SPA Architecture**: Converted the single-view Memory Match page into a multi-game SPA controlled by `GameHub` showing/hiding view containers (`#lobby-view`, `#memory-match-view`, `#tictactoe-view`, `#caro-view`).
- **Profile & Statistics Sync**: Profile name edits, ranks, and match history are stored centrally in `localStorage` and shared/synchronized automatically across game modes (Memory Match, Tic Tac Toe, and Caro) and the lobby dashboard.
- **Unbeatable Minimax AI**: Added Tic Tac Toe game with a depth-aware Minimax algorithm (O player maximizes, X player minimizes) ensuring unbeatable performance on the 3x3 board.
- **Heuristic Evaluation AI**: Added Caro (Gomoku 15x15) game with a fast Heuristic Evaluation algorithm weighing attacks and defenses on empty cells to block and win efficiently. Bypassed Minimax due to state-space size.
- **Artificial Delay**: Implemented a 300ms delay for Caro AI moves and a 500ms delay for Tic Tac Toe AI moves with a status label to ensure a natural gameplay flow.
- **Multi-step Undo**: Designed undo stacks supporting 1-step undo in PvP and 2-step undo in PvE to cleanly revert both AI and player moves.
- **Reconstructed Directory Layout**: Refactored scripts into clean subdirectories (`js/` and `js/games/`) to logically separate navigation logic and game engines.

## Key Files Map
- `index.html`: Holds the DOM views for the Lobby, Memory Match, Tic Tac Toe, and Caro.
- `style.css`: Contains CSS rules, variables, glassmorphism cards, neon piece glows, and win animations.
- `js/main.js`: Hub navigation, Profile management, and central lobby stats bindings.
- `js/games/match.js`: Memory Match game logic with levels.
- `js/games/tictactoe.js`: Core Tic Tac Toe game controller, PvP/PvE logic, and AI minimax implementation.
- `js/games/caro.js`: Core Caro (Gomoku 15x15) game controller, PvP/PvE logic, and Heuristic AI.
- `test_tictactoe_logic.js`: Unit tests verifying victory checks and minimax block/win decisions.
- `test_caro_logic.js`: Unit tests verifying Caro win check, Heuristic AI defense, and PvE undo stack.
- `test_match_logic.js`: Unit tests verifying Memory Match pair verification and victory logic.
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

## API Contracts
Standard browser-based event-driven API and HTML5 LocalStorage interface.

## Pitfalls & Lessons
- **MCP SSE vs POST**: Avoided SSE streams for MCP server communication in helper scripts due to Python buffering hangs; used direct HTTP POST instead.
- **PvE Undo**: Undoing a move in PvE must pop two states (AI's move and player's move) to keep the turn with the player, whereas PvP only pops one.
- **UI Locking**: In PvE, board clicks must be disabled when AI is thinking (`isAiMoving = true`) to prevent race conditions.
- **Heuristic Weights**: The Caro AI weights must scale with the length of the matching run, prioritizing winning moves (5-in-a-row) and open-four threats over simple three-in-a-row blocks.
