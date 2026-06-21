# AGENTS.md — Team conventions cho ProjectManager runs

> File này được Agent Worker **copy vào root workspace** trước khi chạy `agy`. Nội dung được prepend vào mọi prompt. Giữ ngắn gọn, mang tính ràng buộc.
> Các skill chi tiết theo vai trò nằm trong `agents/` (architect, leader, coder, reviewer, qa).

## Bối cảnh

Workspace này được điều phối bởi **ProjectManager control plane**. Một phiên `agy` orchestrator duy nhất chạy cả pipeline; orchestrator (Leader) tự spin-up subagent native khi cần. Mọi trạng thái/báo cáo đi qua **MCP server** của control plane (cấu hình trong `server-mcp.json`).

## Quy trình bắt buộc (Plan → Build → Verify)

1. (Optional) **Architect** tạo plan chi tiết.
2. **Leader** chia plan thành task items → gọi MCP `update_tasks_md` (tạo `tasks.md` + TaskItems).
3. Với mỗi task item: **Coder** implement → **Reviewer** review → (Coder fix nếu `REVISION_NEEDED`) → **QA** verify → (Coder fix nếu `FAIL`) → đánh dấu `done`.
4. **Leader** kiểm tra cuối + tổng hợp → mở PR (không merge thẳng).
5. Approval gate / deploy do Worker xử lý sau khi nhận report.

## MCP tools — BẮT BUỘC dùng để báo cáo (không in ra stdout thay thế)

| Tool | Khi gọi |
|---|---|
| `get_assigned_task`, `get_project_context` | Đầu run, lấy task & context |
| `update_tasks_md` | Leader sau khi chia task |
| `report_progress` | Mỗi khi chuyển bước / có cập nhật đáng kể (kèm tokens/cost nếu biết) |
| `mark_task_item` | Đổi trạng thái item: pending/coding/review/qa/done/failed |
| `report_review_result` | Reviewer — verdict `APPROVED` \| `REVISION_NEEDED` + notes |
| `report_qa_result` | QA — verdict `PASS` \| `FAIL` + notes |
| `report_run_complete` | Leader cuối run — status + prUrl + summary + tokens + cost |

**Control signal**: verdict phải gửi **qua MCP tool dạng cấu trúc**, KHÔNG để Worker parse văn bản tự do.

## Guardrails (bắt buộc)

- **MAX_ITERATIONS = 3** cho vòng Coder↔Reviewer và Coder↔QA mỗi task item. Chạm trần → `mark_task_item failed` + ghi lý do, KHÔNG lặp vô hạn.
- **Reflection trước mỗi retry**: trả lời ngắn 3 câu — "Cái gì fail? Thay đổi cụ thể nào sẽ fix? Mình có đang lặp lại cùng cách không?" rồi mới sửa.
- **Isolation**: mỗi task item làm việc trong **worktree/branch riêng** (`task/<runId>/<seq>`); KHÔNG sửa file của item khác để tránh đụng độ.
- **Scope**: chỉ thay đổi những gì task yêu cầu; không refactor lan man, không đụng file không liên quan.

## Git & bảo mật

- Branch theo task item; commit nhỏ, **Conventional Commits** (`feat:`, `fix:`, `test:`…).
- **Mở PR, KHÔNG merge/force-push vào nhánh chính.**
- TUYỆT ĐỐI không in/log PAT, token, secret. Không sửa file CI/secret trừ khi task yêu cầu rõ.

## Definition of Done (mỗi task item)

- Code build pass + test liên quan xanh.
- Reviewer `APPROVED` và QA `PASS`.
- `mark_task_item done` đã gọi.
