import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Pause,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Type,
  User as UserIcon,
} from "lucide-react";

import { supabase } from "../../supabaseClient";
import { burstFromElement } from "../../utils/celebrate";

type NotificationPrefs = {
  reminders: boolean;
  weeklySummary: boolean;
  studyNudges: boolean;
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  reminders: true,
  weeklySummary: true,
  studyNudges: false,
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const GOAL_MIN = 0;
const GOAL_MAX = 240;
const THUMB_WIDTH_PX = 16;

export type AccessibilityPrefs = {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
};

type AccountPageProps = {
  session: any;
  initials: string;
  onLogout: () => void | Promise<void>;
  onNavigate?: (page: string) => void;
  accessibility: AccessibilityPrefs;
  onAccessibilityChange: (
    next: AccessibilityPrefs | ((prev: AccessibilityPrefs) => AccessibilityPrefs)
  ) => void;
};

type SavedBanner = { kind: "success" | "error"; text: string } | null;

const sectionCard =
  "rounded-2xl border border-[#2a2a3a] bg-[#16161e] p-6 space-y-5";
const inputBase =
  "w-full px-4 py-2.5 bg-[#1c1c27] border border-[#2a2a3a] rounded-lg text-[#e8e8ed] placeholder:text-[#5c5c72] focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 focus:border-[#7c5cfc] transition-colors";
const labelBase = "block text-xs font-medium text-[#8b8b9e] mb-1.5 uppercase tracking-wide";
const primaryBtn =
  "inline-flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const ghostBtn =
  "inline-flex items-center gap-2 bg-[#1c1c27] hover:bg-[#22222e] text-[#e8e8ed] px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-[#2a2a3a]";
const dangerBtn =
  "inline-flex items-center gap-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 px-4 py-2 rounded-lg font-medium text-sm transition-colors";

function ToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-xl bg-[#1c1c27] border border-[#2a2a3a] hover:border-[#7c5cfc]/40 transition-colors"
    >
      <div className="flex items-center gap-3 text-left">
        <div
          className={`p-2 rounded-lg ${
            value ? "bg-[#7c5cfc]/15 text-[#7c5cfc]" : "bg-[#0f0f17] text-[#8b8b9e]"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-[#e8e8ed]">{label}</p>
          <p className="text-xs text-[#8b8b9e]">{description}</p>
        </div>
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
          value ? "bg-[#7c5cfc]" : "bg-[#2a2a3a]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

export default function AccountPage({
  session,
  initials,
  onLogout,
  onNavigate,
  accessibility,
  onAccessibilityChange,
}: AccountPageProps) {
  const email: string = session?.user?.email ?? "";
  const createdAt: string | undefined = session?.user?.created_at;
  const userId: string | undefined = session?.user?.id;

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [dailyGoal, setDailyGoal] = useState(60);
  const [preferredSubject, setPreferredSubject] = useState("");

  const [notifications, setNotifications] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS
  );

  const [passwordForm, setPasswordForm] = useState({
    next: "",
    confirm: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [banner, setBanner] = useState<SavedBanner>(null);

  const baselineRef = useRef<{
    displayName: string;
    timezone: string;
    dailyGoal: number;
    preferredSubject: string;
    notifications: NotificationPrefs;
  } | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "display_name, timezone, daily_goal_minutes, preferred_subject, notification_prefs"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setBanner({
          kind: "error",
          text: `Could not load profile: ${error.message}`,
        });
      } else if (data) {
        const loadedName = data.display_name ?? email.split("@")[0] ?? "";
        const loadedTz = data.timezone ?? timezone;
        const loadedGoal =
          typeof data.daily_goal_minutes === "number" ? data.daily_goal_minutes : 60;
        const loadedSubject = data.preferred_subject ?? "";
        const loadedNotifs: NotificationPrefs = {
          ...DEFAULT_NOTIFICATION_PREFS,
          ...(data.notification_prefs ?? {}),
        };
        setDisplayName(loadedName);
        setTimezone(loadedTz);
        setDailyGoal(loadedGoal);
        setPreferredSubject(loadedSubject);
        setNotifications(loadedNotifs);
        baselineRef.current = {
          displayName: loadedName,
          timezone: loadedTz,
          dailyGoal: loadedGoal,
          preferredSubject: loadedSubject,
          notifications: loadedNotifs,
        };
      } else {
        const fallbackName = email.split("@")[0] ?? "";
        setDisplayName(fallbackName);
        baselineRef.current = {
          displayName: fallbackName,
          timezone,
          dailyGoal: 60,
          preferredSubject: "",
          notifications: DEFAULT_NOTIFICATION_PREFS,
        };
      }
      setLoadingProfile(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setBanner({ kind: "error", text: "No active session — sign in again." });
      return;
    }
    const sourceEl =
      (e as any)?.nativeEvent?.submitter ??
      ((e as any)?.currentTarget?.querySelector?.('[type="submit"]') ?? null);
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        display_name: displayName || null,
        timezone: timezone || null,
        daily_goal_minutes: dailyGoal,
        preferred_subject: preferredSubject || null,
        notification_prefs: notifications,
      },
      { onConflict: "user_id" }
    );
    setSavingProfile(false);
    if (error) {
      setBanner({
        kind: "error",
        text: `Could not save profile: ${error.message}`,
      });
    } else {
      baselineRef.current = {
        displayName,
        timezone,
        dailyGoal,
        preferredSubject,
        notifications,
      };
      setBanner({ kind: "success", text: "Profile saved." });
      burstFromElement(sourceEl);
    }
  };

  const handleAccessibilityToggle = async (
    key: keyof AccessibilityPrefs,
    value: boolean
  ) => {
    const next: AccessibilityPrefs = { ...accessibility, [key]: value };
    onAccessibilityChange(next);
    if (!userId) return;
    const { error } = await supabase
      .from("profiles")
      .update({ accessibility_prefs: next })
      .eq("user_id", userId);
    if (error) {
      setBanner({
        kind: "error",
        text: `Could not save accessibility preference: ${error.message}`,
      });
    }
  };

  const isDirty =
    baselineRef.current !== null &&
    (displayName !== baselineRef.current.displayName ||
      timezone !== baselineRef.current.timezone ||
      dailyGoal !== baselineRef.current.dailyGoal ||
      preferredSubject !== baselineRef.current.preferredSubject ||
      notifications.reminders !== baselineRef.current.notifications.reminders ||
      notifications.weeklySummary !== baselineRef.current.notifications.weeklySummary ||
      notifications.studyNudges !== baselineRef.current.notifications.studyNudges);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.next.length < 6) {
      setBanner({ kind: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setBanner({ kind: "error", text: "Passwords do not match." });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (error) throw error;
      setPasswordForm({ next: "", confirm: "" });
      setBanner({ kind: "success", text: "Password updated successfully." });
    } catch (err: any) {
      setBanner({
        kind: "error",
        text: err?.message ?? "Could not update password.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResetEmail = async () => {
    if (!email) return;
    setBanner(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setBanner({
        kind: "success",
        text: `Password reset link sent to ${email}.`,
      });
    } catch (err: any) {
      setBanner({
        kind: "error",
        text: err?.message ?? "Could not send reset email.",
      });
    }
  };

  const joinedLabel = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-[#7c5cfc] to-[#6a4ce0] p-6 text-white">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">
              {displayName || email.split("@")[0] || "Your account"}
            </h1>
            <p className="text-white/80 text-sm truncate">{email || "No email on file"}</p>
            <p className="text-white/70 text-xs mt-1">
              Member since {joinedLabel}
            </p>
          </div>
        </div>
      </div>

      {banner && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
            banner.kind === "success"
              ? "bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]"
              : "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
          }`}
        >
          {banner.kind === "success" ? (
            <Check className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Shield className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className={sectionCard}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#7c5cfc]/10 text-[#7c5cfc]">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Profile</h2>
            <p className="text-xs text-[#8b8b9e]">
              How you appear in Task Tutor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputBase}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className={labelBase}>Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#5c5c72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                readOnly
                className={`${inputBase} pl-9 bg-[#0f0f17] text-[#8b8b9e] cursor-not-allowed`}
              />
            </div>
          </div>
          <div>
            <label className={labelBase}>Timezone</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[#5c5c72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`${inputBase} pl-9`}
              />
            </div>
          </div>
          <div>
            <label className={labelBase}>Preferred subject</label>
            <input
              type="text"
              value={preferredSubject}
              onChange={(e) => setPreferredSubject(e.target.value)}
              className={inputBase}
              placeholder="e.g. Biology"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelBase}>Daily study goal</label>
            <div className="relative pt-8">
              {(() => {
                const pct = (dailyGoal - GOAL_MIN) / (GOAL_MAX - GOAL_MIN);
                const correction = (0.5 - pct) * THUMB_WIDTH_PX;
                return (
                  <div
                    className="absolute top-0 pointer-events-none transition-transform"
                    style={{
                      left: `calc(${pct * 100}% + ${correction}px)`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="relative bg-[#7c5cfc] text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg shadow-[#7c5cfc]/30 whitespace-nowrap">
                      {formatMinutes(dailyGoal)}
                      <span
                        className="absolute left-1/2 top-full w-0 h-0 -translate-x-1/2"
                        style={{
                          borderLeft: "4px solid transparent",
                          borderRight: "4px solid transparent",
                          borderTop: "4px solid #7c5cfc",
                        }}
                      />
                    </div>
                  </div>
                );
              })()}
              <input
                type="range"
                min={GOAL_MIN}
                max={GOAL_MAX}
                step={15}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                className="w-full accent-[#7c5cfc] cursor-pointer"
                aria-label="Daily study goal in minutes"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#5c5c72] mt-1">
              <span>0m</span>
              <span>1h</span>
              <span>2h</span>
              <span>4h</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {loadingProfile ? (
            <span className="text-xs text-[#8b8b9e] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading profile…
            </span>
          ) : isDirty ? (
            <span className="text-xs text-[#f59e0b] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
              Unsaved changes
            </span>
          ) : null}
          <button
            type="submit"
            className={primaryBtn}
            disabled={savingProfile || loadingProfile || !isDirty}
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Notifications */}
      <section className={sectionCard}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Notifications</h2>
            <p className="text-xs text-[#8b8b9e]">Choose what pings you</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            icon={<Bell className="w-4 h-4" />}
            label="Task reminders"
            description="Browser push notifications for due tasks"
            value={notifications.reminders}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, reminders: v }))
            }
          />
          <ToggleRow
            icon={<Calendar className="w-4 h-4" />}
            label="Weekly summary"
            description="A Monday morning recap of last week's study"
            value={notifications.weeklySummary}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, weeklySummary: v }))
            }
          />
          <ToggleRow
            icon={<Sparkles className="w-4 h-4" />}
            label="Study nudges"
            description="Gentle prompts from the AI tutor when you're idle"
            value={notifications.studyNudges}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, studyNudges: v }))
            }
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {isDirty && !loadingProfile && (
            <span className="text-xs text-[#f59e0b] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full" />
              Unsaved changes
            </span>
          )}
          <button
            type="button"
            onClick={(e) => handleSaveProfile(e as unknown as React.FormEvent)}
            className={primaryBtn}
            disabled={savingProfile || loadingProfile || !isDirty}
          >
            <Save className="w-4 h-4" />
            {savingProfile ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </section>

      {/* Security */}
      <section className={sectionCard}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#60a5fa]/10 text-[#60a5fa]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Security</h2>
            <p className="text-xs text-[#8b8b9e]">
              Protect your account
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelBase}>New password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5c5c72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, next: e.target.value }))
                  }
                  className={`${inputBase} pl-9`}
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className={labelBase}>Confirm new password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5c5c72] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({ ...prev, confirm: e.target.value }))
                  }
                  className={`${inputBase} pl-9`}
                  placeholder="Re-enter new password"
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-between">
            <button
              type="button"
              onClick={handleResetEmail}
              className={ghostBtn}
            >
              <KeyRound className="w-4 h-4" />
              Send reset email
            </button>
            <button type="submit" className={primaryBtn} disabled={savingPassword}>
              <Save className="w-4 h-4" />
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      {/* Accessibility */}
      <section className={sectionCard}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#a78bfa]/10 text-[#a78bfa]">
            <Accessibility className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Accessibility</h2>
            <p className="text-xs text-[#8b8b9e]">
              Adjustments apply instantly across Task Tutor
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            icon={<Moon className="w-4 h-4" />}
            label="High contrast"
            description="Boosts contrast for better readability"
            value={accessibility.highContrast}
            onChange={(v) => handleAccessibilityToggle("highContrast", v)}
          />
          <ToggleRow
            icon={<Type className="w-4 h-4" />}
            label="Large text"
            description="Scales the entire UI up by 20%"
            value={accessibility.largeText}
            onChange={(v) => handleAccessibilityToggle("largeText", v)}
          />
          <ToggleRow
            icon={<Pause className="w-4 h-4" />}
            label="Reduce motion"
            description="Disables animations and transitions"
            value={accessibility.reduceMotion}
            onChange={(v) => handleAccessibilityToggle("reduceMotion", v)}
          />
        </div>
      </section>

      {/* Connected services */}
      <section className={sectionCard}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#4ade80]/10 text-[#4ade80]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Connected services</h2>
            <p className="text-xs text-[#8b8b9e]">
              Link outside apps to enrich your study plan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.("planner")}
          className="w-full text-left rounded-xl border border-[#2a2a3a] bg-[#1c1c27] p-4 flex items-center justify-between gap-4 hover:border-[#7c5cfc]/40 hover:bg-[#22222e] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7c5cfc]/60"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0f0f17] text-[#60a5fa]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e8e8ed]">Google Calendar</p>
              <p className="text-xs text-[#8b8b9e]">
                Sync planner tasks to your primary calendar
              </p>
            </div>
          </div>
          <span className="text-xs text-[#7c5cfc] flex items-center gap-1 flex-shrink-0">
            Manage in Planner <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </section>

      {/* Danger zone */}
      <section
        className={`${sectionCard} border-[#ef4444]/30 bg-[#1a1017]`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444]">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#e8e8ed]">Danger zone</h2>
            <p className="text-xs text-[#8b8b9e]">
              Sign out or disable your account
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <button type="button" onClick={onLogout} className={ghostBtn}>
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
          <button
            type="button"
            onClick={() =>
              setBanner({
                kind: "error",
                text: "Account deletion is not yet wired up — contact support to delete your account.",
              })
            }
            className={dangerBtn}
          >
            <Trash2 className="w-4 h-4" />
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}
