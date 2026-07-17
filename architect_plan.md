# Technical Plan: Positioning Chinese Chess Pieces on Line Intersections

This document details the architectural and styling changes needed to place Chinese Chess (Xiangqi) pieces at the intersections of the board lines instead of the center of squares, fulfilling the user's request:
> "sửa lỗi game cờ tướng. Các quân cờ đang đặt sai vị trí, nên đặt tại giao điểm của các đường kẻ chứ không phải chính giữa ô vuông"

---

## 1. Architectural Strategy

In Chinese Chess, there are **9 vertical lines** (files) and **10 horizontal lines** (ranks), creating **90 intersection points**.

### Cell-Centered Grid Alignment (Recommended)
Instead of switching to a completely new grid positioning system in Javascript (which would require rewrites of coordinate indexing, move logic, AI pathfinding, and risk breaking all unit tests), we will use an elegant **CSS-based cell-centered alignment**:
1. **Grid Layout**: Keep the existing 9x10 grid of cells (`.tuong-square`).
2. **Pieces Positioning**: Pieces will remain centered inside these cells.
3. **Line Intersections**: Instead of borders *around* each cell, we will draw grid lines *passing through the center* of each cell.
   - The intersection of the horizontal and vertical center lines will lie exactly in the middle of each cell.
   - Since pieces are centered in each cell, they will automatically align perfectly on the intersections!
4. **River Realignment**: The river is between Row 4 and Row 5. In this cell-centered approach, the river space spans from the center line of Row 4 (`45%` of board height) to the center line of Row 5 (`55%` of board height). We will shift the absolute `.tuong-river` container to `top: 45%` and keep `height: 10%`.
5. **Palace Diagonals**: We will draw the diagonal lines inside the palace cells using `::before` pseudo-elements. The diagonal lines will go from corner to center, or corner to corner, connecting perfectly to form the two traditional "X" palace boundaries.

```
       CELL-CENTERED GRID DRAWING PRINCIPLE:
       
       +---------+---------+---------+
       |         |         |         |
       |    |    |    |    |    |    |
       |----+----|----+----|----+----|  <-- Intersections are at the center 
       |  (Piece)|         |         |      of cells.
       |    |    |    |    |    |    |
       +---------+---------+---------+
```

---

## 2. Implementation Steps

### Step 1: Update Palace Classes in `js/games/tuong.js`
Modify `isPalaceDiagonal` to return separate class names for each quadrant position of the palace:
- `palace-diagonal-tl` (top-left corners: cell (0, 3), (7, 3))
- `palace-diagonal-br` (bottom-right corners: cell (2, 5), (9, 5))
- `palace-diagonal-tr` (top-right corners: cell (0, 5), (7, 5))
- `palace-diagonal-bl` (bottom-left corners: cell (2, 3), (9, 3))
- `palace-diagonal-both` (centers: cell (1, 4), (8, 4))

### Step 2: Refactor CSS in `style.css`
1. **Remove Old Cell Borders**: Remove the old cell border style on `.tuong-square`.
2. **Draw Center Grid Lines**: Add `background-image` using solid solid-color linear gradients of size `2px 100%` and `100% 2px`, positioned at `center center`.
3. **Style Board Edges and Corners**: Use `:nth-child` selectors to adjust the sizes and positions of gradients for outer-most lines:
   - **Left edge (Col 0)**: Horizontal line starts at center.
   - **Right edge (Col 8)**: Horizontal line ends at center.
   - **Top edge (Row 0)**: Vertical line starts at center.
   - **Bottom edge (Row 9)**: Vertical line ends at center.
   - **Corners**: Top-left, top-right, bottom-left, bottom-right combine these adjustments.
4. **Style River Boundaries**:
   - **Row 4**: Vertical lines stop at center (top-half only), except for Columns 0 and 8.
   - **Row 5**: Vertical lines start at center (bottom-half only), except for Columns 0 and 8.
5. **Add Palace Diagonals**: Implement the diagonals using `::before` pseudo-elements on the palace cells.
6. **Update Selection Highlights**:
   - Change `.selected-square`'s `background: ... !important` to `background-color: ... !important` so that the grid lines underneath remain visible.
7. **Reposition River Overlay**:
   - Update `.tuong-river` to `top: 45%` and `height: 10%`.

---

## 3. Verification Plan

1. **Visual Inspection**: Open the browser page and verify:
   - Pieces are placed exactly at the intersections of the board lines.
   - The border of the board is clean, and lines do not leak outside.
   - The river is correctly drawn between ranks 4 and 5, with vertical lines stopping at the banks (except the borders).
   - Palace diagonals are perfectly aligned and connect corner-to-corner across the 3x3 cells.
   - Selection/highlight states overlay correctly without wiping out the grid lines.
2. **Logic and Unit Tests**: Run `node test_tuong_logic.js` to ensure the logic has not been broken and all rules are intact.
