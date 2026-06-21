# Project Memory

## Context & Architecture

This project is a multi-game web portal. We are moving from a single game structure (Memory Match) to a multi-game hub supporting both **Memory Match** and **Caro (Gomoku)**.

### Game Modules
1. **Memory Match**:
   - Implementation: [memory.js](file:///D:/workspace/wt-f16e7edb3e0e48f2a505db900dd2fc75/memory.js)
   - Interface: Exposes `window.MemoryGame` with:
     - `init()`: Inits elements, binds events, and resets board.
     - `destroy()`: Cleans up listeners, dynamic DOM elements, and resets game state.
     - `reset()`: Resets current game state.
2. **Coordinator/Router**:
   - Implementation: [main.js](file:///D:/workspace/wt-f16e7edb3e0e48f2a505db900dd2fc75/main.js)
   - Responsibility: Detects pages/actions, manages routing, and initializes or switches between different games.

## Recent Changes (Task 1)
- Refactored `main.js` to act as coordinator/router.
- Extracted Memory Match game logic into `memory.js`.
- Included `memory.js` script before `main.js` in `index.html`.

## Next Steps
- Implement UI for game selection (Task 2).
- Create Caro Game PvP component (Task 3).
- Implement Caro Game PvE AI (Task 4).
