# Task List - Cờ Tướng Game Integration

| Seq | Title | Status | Description |
| --- | ----- | ------ | ----------- |
| 1 | Phase 1: Lobby Integration & HTML View Layout | Done | Add a Cờ Tướng game card with tuong-theme in index.html lobby. Implement the #tuong-view container containing status board, 9x10 chessboard container, control buttons (restart, undo, exit). |
| 2 | Phase 2: Navigation & Profile Stats Sync | Done | Edit main.js to integrate Cờ Tướng game view routing and navigation. Setup localStorage synchronization for Cờ Tướng stats (tuong_wins, tuong_played) and bind them to the global nickname profile manager. |
| 3 | Phase 3: CSS Styles, Board & Pieces Aesthetics | Done | Add tuong-theme styles in style.css. Implement high-quality 9x10 grid with glassmorphism glow. Design CSS styles for selected pieces, path indicators for valid moves, river text, palace diagonal lines, and responsiveness. |
| 4 | Phase 4: Core Cờ Tướng Engine Logic | Done | Create js/games/tuong.js with TuongGame class. Lập trình logic tính toán nước đi hợp lệ cho Tướng, Sĩ, Tượng (có cản mắt tượng), Mã (có cản chân mã), Xe, Pháo (có ngòi pháo), và Tốt (có luật qua sông). Xử lý chiếu tướng (Check) và chiếu bí (Checkmate). |
| 5 | Phase 5: AI Engine & PvP/PvE Match Integration | Done | Build dynamic Easy AI (random moves) and Hard AI (minimax with depth-based evaluation heuristic). Implement undo moves history array stack and restart game cycle handlers. |
| 6 | Phase 6: Unit Testing & E2E Validation | Done | Implement test_tuong_logic.js with Node unit tests verifying move validator, checkmate, and AI. Ensure build passes and git status is clean, then final reporting. |
