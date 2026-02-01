import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id")?.trim() || null;
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v,
  );
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Ctx) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const { id } = await context.params;
    const cleanId = id.trim();

    if (!isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const task = await prisma.tasks.findFirst({
      where: { id: cleanId, user_id: userId },
    });

    if (!task)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (e: any) {
    console.error("GET /api/tasks/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to fetch task", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: Ctx) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const { id } = await context.params;
    const cleanId = id.trim();
    if (!isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();

    // Optional safety: only allow updates to your own tasks
    const existing = await prisma.tasks.findFirst({
      where: { id: cleanId, user_id: userId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.tasks.update({
      where: { id: cleanId },
      data: {
        ...(body.title !== undefined
          ? { title: String(body.title).trim() }
          : {}),
        ...(body.description !== undefined
          ? { description: body.description ? String(body.description) : null }
          : {}),
        ...(body.priority !== undefined
          ? { priority: body.priority ? String(body.priority) : null }
          : {}),
        ...(body.status !== undefined
          ? { status: body.status ? String(body.status) : null }
          : {}),
        ...(body.due_date !== undefined
          ? { due_date: body.due_date ? new Date(body.due_date) : null }
          : {}),
        ...(body.completed_at !== undefined
          ? {
              completed_at: body.completed_at
                ? new Date(body.completed_at)
                : null,
            }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/tasks/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to update task", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: Ctx) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const { id } = await context.params;
    const cleanId = id.trim();
    if (!isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await prisma.tasks.findFirst({
      where: { id: cleanId, user_id: userId },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tasks.delete({ where: { id: cleanId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/tasks/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to delete task", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
