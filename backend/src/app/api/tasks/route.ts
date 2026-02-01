import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  return userId?.trim() || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Missing x-user-id header (must be a UUID)" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || null;
    const status = searchParams.get("status")?.trim() || null;

    const tasks = await prisma.tasks.findMany({
      where: {
        user_id: userId,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ due_date: "asc" }, { created_at: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Missing x-user-id header (must be a UUID)" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const created = await prisma.tasks.create({
      data: {
        user_id: userId,
        title,
        description: body.description ?? null,
        priority: body.priority ?? "medium",
        status: body.status ?? "pending",
        due_date: body.due_date
          ? new Date(body.due_date)
          : body.dueDate
            ? new Date(body.dueDate)
            : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
