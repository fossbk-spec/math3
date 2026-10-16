# Nguồn skill (.claude/skills)

| Skill | Nguồn | Commit | License | Thay đổi |
|---|---|---|---|---|
| ui-ux-pro-max | github.com/nextlevelbuilder/ui-ux-pro-max-skill (`.claude/skills/ui-ux-pro-max`) | 56ea9cf | MIT | Bỏ `scripts/tests`; đổi lệnh gọi sang `py -3 .claude/skills/...` (không có `CLAUDE_PLUGIN_ROOT`) |
| web-design-guidelines | github.com/vercel-labs/web-interface-guidelines (`command.md`) | 434b7f9 | MIT | Chép luật về máy thay vì WebFetch mỗi lần; thêm mục ưu tiên quy tắc project |

Không cài: các skill khác của ui-ux-pro-max (cần GEMINI_API_KEY/mạng), thư mục `stack/` (MCP `npx @latest`, `enableAllProjectMcpServers`), `webapp-testing` (Python Playwright; project đã có `scripts/screenshots.mjs`).
Cập nhật: chép lại từ commit mới, review diff `scripts/` trước khi merge.
