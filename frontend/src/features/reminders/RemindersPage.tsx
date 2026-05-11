import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Plus, Trash2, CheckCircle } from "lucide-react";
import { supabase } from "../../supabaseClient";

type Reminder = {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  is_sent: boolean | null;
  send_email: boolean | null;
  send_push: boolean | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function RemindersPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const firedRef = useRef<Set<string>>(new Set());

  async function load() {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("remind_at", { ascending: true });
    if (error) throw new Error(error.message);
    setItems(data ?? []);
  }

  async function checkPushEnabled() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    setPushEnabled(!!existing);
  }

  async function subscribeToWebPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidKey) return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      }));

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("push_subscriptions").upsert(
      { user_id: user?.id, endpoint: sub.endpoint, subscription: JSON.stringify(sub) },
      { onConflict: "endpoint" }
    );
    setPushEnabled(true);
  }

  async function unsubscribeFromPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
    setPushEnabled(false);
  }

  async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      await subscribeToWebPush().catch(console.error);
    }
  }

  async function createReminder() {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("reminders").insert({
      user_id: user?.id,
      title,
      message: message || null,
      remind_at: new Date(remindAt).toISOString(),
      send_push: true,
    });
    if (error) throw new Error(error.message);
    setTitle("");
    setMessage("");
    setRemindAt("");
    setShowForm(false);
    await load();
  }

  async function markSent(id: string, sent: boolean) {
    const { error } = await supabase
      .from("reminders")
      .update({ is_sent: sent, sent_at: sent ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("reminders").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  // Poll every 30s for due reminders and fire browser notifications
  useEffect(() => {
    if (notifPermission !== "granted") return;
    const check = () => {
      const now = Date.now();
      items.forEach((r) => {
        if (r.is_sent || firedRef.current.has(r.id)) return;
        const diff = now - new Date(r.remind_at).getTime();
        if (diff >= 0 && diff < 60_000) {
          firedRef.current.add(r.id);
          new Notification(r.title, {
            body: r.message ?? "You have a reminder!",
            icon: "/vite.svg",
          });
        }
      });
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [items, notifPermission]);

  useEffect(() => {
    load().catch(console.error);
    checkPushEnabled().catch(console.error);
  }, []);

  const sentCount = items.filter((r) => r.is_sent).length;
  const pendingCount = items.filter((r) => !r.is_sent).length;
  const nextPending = items.find((r) => !r.is_sent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e8e8ed] mb-2">Reminders</h1>
          <p className="text-[#8b8b9e]">Stay on top of your study schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Reminder
        </button>
      </div>

      {/* Push notifications toggle — always visible */}
      {"Notification" in window && (
        <div className={`rounded-xl border ${
          notifPermission === "granted"
            ? "bg-[#4ade80]/10 border-[#4ade80]/20"
            : notifPermission === "denied"
            ? "bg-[#ef4444]/10 border-[#ef4444]/20"
            : "bg-[#60a5fa]/10 border-[#60a5fa]/20"
        }`}>
          <div className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 flex-shrink-0 ${
                notifPermission === "granted" ? "bg-[#4ade80]/20"
                : notifPermission === "denied" ? "bg-[#ef4444]/20"
                : "bg-[#60a5fa]/20"
              }`}>
                {notifPermission === "granted" ? (
                  <Bell className="w-5 h-5 text-[#4ade80]" />
                ) : (
                  <BellOff className="w-5 h-5 text-[#ef4444]" />
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm ${
                  notifPermission === "granted" ? "text-[#4ade80]"
                  : notifPermission === "denied" ? "text-[#ef4444]"
                  : "text-[#60a5fa]"
                }`}>
                  {notifPermission === "granted"
                    ? nextPending
                      ? `Push notifications on — "${nextPending.title}" coming up!`
                      : "Push notifications are on"
                    : notifPermission === "denied"
                    ? "Notifications are blocked for this site"
                    : nextPending
                    ? `You have a "${nextPending.title}" reminder — turn on notifications!`
                    : "Push notifications are off"}
                </p>
                <p className={`text-xs mt-0.5 ${
                  notifPermission === "granted" ? "text-[#4ade80]/70"
                  : notifPermission === "denied" ? "text-[#ef4444]/70"
                  : "text-[#60a5fa]/70"
                }`}>
                  {notifPermission === "granted"
                    ? "You'll be alerted even when the tab is closed"
                    : notifPermission === "denied"
                    ? "Your browser is blocking notifications — follow the steps below to fix this"
                    : "Get alerted the moment a reminder is due"}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            {notifPermission !== "denied" && (
              <button
                onClick={() => {
                  if (notifPermission !== "granted") {
                    requestNotificationPermission().catch(console.error);
                  } else if (pushEnabled) {
                    unsubscribeFromPush().catch(console.error);
                  } else {
                    subscribeToWebPush().catch(console.error);
                  }
                }}
                className="flex-shrink-0 focus:outline-none"
                aria-label="Toggle push notifications"
              >
                <div className={`w-12 h-6 rounded-full transition-colors relative ${
                  pushEnabled ? "bg-[#4ade80]" : "bg-[#5c5c72]"
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    pushEnabled ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </div>
              </button>
            )}
          </div>

          {/* Blocked instructions */}
          {notifPermission === "denied" && (
            <div className="border-t border-[#ef4444]/20 px-5 py-4 space-y-3">
              <p className="text-sm font-semibold text-[#ef4444]">How to unblock notifications:</p>
              <ol className="space-y-2 text-sm text-[#ef4444]/80">
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">1.</span>
                  <span>Click the <strong>lock icon</strong> or <strong>info icon</strong> in your browser's address bar (left of the URL).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">2.</span>
                  <span>Find <strong>Notifications</strong> and change it from <strong>Block</strong> to <strong>Allow</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold flex-shrink-0">3.</span>
                  <span><strong>Reload this page</strong> — the toggle will appear and you can turn on reminders.</span>
                </li>
              </ol>
              <p className="text-xs text-[#ef4444]/60 mt-1">
                On <strong>Chrome</strong>: lock icon → Notifications → Allow.&nbsp;
                On <strong>Firefox</strong>: shield icon → Connection Secure → More Information → Permissions.&nbsp;
                On <strong>Edge</strong>: lock icon → Permissions for this site → Notifications → Allow.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#8b8b9e] mb-1">Total</p>
              <p className="text-3xl font-bold text-[#e8e8ed]">{items.length}</p>
            </div>
            <div className="bg-[#60a5fa]/10 rounded-full p-3">
              <Bell className="w-6 h-6 text-[#60a5fa]" />
            </div>
          </div>
        </div>
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#8b8b9e] mb-1">Pending</p>
              <p className="text-3xl font-bold text-[#f59e0b]">{pendingCount}</p>
            </div>
            <div className="bg-[#f59e0b]/10 rounded-full p-3">
              <Bell className="w-6 h-6 text-[#f59e0b]" />
            </div>
          </div>
        </div>
        <div className="bg-[#16161e] rounded-xl border border-[#2a2a3a] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#8b8b9e] mb-1">Sent</p>
              <p className="text-3xl font-bold text-[#4ade80]">{sentCount}</p>
            </div>
            <div className="bg-[#4ade80]/10 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-[#4ade80]" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Reminder Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-[#e8e8ed] mb-4">New Reminder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Enter reminder title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8b8b9e] mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={remindAt}
                    onChange={(e) => setRemindAt(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8b8b9e] mb-2">
                    Message <span className="text-[#5c5c72]">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Add a note..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2a2a3a] text-[#e8e8ed] placeholder:text-[#5c5c72] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc] resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => createReminder().catch(alert)}
                    disabled={!title || !remindAt}
                    className="flex-1 bg-[#7c5cfc] hover:bg-[#6a4ce0] disabled:opacity-40 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Reminder
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setTitle("");
                      setMessage("");
                      setRemindAt("");
                    }}
                    className="flex-1 bg-[#1c1c27] hover:bg-[#222233] text-[#e8e8ed] border border-[#2a2a3a] py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((r) => (
            <div
              key={r.id}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                r.is_sent
                  ? "bg-[#4ade80]/5 border-[#4ade80]/20"
                  : "bg-[#16161e] border border-[#2a2a3a] hover:border-[#3a3a4a]"
              }`}
            >
              <button
                onClick={() => markSent(r.id, !r.is_sent).catch(alert)}
                className="mt-1 flex-shrink-0"
              >
                <CheckCircle
                  className={`w-6 h-6 transition-colors ${
                    r.is_sent ? "text-[#4ade80] fill-[#4ade80]" : "text-[#5c5c72] hover:text-[#8b8b9e]"
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${r.is_sent ? "line-through text-[#5c5c72]" : "text-[#e8e8ed]"}`}>
                  {r.title}
                </p>
                <p className="text-sm text-[#5c5c72] mt-1">
                  {new Date(r.remind_at).toLocaleString()}
                </p>
                {r.message && (
                  <p className="text-sm text-[#8b8b9e] mt-1">{r.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    r.is_sent
                      ? "bg-[#4ade80]/10 border-[#4ade80]/20 text-[#4ade80]"
                      : "bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b]"
                  }`}
                >
                  {r.is_sent ? "Sent" : "Pending"}
                </span>
                <button
                  onClick={() => remove(r.id).catch(alert)}
                  className="text-[#5c5c72] hover:text-[#ef4444] hover:bg-[#ef4444]/10 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-[#1c1c27] rounded-xl border-2 border-dashed border-[#2a2a3a]">
            <Bell className="w-12 h-12 text-[#5c5c72] mx-auto mb-3" />
            <p className="text-[#e8e8ed] font-medium">No reminders yet</p>
            <p className="text-sm text-[#5c5c72] mt-1">Create a reminder to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
