import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-nocheck

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!; // e.g. "mailto:you@example.com"

// ── VAPID helpers ──────────────────────────────────────────────────────────────

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));
  const sigInput = enc.encode(`${headerB64}.${payloadB64}`);

  const privateKeyBytes = base64urlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    sigInput,
  );
  return `${headerB64}.${payloadB64}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: object,
): Promise<void> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience);

  await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      TTL: "86400",
    },
    body: JSON.stringify(payload),
  });
}

// ── Main handler ───────────────────────────────────────────────────────────────

Deno.serve(async () => {
  const now = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("is_sent", false)
    .lte("remind_at", now);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (!reminders?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Cache per-user notification preferences so we only hit `profiles` once per user.
  const prefsByUser = new Map<string, { reminders: boolean }>();
  async function reminderPrefFor(userId: string): Promise<boolean> {
    const cached = prefsByUser.get(userId);
    if (cached) return cached.reminders;

    const { data } = await supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("user_id", userId)
      .maybeSingle();

    // Default to true when no profile row exists yet, so users with no settings
    // still receive the reminders they explicitly created.
    const reminders = data?.notification_prefs?.reminders ?? true;
    prefsByUser.set(userId, { reminders });
    return reminders;
  }

  for (const reminder of reminders) {
    // Web push — gated on the user's notification preference.
    if (reminder.send_push && (await reminderPrefFor(reminder.user_id))) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("subscription")
        .eq("user_id", reminder.user_id);

      for (const row of subs ?? []) {
        const sub = JSON.parse(row.subscription);
        await sendWebPush(sub, {
          title: reminder.title,
          body: reminder.message ?? "Reminder time!",
          url: "/",
        }).catch(console.error);
      }
    }

    // Mark as sent regardless — a muted reminder is still a fired reminder,
    // we just don't push it.
    await supabase
      .from("reminders")
      .update({ is_sent: true, sent_at: now })
      .eq("id", reminder.id);
  }

  return new Response(JSON.stringify({ processed: reminders.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
