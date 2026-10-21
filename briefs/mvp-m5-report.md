# Báo cáo M5 — Tài khoản lớp 3A2

Ngày: 21/10/2026. Chỉ thực hiện M5 trong `briefs/mvp.md`; không làm M4, không tạo nhánh, không commit, không thêm dependency.

## Kết quả triển khai

- `tools/make-class.js <csv> --class 3A2`: dùng `crypto.webcrypto`, PBKDF2/SHA-256 200000 vòng, salt 16 byte mỗi lần tạo và AES-GCM với IV 12 byte riêng từng em. Chỉ ghi JSON sau khi kiểm tra toàn bộ CSV; lỗi không ghi đè file cũ. Log thành công chỉ có số em.
- CSV hỗ trợ BOM UTF-8, dấu phẩy, nháy kép, xuống dòng trong ô; kiểm tra tiêu đề, TT 1–99, trùng TT/username sau chuẩn hoá, mật khẩu ít nhất 6 ký tự và khác username. JSON chỉ có cấu hình KDF, mã học sinh, IV và ciphertext; không lưu username hay hash username.
- Form đăng nhập demo được mở lại. Tài khoản lớp tải `data/class-3a2.json`, suy khoá đúng một lần cho mỗi lượt đăng nhập rồi thử giải mã từng em. Sai trả lỗi 401 “Tên đăng nhập hoặc mật khẩu chưa đúng.” Tài khoản mẫu và tài khoản demo tạo tại máy tiếp tục hoạt động.
- User lớp lưu tại localStorage có id, vai trò, lớp, họ tên và số sao; không có username/mật khẩu. Header và trang chủ chào bằng họ tên qua `textContent`. Thống kê dùng `alias = id` và `classCode`, không đưa họ tên/username vào payload.
- `thong-ke.html` và `schedule.html` có nút “Mở danh sách lớp (CSV)” dùng FileReader, chỉ giữ map mã → tên trong bộ nhớ trang. Tải lại trang sẽ bỏ map. Bảng và CSV tải tại máy ghép họ tên bằng mã; không lưu map vào storage, không gửi danh sách đi. Danh sách API demo trả mã cho tài khoản lớp; giáo viên mở CSV để hiện tên. Bảng schedule bổ sung cả em có trong CSV nhưng chưa có lượt làm trên máy này, không cho đặt lại mật khẩu tài khoản lớp qua web.
- Build chép `data/content/class-*.json` sang `dist/data/`. Sửa thông báo demo để không còn nói “không phải tài khoản thật”. Phần mới dùng chữ ít nhất 18px, nút/input ít nhất 48px; tên do người dùng cung cấp hiển thị bằng DOM text, xuất CSV có xử lý nháy kép và tiền tố công thức.

## Kiểm tra theo log thực tế

| Kiểm tra | Trạng thái | Log / kết quả |
| --- | --- | --- |
| `npm test` | NOT RUN | Đã gọi, exit 1. Node test runner không tạo được tiến trình con: `Error: spawn EPERM`, `errno: -4048`, `code: 'EPERM'`, `syscall: 'spawn'`. Lần cuối báo 12 file lỗi ở bước khởi chạy, chưa chạy nội dung test; không coi là lỗi assertion hay PASS toàn bộ suite. |
| Test cùng tiến trình, lệnh bên dưới | PASS | 68 tests, 68 pass, 0 fail, 0 skipped; exit 0. Gồm 4 test M5 và các test thuần/demo M1–M3. |
| `node --check` tất cả 11 file JS mới/sửa | PASS | Từng lệnh exit 0; danh sách file bên dưới. |
| `node tools/make-class.js test/fixtures/class-fake.csv --class M5-FAKE` | PASS | Exit 0; stdout: `Đã mã hoá 2 em.` |
| `npm run build:demo` | PASS | Exit 0; `Demo build: 15 trang, data/grade3.json, .nojekyll`. |
| Kiểm tra bản build bằng Node | PASS | File lớp giả được chép giống từng byte; JSON không có tên/username/mật khẩu của fixture; 3 trang login/schedule/thong-ke có script classroom và file script tồn tại trong dist. |
| Dọn dữ liệu thử | PASS | Đã xoá đúng hai file tạm `data/content/class-m5-fake.json` và `dist/data/class-m5-fake.json`; không để lớp giả trong build bàn giao. |
| `git diff --check` | PASS | Exit 0. |
| Rà checklist UI bằng mã nguồn | PASS | Phần mới dùng nút thật, nhãn input, trạng thái đọc CSV có `role=status`, chữ có dấu; bảng thống kê cuộn trong vùng riêng. |
| Trình duyệt/Playwright, hai kích thước màn hình | NOT RUN | Theo yêu cầu, dành cho Claude rà sau. Chưa xác nhận trực quan kích thước/không tràn khi tên dài. |
| Tạo và đăng nhập bằng CSV thật | NOT RUN | Theo yêu cầu, chỉ Claude chạy. Không đọc, mở hay liệt kê nội dung `data/taikhoan*.csv`, `data/*.docx`, `data/*.xlsx`. |
| Đăng nhập lớp ở chế độ server / đổi mật khẩu trên web | NOT RUN | Ngoài phạm vi M5, là việc sau. |

Lệnh test đã PASS:

```text
node --test --test-isolation=none test/classroom.test.js test/analytics.test.js test/demo-api.test.js test/m1.test.js test/practice.test.js test/grading.test.js test/adaptive.test.js test/quick-quiz.test.js test/question-view.test.js test/import.test.js
```

Không chạy riêng `test/api.test.js` và `test/practice-api.test.js` bằng lệnh thay thế; cần chạy cả suite ngoài sandbox. Trong lần hồi quy đầu có 1 test FAIL vì tài khoản demo tạo tại máy bị chặn đăng nhập; đã sửa và chạy lại toàn bộ lệnh trên: 68/68 PASS. Một số chuỗi mới bị mất dấu khi truyền script qua PowerShell → Python; đã sửa bằng apply_patch, kiểm tra lại fixture BOM và tiếng Việt bằng test PASS.

## File mới/sửa

11 file JS đã chạy `node --check`:

- `public/assets/js/core/classroom.js` — mới, CSV / crypto / nút mở danh sách cục bộ dùng chung.
- `tools/make-class.js` — mới, CLI tạo file lớp mã hoá.
- `test/classroom.test.js` — mới, kiểm tra CSV, crypto, demo login, payload thống kê, CSV xuất tên và FileReader không storage/network.
- `public/assets/js/core/demo-api.js`.
- `public/assets/js/core/analytics.js`.
- `public/assets/js/components/navbar.js`.
- `public/assets/js/pages/index.js`.
- `public/assets/js/pages/login.js`.
- `public/assets/js/pages/schedule.js`.
- `public/assets/js/pages/thong-ke.js`.
- `tools/build-demo.js`.

Các file khác:

- `test/fixtures/class-fake.csv` — mới, chỉ tên và tài khoản giả, UTF-8 có BOM.
- `public/login.html`.
- `public/schedule.html`.
- `public/thong-ke.html`.
- `briefs/mvp-m5-report.md` — báo cáo này.

Không sửa `data/content/grade3.json`, `original-backup/` hay repo `../hoang-mai-math`. Không sinh `class-3a2.json` từ dữ liệu thật.

## Việc còn lại cho Claude / chủ nhiệm

1. Claude chạy công cụ với CSV thật và `--class 3A2`, sau đó build lại để có `dist/data/class-3a2.json`. Chỉ đưa file mã hoá vào repo/build; CSV thật giữ trên máy.
2. Chạy `npm test` ngoài sandbox; rà đăng nhập, chào họ tên, sai mật khẩu, đăng xuất, mở CSV và xuất CSV trên hai trang giáo viên ở 768×1024 và 1024×768. Kiểm tra giữ điểm/số sao khi đăng nhập lại.
3. Số liệu schedule vẫn là dữ liệu demo trên cùng trình duyệt; số liệu nhiều máy theo tên trên thong-ke cần endpoint thống kê có `students[].alias = id` (hoặc `students[].id`). Không mở rộng Worker/A2 trong M5.
4. Chế độ server và đổi mật khẩu web để task sau. Claude review/commit theo quy trình; chưa mở PR, merge hay deploy.
