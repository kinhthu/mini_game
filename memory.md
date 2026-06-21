# Project Memory (`memory.md`)

## Bối cảnh Dự án (Project Context)
Dự án là một ứng dụng web tĩnh chứa các mini game chất lượng cao, thiết kế theo phong cách hiện đại (glassmorphism, gradient rực rỡ, hiệu ứng chuyển động mượt mà). 
- Hiện tại dự án chỉ có 1 game duy nhất là **Memory Match Game** (Lật thẻ bài trùng khớp).
- Các file hiện tại:
  - `index.html`: Cấu trúc HTML của trang.
  - `style.css`: Hệ thống CSS tùy biến dùng hệ màu Rose/Warm Dark.
  - `main.js`: Logic điều khiển game Memory Match.

## Các thay đổi đã thực hiện (Changes Made)
1. **Lập Kế hoạch Kiến trúc**: Tạo file [architect_plan.md](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/architect_plan.md) chi tiết hóa việc:
   - Tái cấu trúc giao diện thành hệ thống đa màn hình (Multi-screen) qua router ẩn/hiện bằng CSS.
   - Thêm Game Menu để chọn chơi Memory Match hoặc Cờ Ca Rô.
   - Tích hợp game Cờ Ca Rô (Gomoku) 15x15 hỗ trợ cả PvP (chơi 2 người cục bộ) và PvE (chơi với AI).
   - Thiết kế thuật toán AI Heuristic đánh chặn & tấn công mạnh mẽ mà tối ưu hiệu năng.
   - Định nghĩa phong cách thiết kế mở rộng (màu sắc Cyan phát sáng cho X, màu sắc Rose cho O/AI).

## Hướng dẫn & Lưu ý cho Coder/Reviewer tiếp theo
- **Cấu trúc File**:
  - Không viết dồn toàn bộ logic vào `main.js`. Hãy chuyển logic Memory Match thành khối riêng biệt, thêm router màn hình vào `main.js`, và viết toàn bộ logic bàn cờ, thắng thua, AI của Caro vào một file mới: [caro.js](file:///D:/workspace/wt-8ffbd919438948dab82da38062e33b03/caro.js).
- **Trải nghiệm người dùng (UX)**:
  - Bàn cờ Caro 15x15 phải có tính năng hiển thị mờ (opacity thấp) biểu tượng X hoặc O khi hover chuột qua ô trống để người dùng biết mình sắp đặt ở đâu.
  - Sau khi thắng, 5 ô thắng cuộc phải được làm nổi bật bằng hiệu ứng viền phát sáng và phóng to nhẹ để tạo cảm giác thỏa mãn (satisfying).
  - Đảm bảo thiết kế responsive để bàn cờ Caro 15x15 tự động co giãn tốt trên màn hình thiết bị di động.
