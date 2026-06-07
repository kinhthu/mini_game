const allEmojis = ['🚀', '🛸', '🛰️', '🪐', '☄️', '🌌', '👨‍🚀', '👽', '🌎', '⭐', '🌞', '🌙', '🌠', '🌩️', '☀️', '☁️', '❄️', '🔥'];
let currentLevel = 1;
let currentEmojis = [];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = null;
let seconds = 0;
let gameStarted = false;
let isLocked = false;

const HIGH_SCORE_KEY = 'memoryMatchHighScores';

function loadHighScores() {
    try {
        return JSON.parse(localStorage.getItem(HIGH_SCORE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveHighScores(scores) {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
}

function getHighScoreForLevel(level) {
    const scores = loadHighScores();
    return scores[level] || null;
}

const grid = document.getElementById('grid');
const movesDisplay = document.getElementById('moves');
const timeDisplay = document.getElementById('time');
const restartBtn = document.getElementById('restart-btn');
const modalOverlay = document.getElementById('win-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const finalMoves = document.getElementById('final-moves');
const finalTime = document.getElementById('final-time');
const currentLevelDisplay = document.getElementById('current-level');
const highScoreDisplay = document.getElementById('high-score');
const newRecordMsg = document.getElementById('new-record-msg');

function updateHighScoreDisplay() {
    const record = getHighScoreForLevel(currentLevel);
    if (record) {
        highScoreDisplay.textContent = `${record.moves} / ${formatTime(record.seconds)}`;
    } else {
        highScoreDisplay.textContent = '--';
    }
}

function checkAndSaveHighScore() {
    const scores = loadHighScores();
    const current = scores[currentLevel];
    const isNew = !current
        || moves < current.moves
        || (moves === current.moves && seconds < current.seconds);

    if (isNew) {
        scores[currentLevel] = { moves, seconds };
        saveHighScores(scores);
    }
    return isNew;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!gameStarted) {
        gameStarted = true;
        timer = setInterval(() => {
            seconds++;
            timeDisplay.textContent = formatTime(seconds);
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timer);
}

function getGridDimensions(numPairs) {
    if (numPairs <= 6) return 4;
    if (numPairs <= 8) return 4;
    if (numPairs <= 10) return 5;
    if (numPairs <= 12) return 6;
    if (numPairs <= 15) return 6;
    return 6;
}

function createBoard() {
    grid.innerHTML = '';
    
    // Determine number of pairs for current level
    let numPairs = 6 + (currentLevel - 1) * 2;
    if (numPairs > allEmojis.length) {
        numPairs = allEmojis.length;
    }
    
    currentEmojis = allEmojis.slice(0, numPairs);
    cards = [...currentEmojis, ...currentEmojis];
    
    const shuffledCards = shuffle([...cards]);
    
    const cols = getGridDimensions(numPairs);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    shuffledCards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        const front = document.createElement('div');
        front.classList.add('card-face', 'card-front');
        
        const back = document.createElement('div');
        back.classList.add('card-face', 'card-back');
        back.textContent = emoji;
        
        card.appendChild(front);
        card.appendChild(back);
        
        card.addEventListener('click', flipCard);
        
        grid.appendChild(card);
    });
}

function flipCard() {
    if (isLocked) return;
    if (this === flippedCards[0]) return;
    
    startTimer();
    
    this.classList.add('flipped');
    flippedCards.push(this);
    
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        checkForMatch();
    }
}

function checkForMatch() {
    let isMatch = flippedCards[0].dataset.emoji === flippedCards[1].dataset.emoji;
    
    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    flippedCards[0].removeEventListener('click', flipCard);
    flippedCards[1].removeEventListener('click', flipCard);
    
    flippedCards[0].classList.add('matched');
    flippedCards[1].classList.add('matched');
    
    matchedPairs++;
    flippedCards = [];
    
    if (matchedPairs === currentEmojis.length) {
        gameOver();
    }
}

function unflipCards() {
    isLocked = true;
    
    setTimeout(() => {
        flippedCards[0].classList.remove('flipped');
        flippedCards[1].classList.remove('flipped');
        
        flippedCards = [];
        isLocked = false;
    }, 1000);
}

function gameOver() {
    stopTimer();
    const isNewRecord = checkAndSaveHighScore();
    setTimeout(() => {
        finalMoves.textContent = moves;
        finalTime.textContent = formatTime(seconds);
        newRecordMsg.style.display = isNewRecord ? 'block' : 'none';
        updateHighScoreDisplay();
        modalOverlay.classList.add('active');
    }, 500);
}

function resetGame() {
    stopTimer();
    gameStarted = false;
    isLocked = false;
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;
    
    movesDisplay.textContent = '0';
    timeDisplay.textContent = '0:00';
    modalOverlay.classList.remove('active');
    
    createBoard();
    updateHighScoreDisplay();
}

restartBtn.addEventListener('click', () => {
    currentLevel = 1;
    currentLevelDisplay.textContent = currentLevel;
    resetGame();
});

playAgainBtn.addEventListener('click', () => {
    resetGame();
});

nextLevelBtn.addEventListener('click', () => {
    currentLevel++;
    currentLevelDisplay.textContent = currentLevel;
    resetGame();
});

// Initialize game
createBoard();
updateHighScoreDisplay();

// ==========================================
// CUTE MASCOT INTERACTIVE LOGIC
// ==========================================
const mascot = document.getElementById('cute-mascot');
const speechBubble = document.getElementById('mascot-speech');

// Danh sách những câu nói dễ thương
const mascotQuotes = [
    "Cố lên bạn ơi! 🌸",
    "Tìm cặp trùng đi nào! ⭐",
    "Kẹo Konpeito ngon quá! ✨",
    "Tớ là Soot Sprite nè! 🐾",
    "Totoro đang cổ vũ bạn đó! 🌳",
    "Chơi thật vui vẻ nhé! 🍀",
    "Bạn chơi đỉnh quá đi! 🎉",
    "Hãy tập trung nào! 🕯️",
    "Có đói bụng không? 🍵",
    "Tuyệt vời ông mặt trời! ☀️"
];

// Hàm chọn câu thoại ngẫu nhiên
function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * mascotQuotes.length);
    speechBubble.textContent = mascotQuotes[randomIndex];
}

// Hàm tạo hiệu ứng hạt kẹo bay tung toé
function createKonpeitoParticles() {
    const rect = mascot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Bảng màu pastel kẹo Konpeito dễ thương
    const colors = ['#fde047', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'];
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.classList.add('konpeito-particle');
        
        // Tính hướng bay ngẫu nhiên vòng tròn
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 60;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const rot = 180 + Math.random() * 360;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', `${rot}deg`);
        particle.style.setProperty('--particle-color', color);
        
        // Đặt toạ độ xuất phát từ tâm Mascot
        particle.style.left = `${centerX - 7}px`;
        particle.style.top = `${centerY - 7}px`;
        
        document.body.appendChild(particle);
        
        // Tự động xoá hạt sau khi hiệu ứng kết thúc
        setTimeout(() => {
            particle.remove();
        }, 700);
    }
}

// Lắng nghe sự kiện click mascot
if (mascot) {
    mascot.addEventListener('click', () => {
        // Hiệu ứng nhảy
        mascot.classList.remove('pop-active');
        void mascot.offsetWidth; // Trigger reflow để restart animation
        mascot.classList.add('pop-active');
        
        // Thay đổi câu thoại
        showRandomQuote();
        
        // Bắn kẹo sao
        createKonpeitoParticles();
    });
    
    // Đổi câu thoại mỗi khi hover chuột qua
    mascot.addEventListener('mouseenter', () => {
        showRandomQuote();
    });
}

