# AGENTS.md — math3 (Vườn Toán 3)

Web học Toán lớp 3 (bài 9–15, SGK Kết nối tri thức tập một) cho Trường Tiểu học Hoàng Mai. Repo: `fossbk-spec/math3`, gốc từ `anh627/Math5` (tác giả đồng ý). Nội dung câu hỏi nhập từ `fossbk-spec/hoang-mai-math`.
Brief hiện hành: `briefs/mvp-demo.md`.

## Stack
Node ≥ 22, Express 4, better-sqlite3 12, HTML tĩnh + Tailwind (CSS build sẵn `public/assets/css/tailwind.build.css`), JS thuần (không framework, không bundler).

## Lệnh
- `npm start` (http://localhost:3000) · `npm test` (node:test) · `npm run reset-db`
- `node tools/import-hoang-mai.js [../hoang-mai-math]` → `data/content/grade3.json`
- `npm run build:demo` → `dist/` (bản tĩnh cho GitHub Pages) — có sau task T2

## Quy tắc bắt buộc
- **Đúng toán học:** đáp án lấy từ `data/content/grade3.json` (đã do code của hoang-mai-math tính và kiểm). Không tự gõ đáp án mới, không lấy đáp án từ LLM. Câu nhập vào ở `DRAFT`; chỉ giáo viên chuyển `APPROVED`/`REJECTED`.
- **Chấm một chỗ:** logic chấm/chuẩn hoá đáp án dùng chung cho server và bản demo tĩnh (không viết hai lần).
- **Quyền riêng tư trẻ em:** chỉ bí danh + mã lớp (Bạn Cú, Bạn Thỏ…); không họ tên thật, ảnh, ngày sinh. Không gửi dữ liệu học sinh ra dịch vụ ngoài.
- **Bảo mật** (đợt demo: chủ nhiệm cho bỏ qua ngày 16/10, chỉ làm khi brief yêu cầu): escape mọi chuỗi đưa vào `innerHTML`; không tin điểm/thời gian do trình duyệt gửi; không secret mặc định trong code; không commit `.env`, `data/*.db`.
- Giao diện tiếng Việt; chữ học sinh ≥ 18px; vùng chạm ≥ 48px; chạy tốt 768×1024 và 1024×768; font phải có dấu tiếng Việt.
- Không thêm dependency mới nếu brief không cho phép; cần thì ghi vào báo cáo.
- Không đổi `original-backup/` (sẽ xoá ở task riêng), không sửa `data/content/grade3.json` bằng tay — sửa script import rồi chạy lại.
- Trước khi kết thúc: `npm test` pass và `node --check` mọi file JS đã sửa. Báo cáo PASS / FAIL / NOT RUN / BLOCKED theo log thật.

## Skill giao diện (`.claude/skills/`, nguồn: `.claude/skills/SOURCES.md`)
- `ui-ux-pro-max`: `py -3 .claude/skills/ui-ux-pro-max/scripts/search.py "<2–5 từ>" --domain ux` (hoặc `--stack html-tailwind`). Không dùng `--design-system`, `--persist`, `--force`.
- `web-design-guidelines`: checklist rà UI (bản luật cục bộ) trước khi mở PR.
- Kết quả skill chỉ là gợi ý; quy tắc trong file này luôn được ưu tiên.

## Quy trình
Chủ nhiệm duyệt brief → Codex làm trên nhánh → Claude chạy kiểm tra, review, mở PR → chỉ merge khi chủ nhiệm nói **"merge #N"**. Deploy và thay đổi cài đặt GitHub/Cloudflare do chủ nhiệm quyết.
