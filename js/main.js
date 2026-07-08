// Profile Manager to persist and manage user stats
const ProfileManager = {
    storageKey: 'arcade_profile',
    data: {
        nickname: 'ArcadeRider',
        stats: {
            totalPlayed: 0,
            wins: 0,
            winRate: 0,
            matchBestTime4: null,
            matchBestTime6: null,
            matchBestTime8: null,
            g2048HighScore: 0,
            caroWins: 0,
            caroLosses: 0
        }
    },

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                // Ensure stats exists
                if (!this.data.stats) {
                    this.data.stats = {
                        totalPlayed: 0,
                        wins: 0,
                        winRate: 0,
                        matchBestTime4: null,
                        matchBestTime6: null,
                        matchBestTime8: null,
                        g2048HighScore: 0,
                        caroWins: 0,
                        caroLosses: 0
                    };
                }
            } catch (e) {
                console.error("Failed to parse profile data", e);
            }
        }
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    },

    getRank(played, wins) {
        if (played >= 30 && wins >= 20) return "Cyber Legend";
        if (played >= 30 && wins >= 15) return "Console Veteran";
        if (played >= 15 && wins >= 5) return "Grid Master";
        if (played >= 5 && wins >= 2) return "Neon Runner";
        return "Arcade Initiate";
    },

    updateNickname(nick) {
        if (!nick || nick.trim() === '') return false;
        let cleaned = nick.trim();
        if (cleaned.length > 16) {
            cleaned = cleaned.substring(0, 16);
        }
        this.data.nickname = cleaned;
        this.save();
        return true;
    },

    recordGame(gameId, won, stats) {
        this.data.stats.totalPlayed++;
        if (won) {
            this.data.stats.wins++;
        }
        this.data.stats.winRate = Math.round((this.data.stats.wins / this.data.stats.totalPlayed) * 100);

        if (gameId === 'match' && stats) {
            const grid = stats.grid;
            const time = stats.time;
            const key = `matchBestTime${grid}`;
            if (this.data.stats[key] === undefined) {
                this.data.stats[key] = null;
            }
            if (this.data.stats[key] === null || time < this.data.stats[key]) {
                this.data.stats[key] = time;
            }
        } else if (gameId === 'g2048' && stats) {
            const score = stats.score;
            if (score > this.data.stats.g2048HighScore) {
                this.data.stats.g2048HighScore = score;
            }
        } else if (gameId === 'caro' && stats) {
            if (stats.result === 'win' || won) {
                this.data.stats.caroWins = (this.data.stats.caroWins || 0) + 1;
            } else if (stats.result === 'lose' || !won) {
                this.data.stats.caroLosses = (this.data.stats.caroLosses || 0) + 1;
            }
        }
        this.save();
    }
};

// Global coordinator namespace
const GameHub = {
    profile: ProfileManager,

    init() {
        this.profile.load();
        this.bindEvents();
        this.updateLobbyStats();
        this.showView('lobby-view');
    },

    bindEvents() {
        // Edit Nickname
        const editBtn = document.getElementById('edit-nickname-btn');
        const nickInput = document.getElementById('nickname-input');
        const rankDisplay = document.getElementById('user-rank');
        const nickDisplay = document.getElementById('user-nickname');

        if (editBtn && nickInput) {
            editBtn.onclick = () => {
                const isEditing = editBtn.textContent === 'Save';
                if (isEditing) {
                    const newNick = nickInput.value;
                    if (this.profile.updateNickname(newNick)) {
                        nickInput.style.display = 'none';
                        nickDisplay.textContent = this.profile.data.nickname;
                        nickDisplay.style.display = 'inline';
                        editBtn.textContent = 'Edit';
                        this.updateLobbyStats();
                        this.showNotification('Nickname updated successfully!', 'success');
                    } else {
                        this.showNotification('Invalid nickname!', 'error');
                    }
                } else {
                    nickInput.value = this.profile.data.nickname;
                    nickInput.style.display = 'inline';
                    nickDisplay.style.display = 'none';
                    editBtn.textContent = 'Save';
                }
            };
        }

        // Back to lobby buttons
        const backBtns = document.querySelectorAll('.back-btn');
        backBtns.forEach(btn => {
            btn.onclick = () => {
                this.showView('lobby-view');
            };
        });

        // Modal close buttons
        const modalConfirm = document.getElementById('global-modal-confirm');
        const modalCancel = document.getElementById('global-modal-cancel');
        const modalOverlay = document.getElementById('global-modal');

        if (modalConfirm && modalOverlay) {
            modalConfirm.onclick = () => {
                modalOverlay.classList.remove('active');
                if (this.activeModalConfig && this.activeModalConfig.onConfirm) {
                    this.activeModalConfig.onConfirm();
                }
            };
        }
        if (modalCancel && modalOverlay) {
            modalCancel.onclick = () => {
                modalOverlay.classList.remove('active');
                if (this.activeModalConfig && this.activeModalConfig.onCancel) {
                    this.activeModalConfig.onCancel();
                }
            };
        }
    },

    showView(viewId) {
        const views = document.querySelectorAll('.view-section');
        views.forEach(v => {
            if (v.id === viewId) {
                v.style.display = 'flex';
                v.classList.remove('hidden');
            } else {
                v.style.display = 'none';
                v.classList.add('hidden');
            }
        });

        if (viewId === 'match-view' && window.MatchGame) {
            window.MatchGame.init();
        } else if (viewId === 'g2048-view' && window.Game2048) {
            window.Game2048.init();
        } else if (viewId === 'caro-view' && window.CaroGame) {
            window.CaroGame.init();
        } else if (viewId === 'lobby-view') {
            this.updateLobbyStats();
        }
    },

    updateLobbyStats() {
        const stats = this.profile.data.stats;
        
        // Update user panel
        const nickDisplay = document.getElementById('user-nickname');
        const rankDisplay = document.getElementById('user-rank');
        if (nickDisplay) nickDisplay.textContent = this.profile.data.nickname;
        if (rankDisplay) rankDisplay.textContent = this.profile.getRank(stats.totalPlayed, stats.wins);

        // Update stats items
        const playedCount = document.getElementById('total-played-count');
        const winRateVal = document.getElementById('total-win-rate');
        if (playedCount) playedCount.textContent = stats.totalPlayed;
        if (winRateVal) winRateVal.textContent = stats.winRate + '%';

        // Memory game stats
        const memoryBestTime4 = document.getElementById('memory-best-4');
        const memoryBestTime6 = document.getElementById('memory-best-6');
        if (memoryBestTime4) {
            memoryBestTime4.textContent = stats.matchBestTime4 ? stats.matchBestTime4 + 's' : 'N/A';
        }
        if (memoryBestTime6) {
            memoryBestTime6.textContent = stats.matchBestTime6 ? stats.matchBestTime6 + 's' : 'N/A';
        }

        // Caro game stats
        const caroWinsDisplay = document.getElementById('caro-wins');
        const caroLossesDisplay = document.getElementById('caro-losses');
        if (caroWinsDisplay) caroWinsDisplay.textContent = stats.caroWins || 0;
        if (caroLossesDisplay) caroLossesDisplay.textContent = stats.caroLosses || 0;
    },

    showNotification(msg, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = msg;
        container.appendChild(toast);

        // Fade in
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    activeModalConfig: null,
    showModal(config) {
        this.activeModalConfig = config;
        const modalOverlay = document.getElementById('global-modal');
        const modalTitle = document.getElementById('global-modal-title');
        const modalMessage = document.getElementById('global-modal-message');
        const modalConfirm = document.getElementById('global-modal-confirm');
        const modalCancel = document.getElementById('global-modal-cancel');

        if (modalOverlay) {
            if (modalTitle) modalTitle.textContent = config.title || 'Notification';
            if (modalMessage) modalMessage.textContent = config.message || '';
            if (modalConfirm) modalConfirm.textContent = config.confirmText || 'OK';
            if (modalCancel) {
                if (config.cancelText) {
                    modalCancel.textContent = config.cancelText;
                    modalCancel.style.display = 'inline-block';
                } else {
                    modalCancel.style.display = 'none';
                }
            }
            modalOverlay.classList.add('active');
        }
    }
};

// Dummy ParticleBackground class for unit tests compatibility
class ParticleBackground {
    constructor() {}
    init() {}
}

window.ProfileManager = ProfileManager;
window.GameHub = GameHub;
window.ParticleBackground = ParticleBackground;

// Initialize coordinator on DOM load
document.addEventListener('DOMContentLoaded', () => {
    GameHub.init();
});
