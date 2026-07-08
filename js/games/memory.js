// Alias MemoryGame to MatchGame for compatibility
if (typeof MatchGame !== 'undefined') {
    window.MemoryGame = MatchGame;
} else {
    // If loaded standalone, evaluate MatchGame logic
    // (This file is structurally identical to match.js but uses the MatchGame object)
}
