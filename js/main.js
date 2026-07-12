// Global state for Profile and Stats
const ProfileManager = {
    getNickname() {
        return localStorage.getItem('player_nickname') || 'CyberPlayer';
    },
    setNickname(name) {
        if (name && name.trim()) {
            localStorage.setItem('player_nickname', name.trim());
            this.updateUI();
        }
    },
    getRank(wins) {
        if (wins >= 15) return 'Grandmaster 🏆';
        if (wins >= 10) return 'Pro Gamer ⚡';
        if (wins >= 5) return 'Challenger 🌟';
        return 'Beginner 🎮';
    },
    updateUI() {
        const nicknameEl = document.getElementById('player-nickname');
        const rankEl = document.getElementById('player-rank');
        if (nicknameEl) nicknameEl.textContent = this.getNickname();
        
        // Calculate global wins to set rank
        const memoryWins = parseInt(localStorage.getItem('memory_match_wins') || '0', 10);
        const tttWins = parseInt(localStorage.getItem('ttt_pve_wins') || '0', 10) + 
                        parseInt(localStorage.getItem('ttt_pvp_wins') || '0', 10);
        const caroWins = parseInt(localStorage.getItem('caro_pve_wins') || '0', 10) +
                         parseInt(localStorage.getItem('caro_pvp_wins') || '0', 10);
        const canguaWins = parseInt(localStorage.getItem('cangua_wins') || '0', 10);
        const chessWins = parseInt(localStorage.getItem('chess_wins') || '0', 10);
        const totalWins = memoryWins + tttWins + caroWins + canguaWins + chessWins;
        if (rankEl) rankEl.textContent = this.getRank(totalWins);

        // Update Lobby stats
        const memoryPlayed = parseInt(localStorage.getItem('memory_match_played') || '0', 10);
        const tttPlayed = parseInt(localStorage.getItem('ttt_pve_played') || '0', 10) + 
                          parseInt(localStorage.getItem('ttt_pvp_played') || '0', 10);
        const caroPlayed = parseInt(localStorage.getItem('caro_pve_played') || '0', 10) +
                           parseInt(localStorage.getItem('caro_pvp_played') || '0', 10);
        const canguaPlayed = parseInt(localStorage.getItem('cangua_played') || '0', 10);
        const chessPlayed = parseInt(localStorage.getItem('chess_played') || '0', 10);
        
        const totalPlayed = memoryPlayed + tttPlayed + caroPlayed + canguaPlayed + chessPlayed;
        const globalPlayedEl = document.getElementById('global-played');
        if (globalPlayedEl) globalPlayedEl.textContent = totalPlayed;

        const globalWinrateEl = document.getElementById('global-winrate');
        if (globalWinrateEl) {
            const wr = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
            globalWinrateEl.textContent = `${wr}%`;
        }

        // Update Memory Match specific stats on Lobby
        const memoryWinsEl = document.getElementById('stats-memory-wins');
        if (memoryWinsEl) memoryWinsEl.textContent = memoryWins;
        const memoryLevelEl = document.getElementById('stats-memory-level');
        if (memoryLevelEl) memoryLevelEl.textContent = localStorage.getItem('memory_match_level') || '1';

        // Update Tic Tac Toe specific stats on Lobby
        const tttWinsEl = document.getElementById('stats-ttt-wins');
        if (tttWinsEl) tttWinsEl.textContent = tttWins;
        const tttDrawsEl = document.getElementById('stats-ttt-draws');
        if (tttDrawsEl) {
            const draws = parseInt(localStorage.getItem('ttt_pve_draws') || '0', 10) + 
                          parseInt(localStorage.getItem('ttt_pvp_draws') || '0', 10);
            tttDrawsEl.textContent = draws;
        }

        // Update Caro specific stats on Lobby
        const caroWinsEl = document.getElementById('stats-caro-wins');
        if (caroWinsEl) caroWinsEl.textContent = caroWins;
        const caroDrawsEl = document.getElementById('stats-caro-draws');
        if (caroDrawsEl) {
            const draws = parseInt(localStorage.getItem('caro_pve_draws') || '0', 10) +
                          parseInt(localStorage.getItem('caro_pvp_draws') || '0', 10);
            caroDrawsEl.textContent = draws;
        }

        // Update Cờ Cá Ngựa specific stats on Lobby
        const canguaWinsEl = document.getElementById('stats-cangua-wins');
        if (canguaWinsEl) canguaWinsEl.textContent = canguaWins;
        const canguaPlayedEl = document.getElementById('stats-cangua-played');
        if (canguaPlayedEl) canguaPlayedEl.textContent = canguaPlayed;

        // Update Chess specific stats on Lobby
        const chessWinsEl = document.getElementById('stats-chess-wins');
        if (chessWinsEl) chessWinsEl.textContent = chessWins;
        const chessPlayedEl = document.getElementById('stats-chess-played');
        if (chessPlayedEl) chessPlayedEl.textContent = chessPlayed;
    }
};

// Navigation controller
const GameHub = {
    showView(viewId) {
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.add('hidden');
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.remove('hidden');
        }
        
        // Refresh Lobby stats if navigated back
        if (viewId === 'lobby-view') {
            ProfileManager.updateUI();
        }
    }
};

// Initialize App navigation and listeners on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Navigation binds
    const playMemoryBtn = document.getElementById('play-memory-btn');
    if (playMemoryBtn) {
        playMemoryBtn.addEventListener('click', () => {
            GameHub.showView('memory-match-view');
            if (window.MemoryMatch) {
                window.MemoryMatch.init();
            }
        });
    }

    const playTttBtn = document.getElementById('play-ttt-btn');
    if (playTttBtn) {
        playTttBtn.addEventListener('click', () => {
            GameHub.showView('tictactoe-view');
            if (window.TicTacToeGame) {
                window.TicTacToeGame.init();
            }
        });
    }

    const playCaroBtn = document.getElementById('play-caro-btn');
    if (playCaroBtn) {
        playCaroBtn.addEventListener('click', () => {
            GameHub.showView('caro-view');
            if (window.CaroGame) {
                window.CaroGame.init();
            }
        });
    }

    const playCanguaBtn = document.getElementById('play-cangua-btn');
    if (playCanguaBtn) {
        playCanguaBtn.addEventListener('click', () => {
            GameHub.showView('cangua-view');
            if (window.CanGuaGame) {
                window.CanGuaGame.init();
            }
        });
    }

    const playChessBtn = document.getElementById('play-chess-btn');
    if (playChessBtn) {
        playChessBtn.addEventListener('click', () => {
            GameHub.showView('chess-view');
            if (window.ChessGame) {
                window.ChessGame.init();
            }
        });
    }

    document.querySelectorAll('.back-to-lobby-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Stop timers/games if applicable
            try {
                if (window.MemoryMatch) {
                    window.MemoryMatch.stopTimer();
                }
            } catch (e) {
                console.error("Error stopping MemoryMatch timer:", e);
            }

            try {
                if (window.CaroGame && window.CaroGame.initialized) {
                    window.CaroGame.reset();
                }
            } catch (e) {
                console.error("Error resetting CaroGame:", e);
            }

            try {
                if (window.CanGuaGame && window.CanGuaGame.initialized) {
                    window.CanGuaGame.reset(false);
                }
            } catch (e) {
                console.error("Error resetting CanGuaGame:", e);
            }

            try {
                if (window.TicTacToeGame && window.TicTacToeGame.initialized) {
                    window.TicTacToeGame.resetMatch();
                }
            } catch (e) {
                console.error("Error resetting TicTacToeGame:", e);
            }

            try {
                if (window.ChessGame && window.ChessGame.initialized) {
                    window.ChessGame.reset();
                }
            } catch (e) {
                console.error("Error resetting ChessGame:", e);
            }

            GameHub.showView('lobby-view');
        });
    });

    // Nickname Edit Bind
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    if (editNicknameBtn) {
        editNicknameBtn.addEventListener('click', () => {
            const currentName = ProfileManager.getNickname();
            const newName = prompt('Enter your new nickname:', currentName);
            if (newName !== null) {
                ProfileManager.setNickname(newName);
            }
        });
    }

    // Initial Profile & Stats Load
    ProfileManager.updateUI();
});

window.ProfileManager = ProfileManager;
window.GameHub = GameHub;
