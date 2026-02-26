/**
 * Task Reorder API
 * POST: Reorder tasks within/across columns
 * Body: { taskId, newStatus, newPosition }
 */

import { db } from "@/lib/db";
import { tasks, activityLog } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, newStatus, newPosition } = body;
    const now = new Date().toISOString();

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Shift positions in target column
    await db
      .update(tasks)
      .set({ position: sql`${tasks.position} + 1` })
      .where(
        and(
          eq(tasks.projectId, task.projectId),
          eq(tasks.status, newStatus),
          gte(tasks.position, newPosition)
        )
      );

    // Update the moved task
    const updates: Record<string, unknown> = {
      position: newPosition,
      updatedAt: now,
    };

    if (newStatus !== task.status) {
      updates.status = newStatus;

      await db.insert(activityLog).values({
        id: uuid(),
        taskId: task.id,
        projectId: task.projectId,
        action: "status_changed",
        details: JSON.stringify({
          from: task.status,
          to: newStatus,
          title: task.title,
        }),
        actor: "user",
        createdAt: now,
      });
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder task:", error);
    return NextResponse.json(
      { error: "Failed to reorder task" },
      { status: 500 }
    );
  }
}
