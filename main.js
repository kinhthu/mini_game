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
    setTimeout(() => {
        finalMoves.textContent = moves;
        finalTime.textContent = formatTime(seconds);
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
