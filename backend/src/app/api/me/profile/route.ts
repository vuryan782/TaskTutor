import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id")?.trim() || null;
}

// Whitelist fields user is allowed to update in user_profiles
const ALLOWED_PROFILE_FIELDS = new Set([
  "study_streak",
  "total_study_hours",
  "preferred_study_time",
  "timezone",
  "daily_goal_minutes",
  "weekly_goal_minutes",
  "theme",
  "email_notifications",
  "push_notifications",
  "font_size",
  "high_contrast",
  "screen_reader_enabled",
  "keyboard_shortcuts_enabled",
  "auto_save",
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
        created_at: true,
        user_profiles: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // If profile row doesn't exist yet, create it (common pattern)
    if (!user.user_profiles) {
      const profile = await prisma.user_profiles.create({
        data: { user_id: userId },
      });
      return NextResponse.json({ ...user, user_profiles: profile });
    }

    return NextResponse.json(user);
  } catch (e: any) {
    console.error("GET /api/me/profile error:", e);
    return NextResponse.json(
      { error: "Failed to load profile", detail: e?.message ?? String(e) },
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

    // Build a safe update payload
    const data: Record<string, any> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_PROFILE_FIELDS.has(k)) data[k] = v;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Upsert profile so PATCH works even if row doesn't exist yet
    const updated = await prisma.user_profiles.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH /api/me/profile error:", e);
    return NextResponse.json(
      { error: "Failed to update profile", detail: e?.message ?? String(e) },
      { status: 500 },
    );
  }
}
