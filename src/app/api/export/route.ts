/**
 * Export API
 * GET: Export tasks as CSV
 */

import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    let allTasks;
    if (projectId) {
      allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          assignee: tasks.assignee,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          projectName: projects.name,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(eq(tasks.projectId, projectId))
        .orderBy(asc(tasks.position));
    } else {
      allTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          assignee: tasks.assignee,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          projectName: projects.name,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .orderBy(asc(tasks.createdAt));
    }

    // Build CSV
    const headers = [
      "ID",
      "Project",
      "Title",
      "Description",
      "Status",
      "Priority",
      "Assignee",
      "Due Date",
      "Created At",
      "Updated At",
    ];

    const escapeCSV = (val: string | null | undefined): string => {
      if (!val) return "";
      const str = val.replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str}"`
        : str;
    };

    const rows = allTasks.map((t) =>
      [
        t.id,
        escapeCSV(t.projectName),
        escapeCSV(t.title),
        escapeCSV(t.description),
        t.status,
        t.priority,
        escapeCSV(t.assignee),
        t.dueDate || "",
        t.createdAt,
        t.updatedAt,
      ].join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="kanban-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export:", error);
    return NextResponse.json(
      { error: "Failed to export" },
      { status: 500 }
    );
  }
}
