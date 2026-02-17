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
    const cleanId = id?.trim();
    if (!cleanId || !isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const reminder = await prisma.reminders.findFirst({
      where: { id: cleanId, user_id: userId },
    });

    if (!reminder)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(reminder);
  } catch (e: any) {
    console.error("GET /api/reminders/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to fetch reminder", detail: e?.message ?? String(e) },
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
    const cleanId = id?.trim();
    if (!cleanId || !isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    // must belong to user
    const existing = await prisma.reminders.findFirst({
      where: { id: cleanId, user_id: userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title ?? "").trim();
    if (body.message !== undefined)
      data.message = body.message ? String(body.message) : null;
    if (body.reminder_type !== undefined)
      data.reminder_type = body.reminder_type
        ? String(body.reminder_type)
        : null;
    if (body.task_id !== undefined)
      data.task_id = body.task_id ? String(body.task_id) : null;
    if (body.goal_id !== undefined)
      data.goal_id = body.goal_id ? String(body.goal_id) : null;
    if (body.is_sent !== undefined) data.is_sent = Boolean(body.is_sent);
    if (body.sent_at !== undefined)
      data.sent_at = body.sent_at ? new Date(body.sent_at) : null;
    if (body.send_email !== undefined)
      data.send_email = Boolean(body.send_email);
    if (body.send_push !== undefined) data.send_push = Boolean(body.send_push);

    if (body.remind_at !== undefined || body.remindAt !== undefined) {
      const raw = body.remind_at ?? body.remindAt;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid remind_at" },
          { status: 400 },
        );
      }
      data.remind_at = d;
    }

    const updated = await prisma.reminders.update({
      where: { id: cleanId },
      data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/reminders/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to update reminder", detail: e?.message ?? String(e) },
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
    const cleanId = id?.trim();
    if (!cleanId || !isUuid(cleanId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const existing = await prisma.reminders.findFirst({
      where: { id: cleanId, user_id: userId },
      select: { id: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.reminders.delete({ where: { id: cleanId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/reminders/[id] error:", e);
    return NextResponse.json(
      { error: "Failed to delete reminder", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
