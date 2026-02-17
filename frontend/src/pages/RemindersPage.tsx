import { useEffect, useState } from "react";

type Reminder = {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  is_sent: boolean | null;
  send_email: boolean | null;
  send_push: boolean | null;
};

const USER_ID = "dd266735-e639-470c-b47d-875303eecda7"; // placeholder for now

export default function RemindersPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/reminders", {
      headers: { "x-user-id": USER_ID },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load reminders");
    setItems(data);
  }

  async function createReminder() {
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": USER_ID,
      },
      body: JSON.stringify({
        title,
        message: message || null,
        remind_at: remindAt, // ISO string is best; browser input returns local-ish
        send_email: true,
        send_push: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create reminder");
    setTitle("");
    setMessage("");
    setRemindAt("");
    await load();
  }

  async function markSent(id: string, sent: boolean) {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": USER_ID,
      },
      body: JSON.stringify({
        is_sent: sent,
        sent_at: sent ? new Date().toISOString() : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to update reminder");
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/reminders/${id}`, {
      method: "DELETE",
      headers: { "x-user-id": USER_ID },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to delete reminder");
    await load();
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Reminders</h1>

      <div
        style={{
          display: "grid",
          gap: 8,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
        />
        <textarea
          placeholder="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={() => createReminder().catch(alert)}
          disabled={!title || !remindAt}
        >
          Create reminder
        </button>
      </div>

      <h2 style={{ marginTop: 24 }}>Your reminders</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((r) => (
          <div
            key={r.id}
            style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div style={{ opacity: 0.8 }}>
                  Remind at: {new Date(r.remind_at).toLocaleString()}
                </div>
                {r.message ? (
                  <div style={{ marginTop: 6 }}>{r.message}</div>
                ) : null}
                <div style={{ marginTop: 6 }}>
                  Sent: <b>{r.is_sent ? "Yes" : "No"}</b>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => markSent(r.id, !r.is_sent).catch(alert)}>
                  {r.is_sent ? "Mark unsent" : "Mark sent"}
                </button>
                <button onClick={() => remove(r.id).catch(alert)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? <div>No reminders yet.</div> : null}
      </div>
    </div>
  );
}
