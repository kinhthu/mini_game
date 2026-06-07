# Kế hoạch triển khai: Thêm tính năng High Score

## 1. Phân tích hiện trạng

**Dự án:** Memory Match Game (lật bài tìm cặp emoji)

**Cấu trúc file:**
- `index.html`: Giao diện gồm header (h1 + stats `Moves`/`Time` + nút Restart), grid lật bài, modal khi thắng.
- `main.js`: Logic game, biến `currentLevel`, `moves`, `seconds`, các hàm `createBoard()`, `gameOver()`, `resetGame()`.
- `style.css`: Có sẵn class `.stats`, `.stat-box`, `.label`, `.value` để tái sử dụng.

**Đặc điểm cần lưu ý:**
- Game có nhiều **level** (số cặp bài tăng theo level: `6 + (currentLevel - 1) * 2`). High score phải lưu **theo từng level** vì độ khó khác nhau.
- Có 2 chỉ số đo hiệu suất: `moves` (số bước) và `seconds` (thời gian). Đề bài cho phép chọn 1 hoặc cả 2 → **chọn lưu cả 2** để toàn diện, nhưng tiêu chí so sánh chính là **số bước (moves) ít nhất**; nếu hòa moves thì lấy thời gian ngắn hơn.
- Lưu vào `localStorage` dưới key `memoryMatchHighScores` ở dạng JSON object `{ "<level>": { moves, seconds } }`.

## 2. Kế hoạch chi tiết từng bước

### Bước 1 — Cập nhật `index.html`: Thêm ô hiển thị High Score

Trong khối `<div class="stats">` (sau `stat-box` của `Time`), thêm 1 `stat-box` mới hiển thị kỷ lục của level hiện tại:

```html
<div class="stat-box">
    <span class="label">Best</span>
    <span class="value" id="high-score">--</span>
</div>
```

- Mặc định hiển thị `--` khi level chưa có kỷ lục.
- Khi có kỷ lục, hiển thị dạng `<moves> / <time>` (ví dụ `12 / 0:45`).

Trong modal thắng (`#win-modal`), thêm một dòng `<p>` thông báo khi đạt kỷ lục mới:

```html
<p id="new-record-msg" style="display:none; color: var(--accent-color); font-weight: 900;">🏆 New High Score!</p>
```

Đặt dòng này ngay trước nhóm nút trong `.modal-content`.

### Bước 2 — Cập nhật `main.js`: Thêm helper localStorage

Thêm constant key và 2 helper ở đầu file (sau khối khai báo biến):

```js
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
```

### Bước 3 — Thêm DOM reference cho phần tử mới

Thêm vào khối khai báo DOM (gần dòng 22):

```js
const highScoreDisplay = document.getElementById('high-score');
const newRecordMsg = document.getElementById('new-record-msg');
```

### Bước 4 — Hàm cập nhật hiển thị High Score

Thêm hàm mới:

```js
function updateHighScoreDisplay() {
    const record = getHighScoreForLevel(currentLevel);
    if (record) {
        highScoreDisplay.textContent = `${record.moves} / ${formatTime(record.seconds)}`;
    } else {
        highScoreDisplay.textContent = '--';
    }
}
```

### Bước 5 — So sánh và lưu kỷ lục mới khi thắng level

Tạo hàm xét kỷ lục mới (so sánh ưu tiên `moves` ít hơn, nếu hòa thì `seconds` ít hơn):

```js
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
```

### Bước 6 — Tích hợp vào `gameOver()`

Sửa hàm `gameOver()` để: (1) gọi `checkAndSaveHighScore()`, (2) hiển thị/ẩn dòng "New High Score!", (3) cập nhật lại ô Best trên header.

```js
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
```

### Bước 7 — Cập nhật High Score khi chuyển level / restart

Trong `resetGame()`, sau khi `createBoard()`, gọi `updateHighScoreDisplay()` để ô Best hiển thị đúng cho level hiện tại:

```js
function resetGame() {
    // ... code cũ ...
    createBoard();
    updateHighScoreDisplay();  // <-- thêm dòng này
}
```

Đồng thời, ở cuối file (sau `createBoard();` khởi tạo), thêm:

```js
updateHighScoreDisplay();
```

để hiển thị ngay khi vừa load trang.

### Bước 8 — (Tùy chọn) CSS điều chỉnh

`stat-box` hiện tại có `min-width: 100px` và `font-size: 2rem` cho `.value`. Vì chuỗi `12 / 0:45` dài hơn, kiểm tra trên mobile (`max-width: 500px`) xem có bị tràn không. Nếu cần, có thể thêm vào `style.css`:

```css
#high-score {
    font-size: 1.4rem; /* nhỏ hơn vì chứa cả moves và time */
}
```

(Coder quyết định có cần thêm hay không sau khi xem thử bố cục.)

## 3. Tổng hợp file cần thay đổi

| File | Thay đổi |
|---|---|
| `index.html` | Thêm `stat-box` Best Score; thêm dòng "New High Score!" trong modal |
| `main.js` | Thêm constant, helper localStorage, hàm `updateHighScoreDisplay`, hàm `checkAndSaveHighScore`, sửa `gameOver` và `resetGame`, gọi cập nhật khi khởi tạo |
| `style.css` | (Tùy chọn) Tinh chỉnh font-size cho `#high-score` nếu bị tràn |

## 4. Kiểm thử

1. Mở `index.html`, chơi xong 1 level → kiểm tra ô Best có cập nhật, modal hiển thị "New High Score!".
2. Chơi lại level đó với số bước nhiều hơn → kỷ lục giữ nguyên, KHÔNG hiển thị thông báo.
3. Chơi lại với số bước ít hơn → kỷ lục cập nhật, hiển thị thông báo.
4. Chuyển sang level 2 → ô Best hiển thị `--` (vì chưa có kỷ lục cho level 2).
5. Refresh trình duyệt (F5) → ô Best vẫn hiển thị đúng kỷ lục đã lưu (xác nhận `localStorage` hoạt động).
6. Mở DevTools → Application → Local Storage, kiểm tra key `memoryMatchHighScores` tồn tại với cấu trúc JSON đúng.
