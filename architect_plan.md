Tôi đã phân tích các yêu cầu cho trò chơi nối chọn cặp hình giống nhau (tương tự game Pikachu / Onet Connect / Pokemon Match) và xây dựng một kế hoạch kỹ thuật chi tiết.

Kế hoạch kỹ thuật đã được tạo và ghi nhận tại tệp [architect_plan.md](file:///D:/workspace/Mini-Games/architect_plan.md) trong thư mục dự án của bạn.

### Tóm tắt Kế hoạch Kỹ thuật

1. **Cơ chế cốt lõi (Onet Connect / Pikachu Rules):**
   * **Bảng trò chơi:** Lưới ô vuông chứa các emoji động vật (tương tự chủ đề Pokemon). Lưới được đệm thêm một viền trống ở ngoài cùng (các ô trống thuộc hàng `0`, `H+1`, cột `0`, `W+1`) nhằm cho phép đường nối đi vòng ra rìa ngoài bảng.
   * **Thuật toán tìm đường nối (tối đa 2 góc vuông / 3 đoạn thẳng):** Sử dụng một vòng quét tối ưu hóa theo chiều dọc (trên trục cột $c$) và ngang (trên trục dòng $r$) để phát hiện liên kết thẳng (0 góc), liên kết chữ L (1 góc), hoặc liên kết chữ Z/U (2 góc).
   * **Tự động xáo bài (Auto-Shuffle):** Thuật toán tự động duyệt tìm các cặp trùng khớp có thể nối được. Nếu không còn nước đi hợp lệ nào trên bảng, hệ thống sẽ xáo trộn (shuffle) các thẻ cờ còn lại để đảm bảo màn chơi không bị kẹt (soft-lock).

2. **Giao diện & Trải nghiệm cao cấp (Premium UI/UX):**
   * **Đường nối Neon rực rỡ:** Vẽ đường nối bằng thẻ `<svg>` tuyệt đẹp đè lên trên lưới, kết hợp bộ lọc bóng mờ (`drop-shadow`) và hiệu ứng chuyển động laser mượt mà trong 300ms rồi biến mất.
   * **Hiệu ứng biến mất (Tile Fade Out):** Các thẻ cờ biến mất với hiệu ứng phóng nhẹ và thu nhỏ mờ dần khi khớp cặp.
   * **Bảng điều khiển bổ sung:** Gồm có **Thanh thời gian đếm ngược (Timer Bar)**, số lượt **Gợi ý (Hint)**, và số lượt **Tự xáo bài (Manual Shuffle)**.
   * **Cấp độ (Levels):** Tăng kích thước lưới từ dễ đến khó (từ lưới `4x6` đến `8x12`).

3. **Các tệp tin sẽ chỉnh sửa / tạo mới:**
   * **Chỉnh sửa:**
     * [index.html](file:///D:/workspace/Mini-Games/index.html) (Thêm thẻ game trong sảnh chính, giao diện trò chơi `#onet-view`, các nút điều khiển, SVG overlay và Win/Lose modal).
     * [style.css](file:///D:/workspace/Mini-Games/style.css) (CSS Layout dạng glassmorphic, lưới ô cờ linh hoạt và hiệu ứng animation đường đi neon).
     * [js/main.js](file:///D:/workspace/Mini-Games/js/main.js) (Ràng buộc nút chơi, tích hợp lưu trữ điểm số/cấp độ và cập nhật thống kê người chơi trên toàn hệ thống).
   * **Tạo mới:**
     * `js/games/onet.js` (Lớp xử lý chính trò chơi `OnetConnect`).
     * `test_onet_logic.js` (Viết các ca kiểm thử tự động trên NodeJS cho thuật toán tìm đường nối và kiểm tra xáo bài).

> [!IMPORTANT]
> **Khuyên dùng:** Để tiến hành các bước phát triển tiếp theo thuận lợi, bạn hãy thiết lập đường dẫn **`D:\workspace\Mini-Games`** làm không gian làm việc hoạt động (Active Workspace) trên IDE của bạn.
