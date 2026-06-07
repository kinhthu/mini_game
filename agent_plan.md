# Kế hoạch chi tiết: Đổi màu chữ (Giao lại lần 5)

## 1. Bối cảnh & Phân tích hiện trạng

**Dự án:** Memory Match Game (HTML/CSS/JS thuần)
**File liên quan:** `style.css` (file duy nhất chứa định nghĩa màu chữ)

### Hiện trạng `style.css`:
- Khối `:root` (dòng 1-12) hiện chỉ có biến `--text-color: #ffffff` (KHÔNG có `--text-main` hay `--text-muted` như mô tả task).
- Background body là ảnh `background.png` (dòng 22) → nền không cố định, có nhiều vùng sáng-tối khác nhau.
- Hầu hết text đang dùng `#ffffff` + `-webkit-text-stroke` đen 1-2px + `text-shadow` đen lệch → kiểu chữ kiểu "cartoon outline".
- Có một số chỗ hardcode màu `#0f172a` (modal text) và `#000000` (stroke/shadow) không qua biến CSS.
- Đây là lần giao thứ 5 → các lần trước đã thử nhiều tông màu, lần này cần một bước rõ ràng theo đúng yêu cầu task: **thêm/dùng `--text-main` và `--text-muted`** và đảm bảo dễ đọc trên nền ảnh hiện tại.

## 2. Mục tiêu

1. Refactor biến CSS theo đúng tên task yêu cầu: thêm `--text-main` và `--text-muted` vào `:root`.
2. Chọn tông màu **dễ đọc** trên nền ảnh `background.png` (giả định nền có cả vùng sáng và vùng tối → giữ chữ trắng làm `--text-main` để tương phản với stroke đen vẫn là phương án an toàn nhất; `--text-muted` dùng cho text phụ).
3. Thay thế các giá trị màu hardcoded (`#ffffff`, `#0f172a`) trong file `style.css` bằng biến CSS mới để file nhất quán và dễ chỉnh sau này.
4. Không phá vỡ hiệu ứng outline/shadow đang có (đã được duyệt ở lần trước).

## 3. Đề xuất bảng màu mới

| Biến CSS         | Giá trị        | Dùng cho                                              |
|------------------|----------------|-------------------------------------------------------|
| `--text-main`    | `#fffbeb`      | Tiêu đề h1, label, value, button — tông trắng-ngà ấm, bớt chói hơn `#ffffff` thuần, hợp với accent vàng `#fbbf24` |
| `--text-muted`   | `#1e293b`      | Text trong modal (nền sáng) — slate-800, dễ đọc hơn `#0f172a` thuần đen, vẫn đủ tương phản |
| `--text-stroke`  | `#0f172a`      | Màu của `-webkit-text-stroke` (gom hardcode `#000000` về một biến) |

Lý do chọn:
- `#fffbeb` (amber-50) hài hòa với `--accent-color: #fbbf24` đã có → tạo cảm giác ấm, tránh trắng "lạnh" trên nền có gradient xanh.
- `#1e293b` (slate-800) trên nền modal trắng `rgba(255,255,255,0.9)` đạt tương phản WCAG AAA.
- Gom màu stroke về biến giúp lần sau muốn đổi chỉ sửa 1 chỗ.

## 4. Các bước thực thi (cho Coder)

### Bước 1 — Cập nhật khối `:root` trong `style.css` (dòng 1-12)
Thay khối hiện tại:
```css
:root {
    --bg-gradient-start: #e0f2fe;
    --bg-gradient-end: #d1fae5;
    --card-bg-front: rgba(255, 255, 255, 0.6);
    --card-bg-back: #a7f3d0;
    --text-color: #ffffff;
    --text-shadow-dark: 2px 2px 4px rgba(0, 0, 0, 0.8);
    --accent-color: #fbbf24;
    --success-color: #10b981;
    --shadow-glow: rgba(251, 191, 36, 0.6);
    --shadow-dark: rgba(15, 23, 42, 0.4);
}
```
Thành:
```css
:root {
    --bg-gradient-start: #e0f2fe;
    --bg-gradient-end: #d1fae5;
    --card-bg-front: rgba(255, 255, 255, 0.6);
    --card-bg-back: #a7f3d0;
    --text-main: #fffbeb;
    --text-muted: #1e293b;
    --text-stroke: #0f172a;
    --text-shadow-dark: 2px 2px 4px rgba(0, 0, 0, 0.8);
    --accent-color: #fbbf24;
    --success-color: #10b981;
    --shadow-glow: rgba(251, 191, 36, 0.6);
    --shadow-dark: rgba(15, 23, 42, 0.4);
}
```
(Đã xóa `--text-color` cũ vì sẽ thay toàn bộ usage.)

### Bước 2 — Thay `body` (dòng 24)
- `color: var(--text-color);` → `color: var(--text-main);`

### Bước 3 — Thay `h1` (dòng 49-56)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 2px #000000;` → `-webkit-text-stroke: 2px var(--text-stroke);`
- Trong `text-shadow`: đổi `4px 4px 0 #000000` → `4px 4px 0 var(--text-stroke)`.

### Bước 4 — Thay `.stat-box .label` (dòng 76-84)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 1px #000000;` → `-webkit-text-stroke: 1px var(--text-stroke);`
- Trong `text-shadow`: `2px 2px 0 #000000` → `2px 2px 0 var(--text-stroke)`.

### Bước 5 — Thay `.stat-box .value` (dòng 86-92)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 2px #000000;` → `-webkit-text-stroke: 2px var(--text-stroke);`
- `text-shadow`: `3px 3px 0 #000000` → `3px 3px 0 var(--text-stroke)`.

### Bước 6 — Thay `.btn` (dòng 94-108)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 1px #000000;` → `-webkit-text-stroke: 1px var(--text-stroke);`
- `text-shadow: 2px 2px 0 #000000;` → `text-shadow: 2px 2px 0 var(--text-stroke);`.

### Bước 7 — Thay `.primary-btn` (dòng 116-125)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 1.5px #000000;` → `-webkit-text-stroke: 1.5px var(--text-stroke);`
- `text-shadow: 3px 3px 0 #000000;` → `text-shadow: 3px 3px 0 var(--text-stroke);`.

### Bước 8 — Thay `.modal-content h2` (dòng 241-248)
- `color: #ffffff;` → `color: var(--text-main);`
- `-webkit-text-stroke: 2px #0f172a;` → `-webkit-text-stroke: 2px var(--text-stroke);`
- `text-shadow: 4px 4px 0 #0f172a;` → `text-shadow: 4px 4px 0 var(--text-stroke);`.

### Bước 9 — Thay `.modal-content p` (dòng 250-255)
- `color: #0f172a;` → `color: var(--text-muted);`

### Bước 10 — Kiểm tra cuối
- Mở `index.html` trong trình duyệt, xác minh:
  - Tiêu đề h1 vẫn nổi bật trên nền ảnh.
  - Modal "Level Cleared!" có chữ h2 trắng-ngà với stroke đen, chữ p màu slate đậm — đều đọc rõ trên nền modal trắng mờ.
  - Buttons (Restart, Play Again, Next Level) text trắng-ngà, viền đen rõ.
  - Không có chỗ nào bị chữ trắng trên nền trắng hoặc đen trên nền đen.

## 5. Phạm vi KHÔNG đụng tới

- `index.html`, `main.js`: không sửa.
- Background, layout, kích thước font, font-family: giữ nguyên (font Black Ops One đã được duyệt ở commit gần nhất `46614d3`).
- Các biến không liên quan tới text (`--card-bg-*`, `--accent-color`, `--success-color`, `--shadow-*`): giữ nguyên.

## 6. Tiêu chí nghiệm thu

- [ ] `:root` có 3 biến mới: `--text-main`, `--text-muted`, `--text-stroke`.
- [ ] Không còn literal `#ffffff`, `#000000`, `#0f172a` nào trong các rule liên quan tới `color` / `-webkit-text-stroke` / `text-shadow` của text (các giá trị `rgba(...)` cho background/shadow vẫn giữ).
- [ ] Toàn bộ text trong game vẫn đọc được rõ ràng trên nền `background.png`.
- [ ] Không có lỗi console / không vỡ layout.
