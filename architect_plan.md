# Kế hoạch kỹ thuật: Tích hợp game Cờ Ca Rô (Gomoku)

Tài liệu này mô tả kế hoạch thiết kế kiến trúc và triển khai tích hợp thêm trò chơi **Cờ Ca Rô** vào ứng dụng web hiện tại, đồng thời tổ chức lại mã nguồn để hỗ trợ chơi nhiều game khác nhau (Memory Match & Cờ Ca Rô) thông qua một giao diện sảnh chờ (Lobby) hiện đại.

---

## 1. Tổng quan yêu cầu & Kiến trúc

### Mục tiêu
- Thêm game mới **Cờ Ca Rô** (Gomoku) với kích thước bàn cờ tiêu chuẩn 15x15.
- Cải tiến giao diện từ một game đơn lẻ thành một **Game Portal/Lobby** cho phép chọn game (Memory Match hoặc Cờ Ca Rô).
- Hỗ trợ 2 chế độ chơi trong Cờ Ca Rô:
  1. **PvP (Player vs Player)**: Hai người chơi đấu với nhau trên cùng thiết bị.
  2. **PvE (Player vs AI)**: Người chơi đấu với máy thông qua một AI Heuristic (thuật toán lượng giá nước đi thông minh).
- Hỗ trợ 2 luật chơi Caro phổ biến:
  1. **Luật Quốc tế (Gomoku)**: Đủ 5 quân liên tiếp hàng ngang/dọc/chéo là thắng, không cấm chặn hai đầu.
  2. **Luật Việt Nam**: Đủ 5 quân liên tiếp nhưng nếu bị chặn cả 2 đầu bởi quân đối phương thì không tính thắng (tiếp tục chơi).
- Thiết kế Responsive: Bàn cờ hiển thị đẹp trên cả Desktop và Mobile (có cơ chế cuộn/zoom nếu màn hình quá nhỏ).
- Thêm tính năng hữu ích: Điểm số phiên (Scoreboard), Đổi lượt chơi, Nút Hoàn tác (Undo/Redo), Nhạc nền/Hiệu ứng âm thanh hoặc hiệu ứng rung chuyển hình ảnh khi thắng.

### Cấu trúc mã nguồn đề xuất
Để giữ mã nguồn sạch và dễ bảo trì, chúng ta sẽ tách file đơn lẻ `main.js` hiện tại thành các module chuyên biệt:

```
├── index.html            # Markup giao diện chính cho Lobby và các container game
├── style.css             # CSS styles tổng hợp (Variables, Lobby, Memory Match, Caro)
├── js/
│   ├── app.js            # Điều hướng chính, quản lý Lobby và chuyển đổi màn hình game
│   ├── memory.js         # Logic & State của game Memory Match (được refactor từ main.js)
│   ├── caro.js           # Logic bàn cờ, lượt đi, lịch sử đi, kiểm tra thắng thua của Cờ Ca Rô
│   └── caro-ai.js        # Động cơ AI cho chế độ PvE (sử dụng Heuristic evaluation)
```

---

## 2. Thiết kế Giao diện (UI/UX)

### Giao diện Sảnh chờ (Game Lobby)
- Khi vừa vào trang, hiển thị màn hình Lobby dạng thẻ (Cards) với phong cách Glassmorphism đồng nhất với giao diện hiện tại.
- 2 thẻ game lớn:
  - **Memory Match**: Theme Đỏ/Hồng quyến rũ, kèm icon hoặc ảnh preview, thống kê cấp độ hiện tại.
  - **Cờ Ca Rô**: Theme Xanh dương/Emerald sang trọng, kèm icon quân cờ X/O phát sáng, chế độ chơi sẵn có.
- Hiệu ứng hover nổi bật: Card sẽ zoom nhẹ, viền đổi màu gradient và phát sáng nhẹ.

### Giao diện game Cờ Ca Rô
- **Thanh điều khiển (Control Panel)**:
  - Nút quay lại sảnh (Back to Lobby).
  - Chọn chế độ chơi (PvP / PvE).
  - Chọn luật chơi (Chuẩn Gomoku / Luật Việt Nam - Chặn 2 đầu).
  - Bảng điểm (Player X vs Player O/AI) và Lượt chơi hiện tại (Đang đến lượt ai).
  - Nút Reset (Chơi lại) và Nút Undo (Hoàn tác nước đi).
- **Bàn cờ (Game Board)**:
  - Grid 15x15 với các cell kích thước tối thiểu 36px-40px trên Desktop để dễ click.
  - Khi hover lên ô trống sẽ hiển thị bóng mờ (shadow) của quân cờ tương ứng (X hoặc O) tùy theo lượt để người chơi dễ quan sát.
  - Quân X hiển thị màu hồng ngoại (`#fb7185`), quân O hiển thị màu ngọc lục bảo (`#10b981`).
  - Các nước đi mới nhất sẽ có viền highlight nhấp nháy nhẹ.
  - Hàng 5 quân thắng cuộc sẽ được kích hoạt animation nhấp nháy phát sáng rực rỡ để tôn vinh chiến thắng.
- **Win Modal**:
  - Modal thông báo chiến thắng đẹp mắt hiển thị kết quả, số nước đi, và thời gian. Nút "Chơi lại" (Play Again) và "Về trang chủ".

---

## 3. Chi tiết Logic Game Cờ Ca Rô

### 3.1. Trạng thái Game (Game State)
- `board`: Mảng 2 chiều 15x15 lưu giá trị: `null` (ô trống), `'X'`, hoặc `'O'`.
- `currentPlayer`: Người chơi hiện tại (`'X'` hoặc `'O'`).
- `gameActive`: Boolean đánh dấu game đang chạy hay đã kết thúc.
- `moveHistory`: Mảng lưu danh sách các nước đã đi dưới dạng `{row, col, player}` phục vụ tính năng **Undo**.
- `gameMode`: Chế độ chơi (`'pvp'` hoặc `'pve'`).
- `gameRule`: Luật chơi (`'standard'` hoặc `'vietnamese'`).
- `score`: Đối tượng lưu tỉ số `{ X: 0, O: 0, Ties: 0 }`.

### 3.2. Thuật toán kiểm tra thắng cuộc (Win Checker)
Khi một quân được đặt tại ô `(r, c)`:
1. Duyệt qua 4 hướng:
   - Ngang (Horizontal): Trái sang Phải
   - Dọc (Vertical): Trên xuống Dưới
   - Chéo xuôi (Diagonal Down): Trên-Trái xuống Dưới-Phải
   - Chéo ngược (Diagonal Up): Dưới-Trái lên Trên-Phải
2. Với mỗi hướng, đếm số quân liên tiếp cùng màu với quân vừa hạ.
3. Nếu đếm được đủ 5 quân liên tiếp:
   - **Luật Quốc tế**: Thắng ngay lập tức.
   - **Luật Việt Nam (Chặn 2 đầu)**: Kiểm tra 2 đầu của dãy 5 quân. Nếu cả 2 đầu ngoài cùng đều bị chặn bởi quân đối phương (hoặc biên bàn cờ - tùy theo quy ước, ở đây quy định biên không chặn mà chỉ quân đối phương chặn mới tính chặn hai đầu) thì chưa thắng. Nếu chỉ bị chặn 1 đầu hoặc không bị chặn đầu nào thì thắng.

### 3.3. Trí tuệ nhân tạo (Heuristic AI) - `caro-ai.js`
Để AI chạy nhanh trong trình duyệt và có độ phản xạ tốt:
- AI sẽ lượng giá điểm cho mọi ô trống trên bàn cờ.
- Tại mỗi ô trống `(r, c)`, duyệt qua 4 hướng để tính điểm tấn công (nếu AI đánh vào đây) và điểm phòng ngự (nếu đối thủ đánh vào đây để chặn).
- Hệ thống điểm số heuristic mẫu:
  - Dãy 5 quân liên tiếp (Đã thắng): `100,000` điểm.
  - Dãy 4 quân mở hai đầu (Live 4): `10,000` điểm.
  - Dãy 4 quân bị chặn 1 đầu hoặc Dãy 3 quân mở hai đầu (Live 3): `1,000` điểm.
  - Dãy 3 quân bị chặn 1 đầu hoặc Dãy 2 quân mở hai đầu (Live 2): `100` điểm.
  - Ô đơn lẻ hoặc Dãy ít quân hơn: `10` điểm.
- AI sẽ chọn ô có tổng điểm `Tấn công + Phòng thủ` cao nhất. Điểm phòng ngự có thể nhân với một hệ số ưu tiên (ví dụ `1.2`) để AI chơi phòng thủ chủ động hơn khi đối thủ có các thế cờ nguy hiểm.

---

## 4. Các bước triển khai (Implementation Plan)

### Bước 1: Refactor Cấu trúc File & Thiết lập Lobby
- Di chuyển logic hiện tại từ `main.js` sang `js/memory.js`.
- Tạo file `js/app.js` để làm đầu mối quản lý màn hình.
- Cập nhật `index.html` để hỗ trợ hiển thị Lobby mặc định, ẩn/hiện các container game tương ứng.
- Cập nhật `style.css` để định nghĩa giao diện Lobby với phong cách Glassmorphism.

### Bước 2: Thiết kế giao diện & Logic Cờ Ca Rô cơ bản (PvP)
- Thiết lập markup bàn cờ 15x15 và các nút điều khiển trong `index.html`.
- Viết CSS cho bàn cờ Caro, các quân cờ X/O và hiệu ứng khi hover ô cờ.
- Viết `js/caro.js` quản lý state bàn cờ, xử lý sự kiện click click đặt cờ cho chế độ PvP.

### Bước 3: Triển khai Luật chơi & Win Checker
- Cài đặt thuật toán quét thắng thua cho 4 hướng.
- Triển khai bộ lọc luật Việt Nam: Kiểm tra xem hàng 5 quân có bị chặn hai đầu bởi quân đối phương hay không.
- Làm nổi bật (highlight) các ô thắng cuộc bằng animation phát sáng viền hoặc màu sắc rực rỡ.

### Bước 4: Phát triển AI Heuristic cho PvE (`js/caro-ai.js`)
- Triển khai module lượng giá điểm cho các hướng.
- Tích hợp lượt đi của AI vào luồng chơi chính trong `js/caro.js` khi chế độ PvE được chọn.
- Xử lý UX: Hiển thị trạng thái "AI đang suy nghĩ..." (khoảng 300ms - 500ms trì hoãn giả lập) để tăng tính thực tế.

### Bước 5: Hoàn thiện tính năng & Cải tiến UX/UI
- Tích hợp tính năng **Undo**: Cho phép quay lại nước đi trước đó (ở chế độ PvE thì Undo sẽ lùi 2 nước: nước của AI và nước của người chơi).
- Lưu điểm số (Scoreboard) cục bộ, hỗ trợ nút "Reset Score".
- Đảm bảo thiết kế hoàn toàn responsive: Dùng `overflow: auto` cho bàn cờ trên Mobile và thêm nút zoom/thu nhỏ để tối ưu tương tác chạm.
- Thêm âm thanh click cờ và hiệu ứng chúc mừng khi thắng.

### Bước 6: Kiểm thử & Tối ưu hóa (QA)
- Test chơi thử PvP và PvE trên nhiều độ phân giải màn hình khác nhau.
- Đảm bảo AI phản xạ chính xác, không gây đơ hoặc giật lag UI (thời gian tính toán < 50ms).
- Đảm bảo tuân thủ mọi định nghĩa Definition of Done.

---

## 5. Kế hoạch kiểm thử (Test Cases)

| STT | Kịch bản kiểm thử | Kết quả mong đợi |
|---|---|---|
| 1 | Nhấp chọn "Memory Match" ở Lobby | Màn hình Memory Match hiện ra, chơi bình thường. |
| 2 | Nhấp chọn "Cờ Ca Rô" ở Lobby | Màn hình Cờ Ca Rô hiện ra, hiển thị bàn cờ trống. |
| 3 | Chế độ PvP: Nhấp luân phiên | Ô cờ hiện quân X, lượt tiếp theo hiện quân O đúng vị trí click. |
| 4 | Kiểm tra Win Luật Quốc tế | Xếp đủ 5 quân X/O bất kỳ hướng nào -> Báo thắng, highlight dòng thắng. |
| 5 | Kiểm tra Win Luật Việt Nam (chặn 2 đầu) | Xếp đủ 5 quân nhưng bị chặn cả 2 đầu đối phương -> Không báo thắng, game tiếp tục. Bị chặn 1 đầu hoặc không bị chặn -> Thắng. |
| 6 | Chế độ PvE (đấu với AI) | Người chơi hạ X -> AI tự động đặt O ở vị trí thông minh hợp lý sau ~300ms. |
| 7 | Nhấp nút "Undo" trong PvP / PvE | Hoàn tác đúng 1 nước đi ở PvP hoặc 2 nước đi ở PvE (cả lượt máy và người). |
| 8 | Hiển thị Responsive trên điện thoại | Bàn cờ không bị tràn hoặc bóp méo, có thanh cuộn mượt mà để xem toàn bộ bàn cờ. |
