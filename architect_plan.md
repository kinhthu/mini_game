# Technical Architecture Plan: Caro (Gomoku) Game Integration

This document outlines the technical design, routing structure, user interface enhancements, and algorithmic logic required to integrate a **Caro (Gomoku)** game into the existing single-game web application.

---

## 1. Architectural Changes & Routing

Currently, the web application is a single-screen page displaying the "Memory Match Game". To support multiple games, we will introduce a **Multi-Screen Router** system using clean, state-based visibility toggles (`display: none` / `block`).

### UI Hierarchy & Screens
1. **Game Selection Menu Screen (`#menu-screen`)**:
   - Welcome title with premium gradient typography.
   - Two visual selection cards:
     - **Memory Match Card**: Displays description, current best stats, and play button.
     - **Caro Game Card**: Displays Caro description, modes (PvP vs PvE AI), and play button.
2. **Memory Match Game Screen (`#memory-screen`)**:
   - Contains the existing memory game layout.
   - Adds a header button: "← Back to Menu".
3. **Caro Game Screen (`#caro-screen`)**:
   - Game layout containing a 15x15 board.
   - Mode Selector: Play against AI (PvE) or Play with Friend (PvP).
   - Turn indicator showing whose turn it is (X's turn / O's turn).
   - Game statistics: Win counts for Player X, Player O / AI.
   - Control buttons: "Restart Match", "Change Mode", "← Back to Menu".

---

## 2. Caro Game Design & Visual System

To maintain design continuity, we will extend the existing glassmorphic theme.

### Color Palette Extensions
- **Base Background**: Remains the deep warm dark gradient (`#2a0f12` to `#4b1b1b`).
- **Player X (Cyan Theme)**: 
  - Primary color: `#22d3ee` (Cyan-400)
  - Glow shadow: `rgba(34, 211, 238, 0.4)`
- **Player O / AI (Rose Theme)**:
  - Primary color: `#fb7185` (Rose-400)
  - Glow shadow: `rgba(251, 113, 133, 0.4)`
- **Board Grid Lines**: `rgba(255, 255, 255, 0.08)`
- **Winning Path Highlight**: Golden yellow (`#f59e0b`) with pulse animations.

### Micro-Animations
- **Hover State**: When hovering over an empty cell, a faint semi-transparent preview of the current player's piece (X or O) will fade in.
- **Piece Placement**: Pieces will pop in with a smooth scale-up transition (`transform: scale(0) -> scale(1)`) and a slight rotation.
- **Win Line Animation**: The winning five cells will pulse and emit a neon glow corresponding to the winner.

---

## 3. Game Logic & AI Algorithm

The Caro game will be implemented inside a new module [caro.js](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/caro.js).

### Board Representation
- The board will be a 15x15 2D array or 1D array of size 225.
- Values: `null` (empty), `'X'` (Player 1), or `'O'` (Player 2 / AI).

### Win Condition Checker
After each move, check if the active piece forms a continuous line of exactly/at least 5 matching pieces.
- Directions to check from the last placed piece:
  - Horizontal (`dx = 1, dy = 0`)
  - Vertical (`dx = 0, dy = 1`)
  - Diagonal Down-Right (`dx = 1, dy = 1`)
  - Diagonal Up-Right (`dx = 1, dy = -1`)
- The check runs in $O(1)$ relative to the board size (checks 4 paths of length 5 around the placed piece).

### Heuristic AI Engine (PvE Mode)
To make PvE gameplay engaging, a heuristic evaluation AI will calculate the best move. Minimax is too slow for 15x15, so a high-performance **Score Evaluation Matrix** will be used:
1. **Score Windows**: Evaluate all 5-in-a-row combinations in the grid.
2. **Heuristic Scoring Rules**:
   - **5 in a row (Win)**: 100,000 points
   - **Open 4 (Active 4, no blocks)**: 10,000 points
   - **Blocked 4 or Open 3**: 1,000 points
   - **Blocked 3 or Open 2**: 100 points
   - **Open 1 / Blocked 2**: 10 points
3. **Decision Making**:
   - For every empty cell on the board, compute two scores:
     - **Offensive Score**: Points gained if AI ('O') plays there.
     - **Defensive Score**: Points gained if Player ('X') plays there (blocking score).
   - **AI Choice**: Place the piece on the cell that maximizes `Offensive Score + Defensive Score * 0.9` (slightly prioritizing winning moves over blocks).

---

## 4. Implementation Steps

### Step 1: Create `memory.md`
Create [memory.md](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/memory.md) to log context and architectural notes according to rule requirements.

### Step 2: Refactor [index.html](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/index.html)
- Extract current main game container into a screen section `#memory-screen`.
- Add `#menu-screen` with beautiful card buttons.
- Add `#caro-screen` with mode selections, board container, score counters, and turn indicators.
- Reference the new script `caro.js`.

### Step 3: Update [style.css](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/style.css)
- Implement screen visibility utilities.
- Add design styles for game-menu layout.
- Design the Caro board using CSS grid (`repeat(15, 1fr)`) with glassmorphic styles.
- Add visual definitions for X and O pieces using pure CSS pseudo-elements or styled inline elements.
- Add pulse keyframes and winning glows.

### Step 4: Refactor [main.js](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/main.js)
- Group existing functions under a Memory Game Manager block.
- Add router navigation code to handle state visibility switching between screen elements.
- Export screen change callbacks.

### Step 5: Implement [caro.js](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/caro.js)
- Define variables: `board`, `gameActive`, `currentPlayer`, `gameMode` (pvp/pve), `winsX`, `winsO`.
- Add event listeners to board cells.
- Implement win evaluation rules.
- Implement heuristic AI logic.
- Add interactive states: sound triggers or visual alerts on wins/draws.

### Step 6: QA and Review
- Test PvP and PvE modes on various grid sizes.
- Ensure the board is responsive on mobile screens (adapts scales dynamically).
- Verify memory and performance limits.
