/**
 * Kanban MCP Server
 * Exposes project/task management tools and resources via Model Context Protocol
 *
 * Tools:
 *  - list_projects, get_project, create_project, update_project, delete_project
 *  - list_tasks, get_task, create_task, update_task, delete_task, move_task
 *  - add_comment, search_tasks, get_dashboard_summary
 *
 * Resources:
 *  - kanban://projects
 *  - kanban://project/{id}
 *  - kanban://project/{id}/tasks
 *  - kanban://task/{id}
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { db, schema } from "./db-client";
import { eq, and, like, count, sql, asc, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const server = new McpServer({
  name: "kanban-mcp",
  version: "1.0.0",
});

// ─── PROJECT TOOLS ────────────────────────────────────────

server.tool(
  "list_projects",
  "List all projects with task counts",
  {},
  async () => {
    const projects = await db
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        description: schema.projects.description,
        repoUrl: schema.projects.repoUrl,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
        taskCount: count(schema.tasks.id),
      })
      .from(schema.projects)
      .leftJoin(
        schema.tasks,
        eq(schema.projects.id, schema.tasks.projectId)
      )
      .groupBy(schema.projects.id)
      .orderBy(schema.projects.createdAt);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_project",
  "Get details of a specific project",
  { projectId: z.string().describe("The project ID") },
  async ({ projectId }) => {
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, projectId),
    });

    if (!project) {
      return {
        content: [{ type: "text" as const, text: "Project not found" }],
        isError: true,
      };
    }

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(project, null, 2) },
      ],
    };
  }
);

server.tool(
  "create_project",
  "Create a new project",
  {
    name: z.string().describe("Project name"),
    description: z.string().optional().describe("Project description"),
    repoUrl: z.string().optional().describe("Repository URL"),
  },
  async ({ name, description, repoUrl }) => {
    const now = new Date().toISOString();
    const id = uuid();

    const newProject = {
      id,
      name,
      description: description || "",
      repoUrl: repoUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.projects).values(newProject);

    return {
      content: [
        {
          type: "text" as const,
          text: `Project "${name}" created with ID: ${id}`,
        },
      ],
    };
  }
);

server.tool(
  "update_project",
  "Update an existing project",
  {
    projectId: z.string().describe("The project ID"),
    name: z.string().optional().describe("New project name"),
    description: z.string().optional().describe("New description"),
    repoUrl: z.string().optional().describe("New repository URL"),
  },
  async ({ projectId, name, description, repoUrl }) => {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (repoUrl !== undefined) updates.repoUrl = repoUrl;

    await db
      .update(schema.projects)
      .set(updates)
      .where(eq(schema.projects.id, projectId));

    return {
      content: [
        { type: "text" as const, text: `Project ${projectId} updated` },
      ],
    };
  }
);

server.tool(
  "delete_project",
  "Delete a project and all its tasks",
  { projectId: z.string().describe("The project ID to delete") },
  async ({ projectId }) => {
    await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
    return {
      content: [
        { type: "text" as const, text: `Project ${projectId} deleted` },
      ],
    };
  }
);

// ─── TASK TOOLS ───────────────────────────────────────────

server.tool(
  "list_tasks",
  "List tasks for a project, optionally filtered by status or priority",
  {
    projectId: z.string().describe("The project ID"),
    status: z
      .enum(["backlog", "todo", "in_progress", "in_review", "done"])
      .optional()
      .describe("Filter by status"),
    priority: z
      .enum(["critical", "high", "medium", "low"])
      .optional()
      .describe("Filter by priority"),
  },
  async ({ projectId, status, priority }) => {
    const conditions = [eq(schema.tasks.projectId, projectId)];
    if (status) conditions.push(eq(schema.tasks.status, status));
    if (priority) conditions.push(eq(schema.tasks.priority, priority));

    const tasks = await db
      .select()
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(asc(schema.tasks.position));

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(tasks, null, 2) },
      ],
    };
  }
);

server.tool(
  "get_task",
  "Get details of a specific task including comments",
  { taskId: z.string().describe("The task ID") },
  async ({ taskId }) => {
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      return {
        content: [{ type: "text" as const, text: "Task not found" }],
        isError: true,
      };
    }

    const taskComments = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.taskId, taskId))
      .orderBy(desc(schema.comments.createdAt));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ ...task, comments: taskComments }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_task",
  "Create a new task in a project",
  {
    projectId: z.string().describe("The project ID"),
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task description"),
    status: z
      .enum(["backlog", "todo", "in_progress", "in_review", "done"])
      .optional()
      .default("backlog")
      .describe("Initial status"),
    priority: z
      .enum(["critical", "high", "medium", "low"])
      .optional()
      .default("medium")
      .describe("Task priority"),
    assignee: z.string().optional().describe("Assignee name"),
    dueDate: z.string().optional().describe("Due date (ISO 8601)"),
    parentTaskId: z.string().optional().describe("Parent task ID for subtasks"),
  },
  async ({ projectId, title, description, status, priority, assignee, dueDate, parentTaskId }) => {
    const now = new Date().toISOString();
    const id = uuid();
    const taskStatus = status || "backlog";

    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${schema.tasks.position}), -1)` })
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.projectId, projectId),
          eq(schema.tasks.status, taskStatus)
        )
      );

    const newTask = {
      id,
      projectId,
      parentTaskId: parentTaskId || null,
      title,
      description: description || "",
      status: taskStatus,
      priority: priority || "medium",
      assignee: assignee || null,
      dueDate: dueDate || null,
      position: (maxPos?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.tasks).values(newTask);

    await db.insert(schema.activityLog).values({
      id: uuid(),
      taskId: id,
      projectId,
      action: "task_created",
      details: JSON.stringify({ title }),
      actor: "mcp-agent",
      createdAt: now,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Task "${title}" created with ID: ${id} in status "${taskStatus}"`,
        },
      ],
    };
  }
);

server.tool(
  "update_task",
  "Update a task's fields (title, description, status, priority, assignee, due date)",
  {
    taskId: z.string().describe("The task ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    status: z
      .enum(["backlog", "todo", "in_progress", "in_review", "done"])
      .optional()
      .describe("New status"),
    priority: z
      .enum(["critical", "high", "medium", "low"])
      .optional()
      .describe("New priority"),
    assignee: z.string().optional().describe("New assignee"),
    dueDate: z.string().optional().describe("New due date (ISO 8601)"),
  },
  async ({ taskId, title, description, status, priority, assignee, dueDate }) => {
    const now = new Date().toISOString();

    const existing = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!existing) {
      return {
        content: [{ type: "text" as const, text: "Task not found" }],
        isError: true,
      };
    }

    const updates: Record<string, unknown> = { updatedAt: now };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignee !== undefined) updates.assignee = assignee;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (priority !== undefined) updates.priority = priority;

    if (status !== undefined && status !== existing.status) {
      updates.status = status;
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(${schema.tasks.position}), -1)` })
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.projectId, existing.projectId),
            eq(schema.tasks.status, status)
          )
        );
      updates.position = (maxPos?.max ?? -1) + 1;

      await db.insert(schema.activityLog).values({
        id: uuid(),
        taskId,
        projectId: existing.projectId,
        action: "status_changed",
        details: JSON.stringify({ from: existing.status, to: status, title: existing.title }),
        actor: "mcp-agent",
        createdAt: now,
      });
    }

    if (priority !== undefined && priority !== existing.priority) {
      await db.insert(schema.activityLog).values({
        id: uuid(),
        taskId,
        projectId: existing.projectId,
        action: "priority_changed",
        details: JSON.stringify({ from: existing.priority, to: priority, title: existing.title }),
        actor: "mcp-agent",
        createdAt: now,
      });
    }

    await db
      .update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, taskId));

    return {
      content: [
        { type: "text" as const, text: `Task "${existing.title}" updated` },
      ],
    };
  }
);

server.tool(
  "delete_task",
  "Delete a task",
  { taskId: z.string().describe("The task ID to delete") },
  async ({ taskId }) => {
    const existing = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (existing) {
      await db.insert(schema.activityLog).values({
        id: uuid(),
        projectId: existing.projectId,
        taskId: null,
        action: "task_deleted",
        details: JSON.stringify({ title: existing.title }),
        actor: "mcp-agent",
        createdAt: new Date().toISOString(),
      });
    }

    await db.delete(schema.tasks).where(eq(schema.tasks.id, taskId));

    return {
      content: [
        { type: "text" as const, text: `Task ${taskId} deleted` },
      ],
    };
  }
);

server.tool(
  "move_task",
  "Move a task to a different status column",
  {
    taskId: z.string().describe("The task ID"),
    newStatus: z
      .enum(["backlog", "todo", "in_progress", "in_review", "done"])
      .describe("Target status column"),
  },
  async ({ taskId, newStatus }) => {
    const now = new Date().toISOString();
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, taskId),
    });

    if (!task) {
      return {
        content: [{ type: "text" as const, text: "Task not found" }],
        isError: true,
      };
    }

    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${schema.tasks.position}), -1)` })
      .from(schema.tasks)
      .where(
        and(
          eq(schema.tasks.projectId, task.projectId),
          eq(schema.tasks.status, newStatus)
        )
      );

    await db
      .update(schema.tasks)
      .set({
        status: newStatus,
        position: (maxPos?.max ?? -1) + 1,
        updatedAt: now,
      })
      .where(eq(schema.tasks.id, taskId));

    await db.insert(schema.activityLog).values({
      id: uuid(),
      taskId,
      projectId: task.projectId,
      action: "status_changed",
      details: JSON.stringify({ from: task.status, to: newStatus, title: task.title }),
      actor: "mcp-agent",
      createdAt: now,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: `Task "${task.title}" moved from "${task.status}" to "${newStatus}"`,
        },
      ],
    };
  }
);

server.tool(
  "add_comment",
  "Add a comment to a task",
  {
    taskId: z.string().describe("The task ID"),
    content: z.string().describe("Comment text"),
    author: z.string().optional().default("mcp-agent").describe("Comment author"),
  },
  async ({ taskId, content, author }) => {
    const now = new Date().toISOString();
    const id = uuid();

    await db.insert(schema.comments).values({
      id,
      taskId,
      content,
      author: author || "mcp-agent",
      createdAt: now,
      updatedAt: now,
    });

    return {
      content: [
        { type: "text" as const, text: `Comment added to task ${taskId}` },
      ],
    };
  }
);

server.tool(
  "search_tasks",
  "Search tasks by keyword across all projects",
  {
    query: z.string().describe("Search keyword"),
    projectId: z.string().optional().describe("Limit search to a specific project"),
  },
  async ({ query, projectId }) => {
    const conditions = [
      like(schema.tasks.title, `%${query}%`),
    ];
    if (projectId) {
      conditions.push(eq(schema.tasks.projectId, projectId));
    }

    const results = await db
      .select()
      .from(schema.tasks)
      .where(and(...conditions))
      .orderBy(desc(schema.tasks.updatedAt))
      .limit(20);

    return {
      content: [
        {
          type: "text" as const,
          text: results.length > 0
            ? JSON.stringify(results, null, 2)
            : `No tasks found matching "${query}"`,
        },
      ],
    };
  }
);

server.tool(
  "get_dashboard_summary",
  "Get an overview of all projects and tasks with statistics",
  {},
  async () => {
    const [projectCount] = await db
      .select({ count: count(schema.projects.id) })
      .from(schema.projects);

    const [taskCount] = await db
      .select({ count: count(schema.tasks.id) })
      .from(schema.tasks);

    const statusCounts = await db
      .select({
        status: schema.tasks.status,
        count: count(schema.tasks.id),
      })
      .from(schema.tasks)
      .groupBy(schema.tasks.status);

    const priorityCounts = await db
      .select({
        priority: schema.tasks.priority,
        count: count(schema.tasks.id),
      })
      .from(schema.tasks)
      .groupBy(schema.tasks.priority);

    const recentActivities = await db
      .select()
      .from(schema.activityLog)
      .orderBy(desc(schema.activityLog.createdAt))
      .limit(10);

    const summary = {
      totalProjects: projectCount?.count ?? 0,
      totalTasks: taskCount?.count ?? 0,
      tasksByStatus: Object.fromEntries(
        statusCounts.map((s) => [s.status, s.count])
      ),
      tasksByPriority: Object.fromEntries(
        priorityCounts.map((p) => [p.priority, p.count])
      ),
      recentActivity: recentActivities,
    };

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(summary, null, 2) },
      ],
    };
  }
);

// ─── RESOURCES ────────────────────────────────────────────

server.resource(
  "projects-list",
  "kanban://projects",
  { title: "All Projects", description: "List of all projects", mimeType: "application/json" },
  async (uri) => {
    const projects = await db.select().from(schema.projects);
    return {
      contents: [{ uri: uri.href, text: JSON.stringify(projects, null, 2) }],
    };
  }
);

server.resource(
  "project-detail",
  new ResourceTemplate("kanban://project/{id}", {
    list: async () => {
      const projects = await db.select().from(schema.projects);
      return {
        resources: projects.map((p) => ({
          uri: `kanban://project/${p.id}`,
          name: p.name,
        })),
      };
    },
  }),
  { title: "Project Detail", description: "Details of a specific project", mimeType: "application/json" },
  async (uri, { id }) => {
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id as string),
    });
    return {
      contents: [
        {
          uri: uri.href,
          text: project ? JSON.stringify(project, null, 2) : "Project not found",
        },
      ],
    };
  }
);

server.resource(
  "project-tasks",
  new ResourceTemplate("kanban://project/{id}/tasks", {
    list: async () => {
      const projects = await db.select().from(schema.projects);
      return {
        resources: projects.map((p) => ({
          uri: `kanban://project/${p.id}/tasks`,
          name: `${p.name} - Tasks`,
        })),
      };
    },
  }),
  { title: "Project Tasks", description: "Tasks for a specific project", mimeType: "application/json" },
  async (uri, { id }) => {
    const tasks = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, id as string))
      .orderBy(asc(schema.tasks.position));
    return {
      contents: [{ uri: uri.href, text: JSON.stringify(tasks, null, 2) }],
    };
  }
);

server.resource(
  "task-detail",
  new ResourceTemplate("kanban://task/{id}", {
    list: async () => {
      const tasks = await db.select().from(schema.tasks).limit(50);
      return {
        resources: tasks.map((t) => ({
          uri: `kanban://task/${t.id}`,
          name: t.title,
        })),
      };
    },
  }),
  { title: "Task Detail", description: "Details of a specific task", mimeType: "application/json" },
  async (uri, { id }) => {
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id as string),
    });
    const taskComments = task
      ? await db
          .select()
          .from(schema.comments)
          .where(eq(schema.comments.taskId, id as string))
      : [];
    return {
      contents: [
        {
          uri: uri.href,
          text: task
            ? JSON.stringify({ ...task, comments: taskComments }, null, 2)
            : "Task not found",
        },
      ],
    };
  }
);

// ─── START SERVER ─────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kanban MCP server started on stdio");
}

main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
