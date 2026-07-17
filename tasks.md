# Task List - Chinese Chess Positioning Fix

| Seq | Title | Status | Description |
| --- | ----- | ------ | ----------- |
| 1 | Phase 1: Update Palace Classes in js/games/tuong.js | Pending | Modify the `isPalaceDiagonal` logic or board generation inside `js/games/tuong.js` to assign separate, distinct CSS classes for palace cells depending on their diagonal quadrant positions. |
| 2 | Phase 2: Refactor Board and Piece Styling in style.css | Pending | Refactor `style.css` to draw grid lines passing through cell centers, remove default borders, style palace diagonals with ::before pseudo-elements, adapt river positioning, and keep pieces aligned to intersections. |
| 3 | Phase 3: Run Unit Tests & Verify Rendering | Pending | Execute unit tests to ensure no logical regression. Confirm visual board layout matches traditional Chinese Chess board (pieces placed on intersections, proper river boundaries and palace lines). |
