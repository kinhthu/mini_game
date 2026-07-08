# Kế Hoạch Kỹ Thuật: Tích Hợp Game Cờ Caro (Gomoku 15x15) Vào Danh Sách Game

Tài liệu này định nghĩa kế hoạch thiết kế kiến trúc, các thay đổi giao diện và đặc tả kỹ thuật chi tiết để tích hợp trò chơi **Cờ Caro** (Gomoku 15x15) vào bộ ứng dụng game **Mini Game Hub**. 

Trò chơi mới sẽ được tích hợp vào kiến trúc Single Page Application (SPA) hiện có, đứng song song với hai game đã hoàn thiện là **Memory Match** và **Tic Tac Toe**.

---

## 1. Kiến Trúc Hệ Thống & Cấu Trúc Thư Mục

Dự án tiếp tục sử dụng kiến trúc client-side SPA thuần (không framework). Các tệp tin trong workspace sẽ được cập nhật hoặc tạo mới như sau:

```text
D:\workspace\Mini-Games/
├── index.html                   # Cấu trúc HTML chính (Lobby, Memory Match, Tic Tac Toe & Caro views)
├── style.css                    # Toàn bộ CSS (Bổ sung giao diện bàn cờ 15x15, star points & neon purple style)
├── main.js                      # Central Controller: Bổ dung điều hướng view & đồng bộ stats cho Caro
├── caro.js                      # NEW FILE: Xử lý logic game Caro, Heuristic AI đối thủ & Undo Logic
└── test_caro_logic.js           # NEW FILE: Bài kiểm thử tự động (Unit test) độc lập cho Caro dưới Node.js
```

---

## 2. Thiết Kế Giao Diện & Hệ Thống Màu Sắc (Neon Purple Theme)

Cờ Caro sẽ sử dụng hệ màu **Neon Purple / Violet** (`--accent-purple: #a55eea`) làm tông màu chủ đạo để phân biệt với Tic Tac Toe (Neon Gold) và Memory Match (Neon Green/Blue):

| Token Màu | Giá Trị | Vai Trò Giao Diện |
|---|---|---|
| `--accent-purple` | `#a55eea` | Màu chính của Cờ Caro, viền phát sáng, các nút điều khiển |
| `--accent-cyan` | `#00d2d3` | Màu hiển thị cho quân cờ X (Neon Cyan) |
| `--accent-coral` | `#ff7675` | Màu hiển thị cho quân cờ O (Neon Coral) |
| `--shadow-purple-glow`| `0 0 15px rgba(165, 94, 234, 0.4)` | Hiệu ứng neon mờ trên card và ô cờ |

### Đặc tả Giao diện Bàn cờ Caro
1. **Lobby Game Card**: Bổ dung một thẻ game thứ 3 có class `.game-card.caro-theme` trong giao diện Lobby:
   - Hiển thị Icon: `⚔️` hoặc `🏁`.
   - Tiêu đề: **Cờ Caro**.
   - Mô tả: "Trải nghiệm cờ Caro 15x15 truyền thống. Đấu với bạn bè hoặc thử thách AI thông minh."
   - Thống kê: Số trận thắng (`stats-caro-wins`) và Hòa (`stats-caro-draws`) lưu trữ trong `localStorage`.
   - Nút kích hoạt: `Play Now` kích hoạt view `#caro-view`.
2. **Caro Board Grid (15x15)**: 
   - Lưới chơi gồm 225 ô cờ `.caro-cell` sắp xếp bằng CSS Grid `repeat(15, 1fr)`.
   - Bàn cờ có kích thước linh hoạt (responsive) để hiển thị đầy đủ trên màn hình di động mà không bị tràn (max-width `95vw` hoặc `min(550px, 95vw)`).
   - Ký tự quân cờ X/O có hiệu ứng neon tương tự Tic Tac Toe.
   - Các điểm nhấn sao (Star Points) truyền thống tại các tọa độ Gomoku: `(3,3), (3,11), (7,7), (11,3), (11,11)`.
3. **Hiệu ứng chiến thắng**: Khi đạt được chuỗi 5 quân cờ thẳng hàng, các ô cờ tạo nên đường thắng sẽ kích hoạt hiệu ứng nhấp nháy `.winning-cell` màu tím neon.

---

## 3. Đặc Tả Kỹ Thuật Chi Tiết Từng File

### A. index.html
1. **Lobby View (`#lobby-view`)**:
   - Thêm thẻ game card thứ ba `.game-card.caro-theme` vào `.games-grid` với cấu trúc hiển thị điểm số và nút bấm khởi tạo chơi cờ Caro (`#play-caro-btn`).
2. **Caro View (`#caro-view`)**:
   - Thêm section chứa toàn bộ giao diện chơi cờ Caro với ID `#caro-view`, mặc định có class `hidden`.
   - Nút quay lại Lobby (`← Back to Lobby`) sử dụng class chung `.back-to-lobby-btn`.
   - **Bảng Cấu Hình (Configuration)**:
     - Chọn chế độ chơi: PvP (Local) vs PvE (Đấu với AI).
     - Chọn độ khó AI (chỉ hiện khi chơi PvE): Dễ (Easy - đi ngẫu nhiên) vs Khó (Hard - AI Heuristic thông minh).
   - **Bảng Điểm (Scoreboard)**:
     - Thống kê tỉ số trận hiện tại (Player X Wins, Draws, Player O Wins).
   - **Thanh Trạng Thái Lượt Đi**:
     - Hiển thị lượt đi hiện tại hoặc thông báo kết quả chung cuộc.
   - **Bàn Cờ Lưới**:
     - `<main class="caro-grid" id="caro-board">` - các ô cờ `.caro-cell` sẽ được khởi tạo hoàn toàn động từ Javascript.
   - **Thanh Điều Khiển Bên Dưới**:
     - Nút hoàn tác: `↩ Undo` (`#caro-undo-btn`).
     - Nút chơi lại: `🔄 Restart Match` (`#caro-restart-btn`).
     - Nút reset điểm số: `🗑️ Clear Score` (`#caro-clear-btn`).
3. **Script Imports**:
   - Khai báo thêm `<script src="caro.js"></script>` ở cuối body (sau `tictactoe.js`).

### B. style.css
1. **Thẻ Game Lobby**:
   - Cấu hình màu sắc, gradient nền và hiệu ứng hover cho `.caro-theme` sử dụng màu chủ đạo `--accent-purple`.
2. **Bàn Cờ 15x15**:
   - `.caro-grid`: Sử dụng CSS Grid `repeat(15, 1fr)`. Tỷ lệ ô cờ luôn duy trì tỷ lệ 1:1 bằng `aspect-ratio: 1`.
   - `.caro-cell`: Đường viền bán trong suốt (`rgba(255, 255, 255, 0.08)`), nền kính mờ. Kích thước font chữ co giãn tự động để vừa vặn ô cờ.
   - `.star-point`: Đặt một chấm tròn nhỏ ở tâm ô cờ (sử dụng pseudo-element `::before`) để đánh dấu các điểm sao Gomoku.
3. **Hiệu ứng Hover Quân Cờ**:
   - Khi di chuột qua một ô cờ trống, hiển thị mờ ký tự chuẩn bị đặt (quân X hoặc O tương ứng lượt hiện tại) bằng cách gán CSS Variable `--hover-symbol` và `--hover-color` lên bàn cờ cha `#caro-board`.
4. **Animation chiến thắng**:
   - Cài đặt keyframe `.caro-cell.winning` nhấp nháy chuyển màu nền tím phát sáng.

### C. main.js
1. **Quản Lý Profile & Thống Kê**:
   - Mở rộng hàm `ProfileManager.updateUI()` để đọc và cập nhật các biến stats cho Caro từ `localStorage`:
     - `caro_pve_wins`, `caro_pve_played`, `caro_pve_draws`
     - `caro_pvp_wins`, `caro_pvp_played`, `caro_pvp_draws`
   - Tính toán tổng số trận thắng của Caro vào biến `totalWins` toàn hệ thống để cập nhật Rank của người chơi.
2. **Sự Kiện Điều Hướng**:
   - Thêm bộ lắng nghe sự kiện click cho `#play-caro-btn`. Khi nhấn, chuyển sang view `#caro-view` và gọi hàm `CaroGame.init()`.
   - Đảm bảo khi nhấn nút quay lại Lobby (`.back-to-lobby-btn`), dọn dẹp các timer AI dở dang của Caro (nếu có).

### D. caro.js (Tệp Tin Mới)
Chứa đối tượng quản lý toàn cục `CaroGame` đóng gói toàn bộ trạng thái và thuật toán xử lý:
1. **Quản Lý Trạng Thế (State Variables)**:
   - `board`: Mảng 2 chiều kích thước 15x15 khởi tạo bằng `null`.
   - `currentPlayer`: `'X'` hoặc `'O'`.
   - `playMode`: Chế độ đấu `'pvp'` hoặc `'pve'`.
   - `aiDifficulty`: Chế độ thông minh `'easy'` hoặc `'hard'`.
   - `history`: Stack chứa tọa độ các nước đi trước đó (`[{r, c, player}, ...]`) phục vụ chức năng Undo.
   - `isGameOver`, `isAiMoving`, `aiTimeout`.
2. **Khởi Tạo Giao Diện & Sự Kiện**:
   - `init()`: Thực hiện liên kết DOM (chế độ chơi, độ khó, các nút điều khiển) và gọi hàm tạo bàn cờ. Đảm bảo hàm này chỉ đăng ký bộ lắng nghe sự kiện một lần (`initialized` flag).
   - `reset()`: Khôi phục bàn cờ về trống, dọn sạch stack `history`, dừng timeout AI, đặt lại lượt đi về `'X'`.
   - `generateBoard()`: Tạo động 225 phần tử `div` có thuộc tính `data-row` và `data-col`. Nếu ô thuộc tọa độ sao, gán thêm class `star-point`. Đăng ký sự kiện click cho từng ô cờ.
3. **Cơ Chế Đặt Quân (placeStone)**:
   - Ghi nhận nước đi vào mảng `board[r][c]`.
   - Tạo hiệu ứng rơi quân cờ bằng cách thêm phần tử con `.stone-drop` chứa X hoặc O.
   - Lưu trữ nước đi vào stack `history`.
4. **Kiểm Tra Thắng Thua (checkWin & checkDraw)**:
   - `checkWin(row, col)`: Quét từ vị trí quân vừa đi theo 4 trục chính (Ngang, Dọc, Chéo xuôi `\`, Chéo ngược `/`).
   - Đếm số lượng quân cùng màu liên tiếp. Nếu đạt đủ từ 5 quân cờ liên tiếp trở lên, trả về đối tượng `{ symbol: currentPlayer, stones: [[r,c], ...] }`.
   - Nếu bàn cờ đầy mà không ai thắng, trả về trạng thái hòa.
5. **Thuật Toán AI Phân Tích Thế Trận (Heuristic AI)**:
   - Đối với bàn cờ 15x15, thuật toán đệ quy Minimax không khả thi vì không gian trạng thái quá lớn. Sử dụng thuật toán **Heuristic Evaluation** để tìm nước đi tối ưu:
   - **Tính Toán Nước Đi (calculateAiMove)**:
     - Nếu AI đi đầu tiên (bàn cờ trống), tự động chọn ô trung tâm `(7, 7)` để chiếm thế thượng phong.
     - Với các trường hợp khác, quét tất cả các ô cờ trống trên bàn cờ.
     - Với mỗi ô trống `(r, c)`, tính toán điểm tấn công (`attackScore`) dựa trên số lượng quân cờ của AI xung quanh và điểm phòng thủ (`defenseScore`) dựa trên số lượng quân cờ của đối thủ.
     - Công thức gộp điểm: `totalScore = attackScore * 1.1 + defenseScore` (ưu tiên tấn công giành chiến thắng hơn là phòng thủ thụ động nếu điểm ngang nhau).
     - Trả về tọa độ ô cờ có điểm số cao nhất.
   - **Hàm Đánh Giá Điểm Heuristic**:
     - Với mỗi ô cờ trống, quét theo 4 hướng. Đếm số quân liên tiếp cùng màu và trạng thái bị chặn ở hai đầu (mở cả 2 đầu, bị chặn 1 đầu, bị chặn cả 2 đầu).
     - Gán trọng số điểm số:
       - Chuỗi 5 quân liên tiếp (Chiến thắng): `100,000` điểm.
       - Chuỗi 4 quân mở hai đầu (Nguy hiểm cực độ): `10,000` điểm.
       - Chuỗi 4 quân bị chặn một đầu / Chuỗi 3 quân mở hai đầu: `1,000` điểm.
       - Chuỗi 3 quân bị chặn một đầu / Chuỗi 2 quân mở hai đầu: `100` điểm.
       - Chuỗi đơn lẻ hoặc bị chặn hai đầu: `0` đến `10` điểm.
6. **Hoàn Tác Nước Đi (Undo)**:
   - Ở chế độ PvP: Rút lại chính xác 1 nước đi vừa đi trong history.
   - Ở chế độ PvE: Rút lại đồng thời 2 nước đi (nước đi của AI và nước đi của Player trước đó) để người chơi tiếp tục chơi tiếp.

---

## 4. Kế Hoạch Triển Khai Chi Tiết (Checklist)

### Phase 1: Xây Dựng Khung Giao Diện HTML
- [ ] 1.1. Sửa đổi `index.html`, bổ sung thẻ card giới thiệu game Cờ Caro vào games grid của Lobby.
- [ ] 1.2. Thêm view `#caro-view` chứa cấu hình chọn chế độ PvP/PvE, độ khó AI, scoreboard, bàn cờ `#caro-board` và thanh điều khiển undo/restart/clear.
- [ ] 1.3. Khai báo import tệp `caro.js` ở cuối `index.html`.

### Phase 2: Định Dạng CSS & Giao Diện Kính Mờ Tím Neon
- [ ] 2.1. Thêm token màu `--accent-purple` và hiệu ứng đổ bóng tím vào `:root`.
- [ ] 2.2. Viết CSS thiết kế thẻ game kính mờ `.caro-theme` ở Lobby.
- [ ] 2.3. Định dạng lưới bàn cờ `.caro-grid` hỗ trợ co giãn responsive tự động thích ứng với chiều rộng màn hình.
- [ ] 2.4. Thiết kế các ô cờ `.caro-cell`, điểm sao `.star-point` và ký tự cờ X/O phát sáng neon.
- [ ] 2.5. Tạo hiệu ứng nhấp nháy `.winning-cell` chuyển nền tím sáng rực khi kết thúc trận đấu.

### Phase 3: Quản Lý SPA & Đồng Bộ Stats Lên Dashboard
- [ ] 3.1. Cập nhật `main.js` để gắn sự kiện bấm nút `#play-caro-btn` chuyển hướng sang view Caro.
- [ ] 3.2. Cập nhật `ProfileManager` để đọc/ghi stats của Caro (`caro_pve_wins`, `caro_pvp_wins`, v.v.) từ `localStorage`.
- [ ] 3.3. Tích hợp thắng cuộc Caro vào tổng trận thắng của Profile để phân cấp Rank chính xác.

### Phase 4: Thiết Lập Core Logic Cờ Caro (Local PvP)
- [ ] 4.1. Tạo mới tệp `caro.js`.
- [ ] 4.2. Viết hàm khởi tạo `init()` liên kết các sự kiện DOM và hàm `generateBoard()` vẽ lưới 15x15.
- [ ] 4.3. Cài đặt thuật toán kiểm tra thắng cuộc `checkWin()` quét theo 4 hướng từ vị trí đặt quân cờ mới nhất.
- [ ] 4.4. Thực hiện logic đổi lượt chơi X/O và tô sáng các ô cờ thắng cuộc.
- [ ] 4.5. Thực hiện logic nút "Undo" cho PvP (hoàn tác 1 nước) và "Restart Match" dọn dẹp bàn cờ.

### Phase 5: Phát Triển Đối Thuật AI (Easy & Heuristic PvE)
- [ ] 5.1. Triển khai AI Dễ (Easy AI) chọn ô trống ngẫu nhiên.
- [ ] 5.2. Viết hàm đánh giá điểm bàn cờ theo hướng phòng thủ và tấn công để làm AI Khó (Heuristic AI).
- [ ] 5.3. Liên kết AI tự động đi sau một khoảng trễ giả lập `300ms` tạo trải nghiệm chân thực.
- [ ] 5.4. Hoàn thiện logic hoàn tác (Undo) cho PvE lùi 2 nước cờ (Player + AI).

### Phase 6: Viết Bộ Unit Test & QA Verify
- [ ] 6.1. Tạo file kiểm thử `test_caro_logic.js` độc lập chạy bằng Node.js.
- [ ] 6.2. Mock đối tượng `window`, `document`, `localStorage` phục vụ cho việc kiểm thử `caro.js`.
- [ ] 6.3. Viết test case kiểm tra thuật toán phát hiện thắng cuộc theo cả 4 hướng (ngang, dọc, chéo).
- [ ] 6.4. Viết test case kiểm tra AI Heuristic có chặn được thế cờ 3 quân hoặc 4 quân của đối thủ hay không.
- [ ] 6.5. Viết test case kiểm tra chức năng hoàn tác (Undo) hoạt động đúng mục đích trên cả PvP và PvE.

---

## 5. Kịch Bản Kiểm Thử (Test Cases)

| STT | Tác Vụ Kiểm Thử | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi |
|---|---|---|---|
| 1 | Khởi tạo bàn cờ | Bấm "Play Now" ở thẻ Caro | Vẽ đúng lưới 15x15 = 225 ô cờ. Xuất hiện đúng 5 điểm sao Gomoku ở các tọa độ thiết kế. |
| 2 | Phát hiện thắng dọc | Đặt 5 quân X liên tiếp từ `(2,3)` đến `(6,3)` | Trận đấu dừng, hiển thị modal X thắng, 5 ô thắng chớp nháy màu tím neon. |
| 3 | AI phòng thủ cản phá | Người chơi đi X tại các ô `(5,5), (5,6), (5,7)`. Đấu PvE Khó. | AI (O) tự động đi cản phá tại `(5,4)` hoặc `(5,8)` để phá vỡ thế cờ thắng của đối thủ. |
| 4 | AI tấn công dứt điểm | AI (O) có thế cờ `(4,4), (4,5), (4,6)`. Đến lượt AI. | AI (O) tự động đặt quân vào `(4,3)` hoặc `(4,7)` để tạo chuỗi 4 hoặc 5 giành chiến thắng. |
| 5 | Tính năng hoàn tác PvP | Nhấp nút "Undo" ở chế độ PvP | Bảng đấu lùi lại đúng 1 lượt đi cuối cùng, khôi phục lượt đi về người chơi trước. |
| 6 | Tính năng hoàn tác PvE | Nhấp nút "Undo" ở chế độ PvE | Bảng đấu lùi lại 2 lượt đi (của AI và của người chơi), lượt đi chuyển về cho người chơi. |
| 7 | Xóa lịch sử điểm số | Bấm nút "Clear Score" | Điểm số của chế độ hiện tại reset về 0. Thống kê ở Lobby cập nhật tương ứng. |
