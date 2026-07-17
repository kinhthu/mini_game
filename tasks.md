# Task List - Onet Connect Game Integration

| Seq | Title | Status | DependsOn | Description |
| --- | ----- | ------ | --------- | ----------- |
| 1 | Lobby & SPA Layout Integration | Pending | | Add Onet Connect card in the lobby (Wins, Highest Level) and the game view container (#onet-view) in index.html. |
| 2 | Neon Visual Theme and Style | Pending | 1 | Add CSS styling in style.css for Onet game board, neon-glowing tiles, SVG neon line drawer, tile match effects, and time-bar alerts. |
| 3 | Global State Integration & Navigation | Pending | 1 | Bind lobby card to view navigation. Update ProfileManager in js/main.js to initialize, track, and sync Onet stats. |
| 4 | Pathfinding & Board Logic Implementation | Completed | 2, 3 | Implement OnetConnect class in js/games/onet.js: grid padding, pathfinder (0/1/2 turns), auto-shuffle, hints, and game loops. |
| 5 | Logic Verification Unit Tests & QA | Completed | 4 | Implement test_onet_logic.js to verify the pathfinder correctness, blockages, outer boundaries, and auto-shuffle logic under Node.js. |
