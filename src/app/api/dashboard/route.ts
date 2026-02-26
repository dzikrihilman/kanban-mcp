/**
 * Dashboard Summary API
 * GET: Returns aggregated stats for the dashboard
 */

import { db } from "@/lib/db";
import { projects, tasks, activityLog } from "@/lib/db/schema";
import { count, eq, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { DashboardSummary } from "@/types";

export async function GET() {
  try {
    const [projectCount] = await db
      .select({ count: count(projects.id) })
      .from(projects);

    const [taskCount] = await db
      .select({ count: count(tasks.id) })
      .from(tasks);

    const statusCounts = await db
      .select({
        status: tasks.status,
        count: count(tasks.id),
      })
      .from(tasks)
      .groupBy(tasks.status);

    const priorityCounts = await db
      .select({
        priority: tasks.priority,
        count: count(tasks.id),
      })
      .from(tasks)
      .groupBy(tasks.priority);

    const recentActivities = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        taskId: activityLog.taskId,
        projectId: activityLog.projectId,
      })
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(20);

    // Enrich activities with task titles and project names
    const enrichedActivities = await Promise.all(
      recentActivities.map(async (activity) => {
        let taskTitle: string | undefined;
        let projectName: string | undefined;

        if (activity.taskId) {
          const task = await db.query.tasks.findFirst({
            where: eq(tasks.id, activity.taskId),
          });
          taskTitle = task?.title;
        }

        if (activity.projectId) {
          const project = await db.query.projects.findFirst({
            where: eq(projects.id, activity.projectId),
          });
          projectName = project?.name;
        }

        return {
          id: activity.id,
          action: activity.action,
          details: activity.details,
          taskTitle,
          projectName,
          createdAt: activity.createdAt,
        };
      })
    );

    const summary: DashboardSummary = {
      totalProjects: projectCount?.count ?? 0,
      totalTasks: taskCount?.count ?? 0,
      tasksByStatus: Object.fromEntries(
        statusCounts.map((s) => [s.status, s.count])
      ),
      tasksByPriority: Object.fromEntries(
        priorityCounts.map((p) => [p.priority, p.count])
      ),
      recentActivity: enrichedActivities,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
