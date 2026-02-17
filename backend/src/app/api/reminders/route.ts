import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id")?.trim() || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const reminders = await prisma.reminders.findMany({
      where: { user_id: userId },
      orderBy: { remind_at: "asc" },
    });

    return NextResponse.json(reminders);
  } catch (e: any) {
    console.error("GET /api/reminders error:", e);
    return NextResponse.json(
      { error: "Failed to list reminders", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const body = await req.json();

    const title = String(body.title ?? "").trim();
    if (!title)
      return NextResponse.json({ error: "title is required" }, { status: 400 });

    const remindAtRaw = body.remind_at ?? body.remindAt; // allow either key from frontend
    if (!remindAtRaw)
      return NextResponse.json(
        { error: "remind_at is required" },
        { status: 400 },
      );

    const remindAt = new Date(remindAtRaw);
    if (Number.isNaN(remindAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid remind_at date" },
        { status: 400 },
      );
    }

    const created = await prisma.reminders.create({
      data: {
        user_id: userId,
        title,
        message: body.message ? String(body.message) : null,
        reminder_type: body.reminder_type ? String(body.reminder_type) : null,
        task_id: body.task_id ? String(body.task_id) : null,
        goal_id: body.goal_id ? String(body.goal_id) : null,
        remind_at: remindAt,
        send_email: body.send_email ?? true,
        send_push: body.send_push ?? true,
        // is_sent defaults false in DB
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/reminders error:", e);
    return NextResponse.json(
      { error: "Failed to create reminder", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
