/**
 * Single Task API
 * GET: Get task by ID
 * PATCH: Update task (status, priority, title, etc.)
 * DELETE: Delete task
 */

import { db } from "@/lib/db";
import { tasks, activityLog } from "@/lib/db/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const existing = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Handle status change (reposition)
    if (body.status && body.status !== existing.status) {
      const [maxPos] = await db
        .select({ max: sql<number>`COALESCE(MAX(${tasks.position}), -1)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, existing.projectId),
            eq(tasks.status, body.status)
          )
        );
      body.position = (maxPos?.max ?? -1) + 1;

      // Log status change
      await db.insert(activityLog).values({
        id: uuid(),
        taskId: id,
        projectId: existing.projectId,
        action: "status_changed",
        details: JSON.stringify({
          from: existing.status,
          to: body.status,
          title: existing.title,
        }),
        actor: "user",
        createdAt: now,
      });
    }

    // Log other notable changes
    if (body.priority && body.priority !== existing.priority) {
      await db.insert(activityLog).values({
        id: uuid(),
        taskId: id,
        projectId: existing.projectId,
        action: "priority_changed",
        details: JSON.stringify({
          from: existing.priority,
          to: body.priority,
          title: existing.title,
        }),
        actor: "user",
        createdAt: now,
      });
    }

    await db
      .update(tasks)
      .set({ ...body, updatedAt: now })
      .where(eq(tasks.id, id));

    const updated = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existing = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (existing) {
      await db.insert(activityLog).values({
        id: uuid(),
        projectId: existing.projectId,
        taskId: null,
        action: "task_deleted",
        details: JSON.stringify({ title: existing.title }),
        actor: "user",
        createdAt: new Date().toISOString(),
      });
    }

    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
