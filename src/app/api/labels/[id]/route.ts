/**
 * Single Label API
 * PATCH: Update label
 * DELETE: Delete label
 */

import { db } from "@/lib/db";
import { labels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    await db.update(labels).set(body).where(eq(labels.id, id));
    const updated = await db.query.labels.findFirst({
      where: eq(labels.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update label:", error);
    return NextResponse.json(
      { error: "Failed to update label" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.delete(labels).where(eq(labels.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete label:", error);
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 }
    );
  }
}
