# Kế hoạch Kỹ thuật: Tích hợp Game Cờ Tướng vào Mini Game Hub

Tài liệu này đặc tả kế hoạch thiết kế và triển khai game **Cờ Tướng (Xiangqi)** vào dự án Mini Game Hub hiện tại dưới dạng một Single Page Application (SPA) view mới, có đầy đủ các chế độ chơi PvP và PvE (với AI), đồng bộ hóa thông số thống kê người dùng và có bộ unit test kiểm thử logic game độc lập.

---

## 1. Mục tiêu & Phạm vi

*   **Mục tiêu**: Bổ sung game Cờ Tướng vào Mini Game Hub. Game có giao diện hiện đại theo phong cách Glassmorphism Neon đặc trưng của Hub, hỗ trợ chơi PvP và PvE (đấu với AI Dễ/Khó), hỗ trợ hệ thống tính Rank toàn cục, lưu trữ thống kê số trận đã chơi và số trận thắng vào `localStorage`, và hỗ trợ tính năng hoàn tác nước đi (Undo).
*   **Phạm vi**:
    *   **Giao diện & Bố cục**: Thêm card game Cờ Tướng ở Lobby; thiết kế container `#tuong-view` chứa bàn cờ 9x10 (kẻ đường biên, sông, cung điện) và các nút điều khiển.
    *   **Thống kê & Điều hướng**: Định tuyến hiển thị view trong `js/main.js`, đồng bộ hóa các khóa thống kê `tuong_wins` và `tuong_played` với hệ thống Rank chung.
    *   **Logic Engine (`js/games/tuong.js`)**: Phát triển logic tính toán nước đi hợp lệ cho tất cả 7 loại quân, kiểm tra cản mắt tượng, cản chân mã, ngòi pháo, bay tướng (lộ mặt tướng), sông, cung điện, chiếu tướng và chiếu bí/vây bí.
    *   **AI Engine**: Triển khai Easy AI (chọn nước ngẫu nhiên) và Hard AI (Minimax kết hợp cắt tỉa Alpha-Beta và hàm đánh giá Heuristic trọng số quân cờ + vị trí).
    *   **Unit Tests (`test_tuong_logic.js`)**: Lập trình bộ test độc lập chạy trên Node.js để tự động kiểm thử tính đúng đắn của luật cờ và AI.

---

## 2. Phương án Thiết kế

*   **Phương án Đề xuất (Khuyến nghị)**: 
    *   Biểu diễn bàn cờ Cờ Tướng bằng một mảng phẳng gồm 90 phần tử (tương ứng với lưới 9 cột x 10 dòng, đánh chỉ số từ `0` đến `89` bắt đầu từ góc trên bên trái).
    *   Mỗi ô cờ có giá trị là `null` hoặc một đối tượng quân cờ dạng `{ type: 'R'|'N'|'B'|'A'|'K'|'C'|'P', color: 'r'|'b' }` (trong đó 'r' đại diện cho Đỏ đi trước, 'b' đại diện cho Đen đi sau).
    *   *Lý do chọn*: Cách tiếp cận mảng phẳng 90 phần tử đồng nhất hoàn hảo với cấu trúc của `chess.js` (mảng phẳng 64 phần tử) trong dự án. Điều này giúp tối ưu hóa bộ nhớ, dễ dàng sao chép sâu (deep copy) trạng thái bàn cờ khi AI chạy duyệt Minimax, và dễ dàng triển khai stack hoàn tác (Undo) bằng cách lưu lịch sử mảng đơn giản.
*   **Phương án Loại bỏ**:
    *   Biểu diễn bàn cờ dưới dạng mảng 2 chiều 10x9. Mặc dù trực quan hơn trong việc biểu diễn tọa độ dòng/cột, phương án này làm phức tạp hóa logic sao chép sâu trạng thái trong thuật toán Minimax và đòi hỏi cấu trúc undo cồng kềnh hơn.

---

## 3. Thiết kế Kỹ thuật Chi tiết

### A. Giao diện HTML & Tích hợp View (`index.html`)

1.  **Lobby Card**: Thêm card game Cờ Tướng vào `<main class="games-grid">`:
    ```html
    <!-- Cờ Tướng Card -->
    <div class="game-card glass-card tuong-theme">
        <div class="game-icon">⛩️</div>
        <h3 class="game-title">Cờ Tướng</h3>
        <p class="game-desc">Trải nghiệm cờ Tướng truyền thống. Thách thức AI minimax thông minh hoặc đấu trí cùng bạn bè.</p>
        <div class="game-stats">
            <span>Wins: <strong id="stats-tuong-wins">0</strong></span>
            <span>Played: <strong id="stats-tuong-played">0</strong></span>
        </div>
        <button id="play-tuong-btn" class="btn primary-btn red-btn">Play Now</button>
    </div>
    ```
2.  **Game View Layout**: Thêm thẻ div `#tuong-view` kế bên `#chess-view`:
    *   Chứa header định vị nút quay lại Lobby `.back-to-lobby-btn`, tựa game "Cờ Tướng".
    *   Khối cấu hình chế độ chơi (PvP, PvE) và độ khó AI (Dễ, Khó) sử dụng `segmented-control` đồng bộ phong cách.
    *   Khối bảng điểm `tuong-stats` (Đỏ vs Đen/AI) và thanh trạng thái lượt đi `#tuong-status`.
    *   Bàn cờ `#tuong-board` là một thẻ div có class `tuong-grid`.
    *   Footer chứa các nút điều khiển `#tuong-undo-btn`, `#tuong-restart-btn` và `#tuong-clear-btn`.

### B. CSS & Aesthetics (`style.css`)

1.  **Biến màu sắc mới**:
    ```css
    :root {
        --accent-tuong-red: #ff7675;
        --accent-tuong-black: #74b9ff;
        --tuong-board-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
    }
    ```
2.  **Bàn cờ 9x10**:
    ```css
    .tuong-grid {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        grid-template-rows: repeat(10, 1fr);
        gap: 0;
        width: 100%;
        max-width: 450px;
        aspect-ratio: 9 / 10;
        border: 4px solid var(--glass-border);
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: var(--tuong-board-shadow);
        background: rgba(15, 23, 42, 0.6);
        position: relative;
    }
    ```
3.  **Kẻ Sông & Cung Điện**:
    *   Dùng các ô cờ `.tuong-square` có kích thước `aspect-ratio: 1/1` và kẻ đường lưới mảnh giữa các ô.
    *   Vẽ **Sông (River)** ở giữa dòng 4 và dòng 5 bằng cách sử dụng một dải phủ mờ hoặc nhãn text "SÔNG SỞ" - "HÀ HÁN" (楚河 - 漢界) căn giữa.
    *   Vẽ **Cung điện (Palace)**: Áp dụng đường chéo chéo CSS `background: linear-gradient(...)` chéo cho 4 ô ở cung Đen (dòng 0-2, cột 3-5) và cung Đỏ (dòng 7-9, cột 3-5).
4.  **Thiết kế Quân cờ (`.tuong-piece`)**:
    *   Thiết kế hình tròn dạng quân gỗ truyền thống, sử dụng nền kính mờ (`backdrop-filter`) và viền phát sáng Neon màu đỏ hoặc màu xanh lam tùy thuộc vào phe.
    *   Font chữ Hán cổ sắc nét ở trung tâm ô cờ.
    *   Thêm nhãn chữ Latin nhỏ ở phía dưới chữ Hán (ví dụ: "Xe", "Pháo", "Mã", "Sĩ", "Tịnh", "Tướng", "Tốt") để hỗ trợ người chơi không biết chữ Hán.
    *   *Mã Unicode quân cờ Hán*:
        *   **Đen (Black)**: 将 (Tướng), 士 (Sĩ), 象 (Tượng), 车 (Xe), 炮 (Pháo), 马 (Mã), 卒 (Tốt).
        *   **Đỏ (Red)**: 帅 (Tướng), 仕 (Sĩ), 相 (Tượng), 俥 (Xe), 炮 (Pháo), 傌 (Mã), 兵 (Tốt).

### C. Quản lý Điều hướng & Thống kê (`js/main.js`)

1.  **Profile & Stats Synchronization**:
    *   Đọc và tính tổng điểm thắng bao gồm `tuong_wins` để xếp Rank chung (`ProfileManager.getRank`).
    *   Cập nhật `ProfileManager.updateUI()` để đọc `tuong_wins` và `tuong_played` từ `localStorage`, gán giá trị lên DOM của Lobby.
2.  **Navigation Binds**:
    *   Gán sự kiện click cho `#play-tuong-btn` để chuyển sang `tuong-view` và gọi `window.TuongGame.init()`.
    *   Cập nhật nút quay lại `.back-to-lobby-btn` để gọi `window.TuongGame.reset()` giải phóng tài nguyên trước khi về lobby.

### D. Core Engine Logic (`js/games/tuong.js`)

Phát triển module `TuongGame` quản lý toàn bộ vòng đời game Cờ Tướng:

1.  **Dữ liệu Bàn cờ ban đầu**:
    *   Mảng 90 phần tử. Chỉ số dòng = `Math.floor(idx / 9)`, chỉ số cột = `idx % 9`.
    *   Thiết lập quân cờ ban đầu tại dòng 0, 2, 3 (bên Đen) và dòng 6, 7, 9 (bên Đỏ).
2.  **Luật di chuyển chi tiết (`getPseudoLegalMoves(idx)`)**:
    *   **Tướng (K)**: Đi 1 ô dọc/ngang. Chỉ được di chuyển trong cung điện (cột 3-5; dòng 0-2 hoặc dòng 7-9). Kiểm tra luật Lộ mặt tướng: Nếu hai tướng nằm trên cùng một cột mà giữa chúng không có quân nào thì nước đi đó là phạm luật.
    *   **Sĩ (A)**: Đi 1 ô chéo. Chỉ di chuyển trong cung điện (5 ô hợp lệ của cung).
    *   **Tượng (B)**: Đi chéo đúng 2 ô (khoảng cách dòng là 2, cột là 2). Không được qua sông. Bị chặn (cản mắt tượng) nếu ô ở giữa đường chéo `(from + to) / 2` có bất kỳ quân cờ nào.
    *   **Mã (N)**: Đi hình chữ L (di chuyển 1 ô dọc/ngang rồi 1 ô chéo). Bị chặn (cản chân mã) nếu ô liền kề theo hướng đi thẳng đầu tiên có quân cờ.
    *   **Xe (R)**: Đi dọc hoặc ngang tùy ý. Đường đi phải trống. Ăn quân đối phương đầu tiên gặp trên đường đi.
    *   **Pháo (C)**: Di chuyển không ăn quân giống hệt Xe. Khi ăn quân, đường đi bắt buộc phải nhảy qua đúng một quân cờ bất kỳ làm ngòi (ngòi pháo).
    *   **Tốt (P)**: Đi thẳng 1 ô về phía trước. Nếu chưa qua sông chỉ được đi thẳng. Nếu đã qua sông (dòng >= 5 với Đen, dòng <= 4 với Đỏ) được phép đi ngang trái/phải 1 ô. Tuyệt đối không được đi lùi.
3.  **Lọc nước đi hợp lệ (`getLegalMoves(idx)`)**:
    *   Duyệt qua các nước đi giả định (pseudo-legal). Giả lập thực hiện nước đi, nếu nước đi đó làm cho Tướng của mình bị chiếu (`isKingInCheck` trả về `true`), loại bỏ nước đi đó khỏi danh sách hợp lệ.
4.  **Xử lý Chi chiếu & Kết thúc Game**:
    *   Nếu `hasAnyLegalMoves(currentPlayer)` trả về `false`:
        *   Nếu Tướng đang bị chiếu -> **Chiếu bí (Checkmate)** -> Người chơi còn lại thắng.
        *   Nếu Tướng không bị chiếu -> **Vây bí (Stalemate)** -> Người chơi còn lại thắng (theo luật cờ Tướng).

### E. AI Engine & Cấp độ khó

*   **Easy AI**: Tìm kiếm tất cả các quân cờ của AI (phe Đen) có nước đi hợp lệ, chọn ngẫu nhiên một nước đi và thực hiện sau một khoảng trễ 600ms.
*   **Hard AI**:
    *   Duyệt thuật toán Minimax độ sâu 2 hoặc 3 nước đi kết hợp cắt tỉa Alpha-Beta.
    *   Hàm đánh giá Heuristic:
        $$\text{Score} = \sum (\text{Giá trị quân Đen} + \text{Điểm vị trí Đen}) - \sum (\text{Giá trị quân Đỏ} + \text{Điểm vị trí Đỏ})$$
    *   *Trọng số quân cờ*: Xe = 90, Pháo = 45, Mã = 40, Sĩ = 20, Tượng = 20, Tốt trước sông = 10, Tốt sau sông = 22, Tướng = 10000.
    *   *Điểm vị trí*: Cộng điểm thưởng khi Pháo có ngòi tốt, Xe chiếm các cột mở, Mã không bị cản chân, và phạt điểm khi Tướng bị hở sườn.

### F. Kế hoạch Unit Test (`test_tuong_logic.js`)

Lập trình file kiểm thử Node.js tự động kiểm nghiệm các luật cốt lõi của Cờ Tướng:
*   **Test 1**: Khởi tạo cấu hình và bố trí quân cờ Cờ Tướng đúng vị trí gốc.
*   **Test 2**: Kiểm tra luật cản chân Mã và cản mắt Tượng.
*   **Test 3**: Kiểm tra luật Pháo ăn quân cần ngòi.
*   **Test 4**: Kiểm tra luật lộ mặt Tướng.
*   **Test 5**: Kiểm tra phát hiện Chiếu bí và Vây bí.

---

## 4. Hạng mục công việc (Work Items)

| Seq | Hạng mục công việc | File ảnh hưởng | Tiêu chí Nghiệm thu (Acceptance Criteria) |
| :--- | :--- | :--- | :--- |
| **1** | **Phase 1: Lobby Integration & HTML View Layout** | `index.html` | Thêm thẻ game Cờ Tướng ở Lobby. Tạo view `#tuong-view` hoàn chỉnh với các nút chọn chế độ (PvP/PvE), độ khó AI, bảng điểm, khung chứa bàn cờ `#tuong-board` 9x10 và các nút điều khiển. |
| **2** | **Phase 2: Navigation & Profile Stats Sync** | `js/main.js` | Người chơi bấm "Play Now" ở card Cờ Tướng sẽ điều hướng SPA mượt mà sang view Cờ Tướng. Các chỉ số `tuong_wins` và `tuong_played` lưu trữ trong localStorage được đồng bộ lên Rank của ProfileManager và cập nhật giao diện Lobby. |
| **3** | **Phase 3: CSS Styles, Board & Pieces Aesthetics** | `style.css` | Bàn cờ hiển thị lưới 9x10 sắc nét, có đường vẽ Sông và Cung điện. Các quân cờ thiết kế dạng tròn cổ điển phát sáng Neon màu đỏ/xanh lam, hiển thị chữ Hán cổ to rõ ở giữa và có nhãn phụ tiếng Việt nhỏ ở góc dưới. |
| **4** | **Phase 4: Core Cờ Tướng Engine Logic** | `js/games/tuong.js` | Hoàn thành class `TuongGame`. Lập trình logic di chuyển đầy đủ cho cả 7 loại quân cờ bao gồm tất cả các luật cản chân mã, cản mắt tượng, ngòi pháo, sông, cung điện, lộ mặt tướng, chiếu tướng, chiếu bí và vây bí. |
| **5** | **Phase 5: AI Engine & PvP/PvE Integration** | `js/games/tuong.js` | Tích hợp Easy AI (random moves) và Hard AI (minimax alpha-beta depth 2-3 với heuristic điểm số quân và vị trí). Người chơi có thể chơi chế độ PvE mượt mà, hỗ trợ nút Undo lùi 2 nước trong PvE và lùi 1 nước trong PvP. |
| **6** | **Phase 6: Unit Testing & E2E Validation** | `test_tuong_logic.js` | Viết và chạy bộ unit test tự động bằng Node.js. Xác nhận tất cả 5 test case lớn về luật cản chân, cản mắt tượng, ngòi pháo, lộ mặt tướng và chiếu bí đều vượt qua (Pass). |

---

## 5. Rủi ro & Giải pháp Giảm thiểu

1.  **Rủi ro hiệu năng AI (Minimax)**: Do Cờ Tướng có nhánh nước đi rộng hơn cờ vua, thuật toán Minimax dễ gây đơ trình duyệt nếu duyệt sâu.
    *   *Giảm thiểu*: Cài đặt độ sâu tìm kiếm tối đa của Hard AI là 2 hoặc 3 nước đi. Tối ưu hàm sinh nước đi giả lập để loại bỏ sớm các nước đi phạm luật. Thêm hiệu ứng trì hoãn nhân tạo (`setTimeout` từ 600ms đến 800ms) để mang lại cảm giác AI đang suy nghĩ thực tế mà không chặn luồng giao diện.
2.  **Rủi ro trải nghiệm người dùng với chữ Hán**: Một số người chơi có thể không quen đọc chữ Hán trên các quân cờ Cờ Tướng.
    *   *Giảm thiểu*: Thiết kế các quân cờ có nhãn tiếng Việt nhỏ nằm ở phần viền dưới của quân cờ để đảm bảo mọi đối tượng người chơi đều có thể tiếp cận game dễ dàng.

---

## 6. Hướng dẫn Xác minh End-to-End

1.  **Kiểm tra Giao diện & Định tuyến**:
    *   Mở Hub game, bấm "Play Now" ở card Cờ Tướng. View game hiển thị mượt mà.
    *   Kiểm tra bàn cờ lưới 9x10 có sông ở giữa, hai cung điện có đường chéo.
    *   Bấm "Back to Lobby" để đảm bảo quay lại Lobby chính xác.
2.  **Xác minh Luật di chuyển**:
    *   Chọn quân Tượng và di chuyển chéo 2 ô; kiểm tra xem Tượng có bị chặn khi có quân đứng ở ô giữa đường chéo không và đảm bảo Tượng không thể đi qua sông.
    *   Chọn quân Mã và kiểm tra cản chân Mã ở các hướng tương ứng.
    *   Chọn quân Pháo và kiểm tra xem có ăn được quân khi có đúng 1 quân làm ngòi không.
    *   Di chuyển thử để hai Tướng đối mặt trực tiếp trên cùng một cột dọc và đảm bảo hệ thống chặn nước đi đó.
3.  **Xác minh AI & Hoàn tác**:
    *   Chọn chế độ PvE, đi thử một vài nước và kiểm tra AI phản hồi đi quân của nó mượt mà.
    *   Bấm nút "Undo" sau khi AI đi cờ để xác nhận bàn cờ quay lại đúng 2 nước (nước đi của player và nước đi của AI) và lượt đi trả về cho player.
4.  **Xác minh Unit Test**:
    *   Chạy lệnh `node test_tuong_logic.js` trên terminal. Đảm bảo toàn bộ 5 test case hoạt động chính xác và in ra thông báo `VERDICT: PASS`.
