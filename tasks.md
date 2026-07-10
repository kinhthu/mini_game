# Task List - Cờ Cá Ngựa Game Integration

| Seq | Title | Status | Description |
| --- | ----- | ------ | ----------- |
| 1 | Phase 1: Tạo dựng Giao Diện HTML & CSS Grid Bàn Cờ | Pending | Thêm thẻ game Cờ Cá Ngựa vào Lobby. Xây dựng cấu trúc view `#cangua-view` với bảng điều khiển và bàn cờ trong index.html. Định dạng bàn cờ 15x15 bằng CSS Grid, tạo style cho các ô cờ, quân cờ (ngựa), và hiệu ứng xúc xắc 3D trong style.css. |
| 2 | Phase 2: Navigation & Đồng bộ Profile Stats | Pending | Tích hợp logic chuyển view trong main.js để điều hướng đến game Cá Ngựa. Đồng bộ và lưu trữ stats của game (`cangua_wins`, `cangua_played`) vào localStorage, tích hợp vào ProfileManager để cập nhật tổng Rank. |
| 3 | Phase 3: Phát Triển Core Logic, Bàn Cờ & Cơ Chế Xúc Xắc | Pending | Khởi tạo file `cangua.js` với lớp `CanGuaGame`. Xây dựng logic vẽ bàn cờ động 15x15, khởi tạo vị trí ban đầu cho 16 quân ngựa, và triển khai cơ chế tung xúc xắc ngẫu nhiên (sinh 2 số từ 1 đến 6) cùng trạng thái lượt đi của người chơi. |
| 4 | Phase 4: Thiết Lập Cơ Chế Xuất Quân & Di Chuyển Ngựa | Pending | Lập trình điều kiện xuất quân khi tung được cặp xúc xắc Double hoặc 1 và 6. Xây dựng logic tính toán nước đi khả dụng cho từng ngựa dựa trên kết quả xúc xắc. Cập nhật giao diện di chuyển quân ngựa theo vòng kim đồng hồ quanh bàn cờ. |
| 5 | Phase 5: Xử Lý Logic Leo Chuồng, Đá Quân & Chế Độ AI | Pending | Lập trình quy tắc leo chuồng chính và di chuyển lên các ô từ 1 đến 6. Thiết lập cơ chế đá quân đối thủ về chuồng phụ khi trùng tọa độ. Xây dựng AI tự động chơi cờ theo thứ tự ưu tiên nước đi thông minh. Kiểm thử điều kiện thắng cuộc. |
| 6 | Phase 6: Viết Unit Test & Kiểm Thử Tổng Thể | Pending | Tạo tệp `test_cangua_logic.js` chứa các unit test chạy độc lập bằng Node.js để kiểm thử toàn bộ logic game. Thực thi kiểm thử, tối ưu hóa CSS responsive cho mobile, kiểm tra clean git status và hoàn thành verification. |
