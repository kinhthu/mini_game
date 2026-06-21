# Memory: Mini-Game Web Platform

Tài liệu này lưu trữ bối cảnh, kiến trúc, các quyết định thiết kế và trạng thái hiện tại của dự án Mini-Games.

---

## 1. Bối cảnh dự án (Context)
- Dự án là một trang web chứa các trò chơi nhỏ được xây dựng bằng công nghệ thuần túy: HTML, CSS và JavaScript.
- Hiện tại, hệ thống mới chỉ có **01 trò chơi duy nhất là Memory Match (Lật thẻ tìm cặp trùng)**.
- Giao diện của trang web được thiết kế theo phong cách hiện đại với gam màu tối (dark theme), sử dụng hiệu ứng làm mờ kính (glassmorphism) và phông chữ Outfit phong cách cao cấp.

---

## 2. Kiến trúc & Quyết định kỹ thuật
Để thêm trò chơi **Cờ Ca Rô (Gomoku)** và phát triển dự án thành một cổng trò chơi mini-game hoàn thiện, chúng tôi đã đưa ra các quyết định kiến trúc cốt lõi trong `architect_plan.md`:

### A. Chuyển đổi sang kiến trúc Single-Page App (SPA)
- Giao diện chính sẽ dùng chung tệp `index.html`. Các giao diện cụ thể được định vị trong các khối `div` màn hình (`.screen`) khác nhau.
- Các màn hình:
  1. `#lobby-screen`: Màn hình sảnh chính hiển thị các thẻ chọn game (Memory Match & Cờ Ca Rô).
  2. `#memory-game-screen`: Màn hình chứa trò chơi lật hình Memory Match.
  3. `#caro-game-screen`: Màn hình chứa trò chơi Cờ Ca Rô mới.
- Quản lý định tuyến ẩn/hiện màn hình thông qua mã JavaScript trong `main.js`.

### B. Tách biệt Module Javascript (Modular JS)
- Thay thế mã nguồn tập trung (monolithic) cũ:
  - `main.js`: Nhận vai trò Router điều phối sảnh chính và điều khiển chuyển đổi giữa các trò chơi.
  - `memory.js`: Chứa toàn bộ nghiệp vụ của game lật hình.
  - `caro.js`: Chứa toàn bộ nghiệp vụ của game Cờ Ca Rô mới.

### C. Thiết kế Game Cờ Ca Rô
- **Bàn cờ**: 12x12 ô cờ hiển thị bằng CSS Grid, đảm bảo độ nhạy (responsive) trên màn hình hẹp di động thông qua đơn vị tương đối và tỉ lệ `aspect-ratio: 1/1`.
- **Chế độ chơi**:
  - PvP (Player vs Player): Chơi luân phiên tại máy cục bộ.
  - PvAI (Player vs AI): Người chơi đấu với Máy. Máy sử dụng thuật toán chấm điểm ô cờ Heuristic (Tấn công & Phòng thủ) phản hồi tức thời (<5ms) mà không tốn tài nguyên.
- **Tính năng bổ sung**: Cho phép đi lại nước cờ trước đó (Undo) bằng cơ chế lưu lịch sử Stack.

---

## 3. Trạng thái hiện tại & Hướng tiếp theo
- **Trạng thái**:
  - Đã hoàn thành phân tích yêu cầu từ phía Architect.
  - Đã tạo tài liệu kế hoạch kỹ thuật chi tiết tại [architect_plan.md](file:///D:/workspace/wt-4b22a91e72964875877e9e608b9c0c8e/architect_plan.md).
  - **Đã hoàn thành Task 1**: Tách file JS & Refactor Memory Match. Toàn bộ logic game lật hình đã được đóng gói thành lớp `MemoryGame` trong [memory.js](file:///D:/workspace/wt-4b22a91e72964875877e9e608b9c0c8e/memory.js), giúp giải phóng [main.js](file:///D:/workspace/wt-4b22a91e72964875877e9e608b9c0c8e/main.js).
- **Lưu ý cho các bước tiếp theo (Leader/Coder/QA)**:
  - **Coder**: Tiếp tục Task 2: Cập nhật cấu trúc [index.html](file:///D:/workspace/wt-4b22a91e72964875877e9e608b9c0c8e/index.html) để thêm khung màn hình Lobby và Caro game. Chú ý bọc màn hình Memory Match hiện tại vào vùng chứa riêng (`#memory-game-screen`).
  - **QA**: Tập trung kiểm tra tính tương thích responsive của bàn cờ Caro trên màn hình điện thoại di động và độ nhạy bén chặn nước đi của AI.
