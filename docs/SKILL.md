---
name: kanban-mcp
description: Manage development projects and tasks using the Kanban MCP server. Use when starting a new task, tracking progress, creating sub-tasks, adding comments, or updating task status. Activates on keywords like task, project, kanban, track, progress, todo, backlog, sprint.
---

# Kanban MCP Skill

Use this skill to automatically manage development projects and tasks through the Kanban MCP server.

## When to Use

- When starting new work (create a task)
- When finishing work (update status to done)
- When the user asks to track progress
- When breaking complex work into sub-tasks
- When recording technical decisions (add comment)

## Available Tools

### Project Management

- `list_projects` — List all projects
- `get_project` — Project details
- `create_project` — Create a new project (name, description, repoUrl)
- `update_project` — Update project fields
- `delete_project` — Delete a project

### Task Management

- `list_tasks` — List tasks (filter: projectId, status, priority)
- `get_task` — Task details with comments
- `create_task` — Create task (projectId, title, description, status, priority, parentTaskId)
- `update_task` — Update task fields
- `delete_task` — Delete a task
- `move_task` — Move task to a new status

### Utility

- `add_comment` — Add a comment to a task (taskId, content, author)
- `search_tasks` — Search tasks by keyword
- `get_dashboard_summary` — Dashboard summary (totals, status, priority, activity)

## Valid Statuses

| Status        | Description               |
| ------------- | ------------------------- |
| `backlog`     | Not yet scheduled         |
| `todo`        | Ready to be worked on     |
| `in_progress` | Currently being worked on |
| `in_review`   | Waiting for review        |
| `done`        | Completed                 |

## Valid Priorities

| Priority   | Description                  |
| ---------- | ---------------------------- |
| `critical` | Must be resolved immediately |
| `high`     | Important, top priority      |
| `medium`   | Normal                       |
| `low`      | Can be deferred              |

## Standard Workflows

### 1. Starting New Work

```
1. list_projects → find the appropriate project
2. If none exists → create_project(name, description)
3. create_task(projectId, title, description, status: "in_progress", priority)
4. Implement the work
5. add_comment(taskId, "Details of changes made")
6. move_task(taskId, "done") when complete
```

### 2. Complex Work (with Sub-tasks)

```
1. create_task → main task with status "in_progress"
2. create_task(parentTaskId: <main id>) → sub-task 1
3. create_task(parentTaskId: <main id>) → sub-task 2
4. Complete sub-tasks one by one → move_task to "done"
5. After all sub-tasks are done → move_task parent to "done"
```

### 3. Bug Fix

```
1. create_task(title: "[Fix] Bug description", priority: "high", status: "in_progress")
2. add_comment → root cause analysis
3. Fix the bug
4. add_comment → solution applied
5. move_task → "done"
```

### 4. Review Progress

```
1. get_dashboard_summary → overview
2. list_tasks(projectId, status: "in_progress") → tasks in progress
3. list_tasks(projectId, status: "todo") → tasks not yet started
```

## Important Rules

1. **ALWAYS** create a task before starting work
2. **ALWAYS** update task status when finished
3. **NEVER** leave tasks "in_progress" without an update at the end of a session
4. Use `add_comment` to record technical decisions, not just in chat
5. Break large work into sub-tasks so progress is measurable
6. Use consistent title formats: `[Feature]`, `[Fix]`, `[Refactor]`, `[Docs]`, `[Test]`
