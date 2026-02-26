/**
 * Labels API
 * GET: List labels for a project
 * POST: Create a new label
 */

import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const allLabels = await db
      .select()
      .from(labels)
      .where(eq(labels.projectId, projectId));

    return NextResponse.json(allLabels);
  } catch (error) {
    console.error("Failed to fetch labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const id = uuid();

    const newLabel = {
      id,
      projectId: body.projectId,
      name: body.name || "Label",
      color: body.color || "#6366f1",
      createdAt: now,
    };

    await db.insert(labels).values(newLabel);
    return NextResponse.json(newLabel, { status: 201 });
  } catch (error) {
    console.error("Failed to create label:", error);
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}
