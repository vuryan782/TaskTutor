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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reminders</h1>
          <p className="text-gray-600">Stay on top of your study schedule</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Reminder
        </button>
      </div>

      {/* Push notifications toggle — always visible */}
      {"Notification" in window && (
        <div className={`rounded-xl border ${
          notifPermission === "granted"
            ? "bg-green-50 border-green-200"
            : notifPermission === "denied"
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 flex-shrink-0 ${
                notifPermission === "granted" ? "bg-green-100"
                : notifPermission === "denied" ? "bg-red-100"
                : "bg-blue-100"
              }`}>
                {notifPermission === "granted" ? (
                  <Bell className="w-5 h-5 text-green-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <p className={`font-semibold text-sm ${
                  notifPermission === "granted" ? "text-green-900"
                  : notifPermission === "denied" ? "text-red-900"
                  : "text-blue-900"
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
                  notifPermission === "granted" ? "text-green-700"
                  : notifPermission === "denied" ? "text-red-700"
                  : "text-blue-700"
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
                  pushEnabled ? "bg-green-500" : "bg-gray-300"
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
            <div className="border-t border-red-200 px-5 py-4 space-y-3">
              <p className="text-sm font-semibold text-red-900">How to unblock notifications:</p>
              <ol className="space-y-2 text-sm text-red-800">
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
              <p className="text-xs text-red-600 mt-1">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sent</p>
              <p className="text-3xl font-bold text-green-600">{sentCount}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Reminder Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">New Reminder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="Enter reminder title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={remindAt}
                    onChange={(e) => setRemindAt(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Add a note..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => createReminder().catch(alert)}
                    disabled={!title || !remindAt}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-2 rounded-lg font-medium transition-colors"
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
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition-colors"
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
              className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-colors ${
                r.is_sent
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <button
                onClick={() => markSent(r.id, !r.is_sent).catch(alert)}
                className="mt-1 flex-shrink-0"
              >
                <CheckCircle
                  className={`w-6 h-6 transition-colors ${
                    r.is_sent ? "text-green-600 fill-green-600" : "text-gray-300 hover:text-gray-500"
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p className={`font-medium ${r.is_sent ? "line-through text-gray-500" : "text-gray-900"}`}>
                  {r.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(r.remind_at).toLocaleString()}
                </p>
                {r.message && (
                  <p className="text-sm text-gray-600 mt-1">{r.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    r.is_sent
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-amber-50 border-amber-200 text-amber-700"
                  }`}
                >
                  {r.is_sent ? "Sent" : "Pending"}
                </span>
                <button
                  onClick={() => remove(r.id).catch(alert)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No reminders yet</p>
            <p className="text-sm text-gray-500 mt-1">Create a reminder to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
