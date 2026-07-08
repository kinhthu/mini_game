# Memory: Mini Game Hub Integration

## Last Updated
2026-07-08

## Tech Stack
- HTML5 (Structure)
- CSS3 (Vanilla styles, Glassmorphism, Neon gold/cyan/coral glow)
- JavaScript (Vanilla ES6, client-side SPA routing)
- Node.js (Unit test suite execution)

## Key Architecture Decisions
- **SPA Architecture**: Converted the single-view Memory Match page into a multi-game SPA controlled by `GameHub` showing/hiding view containers (`#lobby-view`, `#memory-match-view`, `#tictactoe-view`).
- **Profile & Statistics Sync**: Profile name edits, ranks, and match history are stored centrally in `localStorage` and shared/synchronized automatically across game modes and the lobby dashboard.
- **Unbeatable Minimax AI**: Added Tic Tac Toe game with a depth-aware Minimax algorithm (O player maximizes, X player minimizes) ensuring unbeatable performance on the 3x3 board.
- **Artificial Delay**: Implemented a 500ms delay for AI moves with a status label ("AI is thinking...") to ensure a natural gameplay flow.
- **Multi-step Undo**: Designed undo stacks supporting 1-step undo in PvP and 2-step undo in PvE to cleanly revert both AI and player moves.

## Key Files Map
- `index.html`: Holds the DOM views for the Lobby, Memory Match, and Tic Tac Toe.
- `style.css`: Contains CSS rules, variables, glassmorphism cards, neon piece glows, and win animations.
- `main.js`: Hub navigation, Profile management, and Memory Match logic.
- `tictactoe.js`: Core Tic Tac Toe game controller, PvP/PvE logic, and AI minimax implementation.
- `test_tictactoe_logic.js`: Unit tests verifying victory checks and minimax block/win decisions.
- `tasks.md`: Task checklist registered with the Project Manager.

## Recent Schema Changes
No database schema exists. LocalStorage schema keys are defined as follows:
- `player_nickname` (String)
- `memory_match_wins` / `memory_match_played` / `memory_match_level` (Integer)
- `ttt_game_mode` ('pvp' / 'pve')
- `ttt_ai_diff` ('easy' / 'hard')
- `ttt_pvp_wins` / `ttt_pvp_losses` / `ttt_pvp_draws` (Integer)
- `ttt_pve_wins` / `ttt_pve_losses` / `ttt_pve_draws` (Integer)

## API Contracts
Standard browser-based event-driven API and HTML5 LocalStorage interface.

## Pitfalls & Lessons
- **MCP SSE vs POST**: Avoided SSE streams for MCP server communication in helper scripts due to Python buffering hangs; used direct HTTP POST instead.
- **PvE Undo**: Undoing a move in PvE must pop two states (AI's move and player's move) to keep the turn with the player, whereas PvP only pops one.
- **UI Locking**: In PvE, board clicks must be disabled when AI is thinking (`isAiMoving = true`) to prevent race conditions.
