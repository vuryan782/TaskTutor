import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id")?.trim() || null;
}

const ALLOWED_ACCOUNT_FIELDS = new Set([
  "username",
  "full_name",
  "avatar_url",
  "phone",
]);

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const user = await prisma.users.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        avatar_url: true,
        phone: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (e: any) {
    console.error("GET /api/me/account error:", e);
    return NextResponse.json(
      { error: "Failed to load account", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId)
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });

    const body = await req.json();

    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_ACCOUNT_FIELDS.has(k)) data[k] = v;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Optional: normalize username
    if (data.username) data.username = String(data.username).trim();

    const updated = await prisma.users.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        full_name: true,
        avatar_url: true,
        phone: true,
        updated_at: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/me/account error:", e);

    // If username unique constraint fails, Prisma error code is usually P2002
    if (e?.code === "P2002") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update account", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
