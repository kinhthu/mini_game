# Task List - Chess Game Integration

| Seq | Title | Status | Description |
| --- | ----- | ------ | ----------- |
| 1 | Phase 1: Lobby Integration & HTML View Layout | Done | Add a Chess game card with chess-theme in index.html lobby. Implement the #chess-view container containing status board, 8x8 chessboard container, promotion modal dialogue, control buttons (restart, undo, exit). |
| 2 | Phase 2: Navigation & Profile Stats Sync | Done | Edit main.js to integrate chess game view routing and navigation. Setup localStorage synchronization for chess stats (chess_wins, chess_played) and bind them to the global nickname profile manager. |
| 3 | Phase 3: CSS Styles, Board & Pieces Aesthetics | Done | Add chess-theme styles in style.css. Implement high-quality light and dark square grids with glassmorphism glow. Design CSS styles for selected pieces, path indicators for valid moves, check highlights, and responsiveness. |
| 4 | Phase 4: Core Chess Engine Logic | Done | Create js/games/chess.js with ChessGame class. Lập trình logic tính toán nước đi hợp lệ cho Tốt, Mã, Tượng, Xe, Hậu, Vua. Xử lý các luật đặc biệt: Nhập thành (Castling), Bắt chốt qua đường (En Passant), Phong cấp (Promotion), Chiếu tướng (Check), Chiếu bí (Checkmate), và Hòa cờ (Stalemate). |
| 5 | Phase 5: AI Engine & PvP/PvE Match Integration | Done | Build dynamic Easy AI (random moves) and Hard AI (minimax with depth-based evaluation heuristic). Implement undo moves history array stack and restart game cycle handlers. |
| 6 | Phase 6: Unit Testing & E2E Validation | Done | Implement test_chess_logic.js with Node unit tests verifying move validator, checkmate, stalemate, and AI. Ensure build passes and git status is clean, then final reporting. |
