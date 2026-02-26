/**
 * Projects API
 * GET: List all projects
 * POST: Create a new project
 */

import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        repoUrl: projects.repoUrl,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        taskCount: count(tasks.id),
      })
      .from(projects)
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .groupBy(projects.id)
      .orderBy(projects.createdAt);

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const id = uuid();

    const newProject = {
      id,
      name: body.name || "Untitled Project",
      description: body.description || "",
      repoUrl: body.repoUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(projects).values(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
