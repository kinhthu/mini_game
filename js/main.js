/**
 * Gemini Arcade - SPA Orchestrator and Design System Controller
 */

// 1. PARTICLE BACKGROUND CANVAS ENGINE
class ParticleBackground {
    constructor() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.colors = [
            'rgba(0, 242, 254, 0.4)',  // cyan
            'rgba(155, 81, 224, 0.4)', // purple
            'rgba(255, 75, 92, 0.4)',  // coral
            'rgba(251, 197, 49, 0.4)',  // gold
            'rgba(0, 230, 118, 0.4)'   // green
        ];
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 20000));
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 4 + 1.5,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                glow: Math.random() * 15 + 5
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Bounce on boundaries
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = p.glow;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        });

        // Draw connections
        this.ctx.shadowBlur = 0; // reset shadow for lines
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 100) {
                    const alpha = (1 - dist / 100) * 0.12;
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// 2. PROFILE & STATISTICS MANAGER
const ProfileManager = {
    storageKey: 'gemini_arcade_profile',
    data: {
        nickname: 'ArcadeRider',
        stats: {
            totalPlayed: 0,
            wins: 0,
            winRate: 0,
            // Game records
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
                // Ensure stats structure matches
                if (!this.data.stats) this.data.stats = {};
            } catch (e) {
                console.error("Failed to parse profile, loading defaults", e);
            }
        }
        this.updateUI();
    },

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        this.updateUI();
    },

    updateNickname(newNick) {
        if (newNick && newNick.trim().length > 0) {
            this.data.nickname = newNick.trim().slice(0, 16);
            this.save();
            return true;
        }
        return false;
    },

    recordGame(gameId, won, extraStats = {}) {
        this.data.stats.totalPlayed++;
        if (won) {
            this.data.stats.wins++;
        }

        // Handle specific game statistics
        if (gameId === 'match') {
            const { grid, time } = extraStats;
            if (grid && time) {
                const key = `matchBestTime${grid}`;
                const prevBest = this.data.stats[key];
                if (prevBest === undefined || prevBest === null || time < prevBest) {
                    this.data.stats[key] = time;
                    GameHub.showNotification(`New Record in Match ${grid}x${grid}: ${time}s!`, '🔥');
                }
            }
        } else if (gameId === 'g2048') {
            const { score } = extraStats;
            if (score && score > (this.data.stats.g2048HighScore || 0)) {
                this.data.stats.g2048HighScore = score;
                GameHub.showNotification(`New 2048 High Score: ${score}!`, '🔥');
            }
        } else if (gameId === 'caro') {
            const { result } = extraStats; // 'win', 'lose'
            if (result === 'win') {
                this.data.stats.caroWins = (this.data.stats.caroWins || 0) + 1;
            } else if (result === 'lose') {
                this.data.stats.caroLosses = (this.data.stats.caroLosses || 0) + 1;
            }
        }

        // Recalculate win rate
        const total = this.data.stats.totalPlayed;
        this.data.stats.winRate = total > 0 ? Math.round((this.data.stats.wins / total) * 100) : 0;

        this.save();
    },

    getRank(total, wins) {
        if (total < 3) return "Arcade Initiate";
        if (total < 10) return "Neon Runner";
        if (total < 25) return "Grid Master";
        if (wins >= 20) return "Cyber Legend";
        return "Console Veteran";
    },

    updateUI() {
        // Elements
        const nickInput = document.getElementById('profile-nickname');
        const rankSpan = document.getElementById('profile-rank');
        const playedSpan = document.getElementById('stat-total-played');
        const winsSpan = document.getElementById('stat-total-wins');
        const rateSpan = document.getElementById('stat-win-rate');

        if (nickInput) nickInput.value = this.data.nickname;
        if (rankSpan) rankSpan.textContent = this.getRank(this.data.stats.totalPlayed, this.data.stats.wins);
        if (playedSpan) playedSpan.textContent = this.data.stats.totalPlayed;
        if (winsSpan) winsSpan.textContent = this.data.stats.wins;
        if (rateSpan) rateSpan.textContent = `${this.data.stats.winRate}%`;

        // Update Lobby Game Catalog Record Displays
        const matchBestLabel = document.getElementById('lobby-match-best');
        if (matchBestLabel) {
            const times = [];
            if (this.data.stats.matchBestTime4) times.push(`${this.data.stats.matchBestTime4}s (4x4)`);
            if (this.data.stats.matchBestTime6) times.push(`${this.data.stats.matchBestTime6}s (6x6)`);
            if (this.data.stats.matchBestTime8) times.push(`${this.data.stats.matchBestTime8}s (8x8)`);
            matchBestLabel.textContent = times.length > 0 ? times.join(' / ') : '-';
        }

        const score2048Label = document.getElementById('lobby-g2048-best');
        if (score2048Label) {
            score2048Label.textContent = this.data.stats.g2048HighScore || '0';
        }

        const caroRecordLabel = document.getElementById('lobby-caro-record');
        if (caroRecordLabel) {
            const w = this.data.stats.caroWins || 0;
            const l = this.data.stats.caroLosses || 0;
            caroRecordLabel.textContent = `${w} W - ${l} L`;
        }
    }
};

// 3. CENTRAL GATEWAY & API (GameHub)
window.GameHub = {
    profile: ProfileManager,
    
    showView(viewId) {
        // Hide all views
        const views = document.querySelectorAll('.view-section');
        views.forEach(v => {
            v.classList.remove('active');
            v.style.display = 'none';
        });

        // Show active view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'flex';
            // Force redraw for transition animation
            void targetView.offsetWidth;
            targetView.classList.add('active');
        }

        // Update Nav Link classes
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            if (btn.getAttribute('data-view') === viewId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Trigger individual game loading/unloading hooks
        if (viewId === 'match-view' && window.MatchGame && typeof window.MatchGame.init === 'function') {
            window.MatchGame.init();
        } else if (viewId === 'g2048-view' && window.Game2048 && typeof window.Game2048.init === 'function') {
            window.Game2048.init();
        } else if (viewId === 'caro-view' && window.CaroGame && typeof window.CaroGame.init === 'function') {
            window.CaroGame.init();
        }
    },

    showNotification(message, icon = '🏆') {
        const banner = document.getElementById('notification-banner');
        const text = document.getElementById('notification-text');
        const iconSpan = document.getElementById('notification-icon');
        
        if (banner && text) {
            text.textContent = message;
            if (iconSpan) iconSpan.textContent = icon;
            
            banner.classList.add('active');
            
            // Auto hide after 3.5s
            if (this._notifTimeout) clearTimeout(this._notifTimeout);
            this._notifTimeout = setTimeout(() => {
                banner.classList.remove('active');
            }, 3500);
        }
    },

    showModal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
        const overlay = document.getElementById('game-modal');
        const mTitle = document.getElementById('modal-title');
        const mBody = document.getElementById('modal-body');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');

        if (!overlay) return;

        mTitle.textContent = title;
        mBody.innerHTML = body;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        // Reset click handlers
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;

        confirmBtn.onclick = () => {
            overlay.classList.remove('active');
            if (typeof onConfirm === 'function') onConfirm();
        };

        cancelBtn.onclick = () => {
            overlay.classList.remove('active');
            if (typeof onCancel === 'function') onCancel();
        };

        overlay.classList.add('active');
    }
};

// 4. MAIN PAGE ORCHESTRATION & BINDINGS
document.addEventListener('DOMContentLoaded', () => {
    // Start particles background
    new ParticleBackground();

    // Load Player profile
    ProfileManager.load();

    // Set up SPA View Navigation links
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            GameHub.showView(targetView);
        });
    });

    // Play Now buttons in lobby cards
    const playButtons = document.querySelectorAll('.play-game-btn');
    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-target');
            GameHub.showView(targetView);
        });
    });

    // Back to Lobby navigation
    const backBtns = document.querySelectorAll('.back-to-lobby');
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            GameHub.showView('lobby-view');
        });
    });

    // Profile Nickname Editing Event bindings
    const editBtn = document.getElementById('edit-nickname-btn');
    const nickInput = document.getElementById('profile-nickname');

    if (editBtn && nickInput) {
        editBtn.addEventListener('click', () => {
            const isReadonly = nickInput.hasAttribute('readonly');
            if (isReadonly) {
                // Switch to edit mode
                nickInput.removeAttribute('readonly');
                editBtn.textContent = '💾';
                nickInput.focus();
                nickInput.select();
                nickInput.style.borderBottomColor = 'var(--accent-cyan)';
            } else {
                // Save edited nickname
                const updated = ProfileManager.updateNickname(nickInput.value);
                nickInput.setAttribute('readonly', 'true');
                editBtn.textContent = '✏️';
                nickInput.style.borderBottomColor = 'transparent';
                if (updated) {
                    GameHub.showNotification(`Nickname updated to ${ProfileManager.data.nickname}!`, '💾');
                }
            }
        });

        // Also allow saving when pressing Enter
        nickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editBtn.click();
            }
        });
    }

    // Welcoming Notification Banner
    setTimeout(() => {
        GameHub.showNotification(`Welcome back, ${ProfileManager.data.nickname}!`, '👾');
    }, 1000);
});
