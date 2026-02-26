/**
 * Analytics API
 * GET: Return extended analytics data (completion trends, avg time, velocity)
 */

import { db } from "@/lib/db";
import { tasks, activityLog, projects } from "@/lib/db/schema";
import { count, eq, sql, desc, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    // Tasks created per day (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const since = fourteenDaysAgo.toISOString();

    const conditions = projectId
      ? and(gte(tasks.createdAt, since), eq(tasks.projectId, projectId))
      : gte(tasks.createdAt, since);

    const createdTrend = await db
      .select({
        date: sql<string>`date(${tasks.createdAt})`.as("date"),
        count: count(tasks.id),
      })
      .from(tasks)
      .where(conditions)
      .groupBy(sql`date(${tasks.createdAt})`)
      .orderBy(sql`date(${tasks.createdAt})`);

    // Tasks completed per day (last 14 days) - from activity log
    const completionConditions = projectId
      ? and(
          gte(activityLog.createdAt, since),
          eq(activityLog.action, "status_changed"),
          eq(activityLog.projectId, projectId)
        )
      : and(
          gte(activityLog.createdAt, since),
          eq(activityLog.action, "status_changed")
        );

    const completedTrend = await db
      .select({
        date: sql<string>`date(${activityLog.createdAt})`.as("date"),
        count: count(activityLog.id),
      })
      .from(activityLog)
      .where(completionConditions)
      .groupBy(sql`date(${activityLog.createdAt})`)
      .orderBy(sql`date(${activityLog.createdAt})`);

    // Tasks per project
    const tasksPerProject = await db
      .select({
        projectId: tasks.projectId,
        projectName: projects.name,
        total: count(tasks.id),
        done: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' THEN 1 ELSE 0 END)`,
        inProgress: sql<number>`SUM(CASE WHEN ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .groupBy(tasks.projectId);

    // Recent completions (last 10 done tasks)
    const recentCompletions = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.action, "status_changed"))
      .orderBy(desc(activityLog.createdAt))
      .limit(10);

    // Filter only status changes TO done
    const doneCompletions = recentCompletions.filter((a) => {
      try {
        const details = JSON.parse(a.details || "{}");
        return details.to === "done";
      } catch {
        return false;
      }
    });

    return NextResponse.json({
      createdTrend,
      completedTrend,
      tasksPerProject,
      recentCompletions: doneCompletions,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
