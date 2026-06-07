# Kế hoạch thực thi — Đổi ảnh nền sang cảnh thiên nhiên phong cách Ghibli

## 0. Bối cảnh & Phát hiện quan trọng

- **Cấu trúc thực tế của dự án:** Toàn bộ source code mini game nằm ở **thư mục gốc** `D:\workspace\supperseo2018\MiniGame\`, **KHÔNG có thư mục con `memory_match_game/`** như mô tả trong task. Các file liên quan:
  - `index.html`
  - `style.css`
  - `main.js`
  - `background.png` (ảnh nền hiện tại, 822 KB)
- **Tham chiếu trong CSS:** `style.css` (dòng 24) đang dùng `background: url('background.png') center center fixed;` với `background-size: cover;` — tức là ảnh nền load từ đường dẫn tương đối ngay tại thư mục gốc.
- **Hệ quả:** Coder phải thay file `background.png` tại **thư mục gốc dự án**, không tạo thư mục `memory_match_game/` mới.
- **Theme hiện tại (galaxy/dark):** Chữ trắng có viền/đổ bóng tím-indigo đậm, các stat-box và modal dùng glassmorphism nền tối (`rgba(15, 23, 42, 0.x)`). Khi đổi sang nền pastel sáng phong cách Ghibli, các thành phần này vẫn còn đủ độ tương phản, nhưng cần thêm một lớp overlay nhẹ ở body để đảm bảo card và text luôn nổi bật trên mọi vùng của ảnh nền.

---

## 1. Mục tiêu

1. Thay ảnh `background.png` ở thư mục gốc bằng một ảnh nền cảnh thiên nhiên phong cách **Studio Ghibli**: bầu trời pastel (xanh nhạt → hồng/đào), mây trắng bồng bềnh, đồi cỏ xanh non, có thể có vài bụi cây/cây silhouette.
2. Đảm bảo layout không vỡ; các thẻ bài (`.card`), header, stats, modal đều rõ ràng, dễ đọc trên nền mới.
3. Điều chỉnh `style.css` thêm overlay nhẹ và tinh chỉnh để giữ độ tương phản cho UI.

---

## 2. Các bước thực thi (step-by-step)

### Bước 1 — Tạo ảnh nền `background.png` mới phong cách Ghibli

**Cách tiếp cận:** Vì môi trường là Windows + PowerShell, tạo ảnh thủ tục (procedurally) bằng .NET `System.Drawing.Common` để dựng cảnh pastel. Cách này lặp lại được, không phụ thuộc tải file ngoài.

- **Kích thước ảnh:** `1920x1080` (đủ lớn để `background-size: cover` không bị mờ trên màn hình lớn).
- **Bố cục từ trên xuống dưới:**
  - **Trời (60% phía trên):** Gradient dọc từ `#BFE3F5` (xanh trời nhạt) → `#FFD6C0` (hồng đào pastel) ở vùng chân trời.
  - **Mặt trời mờ (tùy chọn):** Vòng tròn `#FFF4D6` mờ, bán kính ~120 px, đặt lệch trái-trên (`x ≈ 480, y ≈ 280`).
  - **Mây trắng:** 5–7 cụm mây bằng cách vẽ chồng nhiều ellipse trắng `#FFFFFF` với alpha ~85%, kích thước và vị trí ngẫu nhiên trong nửa trên.
  - **Đồi sau (40% phía dưới, lớp xa):** Bezier/đường cong xanh pastel `#B8D9A8` chiếm ~30% chiều cao dưới.
  - **Đồi trước (lớp gần):** Bezier xanh đậm hơn `#8FBF7A` chiếm ~20% chiều cao dưới cùng.
  - **Cây silhouette (tùy chọn):** 2–3 cây tròn nhỏ màu `#6FA463` đặt trên đường chân đồi để tăng độ "Ghibli".
- **Lưu file:** Ghi đè `D:\workspace\supperseo2018\MiniGame\background.png` (PNG, RGB).

**Script gợi ý (PowerShell, dùng `System.Drawing.Common`):** Coder có thể viết một script ngắn tạo `Bitmap`, dùng `LinearGradientBrush` cho trời, `SolidBrush` với alpha cho mây, và `FillPath` cho đường cong đồi. Lưu bằng `bitmap.Save("background.png", [System.Drawing.Imaging.ImageFormat]::Png)`.

**Tiêu chí chấp nhận cho ảnh:**
- Tông màu pastel sáng, ấm áp, không có vùng nào quá tối hoặc quá chói.
- Khi `background-size: cover` được áp dụng ở các tỉ lệ màn hình khác nhau (16:9, 4:3, mobile dọc), bố cục vẫn nhận ra được trời ở trên + đồi ở dưới.

### Bước 2 — Thêm lớp overlay nhẹ trong `style.css` để giữ độ tương phản

Trong `style.css`, thêm một pseudo-element `body::before` phủ toàn màn để:
- Làm dịu (slight wash) nền ở vùng có cụm mây trắng (tránh chữ trắng của `h1` chìm vào mây).
- Tăng tương phản nhẹ cho các thẻ bài và stat-box.

**Sửa cụ thể trong `style.css`:**

1. Trong khối `body { ... }` (dòng 22–33), giữ nguyên thuộc tính `background`, nhưng thêm `position: relative;` và `z-index: 0;` để đảm bảo `::before` hoạt động đúng.
2. Thêm khối mới ngay sau khối `body`:
   ```css
   body::before {
       content: '';
       position: fixed;
       inset: 0;
       background: linear-gradient(
           180deg,
           rgba(30, 27, 75, 0.18) 0%,
           rgba(30, 27, 75, 0.08) 50%,
           rgba(30, 27, 75, 0.22) 100%
       );
       pointer-events: none;
       z-index: -1;
   }
   ```
   - Lớp này tối nhẹ ở đỉnh và đáy (giúp tiêu đề "Memory Match" trắng + viền indigo tiếp tục nổi bật trên cụm mây trắng) và gần như trong suốt ở giữa (để vùng cards vẫn nhìn rõ cảnh nền Ghibli).
3. Đảm bảo `.game-container` (dòng 35–42) có `position: relative;` để nó nằm trên overlay (mặc định nó đã là static block flex; thêm `position: relative;` an toàn).

### Bước 3 — Tinh chỉnh `.card-front` để giữ rõ ràng trên nền sáng

Trên nền pastel sáng, mặt sau (úp) của card hiện tại dùng `rgba(255, 255, 255, 0.6)` có thể bị "chìm" vào vùng mây trắng. Cần tăng độ tương phản viền và làm nền card-front đậm hơn một chút:

- Trong `style.css` dòng 173–179, đổi `.card-front`:
  - `background: rgba(255, 255, 255, 0.75);` (từ `0.6` lên `0.75`).
  - Thêm `border: 1.5px solid rgba(167, 139, 250, 0.55);` (viền lavender mảnh — vừa hài hòa Ghibli vừa làm card không chìm vào mây).
- Giữ nguyên `.card-front::after` (dấu `?` violet) — tông tím nhạt vẫn hợp tông Ghibli.

### Bước 4 — Kiểm thử thủ công (manual verification)

1. Mở `index.html` bằng trình duyệt (Chrome/Edge). Mục tiêu kiểm:
   - Ảnh nền hiển thị full màn, không bị méo hoặc lặp tile.
   - Tiêu đề "Memory Match (Level 1)" rõ nét, không lẫn vào mây/trời.
   - Các stat-box (Moves / Time / Best) đọc được dễ dàng.
   - Card mặt úp (`?`) phân biệt rõ với nền, không bị "tan" vào vùng mây trắng.
   - Click một vài card → mặt sau lavender hiện đẹp; khi match thành công, mặt xanh `--success-color` vẫn nổi.
   - Mở modal "Level Cleared" (cách nhanh: lật đủ cặp ở level 1 hoặc tạm chỉnh `numPairs` để test) → modal nền tối vẫn rõ ràng.
2. Kiểm tra responsive bằng DevTools (375×667 — mobile dọc): bố cục ảnh nền vẫn nhận ra cảnh thiên nhiên, không bị crop mất hết phần đồi.

### Bước 5 — Commit & tổng kết thay đổi

Sau khi mọi thứ ổn, commit thay đổi với message tiếng Việt phù hợp lịch sử commit dự án, ví dụ:
```
Task: Đổi ảnh nền sang cảnh thiên nhiên phong cách Ghibli
```
Files thay đổi:
- `background.png` (binary, ghi đè)
- `style.css` (thêm `body::before`, tinh chỉnh `.card-front`, thêm `position: relative` cho body/game-container nếu cần)

---

## 3. Danh sách file sẽ chỉnh sửa

| File | Hành động |
|---|---|
| `background.png` (thư mục gốc) | **Ghi đè** bằng ảnh Ghibli pastel mới (1920x1080 PNG) |
| `style.css` | Thêm `body::before` overlay; tăng opacity `.card-front`; thêm `position: relative` cho body/game-container |
| `index.html` | **Không sửa** |
| `main.js` | **Không sửa** |

---

## 4. Rủi ro & lưu ý

- **Đường dẫn tương đối:** Vì `style.css` dùng `url('background.png')` (không có `./`), file phải nằm cùng cấp với `style.css`. Đặt sai vị trí (vd. tạo `memory_match_game/background.png` theo lời mô tả task) sẽ làm ảnh không load.
- **Cache trình duyệt:** Sau khi thay PNG, dùng hard-reload (Ctrl+F5) để chắc chắn không xem nhầm bản cũ.
- **Đừng sửa thêm theme dark/galaxy không cần thiết:** Task chỉ yêu cầu đổi nền — không refactor màu chữ chính, không động vào `:root` variables nếu không bắt buộc, để giữ scope thay đổi gọn.
- **System.Drawing.Common trên PowerShell:** Trên Windows PowerShell 5.1 đã có sẵn (`Add-Type -AssemblyName System.Drawing`). Nếu môi trường là PowerShell 7+, có thể cần install thêm package, nhưng task này nên chạy bằng `powershell.exe` (Win PS 5.1) để đơn giản.

---

## 5. Tiêu chí hoàn thành (Definition of Done)

- [ ] `background.png` mới là cảnh thiên nhiên pastel Ghibli (trời + mây + đồi), đặt đúng tại thư mục gốc dự án.
- [ ] Game mở trong trình duyệt hiển thị nền mới full màn, không vỡ layout.
- [ ] Tiêu đề, stat-box, card mặt úp, card mặt mở, modal đều dễ đọc và rõ nét trên nền mới.
- [ ] `style.css` được cập nhật với overlay nhẹ và tinh chỉnh `.card-front`; không có lỗi cú pháp.
- [ ] Commit cuối với message mô tả task bằng tiếng Việt.
