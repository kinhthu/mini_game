# Kế Hoạch Chi Tiết: Thêm Icon Động Dễ Thương Ở Góc Trái Trên (Mini Game)

Tài liệu này hướng dẫn chi tiết các bước để thêm một linh vật hoạt hình dễ thương – **Soot Sprite (Susuwatari - Bụi than tinh nghịch từ Ghibli)** ôm một viên kẹo sao **Konpeito** lấp lánh ở góc trên bên trái của giao diện Mini Game. 

Linh vật này sẽ có hiệu ứng tự động chuyển động liếc mắt, nhún nhảy bay bổng nhẹ nhàng, và khi click/hover sẽ hiển thị bong bóng thoại dễ thương kèm hiệu ứng pháo hoa hạt kẹo sao Konpeito bắn ra xung quanh.

---

## 1. Phân Tích & Ý Tưởng Thiết Kế

1. **Hình tượng Mascot:** Soot Sprite được vẽ bằng SVG vector tự nhiên, màu đen xám bóng mờ với đôi mắt to tròn lấp lánh cực kỳ dễ thương và má hồng hào, trên tay ôm một viên kẹo sao Konpeito màu vàng.
2. **Hiệu ứng động (Animations):**
   - **Tự động bay bổng (Idle Float):** Mascot sẽ tự động nhấp nhô nhẹ nhàng và xoay nhẹ (float & wiggle) theo nhịp thở.
   - **Tự động liếc mắt (Look-around):** Con ngươi mắt của Soot Sprite sẽ đảo nhẹ sang trái, phải, lên trên rồi trở về trung tâm sau vài giây để tạo cảm giác sinh động có hồn.
   - **Hiệu ứng Nhảy nhót (Pop & Bounce on Click):** Khi được nhấp chuột, mascot sẽ nhún mạnh và xoay nhẹ một góc, đồng thời bong bóng thoại sẽ rung rinh.
   - **Hạt kẹo sao Konpeito (Star Particles):** Mỗi cú nhấp chuột sẽ bắn ra 8 hạt kẹo sao nhỏ rực rỡ sắc màu (vàng, hồng, xanh lam, xanh lá, tím) bay toả ra từ trung tâm rồi mờ dần đi.
3. **Bong bóng thoại tương tác (Speech Bubble):**
   - Gợi ý những lời động viên cực kỳ đáng yêu bằng cả tiếng Việt lẫn tiếng Anh mang đậm phong cách Ghibli (ví dụ: *"Cố lên nào! 🌸"*, *"Konpeito ngon quá! ✨"*, *"Totoro đang cổ vũ bạn đó! 🌳"*).
   - Xuất hiện mượt mà khi di chuột vào hoặc khi được click chuột.
4. **Tính tương thích responsive (Mobile-friendly):**
   - Trên màn hình lớn, kích thước mascot là `65px`.
   - Trên màn hình nhỏ (`max-width: 600px`), mascot tự động thu nhỏ (khoảng `45px`) và dịch sát mép góc trái hơn (`top: 0.75rem`, `left: 0.75rem`) để tránh hoàn toàn việc che khuất tiêu đề hay các chỉ số game.

---

## 2. Các Bước Thực Hiện Chi Tiết

### Bước 1: Thêm Giao Diện HTML (`index.html`)

Chèn cấu trúc HTML của Mascot vào đầu thẻ `<body>` (ngay trên `.game-container`).

* **File:** [index.html](file:///D:/workspace/supperseo2018/MiniGame/index.html)
* **Vị trí chèn:** Ngay sau dòng `<body>` (dòng 10-11).
* **Mã HTML mẫu:**
  ```html
  <!-- Mascot Soot Sprite Dễ Thương -->
  <div class="soot-sprite-container" id="cute-mascot">
      <div class="speech-bubble" id="mascot-speech">Ganbare! 🍀</div>
      <svg class="soot-sprite" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- Các gai bụi than -->
          <path d="M 50 12 L 44 26 L 31 16 L 38 31 L 18 24 L 32 40 L 12 42 L 30 50 L 14 60 L 32 61 L 22 76 L 39 71 L 34 87 L 48 78 L 50 94 L 56 78 L 70 87 L 65 71 L 82 76 L 72 61 L 90 60 L 74 50 L 92 42 L 72 40 L 86 24 L 66 31 L 73 16 L 60 26 Z" fill="#2d2d2d" />
          <circle cx="53" cy="51" r="28" fill="#1e1e1e" />
          
          <!-- Đôi mắt to tròn -->
          <circle cx="43" cy="46" r="9.5" fill="#ffffff" />
          <circle cx="63" cy="46" r="9.5" fill="#ffffff" />
          
          <!-- Con ngươi màu đen chuyển động được -->
          <circle class="pupil-left" cx="44" cy="46" r="4.5" fill="#000000" />
          <circle class="pupil-right" cx="62" cy="46" r="4.5" fill="#000000" />
          
          <!-- Má hồng đáng yêu -->
          <ellipse cx="34" cy="56" rx="4" ry="2" fill="#f472b6" opacity="0.7" />
          <ellipse cx="72" cy="56" rx="4" ry="2" fill="#f472b6" opacity="0.7" />

          <!-- Viên kẹo sao Konpeito ôm bên hông -->
          <g transform="translate(68, 62) scale(0.9)">
              <polygon points="15,0 19,9 29,10 21,17 24,26 15,21 6,26 9,17 1,10 11,9" fill="#fde047" stroke="#facc15" stroke-width="1"/>
          </g>
      </svg>
  </div>
  ```

---

### Bước 2: Thêm Định Dạng CSS (`style.css`)

Thêm các thuộc tính CSS cho Mascot, Bong bóng thoại, Hiệu ứng hạt lấp lánh và các chuyển động động ở cuối file CSS.

* **File:** [style.css](file:///D:/workspace/supperseo2018/MiniGame/style.css)
* **Nội dung CSS cần bổ sung:**
  ```css
  /* ==========================================
     CUTE MASCOT & INTERACTIONS (GHIBLI STYLE)
     ========================================== */
  .soot-sprite-container {
      position: fixed;
      top: 1.5rem;
      left: 1.5rem;
      z-index: 90;
      width: 65px;
      height: 65px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      user-select: none;
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .soot-sprite-container:hover {
      transform: scale(1.1);
  }

  .soot-sprite {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
      animation: float-and-wiggle 4s infinite ease-in-out;
  }

  /* Con ngươi mắt tự động đảo quanh */
  .pupil-left, .pupil-right {
      transform-origin: center;
      animation: look-around 8s infinite ease-in-out;
  }

  /* Bong bóng hội thoại nhỏ xinh */
  .speech-bubble {
      position: absolute;
      bottom: -45px;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-main);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.75rem;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px) scale(0.9);
      transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                  transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 600;
      letter-spacing: 0.5px;
  }

  .speech-bubble::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 0 6px 6px 6px;
      border-style: solid;
      border-color: transparent transparent rgba(15, 23, 42, 0.85) transparent;
  }

  /* Kích hoạt bong bóng thoại khi Hover hoặc Active */
  .soot-sprite-container:hover .speech-bubble,
  .soot-sprite-container.active .speech-bubble {
      opacity: 1;
      transform: translateY(0) scale(1);
  }

  /* Hiệu ứng nảy mạnh khi click */
  .soot-sprite-container.pop-active {
      animation: pop-bounce 0.4s ease-out;
  }

  /* Hạt kẹo sao Konpeito pháo hoa */
  .konpeito-particle {
      position: fixed;
      pointer-events: none;
      z-index: 100;
      width: 14px;
      height: 14px;
      background-color: var(--particle-color);
      clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
      animation: particle-burst 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  /* KEYFRAMES ANIMATIONS */
  @keyframes float-and-wiggle {
      0%, 100% {
          transform: translateY(0) rotate(-2deg);
      }
      50% {
          transform: translateY(-6px) rotate(3deg);
      }
  }

  @keyframes look-around {
      0%, 12%, 88%, 100% {
          transform: translate(0, 0);
      }
      15%, 35% {
          transform: translate(-1.5px, 0.5px);
      }
      40%, 60% {
          transform: translate(1.5px, -0.5px);
      }
      65%, 85% {
          transform: translate(0, -1px);
      }
  }

  @keyframes pop-bounce {
      0% { transform: scale(1); }
      30% { transform: scale(0.85) translateY(4px); }
      60% { transform: scale(1.2) translateY(-8px) rotate(8deg); }
      100% { transform: scale(1); }
  }

  @keyframes particle-burst {
      0% {
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
      }
      100% {
          transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot));
          opacity: 0;
      }
  }

  /* Tự động thu gọn trên Mobile */
  @media (max-width: 600px) {
      .soot-sprite-container {
          top: 0.75rem;
          left: 0.75rem;
          width: 45px;
          height: 45px;
      }
      .speech-bubble {
          font-size: 0.65rem;
          bottom: -38px;
          padding: 0.3rem 0.6rem;
      }
  }
  ```

---

### Bước 3: Thêm Logic Tương Tác JavaScript (`main.js`)

Bổ sung các hàm tương tác cho Mascot ở cuối file JavaScript.

* **File:** [main.js](file:///D:/workspace/supperseo2018/MiniGame/main.js)
* **Nội dung JS cần bổ sung:**
  ```javascript
  // ==========================================
  // CUTE MASCOT INTERACTIVE LOGIC
  // ==========================================
  const mascot = document.getElementById('cute-mascot');
  const speechBubble = document.getElementById('mascot-speech');

  // Danh sách những câu nói dễ thương
  const mascotQuotes = [
      "Cố lên bạn ơi! 🌸",
      "Tìm cặp trùng đi nào! ⭐",
      "Kẹo Konpeito ngon quá! ✨",
      "Tớ là Soot Sprite nè! 🐾",
      "Totoro đang cổ vũ bạn đó! 🌳",
      "Chơi thật vui vẻ nhé! 🍀",
      "Bạn chơi đỉnh quá đi! 🎉",
      "Hãy tập trung nào! 🕯️",
      "Có đói bụng không? 🍵",
      "Tuyệt vời ông mặt trời! ☀️"
  ];

  // Hàm chọn câu thoại ngẫu nhiên
  function showRandomQuote() {
      const randomIndex = Math.floor(Math.random() * mascotQuotes.length);
      speechBubble.textContent = mascotQuotes[randomIndex];
  }

  // Hàm tạo hiệu ứng hạt kẹo bay tung toé
  function createKonpeitoParticles() {
      const rect = mascot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Bảng màu pastel kẹo Konpeito dễ thương
      const colors = ['#fde047', '#f472b6', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'];
      
      for (let i = 0; i < 8; i++) {
          const particle = document.createElement('div');
          particle.classList.add('konpeito-particle');
          
          // Tính hướng bay ngẫu nhiên vòng tròn
          const angle = Math.random() * Math.PI * 2;
          const distance = 40 + Math.random() * 60;
          const tx = Math.cos(angle) * distance;
          const ty = Math.sin(angle) * distance;
          const rot = 180 + Math.random() * 360;
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          particle.style.setProperty('--tx', `${tx}px`);
          particle.style.setProperty('--ty', `${ty}px`);
          particle.style.setProperty('--rot', `${rot}deg`);
          particle.style.setProperty('--particle-color', color);
          
          // Đặt toạ độ xuất phát từ tâm Mascot
          particle.style.left = `${centerX - 7}px`;
          particle.style.top = `${centerY - 7}px`;
          
          document.body.appendChild(particle);
          
          // Tự động xoá hạt sau khi hiệu ứng kết thúc
          setTimeout(() => {
              particle.remove();
          }, 700);
      }
  }

  // Lắng nghe sự kiện click mascot
  if (mascot) {
      mascot.addEventListener('click', () => {
          // Hiệu ứng nhảy
          mascot.classList.remove('pop-active');
          void mascot.offsetWidth; // Trigger reflow để restart animation
          mascot.classList.add('pop-active');
          
          // Thay đổi câu thoại
          showRandomQuote();
          
          // Bắn kẹo sao
          createKonpeitoParticles();
      });
      
      // Đổi câu thoại mỗi khi hover chuột qua
      mascot.addEventListener('mouseenter', () => {
          showRandomQuote();
      });
  }
  ```

---

## 3. Quy Trình Kiểm Thử & Tinh Chỉnh

1. **Kiểm tra độ phản hồi (Responsiveness):** Co giãn chiều rộng trình duyệt về dưới `600px` và kiểm tra xem Mascot có tự động scale nhỏ lại không. Đảm bảo nó nằm gọn gàng bên góc trái trên và không che lấp chữ "Memory Match" trong tiêu đề.
2. **Kiểm tra tương tác chuột:** Hover chuột vào để thấy Bong bóng thoại xuất hiện. Click liên tục vào Mascot để kiểm tra hiệu ứng nhảy và pháo hoa kẹo sao bay tung toé mượt mờ.
3. **Kiểm tra console:** Đảm bảo không phát sinh bất kỳ lỗi Javascript nào liên quan đến sự kiện click hay toạ độ màn hình.
