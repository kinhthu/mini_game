# Kế Hoạch Kỹ Thuật: Tích Hợp Game Tic Tac Toe Vào Danh Sách Game

Tài liệu này định nghĩa kế hoạch thiết kế kiến trúc, các thay đổi giao diện và đặc tả kỹ thuật chi tiết để tích hợp trò chơi **Tic Tac Toe** (Cờ Ca-rô 3x3) vào bộ ứng dụng game **Mini Game Hub**. 

Ứng dụng sẽ được tái cấu trúc từ một trang game duy nhất (Memory Match) thành một ứng dụng Single Page Application (SPA) chứa nhiều game, quản lý bởi một màn hình chính (Lobby) điều hướng mượt mà, sử dụng thiết kế kính mờ (Glassmorphism) cùng hiệu ứng Neon bắt mắt.

---

## 1. Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục

Dự án sử dụng kiến trúc client-side SPA thuần (không framework). Các tệp tin trong workspace sẽ được cập nhật hoặc tạo mới như sau:

```text
wt-b73fa0b253eb4fa588781164e1c702f2/
├── index.html                   # Cấu trúc HTML chính (Lobby, Memory Match & Tic Tac Toe views)
├── style.css                    # Toàn bộ CSS (Lobby, game cards, 3x3 grid board & neon styles)
├── main.js                      # Central Controller: Điều hướng view, ProfileManager, quản lý stats
└── tictactoe.js                 # NEW FILE: Công cụ xử lý logic game Tic Tac Toe, Minimax AI & Easy AI
```

---

## 2. Thiết Kế Giao Diện & Hệ Thống Màu Sắc (Neon Theme)

Tic Tac Toe sẽ sử dụng hệ màu **Neon Gold / Cyberpunk** làm màu chủ đạo để phân biệt với các game khác, đồng bộ với phong cách Glassmorphism:

| Token Màu | Giá Trị | Vai Trò Giao Diện |
|---|---|---|
| `--accent-gold` | `#fbc531` | Màu chủ đạo của Tic Tac Toe, viền nổi bật, tiêu đề |
| `--accent-cyan` | `#00d2d3` | Màu hiển thị cho quân cờ X (Neon Cyan) |
| `--accent-coral` | `#ff7675` | Màu hiển thị cho quân cờ O (Neon Coral) |
| `--glass-bg` | `rgba(255, 255, 255, 0.05)` | Nền thẻ kính mờ |
| `--glass-border` | `rgba(255, 255, 255, 0.1)` | Viền kính mờ |

### Chi Tiết Thành Phần
1. **Lobby Game Card**: Thẻ game trong giao diện Lobby có hiệu ứng phóng to nhẹ khi hover, viền vàng neon và hiển thị chỉ số thắng/thua/hòa (PvP và PvE) lấy từ `localStorage`.
2. **Tic Tac Toe Board**: Bảng lưới 3x3 kích thước cố định khoảng `300px - 320px`, các ô cờ bo góc nhẹ (`0.75rem`) có hiệu ứng hover hiển thị mờ ký tự chuẩn bị đặt.
3. **Hiệu ứng chiến thắng**: Khi có người thắng, 3 ô tạo thành đường thắng sẽ nhấp nháy liên tục (pulse animation) bằng màu vàng neon nổi bật.

---

## 3. Đặc Tả Kỹ Thuật Chi Tiết Từng File

### A. index.html
1. **Lobby View (`#lobby-view`)**: 
   - Tiêu đề game hub dạng neon phát sáng.
   - Panel Profile: Hiển thị Avatar, Nickname (có nút Edit sửa trực tiếp lưu vào `localStorage`) và Rank của người chơi.
   - Panel Stats: Hiển thị tổng số trận đã chơi, tỷ lệ thắng (Win Rate) toàn cục.
   - Games Grid: Chứa 2 thẻ card lựa chọn game: **Memory Match** và **Tic Tac Toe**. Mỗi card có mô tả ngắn, thống kê lịch sử và nút "Play Now".
2. **Memory Match View (`#memory-match-view`)**:
   - Được bao bọc trong một container ẩn (`.hidden`), có nút quay lại Lobby (`← Back to Lobby`).
3. **Tic Tac Toe View (`#tictactoe-view`)**:
   - Bao bọc trong container ẩn (`.hidden`), có nút quay lại Lobby.
   - Panel cấu hình game:
     - Chọn chế độ chơi: PvP (Local) vs PvE (Đấu với AI).
     - Chọn độ khó AI (chỉ hiện khi đấu PvE): Dễ (Easy) vs Vô địch (Unbeatable).
   - Bảng thống kê tỉ số trận đấu hiện tại (Player X Wins, Draws, Player O Wins).
   - Trạng thái lượt chơi hiện tại ("Player X's Turn", "Your Turn", hoặc "AI is thinking...").
   - Lưới chơi cờ `#ttt-board` chứa 9 ô `.ttt-cell` có `data-index` từ 0 đến 8.
   - Thanh điều khiển bên dưới: Nút hoàn tác (Undo), Nút chơi lại trận mới (Restart Match), Nút xóa tỉ số hiện tại (Clear Score).
4. **Script Imports**:
   - Nhúng `main.js` ở cuối body.
   - Nhúng `tictactoe.js` ở cuối body để chạy song song.

### B. style.css
1. **Lobby & Layout**:
   - Thiết lập CSS Grid cho danh sách game (`.games-grid`).
   - Cài đặt hiệu ứng kính mờ `.glass-card` (backdrop-filter, border bán trong suốt).
2. **Lưới Tic Tac Toe**:
   - `.ttt-grid`: CSS Grid `repeat(3, 1fr)` có khoảng cách gap là `10px` đến `15px`.
   - `.ttt-cell`: Ô cờ kính mờ, có kích thước cố định hoặc responsive, căn giữa nội dung X/O bằng Flexbox, kích thước font chữ lớn (`3rem`).
3. **Ký Tự Quân Cờ**:
   - Quân X: Có class `.x`, màu Neon Cyan kèm hiệu ứng shadow phát sáng (`text-shadow`).
   - Quân O: Có class `.o`, màu Neon Coral kèm hiệu ứng shadow phát sáng.
4. **Animation chiến thắng**:
   - `.ttt-cell.winning`: Kích hoạt keyframe animation `pulse` làm đổi màu nền sang màu vàng neon sáng rực và co giãn nhẹ.

### C. main.js
1. **Lớp Điều Hướng & Lobby**:
   - Định nghĩa đối tượng `GameHub` điều phối chuyển đổi giữa các màn hình (`showView(viewId)`).
   - Quản lý sự kiện nút back về lobby từ các màn chơi.
2. **Profile & Stats Manager**:
   - Quản lý tải và lưu trữ thông tin hồ sơ người chơi (`nickname`, `rank`).
   - Cập nhật số liệu thống kê thắng/thua toàn hệ thống và đồng bộ trực tiếp lên giao diện Lobby mỗi khi tải lại trang hoặc kết thúc game.
3. **Tách Biệt Logic Memory Match**:
   - Đảm bảo logic Memory Match (hiện tại đang nằm trong `main.js`) hoạt động độc lập dưới dạng một module hoặc phương thức khởi tạo riêng khi view `memory-match-view` được kích hoạt.

### D. tictactoe.js (Tệp Tin Mới)
Một module tự thực thi (IIFE) hoặc class controller quản lý toàn bộ logic Tic Tac Toe:
1. **State variables**:
   - `board`: Mảng 1 chiều 9 phần tử lưu trạng thái các ô (`null`, `'X'`, `'O'`).
   - `currentPlayer`: Người chơi hiện tại (`'X'` hoặc `'O'`).
   - `gameMode`: `'pvp'` (Local) hoặc `'pve'` (AI).
   - `aiDifficulty`: `'easy'` hoặc `'hard'`.
   - `history`: Ngăn xếp (stack) lưu các trạng thái board trước đó để phục vụ Undo.
   - `isGameOver`, `isAiMoving`.
2. **Hàm Điều Khiển & Sự Kiện**:
   - `init()`: Gán sự kiện click cho các ô cờ, nút đổi chế độ, độ khó, nút undo, restart, clear.
   - `resetBoard()`: Thiết lập lại mảng board, lượt chơi về 'X', làm sạch history và cập nhật giao diện.
   - `handleCellClick(e)`: Xử lý khi người chơi bấm vào ô cờ trống. Chặn click nếu game đã kết thúc hoặc AI đang tính toán.
   - `makeMove(index, player)`: Ghi nhận nước đi, lưu trạng thái hiện tại vào `history`, đổi lượt chơi và kiểm tra trạng thái thắng/draw.
   - `endGame(result, winCombo)`: Dừng game, tô màu nổi bật các ô thắng cuộc, lưu tỉ số vào `localStorage` và cập nhật giao diện thống kê.
3. **Thuật Toán AI (Easy & Minimax)**:
   - `triggerAiMove()`: Thực hiện nước đi của AI bằng cách gọi thuật toán tương ứng sau một khoảng trễ giả lập `500ms` (tạo cảm giác tự nhiên).
   - `getRandomMove()`: Trả về một chỉ số ngẫu nhiên trong danh sách các ô trống.
   - `getMinimaxMove()`: Tìm nước đi có điểm tối ưu nhất bằng cách chạy thuật toán Minimax duyệt qua các nước đi khả dụng của quân 'O'.
   - `checkWin(b, player)`: Kiểm tra xem player có thắng trên bảng trạng thái `b` hay không. Trả về mảng 3 chỉ số thắng cuộc nếu có, ngược lại trả về `null`.
   - `checkWinForScore(b, player)`: Hàm phụ trợ kiểm tra nhanh thắng/thua phục vụ đệ quy của Minimax.
   - `minimax(b, depth, isMaximizing)`: Thuật toán Minimax đệ quy có tính độ sâu (depth-aware):
     - Trạng thái AI thắng: `10 - depth` (ưu tiên thắng nhanh).
     - Trạng thái người chơi thắng: `depth - 10` (ưu tiên cản phá sớm).
     - Trạng thái hòa: `0`.
4. **Hàm Hoàn Tác (Undo)**:
   - Ở chế độ **PvP**: Lùi lại 1 nước đi từ history.
   - Ở chế độ **PvE**: Lùi lại 2 nước đi (cả nước đi của AI và nước đi của Player trước đó) để đưa lượt đi về tay người chơi.

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Checklist)

### Phase 1: Tạo Giao Diện Lobby & Cấu Trúc HTML
- [ ] 1.1. Sửa đổi `index.html` để bọc Memory Match hiện tại vào màn hình `#memory-match-view` và thêm class `.hidden`.
- [ ] 1.2. Thêm màn hình chính `#lobby-view` chứa Panel Profile, thống kê chung và Games Grid với 2 thẻ game.
- [ ] 1.3. Thêm cấu trúc màn hình chơi game Tic Tac Toe `#tictactoe-view` đầy đủ các nút chọn mode, bảng điểm, lưới 9 ô cờ và thanh điều khiển undo/restart.
- [ ] 1.4. Khai báo import tệp `tictactoe.js` ở cuối `index.html`.

### Phase 2: Phát Triển CSS & Theme Neon Gold
- [ ] 2.1. Thêm các biến token màu neon vàng, cyan và hồng coral vào `:root`.
- [ ] 2.2. Viết CSS thiết kế thẻ game kính mờ ở Lobby (`.game-card`).
- [ ] 2.3. Định dạng lưới chơi cờ Tic Tac Toe `.ttt-grid` kích thước `320px x 320px` dùng CSS Grid.
- [ ] 2.4. Thiết kế các quân cờ X, O phát sáng nổi bật trên nền tối.
- [ ] 2.5. Tạo keyframe `pulse` cho các ô thắng cuộc chuyển sang màu nền vàng neon chớp nháy.

### Phase 3: Quản Lý State SPA & Thống Kê Profile
- [ ] 3.1. Cập nhật `main.js` để khởi tạo đối tượng `GameHub` điều hướng view ẩn/hiện.
- [ ] 3.2. Cài đặt các hàm chỉnh sửa nickname của profile người chơi và đồng bộ trực tiếp lên giao diện.
- [ ] 3.3. Thực hiện đọc và ghi tổng hợp thắng/thua từ `localStorage` để cập nhật bảng stats của Lobby.

### Phase 4: Xây Dựng Core Game Logic (Local PvP)
- [ ] 4.1. Tạo mới tệp `tictactoe.js`.
- [ ] 4.2. Viết hàm khởi tạo `init()` và liên kết các sự kiện DOM của Tic Tac Toe view.
- [ ] 4.3. Viết hàm kiểm tra thắng cuộc `checkWin()` cho 8 đường thắng hợp lệ.
- [ ] 4.4. Thực hiện cơ chế nhấp nháy các ô thắng cuộc và chuyển đổi lượt chơi X/O.
- [ ] 4.5. Triển khai nút "Restart Match" xóa sạch bảng đấu và nút "Clear Score".

### Phase 5: Phát Triển Trí Tuệ Nhân Tạo AI (PvE)
- [ ] 5.1. Tích hợp AI Dễ (Easy AI) đi ngẫu nhiên ô trống.
- [ ] 5.2. Viết hàm đệ quy `minimax()` tính toán điểm số cho từng nước đi.
- [ ] 5.3. Viết hàm tìm nước đi tốt nhất `getMinimaxMove()` liên kết vào game controller.
- [ ] 5.4. Thêm hiệu ứng trễ `500ms` khi AI suy nghĩ để tăng trải nghiệm người dùng.
- [ ] 5.5. Viết logic hoàn tác (Undo) phân biệt 1 bước (PvP) và 2 bước (PvE).

### Phase 6: Thiết Lập Test Suite & QA Verify
- [ ] 6.1. Tạo file kiểm thử `test_tictactoe_logic.js` chạy độc lập dưới môi trường Node.js.
- [ ] 6.2. Mock đối tượng `document`, `localStorage` và nạp code `tictactoe.js` vào để test.
- [ ] 6.3. Kiểm thử tính năng phát hiện thắng cuộc (`checkWin`).
- [ ] 6.4. Kiểm thử khả năng cản phá nước đi thắng của người chơi từ AI Minimax.
- [ ] 6.5. Kiểm thử khả năng tự động thực hiện nước đi dứt điểm giành chiến thắng của AI.
- [ ] 6.6. Chạy và xác minh tất cả bài test đạt trạng thái PASS 100%.

---

## 5. Kịch Bản Kiểm Thử Xác Minh (Test Cases)

| STT | Tác Vụ Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi |
|---|---|---|---|
| 1 | Chuyển đổi màn hình SPA | Click "Play Now" ở thẻ Tic Tac Toe | Giao diện Lobby ẩn đi, màn chơi Tic Tac Toe hiển thị. |
| 2 | Hoạt động chế độ PvP | Chơi luân phiên X và O tạo thành hàng ngang | Game kết thúc, hiển thị người thắng cuộc, 3 ô thắng chớp nháy màu vàng, cập nhật tỉ số PvP. |
| 3 | AI chặn nước đi của người chơi | Người chơi đi X ở 0 và 1. Đấu PvE khó (Unbeatable). | AI (O) bắt buộc phải đi vào ô số 2 để cản phá đường thắng của người chơi. |
| 4 | AI tự động dứt điểm chiến thắng | AI (O) có quân ở 4 và 5. Đến lượt AI. | AI (O) chọn đi vào ô số 3 hoặc 6 (tùy thế trận) để tạo chuỗi 3 quân thắng cuộc ngay lập tức. |
| 5 | Tính năng hoàn tác PvP | Nhấp nút "Undo Move" ở chế độ PvP | Rút lại chính xác 1 nước đi vừa thực hiện, đưa lượt chơi về người chơi trước. |
| 6 | Tính năng hoàn tác PvE | Nhấp nút "Undo Move" ở chế độ PvE | Rút lại đồng thời nước đi của AI và nước đi của người chơi trước đó, lượt đi quay về người chơi. |
| 7 | Xóa lịch sử điểm số | Bấm nút "Clear Score" | Điểm số của chế độ hiện tại trong bảng stats và lưu trữ cục bộ reset về 0. Bảng stats Lobby cập nhật tương ứng. |
| 8 | Đồng bộ Nickname | Sửa Nickname thành "CyberPlayer" | Tên người chơi ở Panel Profile cập nhật, hiển thị đúng ở các thống kê liên quan. |

---

## 6. Phân Tích Rủi Ro & Biện Pháp Khắc Phục

1. **Rủi ro 1: Thuật toán Minimax gây đơ trình duyệt**
   - *Nguyên nhân*: Lưới 3x3 có số lượng tổ hợp trạng thái rất nhỏ (tối đa 9! = 362,880 trạng thái), nên Minimax chạy cực nhanh dưới 5ms. Tuy nhiên, nếu mở rộng lưới lớn hơn, đệ quy sẽ bị chậm.
   - *Khắc phục*: Giới hạn thuật toán này riêng cho bảng 3x3. Không áp dụng đệ quy sâu không giới hạn cho các dạng bàn cờ Gomoku/Caro lớn mà không có cắt tỉa Alpha-Beta hay giới hạn độ sâu.
2. **Rủi ro 2: AI di chuyển tức thời làm hỏng trải nghiệm người dùng**
   - *Khắc phục*: Sử dụng `setTimeout` tạo độ trễ giả lập `500ms` trước khi AI đặt quân cờ, hiển thị trạng thái "AI is thinking..." để giao diện sinh động và tự nhiên hơn.
3. **Rủi ro 3: Trạng thái không đồng bộ khi nhấn nút quay lại Lobby lúc đang dở trận**
   - *Khắc phục*: Tự động lưu trạng thái game dở dang hoặc reset hoàn toàn bảng chơi khi chuyển đổi view để đảm bảo tính nhất quán của dữ liệu.
