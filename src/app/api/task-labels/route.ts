/**
 * Task Labels API
 * POST: Assign a label to a task
 * DELETE: Remove a label from a task
 */

import { db } from "@/lib/db";
import { taskLabels } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    await db.insert(taskLabels).values({
      taskId: body.taskId,
      labelId: body.labelId,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to assign label:", error);
    return NextResponse.json(
      { error: "Failed to assign label" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const labelId = searchParams.get("labelId");

    if (!taskId || !labelId) {
      return NextResponse.json(
        { error: "taskId and labelId are required" },
        { status: 400 }
      );
    }

    await db
      .delete(taskLabels)
      .where(
        and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove label:", error);
    return NextResponse.json(
      { error: "Failed to remove label" },
      { status: 500 }
    );
  }
}
