document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = {
        memory: {
            element: document.getElementById('memory-game-section'),
            game: window.MemoryGame
        },
        caro: {
            element: document.getElementById('caro-game-section'),
            game: window.CaroGame
        }
    };

    let activeTab = 'memory';

    // Initialize the default game (Memory Match)
    if (sections[activeTab] && sections[activeTab].game) {
        sections[activeTab].game.init();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            if (targetTab === activeTab) return;

            // Switch active tab UI
            const activeTabBtn = document.querySelector('.tab-btn.active');
            if (activeTabBtn) {
                activeTabBtn.classList.remove('active');
            }
            tab.classList.add('active');

            // Stop old game and hide its section
            const oldSection = sections[activeTab];
            if (oldSection) {
                if (oldSection.game && typeof oldSection.game.stop === 'function') {
                    oldSection.game.stop();
                }
                if (oldSection.element) {
                    oldSection.element.style.display = 'none';
                    oldSection.element.classList.remove('active');
                }
            }

            // Update active tab key
            activeTab = targetTab;

            // Show new game section and initialize it
            const newSection = sections[activeTab];
            if (newSection) {
                if (newSection.element) {
                    newSection.element.style.display = 'block';
                    newSection.element.classList.add('active');
                }
                if (newSection.game && typeof newSection.game.init === 'function') {
                    newSection.game.init();
                }
            }
        });
    });
});
