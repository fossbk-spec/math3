# Bàn giao math3 (cập nhật 21/10/2026 tối)

Đọc cùng `AGENTS.md` và `briefs/mvp.md`. Quy trình giữ nguyên: Codex viết code → Claude kiểm tra ngoài sandbox, review, mở PR → chỉ merge khi chủ nhiệm nói "merge #N".

## Trạng thái
- Bản chạy thật: https://fossbk-spec.github.io/math3/ (GitHub Pages tự deploy khi merge `main`).
- Đã merge: #5 M1 (phiếu bài tập lấy câu từ dữ liệu), #6 M2 (luyện tập thích ứng), #8 M3 (Đố nhanh bảng 6–9), #9 M5 (tài khoản thật lớp 3A2, họ tên mã hoá AES-GCM theo mật khẩu).
- Đang mở:
  - nhánh `fix/login-tablet`: báo lỗi đăng nhập ngay dưới ô mật khẩu (toast ở đáy bị dải thống kê che), tắt tự viết hoa/tự sửa ở ô đăng nhập, thử lại mật khẩu chữ thường. `npm test` 70/70, đã thử trên Edge.
  - #7 (`chore/gitignore-danh-sach-lop`): trùng với `.gitignore` đã merge ở #8 → có thể đóng.
- Tạm hoãn theo chủ nhiệm: M4 (chữ ≥ 18px, vùng chạm ≥ 48px, favicon).
- Chờ chủ nhiệm: A0 (tài khoản Cloudflare + API token) → A2/A4 Worker thống kê thật. Không có A2 thì trang Thống kê chỉ là dữ liệu mẫu và tiến độ chỉ lưu trên từng máy.

## Tài khoản lớp 3A2
- File thật `data/taikhoan3a2_capnhat.csv` (35 em; `TT,Họ và tên,username,password`) **không có trên GitHub** (`.gitignore`). Sang máy khác: chép tay (USB/Drive riêng), không qua git, không dán vào chat.
- Đổi mật khẩu / thêm em: sửa CSV → `node tools/make-class.js data/taikhoan3a2_capnhat.csv --class 3A2` → commit `data/content/class-3a2.json` (chỉ chứa mã + bản mã hoá) → PR.
- Codex không được đọc `data/*.csv`, `data/*.docx`. Kiểm tra lộ tên trước mỗi PR: quét `class-3a2.json` và `dist/` theo họ tên/username/mật khẩu (Claude có script).

## Môi trường
- Node ≥ 22; `npm ci`; `npm test`; `npm run build:css` khi thêm class Tailwind; `npm run build:demo` → `dist/`.
- Codex CLI: tài khoản ChatGPT mới (21/10) dùng được model mặc định `gpt-6.1-sol`. Sandbox Codex chặn `spawn` → `npm test` phải chạy ngoài sandbox. Chạy: `codex exec -c 'windows.sandbox="unelevated"' -s workspace-write -c model_reasoning_effort=medium -o <file> - < prompt.txt`.
- Rà giao diện: Playwright (`playwright-core`, Edge `channel: 'msedge'`) cài ngoài repo; phục vụ `dist/` bằng `python -m http.server 8765`.
- Repo gốc: `anh627/Math5` (1 commit, chưa có gì mới).
