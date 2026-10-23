# Báo cáo tài khoản học sinh dùng thử — 23/10/2026

Đã thêm `hocsinh / 123456`, bí danh **Bạn Dùng Thử**, vai trò `student`, lớp `DEMO`.

## File đã sửa

- `public/assets/js/core/demo-api.js`: người dùng mẫu thứ ba, id số 3 trên demo mới; kiểm tra đúng mật khẩu như `hocsinh01`. Với bộ nhớ demo cũ, bổ sung tài khoản bằng id số còn trống, giữ tiến độ và tài khoản đã tạo. Nhận diện tài khoản mẫu theo username để tránh đụng id cũ. Giữ nguyên PBKDF2 của giáo viên và luồng đăng nhập lớp 3A2.
- `data/seed.json`: thêm tài khoản ở cuối danh sách, giữ thứ tự/id của tài khoản mẫu cũ. Dùng trường `password` theo định dạng hiện có; `server/db.js` băm bcrypt cost 10 khi bảng users trống. Không bổ sung tài khoản vào DB đã có người dùng.
- `public/assets/js/pages/login.js`: dòng “Tài khoản dùng thử: hocsinh / 123456”, cỡ chữ 18px, chỉ tạo khi `MATH_DEMO === true`.
- `test/demo-api.test.js`: demo mới, đúng/sai/thiếu mật khẩu, không chấp nhận khoảng trắng cuối; kiểm tra lại `hocsinh01`.
- `test/classroom.test.js`: bộ nhớ demo cũ có id 3 đã dùng; đăng nhập tài khoản thử, giữ dữ liệu, thống kê `classCode: 'DEMO'`; kiểm tra lại 3A2 và giáo viên. Dữ liệu lớp trong test là fixture giả tại `test/fixtures/`.
- `test/api.test.js`: đăng nhập server đúng cho tài khoản thử và kiểm tra `/auth/me`; mật khẩu sai/rỗng/thừa khoảng trắng trả 401 cho cả `hocsinh`, `hocsinh01`, `giaovien01`. Giữ kiểm tra đăng nhập đúng của hai tài khoản cũ.
- `briefs/tai-khoan-hocsinh-report.md`: báo cáo này.

Thống kê hiện đã lấy `classCode` từ `user.className`, nên không cần sửa `analytics.js`. Test dùng sendBeacon giả, không gửi dữ liệu ra ngoài. Giáo viên demo vẫn cần mật khẩu khớp mã băm PBKDF2 hiện có; giáo viên server giữ cơ chế seed/bcrypt hiện hành.

## Kết quả kiểm tra thực tế

| Trạng thái | Kiểm tra | Log/kết quả |
| --- | --- | --- |
| NOT RUN | Toàn bộ suite qua `npm test` | Lệnh exit 1; runner báo 15 file fail vì `Error: spawn EPERM`, `errno: -4048`, `syscall: 'spawn'`. Các test chưa được thực thi; không kết luận suite PASS. |
| PASS | `node --test --test-isolation=none test/demo-api.test.js test/classroom.test.js test/analytics.test.js` | `tests 14`, `pass 14`, `fail 0`, exit 0. Bao gồm đúng/sai mật khẩu demo, lớp 3A2, giáo viên, bộ nhớ cũ và mã lớp thống kê. |
| PASS | Kiểm tra HTTP server trong cùng tiến trình (`PowerShell here-string` truyền vào `node`) | SQLite `:memory:`, Express JSON + `attachUser(db)` + router thật, secret giả. Cả ba tài khoản đều đăng nhập đúng, ba mật khẩu không hợp lệ trả 401, `/auth/me` trả đúng người dùng, hash bcrypt cost 10; exit 0. |
| PASS | `node --check` | Exit 0 cho cả 5 file JS sửa: `demo-api.js`, `login.js`, `api.test.js`, `classroom.test.js`, `demo-api.test.js`. |
| PASS | `git diff --check` | Exit 0. |
| NOT RUN | Trình duyệt, kích thước màn hình và build demo | Không mở trình duyệt theo yêu cầu; chưa chạy build. Claude kiểm tra giao diện sau. |

Log kiểm tra HTTP server cuối cùng:

```text
[DB] Đã nạp tài khoản mẫu từ data/seed.json
PASS server hocsinh: correct password, 3 invalid passwords, auth/me, bcrypt cost 10
PASS server hocsinh01: correct password, 3 invalid passwords, auth/me, bcrypt cost 10
PASS server giaovien01: correct password, 3 invalid passwords, auth/me, bcrypt cost 10
```

Hai lần chạy script kiểm tra HTTP tạm ban đầu FAIL do chính script: PowerShell truyền literal tiếng Việt thành `B?n D?ng Th?`, rồi thiếu middleware `attachUser` khiến `/auth/me` trả 401. Đã sửa script kiểm tra (đọc bí danh từ seed UTF-8, thêm middleware đúng như server) và chạy lại PASS như log trên; không thay đổi mã server để xử lý hai lỗi script này.

Không thêm dependency, không tạo nhánh/commit, không đọc hoặc sửa `data/*.csv`, `data/*.docx`, `.env`; không sửa DB thật hay nội dung toán học.
