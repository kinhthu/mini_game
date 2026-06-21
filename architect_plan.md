# Kế hoạch kỹ thuật: Thêm game Cờ Ca Rô vào Web Mini-Games

Tài liệu này phác thảo kế hoạch chi tiết để tái cấu trúc và mở rộng trang web mini-game hiện tại, từ chỗ chỉ có duy nhất một game Memory Match sang một nền tảng hỗ trợ nhiều game, đồng thời tích hợp game **Cờ Ca Rô (Gomoku)** với chế độ chơi hai người (PvP) và chơi với Máy (PvAI).

---

## 1. Mục tiêu & Phạm vi

- **Mục tiêu**: Tích hợp game Cờ Ca Rô vào trang web hiện tại với giao diện hiện đại, mượt mà và nhất quán về mặt thẩm mỹ (glassmorphism, dark theme).
- **Phạm vi**:
  - **Màn hình lựa chọn game (Lobby)**: Nơi người dùng có thể chọn giữa "Memory Match" và "Cờ Ca Rô".
  - **Game Cờ Ca Rô**:
    - Bàn cờ kích thước **12x12** (kích thước tối ưu cho cả màn hình mobile và desktop).
    - **Chế độ chơi PvP (Player vs Player)**: Hai người chơi chơi cục bộ trên cùng một thiết bị.
    - **Chế độ chơi PvAI (Player vs AI)**: Người chơi đấu với máy (AI sử dụng thuật toán heuristic đánh giá trạng thái).
    - **Tính năng mở rộng**: Chức năng đi lại (Undo), Đếm lượt đi (Moves), Đồng hồ đo thời gian (Timer), Nút Restart và quay lại Lobby.
    - **UI/UX cao cấp**: Thiết kế quân X/O sắc nét, hiệu ứng animation khi đi cờ, highlight dòng chiến thắng bằng hiệu ứng phát sáng (glowing line), màn hình modal thông báo kết quả.

---

## 2. Phương án thiết kế & Trade-offs

### A. Cấu trúc ứng dụng và Chuyển đổi màn hình (Routing)
- **Phương án 1 (Multi-page App)**: Tách mỗi game ra một file HTML riêng biệt (`index.html` làm lobby, `memory.html` cho Memory Match, `caro.html` cho Caro).
  - *Trade-off*: Giữ code cô lập tốt, nhưng trải nghiệm chuyển trang sẽ bị giật (reload trang), khó tái sử dụng các biến CSS chung, fonts, và giao diện nền đồng bộ.
- **Phương án 2 (Single-page App - SPA - KHUYẾN NGHỊ)**: Giữ nguyên `index.html`, chia giao diện thành các phần tử màn hình (`#lobby-screen`, `#memory-game-screen`, `#caro-game-screen`) điều khiển ẩn hiện qua CSS và JavaScript. Tách logic nghiệp vụ thành các file JS riêng biệt (`memory.js`, `caro.js`) và quản lý định tuyến chung trong `main.js`.
  - *Trade-off*: Chuyển đổi màn hình mượt mà, tức thời (kèm hiệu ứng fade-in). Dễ dàng chia sẻ CSS variables chung cho nút bấm, modal, background. Cần đặt tên class CSS cẩn thận để tránh xung đột phong cách.

### B. Cơ chế hiển thị Bàn cờ Ca Rô
- **Phương án 1 (HTML Canvas)**: Vẽ bàn cờ và quân cờ trên thẻ `<canvas>`.
  - *Trade-off*: Hiệu năng cao cho bàn cờ siêu lớn, nhưng khó cấu hình responsive (cần resize canvas bằng JS), khó áp dụng CSS hover effects cho từng ô cờ, việc bắt sự kiện click phức tạp hơn.
- **Phương án 2 (CSS Grid & DOM Elements - KHUYẾN NGHỊ)**: Sử dụng CSS Grid kết hợp thẻ `div` cho từng ô cờ.
  - *Trade-off*: 144 ô cờ (12x12) là cực kỳ nhẹ đối với DOM. Dễ dàng viết CSS hover, hiệu ứng vẽ quân cờ bằng SVG/CSS, responsive tự động theo flexbox/grid. Trực quan và dễ code.

### C. Giải thuật AI cho Cờ Ca Rô
- **Phương án 1 (Minimax / Alpha-Beta Pruning)**: Tìm kiếm cây trạng thái.
  - *Trade-off*: Có khả năng tính toán nước đi sâu, nhưng không gian trạng thái bàn cờ 12x12 quá lớn ($144!$), dẫn đến việc tính toán rất chậm và dễ gây giật lag trên trình duyệt nếu độ sâu lớn hơn 3.
- **Phương án 2 (Đánh giá Heuristic Điểm ô cờ - KHUYẾN NGHỊ)**: Duyệt qua tất cả các ô trống trên bàn cờ, tính điểm cho mỗi ô dựa trên cấu trúc các quân cờ xung quanh (theo 4 hướng). AI sẽ ưu tiên chọn ô có điểm cao nhất (tấn công hoặc phòng thủ tối ưu).
  - *Trade-off*: Tính toán cực kỳ nhanh (dưới 5ms), cấu hình đơn giản nhưng vẫn thông minh và tạo thử thách lớn cho người chơi casual.

---

## 3. Thiết kế kỹ thuật

### A. Cấu trúc thư mục dự kiến
```text
/
├── index.html          # File HTML duy nhất (chứa cấu trúc của Lobby, Memory, Caro)
├── style.css           # CSS chung + Styles chi tiết của từng màn hình & game
├── main.js             # Controller chính (điều hướng màn hình, khởi tạo game)
├── memory.js           # Logic của game Memory Match (Refactored từ main.js)
└── caro.js             # Logic của game Cờ Ca Rô (PvP, PvAI, Heuristic AI)
```

### B. Thay đổi cấu trúc HTML (`index.html`)
- Bọc game Memory Match hiện tại vào trong một container `<div id="memory-game-screen" class="screen">`.
- Tạo mới màn hình chính `<div id="lobby-screen" class="screen active">` chứa tiêu đề ứng dụng và 2 thẻ game (Game Cards) giới thiệu chi tiết từng trò chơi.
- Tạo mới `<div id="caro-game-screen" class="screen">` với:
  - Header: Tên game, chế độ chơi hiện tại, các nút chức năng (Lobby, Restart, Undo).
  - Stats: Lượt đi, Thời gian, Lượt đi của ai (X hay O).
  - Board: `<div id="caro-board" class="caro-board"></div>`.
  - Modal: Khung kết quả trận đấu riêng hoặc dùng chung hệ thống Modal thiết kế lại.

### C. Thiết kế JavaScript Modules
- **`memory.js`**:
  - Đóng gói logic Memory Match vào một class hoặc đối tượng `MemoryGame`.
  - Cung cấp phương thức `init()`, `reset()`, và `cleanup()` (hủy timer).
- **`caro.js`**:
  - Đối tượng `CaroGame` quản lý:
    - `board`: Mảng 2 chiều kích thước 12x12 lưu trạng thái (`''`, `'X'`, `'O'`).
    - `history`: Stack lưu danh sách nước đi đã thực hiện (để hỗ trợ Undo).
    - `currentPlayer`: Người chơi hiện tại (`'X'` hoặc `'O'`).
    - `gameMode`: `'pvp'` hoặc `'pvai'`.
  - Win-checking logic: Quét từ vị trí nước đi hiện tại theo 4 hướng chính (ngang, dọc, chéo chính, chéo phụ) để kiểm tra xem có chuỗi 5 ô liên tiếp cùng loại hay không.
  - Heuristic AI:
    - Định nghĩa bảng điểm cho các cấu trúc chuỗi (Ví dụ: 5 quân = 100,000 điểm; 4 quân mở hai đầu = 10,000 điểm; 4 quân bị chặn một đầu = 1,000 điểm; tương tự cho phòng ngự của đối phương).
    - AI sẽ tính tổng điểm (Điểm Tấn Công + Điểm Phòng Thủ) cho mọi ô trống, sau đó chọn ô có điểm cao nhất.

### D. Thiết kế CSS (`style.css`)
- Thêm lớp `.screen` để kiểm soát hiển thị:
  ```css
  .screen {
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
  }
  .screen.active {
      display: flex;
      flex-direction: column;
      opacity: 1;
  }
  ```
- Thiết kế Lobby bắt mắt: Các game card có hiệu ứng scale, glow viền nhẹ khi di chuột qua, sử dụng `backdrop-filter: blur(10px)` tạo phong cách kính mờ.
- Tạo phong cách quân cờ Caro:
  - Ô cờ: `aspect-ratio: 1/1`, viền mờ `rgba(255,255,255,0.05)`, hiệu ứng hover sáng nhẹ.
  - Quân cờ **X**: Vẽ nét chéo mượt màu hồng đỏ rực (`--accent-color` hoặc `#f43f5e`), tỏa sáng nhẹ (`text-shadow` hoặc `box-shadow` phát quang).
  - Quân cờ **O**: Vẽ hình tròn màu xanh lam sáng (`#38bdf8`), tỏa sáng xanh.

---

## 4. Hạng mục công việc (Task Items)

1. **Task 1: Tách file JS & Refactor Memory Match**
   - Di chuyển toàn bộ code của game lật hình từ `main.js` sang `memory.js`.
   - Tổ chức lại code dưới dạng mô đun để tránh xung đột biến toàn cục.
2. **Task 2: Cập nhật cấu trúc index.html**
   - Thêm phần khung HTML cho Lobby screen.
   - Thêm phần khung HTML cho Caro game screen (bao gồm bảng cờ, chỉ số, chế độ chọn PvP/PvAI).
   - Tích hợp liên kết các script mới.
3. **Task 3: Cập nhật style.css**
   - Thêm lớp điều khiển ẩn hiện màn hình mượt mà.
   - Tạo phong cách cho màn hình Lobby (hiển thị 2 card game đẹp mắt).
   - Tạo kiểu dáng cho bàn cờ Caro 12x12 responsive tốt trên màn hình hẹp (mobile).
4. **Task 4: Viết logic Cờ Ca Rô (chế độ PvP)**
   - Viết hàm render bàn cờ Caro động và gán sự kiện click.
   - Hiện thực hóa logic thay đổi lượt đi, lưu lịch sử để hỗ trợ chức năng **Undo**.
   - Cài đặt thuật toán kiểm tra 5 quân liên tiếp thắng cuộc và đánh dấu (highlight) dòng thắng cuộc.
5. **Task 5: Thiết lập thuật toán AI cho chế độ PvAI**
   - Xây dựng lớp chấm điểm heuristic dựa trên số lượng quân cờ liên tiếp trên cùng một hướng để tìm nước đi tối ưu nhất cho máy.
   - Liên kết lượt đi của máy tự động kích hoạt sau khi người chơi đi nước cờ của mình.
6. **Task 6: Tích hợp tổng thể và Polish UI/UX**
   - Liên kết sự kiện nút quay lại lobby, reset game.
   - Thêm các micro-animations (ví dụ quân cờ xuất hiện với hiệu ứng scale và glow).
   - Đảm bảo định dạng responsive chuẩn xác.

---

## 5. Rủi ro & Cách giảm thiểu

| Rủi ro | Tác động | Giải pháp giảm thiểu |
| :--- | :--- | :--- |
| **Bàn cờ 12x12 bị tràn** trên màn hình nhỏ di động (360px - 400px). | Làm hỏng bố cục giao diện, người chơi phải cuộn ngang. | Sử dụng CSS `max-width: min(90vw, 500px)` và gán tỷ lệ ô cờ tự động co giãn theo viewport nhờ `aspect-ratio: 1/1`. |
| **Trạng thái (State) bị rò rỉ** giữa các lần chơi hoặc đổi game. | Lỗi đếm thời gian nhảy sai, lượt đi bị lẫn lộn giữa game cũ và mới. | Khi click quay lại lobby hoặc reset, thực thi hàm cleanup xóa bỏ hoàn toàn setInterval timer hiện tại và làm trống mảng bàn cờ. |
| **AI thực thi quá lâu** gây đơ giao diện (UI lockup). | Trải nghiệm kém, người dùng tưởng game bị đơ. | Thuật toán đánh giá heuristic đơn giản chỉ mất dưới 5ms để duyệt 144 ô. Tránh sử dụng cây tìm kiếm quá sâu trên trình duyệt. |

---

## 6. Cách thức kiểm thử (Verification)

1. **Kiểm tra Định tuyến (Routing)**:
   - Truy cập trang web -> Hiển thị Lobby đầu tiên.
   - Nhấp vào "Memory Match" -> Chuyển màn hình mượt mà, game bắt đầu. Quay lại lobby -> Timer dừng hẳn.
   - Nhấp vào "Cờ Ca Rô" -> Chuyển sang Caro. Quay lại lobby -> Xóa trắng bàn cờ.
2. **Kiểm thử Caro PvP**:
   - Nhấp chọn ô cờ bất kỳ -> Hiển thị quân X. Nhấp ô tiếp theo -> Hiển thị quân O.
   - Thử click vào ô đã đi -> Không xảy ra hiện tượng ghi đè hay mất lượt.
   - Đi đủ 5 quân cùng loại theo hàng ngang, dọc hoặc chéo -> Màn hình modal chiến thắng hiện ra, dòng 5 quân chiến thắng được phát sáng.
   - Nhấp nút "Undo" -> Quay lại nước đi trước đó đúng lượt chơi.
3. **Kiểm thử Caro PvAI**:
   - Bật chế độ PvAI -> Người chơi đi X trước.
   - Ngay lập tức AI tự động phân tích và đi quân O.
   - Thử đi 3 hoặc 4 quân liên tiếp -> Kiểm tra xem AI có tự động phát hiện và đi chặn hai đầu hay không.
4. **Kiểm tra Responsive**:
   - Dùng Chrome DevTools giả lập iPhone SE (375px) và các dòng máy nhỏ -> Bàn cờ Caro tự động thu nhỏ vừa khít bề ngang, không bị lệch hoặc tràn dòng.
