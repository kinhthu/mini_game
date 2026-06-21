window.CaroAI = (function() {
    const BOARD_SIZE = 15;

    // Helper to check if a move results in a win (using the game rules)
    function checkWin(board, row, col, symbol, rule) {
        const directions = [
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: -1 }
        ];
        
        for (let { dr, dc } of directions) {
            let count = 1;
            
            // Positive direction
            let r = row + dr;
            let c = col + dc;
            let posCount = 0;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === symbol) {
                count++;
                posCount++;
                r += dr;
                c += dc;
            }
            
            // Negative direction
            r = row - dr;
            c = col - dc;
            let negCount = 0;
            while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === symbol) {
                count++;
                negCount++;
                r -= dr;
                c -= dc;
            }
            
            if (count >= 5) {
                if (rule === 'vietnamese') {
                    const opponent = symbol === 'X' ? 'O' : 'X';
                    
                    let blockBefore = false;
                    let rBefore = row - (negCount + 1) * dr;
                    let cBefore = col - (negCount + 1) * dc;
                    if (rBefore >= 0 && rBefore < BOARD_SIZE && cBefore >= 0 && cBefore < BOARD_SIZE) {
                        if (board[rBefore][cBefore] === opponent) {
                            blockBefore = true;
                        }
                    }
                    
                    let blockAfter = false;
                    let rAfter = row + (posCount + 1) * dr;
                    let cAfter = col + (posCount + 1) * dc;
                    if (rAfter >= 0 && rAfter < BOARD_SIZE && cAfter >= 0 && cAfter < BOARD_SIZE) {
                        if (board[rAfter][cAfter] === opponent) {
                            blockAfter = true;
                        }
                    }
                    
                    if (blockBefore && blockAfter) {
                        continue;
                    }
                }
                return true;
            }
        }
        return false;
    }

    function evaluateCell(board, row, col, symbol, opponentSymbol, rule) {
        const directions = [
            { dr: 0, dc: 1 },   // Horizontal
            { dr: 1, dc: 0 },   // Vertical
            { dr: 1, dc: 1 },   // Diagonal Down-Right
            { dr: 1, dc: -1 }   // Diagonal Down-Left
        ];

        let score = 0;

        for (let { dr, dc } of directions) {
            // Check all 5-cell windows containing (row, col)
            for (let i = 0; i < 5; i++) {
                const startR = row - i * dr;
                const startC = col - i * dc;

                // Check if window is within board boundaries
                let valid = true;
                let sCount = 0;
                let oppCount = 0;

                for (let j = 0; j < 5; j++) {
                    const r = startR + j * dr;
                    const c = startC + j * dc;
                    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) {
                        valid = false;
                        break;
                    }
                    const cellVal = board[r][c];
                    if (cellVal === symbol) {
                        sCount++;
                    } else if (cellVal === opponentSymbol) {
                        oppCount++;
                    }
                }

                if (!valid) continue;

                // If window contains even one opponent piece, it cannot be used by symbol S
                if (oppCount > 0) continue;

                // Check blocked ends for Vietnamese rule
                let blockBefore = false;
                let blockAfter = false;
                if (rule === 'vietnamese') {
                    const beforeR = startR - dr;
                    const beforeC = startC - dc;
                    if (beforeR >= 0 && beforeR < BOARD_SIZE && beforeC >= 0 && beforeC < BOARD_SIZE) {
                        if (board[beforeR][beforeC] === opponentSymbol) {
                            blockBefore = true;
                        }
                    }

                    const afterR = startR + 5 * dr;
                    const afterC = startC + 5 * dc;
                    if (afterR >= 0 && afterR < BOARD_SIZE && afterC >= 0 && afterC < BOARD_SIZE) {
                        if (board[afterR][afterC] === opponentSymbol) {
                            blockAfter = true;
                        }
                    }
                }

                if (rule === 'vietnamese' && blockBefore && blockAfter) {
                    continue; // Blocked at both ends, useless
                }

                // Score window based on number of pieces of symbol
                switch (sCount) {
                    case 4:
                        // Make sure it's actually a win if we play here
                        if (checkWin(board, row, col, symbol, rule)) {
                            score += 100000;
                        }
                        break;
                    case 3:
                        score += 10000;
                        break;
                    case 2:
                        score += 1000;
                        break;
                    case 1:
                        score += 100;
                        break;
                    case 0:
                        score += 10;
                        break;
                }
            }
        }

        return score;
    }

    function getBestMove(boardState, aiSymbol, opponentSymbol, rule) {
        const possibleMoves = [];

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (boardState[r][c] === null) {
                    let attackScore = evaluateCell(boardState, r, c, aiSymbol, opponentSymbol, rule);
                    let defenseScore = evaluateCell(boardState, r, c, opponentSymbol, aiSymbol, rule);

                    let combinedScore = 0;
                    if (attackScore >= 100000) {
                        combinedScore = attackScore + 10000000; // Prioritize winning immediately
                    } else if (defenseScore >= 100000) {
                        combinedScore = defenseScore + 5000000; // Prioritize blocking immediate win
                    } else {
                        combinedScore = attackScore + defenseScore * 1.2; // Scale defense slightly (e.g. 1.2x)
                    }

                    possibleMoves.push({ r, c, score: combinedScore });
                }
            }
        }

        // Sort possible moves by score descending
        possibleMoves.sort((a, b) => b.score - a.score);

        if (possibleMoves.length > 0) {
            // Find all moves with the maximum score to break ties randomly or just take the first one
            const maxScore = possibleMoves[0].score;
            const candidates = possibleMoves.filter(m => m.score === maxScore);
            // Randomly select one of the candidate best moves
            const selected = candidates[Math.floor(Math.random() * candidates.length)];
            return { row: selected.r, col: selected.c };
        }

        return null;
    }

    return {
        getBestMove: getBestMove
    };
})();
