/**
 * Tasks API
 * GET: List tasks for a project (query param: projectId, status, priority)
 * POST: Create a new task
 */

import { db } from "@/lib/db";
import { tasks, taskLabels, labels, comments, activityLog } from "@/lib/db/schema";
import { eq, and, count, sql, asc, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import type { TaskWithLabels } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const conditions = [eq(tasks.projectId, projectId)];
    if (status) {
      conditions.push(
        eq(tasks.status, status as TaskWithLabels["status"])
      );
    }
    if (priority) {
      conditions.push(
        eq(tasks.priority, priority as TaskWithLabels["priority"])
      );
    }

    const allTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.position), desc(tasks.createdAt));

    // Enrich with labels, subtask counts, comment counts
    const enrichedTasks: TaskWithLabels[] = await Promise.all(
      allTasks.map(async (task) => {
        const taskLabelRows = await db
          .select({
            id: labels.id,
            name: labels.name,
            color: labels.color,
          })
          .from(taskLabels)
          .innerJoin(labels, eq(taskLabels.labelId, labels.id))
          .where(eq(taskLabels.taskId, task.id));

        const [subtaskResult] = await db
          .select({
            total: count(tasks.id),
            done: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
          })
          .from(tasks)
          .where(eq(tasks.parentTaskId, task.id));

        const [commentResult] = await db
          .select({ count: count(comments.id) })
          .from(comments)
          .where(eq(comments.taskId, task.id));

        return {
          ...task,
          labels: taskLabelRows,
          subtaskCount: subtaskResult?.total ?? 0,
          subtaskDoneCount: Number(subtaskResult?.done ?? 0),
          commentCount: commentResult?.count ?? 0,
        };
      })
    );

    return NextResponse.json(enrichedTasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const id = uuid();

    // Get max position for the status column
    const [maxPos] = await db
      .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.projectId, body.projectId),
          eq(tasks.status, body.status || "backlog")
        )
      );

    const newTask = {
      id,
      projectId: body.projectId,
      parentTaskId: body.parentTaskId || null,
      title: body.title || "Untitled Task",
      description: body.description || "",
      status: body.status || "backlog",
      priority: body.priority || "medium",
      assignee: body.assignee || null,
      dueDate: body.dueDate || null,
      position: (maxPos?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tasks).values(newTask);

    // Log activity
    await db.insert(activityLog).values({
      id: uuid(),
      taskId: id,
      projectId: body.projectId,
      action: "task_created",
      details: JSON.stringify({ title: newTask.title }),
      actor: "user",
      createdAt: now,
    });

    return NextResponse.json(
      { ...newTask, labels: [], subtaskCount: 0, subtaskDoneCount: 0, commentCount: 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
