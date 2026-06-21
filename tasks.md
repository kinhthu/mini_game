# Tasks Breakdown: Cờ Ca Rô Game Integration

Đây là bảng phân chia công việc cho việc thêm game Cờ Ca Rô vào Web Mini-Games.

## Danh sách Task Items

1. **Task 1: Tách file JS & Refactor Memory Match** (seq: 1)
   - *Mô tả*: Di chuyển toàn bộ code của game lật hình từ `main.js` sang `memory.js`. Đóng gói logic Memory Match vào một class hoặc module `MemoryGame` để tránh xung đột biến toàn cục.
   - *Acceptance Criteria*: `main.js` chỉ làm nhiệm vụ router chính. Game lật hình chạy bình thường từ `memory.js` mà không bị rò rỉ biến hay lỗi logic.

2. **Task 2: Cập nhật cấu trúc index.html** (seq: 2)
   - *Mô tả*: Bọc màn hình Memory Match hiện tại vào container `#memory-game-screen`. Thêm màn hình chính `#lobby-screen` với 2 thẻ game (Game Cards). Thêm màn hình game Caro `#caro-game-screen` có đầy đủ header, stats, board, và modal. Liên kết các script mới (`memory.js` và `caro.js`).
   - *Acceptance Criteria*: Cấu trúc HTML đầy đủ, phân biệt rõ các `.screen` và load đúng các script.

3. **Task 3: Cập nhật style.css** (seq: 3)
   - *Mô tả*: Thêm lớp `.screen` điều khiển hiển thị ẩn/hiện mượt mà. Thiết kế Lobby hiện đại (glassmorphism, hover scale/glow). Tạo kiểu dáng cho bàn cờ Caro 12x12 responsive tốt và các quân cờ X/O phát sáng/glowing.
   - *Acceptance Criteria*: CSS chuẩn giao diện premium, không tràn/vỡ trên mobile, các hiệu ứng hover, scale, glow hoạt động tốt.

4. **Task 4: Viết logic Cờ Ca Rô (chế độ PvP)** (seq: 4)
   - *Mô tả*: Khởi tạo class `CaroGame` quản lý mảng 2 chiều 12x12, lượt đi, lịch sử đi (để Undo). Viết logic render bàn cờ Caro động và sự kiện click. Triển khai thuật toán win-checking quét 4 hướng cho chuỗi 5 ô liên tiếp và highlight dòng thắng cuộc.
   - *Acceptance Criteria*: Người chơi có thể chơi PvP luân phiên X và O, không ghi đè cờ, có thể Undo, phát hiện chiến thắng 5 quân chính xác và highlight dòng thắng + hiển thị modal kết quả.

5. **Task 5: Thiết lập thuật toán AI cho chế độ PvAI** (seq: 5)
   - *Mô tả*: Xây dựng thuật toán AI heuristic chấm điểm (tấn công + phòng ngự) cho mọi ô trống theo 4 hướng và chọn nước đi tối ưu nhất cho máy. Kích hoạt lượt đi AI tự động sau khi người chơi đi nước cờ của mình.
   - *Acceptance Criteria*: Chế độ PvAI hoạt động mượt mà (<5ms), AI phản hồi thông minh, biết chặn các hàng 3, hàng 4 nguy hiểm của đối phương.

6. **Task 6: Tích hợp tổng thể và Polish UI/UX** (seq: 6)
   - *Mô tả*: Hoàn thiện router trong `main.js` để chuyển đổi mượt mà giữa Lobby, Memory Match, và Caro. Dọn dẹp/xóa bỏ timer/state khi đổi game hoặc quay lại lobby. Thêm các micro-animations và kiểm tra responsive hoàn hảo.
   - *Acceptance Criteria*: Tổng thể trang web chạy trơn tru, không rò rỉ timer/trạng thái cũ, giao diện hoàn thiện và đẹp mắt.
