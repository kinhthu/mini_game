# Memory: Mini-Game Hub Context & Architecture

Tài liệu này lưu trữ bối cảnh, kiến trúc hiện tại và lịch sử thay đổi của dự án. Mọi Agent tham gia vào dự án bắt buộc phải đọc và cập nhật tài liệu này.

---

## 1. Bối Cảnh & Kiến Trúc Dự Án (Project Context)

- **Loại hình**: Dự án web mini-game chạy trên client (HTML, CSS, JS thuần).
- **Màu sắc & Phong cách chủ đạo**: 
  - Tông tối cao cấp (Dark theme với dải chuyển màu hồng sẫm/đỏ rượu: `#2a0f12` đến `#4b1b1b`).
  - Font chữ hiện đại: `Outfit` từ Google Fonts.
  - Sử dụng các hiệu ứng bóng mờ (backdrop-filter) và bo góc mềm mại.
- **Cấu trúc thư mục ban đầu**:
  - `index.html`: Chứa cấu trúc HTML cho game Memory Match.
  - `style.css`: Định nghĩa phong cách chung, biến CSS, cấu trúc grid cho thẻ bài và modal.
  - `main.js`: Chứa toàn bộ logic game Memory Match (quản lý trạng thái, thời gian, lượt lật, logic thắng cuộc và cập nhật DOM).

---

## 2. Các Thay Đổi Gần Đây (Recent Actions)

- **21/06/2026**: 
  - Khảo sát mã nguồn hiện tại của game Memory Match.
  - Xây dựng bản kế hoạch kỹ thuật chi tiết tại [architect_plan.md](file:///D:/workspace/wt-40b6bec987b7428dafd0c8f6628e77b4/architect_plan.md) để mở rộng dự án, tích hợp thêm game **Cờ Ca Rô (Gomoku)**.
  - Thiết kế cấu trúc phân rã tệp JS mới (`memory.js` để tách biệt logic game cũ, `caro.js` chứa logic game mới và AI, `main.js` đóng vai trò là Router điều khiển màn hình chính).
  - Tái cấu trúc thành công game Memory Match: chuyển toàn bộ logic game từ `main.js` sang `memory.js` dưới dạng class `MemoryMatch`. Cập nhật `index.html` và `main.js` để tích hợp và khởi tạo trò chơi thông qua class này.

---

## 3. Hướng Dẫn & Lưu Ý Cho Các Task Tiếp Theo (Next Steps & Guidelines)

- **Tái cấu trúc**: Cần chuyển logic game Memory hiện tại trong `main.js` sang `memory.js` trước khi viết thêm tính năng mới để tránh xung đột mã nguồn.
- **Tính đáp ứng (Responsive)**: Bàn cờ Ca Rô có kích thước lớn ($12 \times 12$ hoặc $15 \times 15$) cần được tính toán kích thước ô cờ cẩn thận (sử dụng đơn vị `vmin`/`vmax` hoặc tỉ lệ phần trăm) để hiển thị trọn vẹn và dễ bấm trên màn hình điện thoại di động mà không bị tràn khung.
- **Thuật toán AI**: Để có trải nghiệm mượt mà, thuật toán AI trong `caro.js` nên dùng phương pháp **Heuristic Pattern Scoring** để chấm điểm nước đi nhanh chóng thay vì Minimax sâu để tránh đơ trình duyệt.
- **Conventional Commits**: Khi thực hiện các thay đổi, hãy commit nhỏ gọn kèm message theo chuẩn (ví dụ: `feat: add game selection menu layout`, `fix: win condition detection diagonal check`).
