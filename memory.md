# Memory Documentation

## Last Updated
2026-07-08

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JS
- Icons/Fonts: Outfit from Google Fonts
- Framework-free Single Page Application (SPA) architecture

## Key Architecture Decisions
- **Lobby-centric SPA Routing**: The app implements dynamic switching of screens using `<section>` elements with ID toggling (`#lobby-view`, `#match-view`, `#caro-view`, `#g2048-view`).
- **Profile Stats Persistence**: User profile (nickname, stats for plays, wins, and best times) are persisted directly in `localStorage` inside the `ProfileManager` object.
- **Separated Game Engines**: Each game (Memory Match and Caro) has its logic extracted into separate modules (`js/games/match.js` and `js/games/caro.js`) registered under the window namespace.
- **Heuristic AI for Gomoku (Caro)**: The PvE mode uses a dynamic 5-cell window scanning algorithm that aggregates defensive (blocking human threats) and offensive (building AI wins) heuristic scores.
- **Vietnamese Blocked-Ends Rule**: Consecutive 5 stones in Gomoku only win if they are not blocked at both ends by the opponent's stones.

## Key Files Map
- `index.html`: Main SPA structure containing lobby, game containers, and global modal templates.
- `style.css`: Premium Neon Glassmorphism design system styles, board grid layouts, stone shadows, and animations.
- `main.js`: Main coordinator namespace (`GameHub`), routing, modal popups, and user profile management (`ProfileManager`).
- `js/games/match.js`: Memory Match game loop, shuffling, and difficulty binding.
- `js/games/caro.js`: 15x15 Caro game loop, checkWin algorithm, and heuristic AI.

## Pitfalls & Lessons
- **Mock DOM style and querySelectorAll support**: When writing unit tests in Node.js mocked environments, make sure to safely guard style settings (`if (grid.style)`) and avoid assuming `querySelectorAll` is defined on all elements by checking `typeof boardEl.querySelectorAll === 'function'` and falling back to iterating over children.
- **Manual vs automatic history pushes**: To support manual test play simulations without breaking normal gameplay history tracking, place the history push action directly inside `placeStone()` instead of scattering it in click/AI event handlers.
