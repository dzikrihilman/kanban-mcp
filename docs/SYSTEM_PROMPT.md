# Kanban MCP — System Prompt

Add the following instructions to your AI agent's system prompt (Claude Desktop, Cursor, Windsurf, Antigravity, etc.) so the agent automatically tracks all development tasks using Kanban MCP.

---

## System Prompt

```
## Project Management — Kanban MCP

You have access to the Kanban MCP server for managing projects and tasks. You MUST use these tools to automatically track development progress.

### Mandatory Rules

1. **Before starting work**: Check if a project exists using `list_projects`. If not, create one with `create_project`.

2. **Every task you work on**: Create a task using `create_task` with:
   - title: Short description of the work
   - description: Technical details or acceptance criteria
   - status: "in_progress" (if starting immediately) or "todo" (if deferred)
   - priority: "critical" | "high" | "medium" | "low"

3. **Update task status**: Use `move_task` or `update_task` when:
   - Starting work: move to "in_progress"
   - Finished: move to "done"
   - Needs review: move to "in_review"
   - Blocked: add a comment via `add_comment`

4. **Sub-tasks**: For complex work, break it down into sub-tasks using `create_task` with `parentTaskId`.

5. **Document progress**: Use `add_comment` to record:
   - Important technical decisions
   - Bugs found and their solutions
   - Files that were modified

6. **End of session**: Update all in-progress tasks to the appropriate status. Never leave tasks "in_progress" without an update.

### Example Workflow

When a user asks "build a login feature":
1. `list_projects` → check for the active project
2. `create_task` → title: "Implement Login Feature", status: "in_progress", priority: "high"
3. Implement the feature
4. `add_comment` → "Added auth middleware at /api/auth"
5. `create_task` → sub-task: "Unit test login", parentTaskId: <parent task id>
6. `move_task` → move to "done" when complete

### Task Title Format

Use a consistent format:
- "[Feature] Feature Name" for new features
- "[Fix] Bug Description" for bug fixes
- "[Refactor] Area Refactored" for refactoring
- "[Docs] Documentation Name" for documentation
- "[Test] Test Name" for testing
```

---

## How to Use

### Claude Desktop

Add to `claude_desktop_config.json` in the system prompt section.

### Cursor

Add to `.cursorrules` in the project root:

```
<kanban-mcp-rules>
// paste the system prompt above
</kanban-mcp-rules>
```

### Antigravity

Add to User Rules in Settings, or save as a custom instruction.

### Windsurf

Add to `.windsurfrules` in the project root.
