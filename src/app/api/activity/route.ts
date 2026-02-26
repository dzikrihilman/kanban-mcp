/**
 * Activity Log API
 * GET: List activity for a task or project
 */

import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "30");

    let query = db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    if (taskId) {
      query = db
        .select()
        .from(activityLog)
        .where(eq(activityLog.taskId, taskId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit);
    } else if (projectId) {
      query = db
        .select()
        .from(activityLog)
        .where(eq(activityLog.projectId, projectId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit);
    }

    const activities = await query;
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
