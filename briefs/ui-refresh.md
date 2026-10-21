# Brief UI — Làm mới giao diện Vườn Toán 3 (gộp M4)

Chủ nhiệm yêu cầu 21/10: "dùng skill trong project hoang-mai-math, sửa lại giao diện cho đẹp và hiện đại". Brief này **gộp M4** (đang tạm hoãn) vì cùng chạm các trang học sinh. Không đổi nghiệp vụ, API, dữ liệu, chấm điểm.

## Hướng thiết kế (từ `ui-ux-pro-max`, đã lọc theo AGENTS.md)

Tra `--domain product "children education app"` → *Kids Learning (ABC & Math)*: **Claymorphism + Vibrant & Block-based**, micro-interaction, "bright primary + child-safe pastels + reward gold". Áp dụng ở mức vừa phải cho lớp 3 (8–9 tuổi), giữ chủ đề "Vườn" xanh lá của trường:

| Token | Giá trị | Ghi chú |
|---|---|---|
| `primary` | `#15803d` (họ xanh lá); chữ trên nền: trắng (≈ 5:1) — không dùng `#16a34a` cho nền có chữ trắng (≈ 3,3:1, không đạt) | màu "Vườn" |
| `primary-ink` | `#14532d` | chữ/viền nhấn, tương phản ≥ 7:1 trên nền sáng |
| `sun` (thưởng) | `#f59e0b`, chữ trên nền: `#0f172a` | sao, điểm, huy hiệu |
| `sky` (tương tác) | `#2563eb` | link, tiến độ, trạng thái đang chọn |
| `berry` (vui) | `#ec4899` | điểm nhấn trò chơi, dùng ít |
| `background` | `#f0fdf4` → thẻ trắng `#ffffff` | nền pastel nhạt |
| `ink` / `muted` | `#0f172a` / `#475569` | chữ chính / phụ |
| `error` | giữ `#ba1a1a` | |

Map các token Material hiện có (`primary`, `secondary`, `tertiary`, `surface-*`, `on-*`) sang bảng trên **trong `public/assets/js/tailwind.config.js`** để không phải sửa hàng trăm class; chỉ đổi class ở chỗ cần hiệu ứng mới.

**Chữ:** `--domain typography` gợi ý Nunito (tròn, có tiếng Việt) cho tiêu đề; **không dùng DM Sans** (thiếu dấu tiếng Việt). Tiêu đề: **Nunito 800**; thân: **Nunito Sans** (đang dùng). Bỏ Quicksand (14 trang) — thay bằng Nunito, một link Google Fonts chung (`display=swap`, subset vietnamese).

**Khối "đất sét" (clay):** thẻ bo `1.5rem`, viền 2–3px màu đậm hơn nền thẻ, bóng kép mềm (`0 6px 0 <màu đậm>` + `0 12px 24px rgb(0 0 0 / .08)`); nút chính dạng "nút bấm 3D" (bóng đáy 4–6px, khi `:active` dịch xuống và bỏ bóng). Định nghĩa một lần trong `app.css` (`.clay-card`, `.clay-btn`, `.clay-btn--sun`, `.clay-btn--sky`, `.chip`) rồi dùng lại.

**Chuyển động:** 150–250 ms, chỉ `transform`/`opacity`; ngôi sao/điểm "nảy" nhẹ khi trả lời đúng; tôn trọng `prefers-reduced-motion` (đã có trong `app.css`). Không nền động liên tục (gợi ý của style gốc bỏ qua vì gây xao nhãng trẻ).

## U1 — Hệ thống thiết kế + khung chung + trang chính

1. `tailwind.config.js`: bảng màu, `fontFamily` (`headline-*` → Nunito), `borderRadius` theo trên. `app.css`: các lớp `clay-*`, `chip`, focus ring dùng `sky` (giữ `outline` 3px).
2. Header/khung chung mọi trang học sinh: logo + tên trường, bí danh + lớp, sao/điểm dạng chip vàng; **chữ ≥ 18px** (hiện 11–13px), vùng chạm ≥ 48px.
3. Làm mới `index.html` (trang chủ học sinh), `login.html`, `lesson.html`, `practice.html`, `exercise.html`, `exam.html`: thẻ bài học dạng clay có số bài lớn + thanh tiến độ; nút chính clay; trạng thái đúng/sai rõ bằng **màu + biểu tượng + chữ** (không chỉ màu).
4. M4: "Quay lại Mục Lục SGK" (`lesson`), nút quay lại `exercise`, link "AI Safe & Smart" ≥ 48px; thêm `public/favicon.ico` từ logo có sẵn trong `public/assets`; dải thông báo thống kê thu thành nút nhỏ sau khi bấm "Đã hiểu" (lưu `localStorage`, bọc try/catch), không che nội dung.
5. `npm run build:css`; `npm run build:demo`.

## U2 — Trò chơi, bảng thành tích, trang giáo viên

1. `game.html`, `game2–4.html`: khung chung, nút "Kết thúc & Lưu điểm" ≥ 48px (hiện 42px), chữ ≥ 18px (`game3`/`game4` có 10–11px), màn kết quả dùng `clay-card` + sao vàng.
2. `leaderboard.html`, `schedule.html`, `ai-safe.html`, `introduce.html`: áp token và thẻ mới. **Không thêm so sánh/xếp hạng học sinh mới.**
3. Trang giáo viên (`thong-ke.html`, phần giáo viên): chỉ áp token màu/chữ, giữ bố cục; sửa footer đang hiện tên icon (`menu_book`, `support_agent`) do thiếu font icon.

## Ràng buộc

- Theo `AGENTS.md`: chữ học sinh ≥ 18px; vùng chạm ≥ 48px; 768×1024 và 1024×768 không tràn ngang; font có dấu tiếng Việt; tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1).
- Không thêm dependency, không framework/bundler mới; chỉ Google Fonts đang dùng (đổi họ font). Không dùng `--design-system`/`--persist`/`--force` của skill.
- Không đổi id/`data-*`/tên hàm mà JS và test dựa vào; không sửa `data/content/*.json`, không đọc `data/*.csv`, `data/*.docx`.
- Trước khi kết thúc: tự rà theo `.claude/skills/web-design-guidelines/SKILL.md`, ghi kết quả vào báo cáo `briefs/ui-refresh-uN-report.md` (PASS / FAIL / NOT RUN theo log thật).

## Kiểm tra (Claude, ngoài sandbox)

`npm test`; `node --check` file JS đã sửa; `npm run build:demo`; chụp Edge 768×1024 và 1024×768 các trang chính trước/sau (Playwright ngoài repo); quét `dist/` không lộ họ tên/username/mật khẩu lớp 3A2. Mỗi task một PR, chỉ merge khi chủ nhiệm nói "merge #N".
