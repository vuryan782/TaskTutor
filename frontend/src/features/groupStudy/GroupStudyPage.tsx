import { Copy, ExternalLink, FileText, Link2, Lock, Plus, Trash2, Upload, Users, Video } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "../../supabaseClient";
import type { GroupSession } from "../../types/study";

type GroupStudyPageProps = {
  userId: string;
  userLabel: string;
};

type SharedMaterial = {
  id: string;
  sessionId: string;
  title: string;
  url: string;
  materialType: "link" | "file";
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
  createdBy: string;
};

const MATERIALS_BUCKET = "group-materials";

export default function GroupStudyPage({ userId, userLabel }: GroupStudyPageProps) {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);
  const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<{ sessionId: string; title: string; url: string } | null>(null);
  const [materialsBySession, setMaterialsBySession] = useState<Record<string, SharedMaterial[]>>({});
  const [selectedMaterialsSessionId, setSelectedMaterialsSessionId] = useState("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [openingMaterialId, setOpeningMaterialId] = useState<string | null>(null);
  const [removingMaterialId, setRemovingMaterialId] = useState<string | null>(null);

  const [newSession, setNewSession] = useState({
    title: "",
    subject: "",
    startsAt: "",
    isLive: false,
    isPrivate: false,
  });

  const normalizeCode = (code: string) => code.trim().toUpperCase();
  const makeSessionCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const chars = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]);
    return `${chars.slice(0, 3).join("")}-${chars.slice(3).join("")}`;
  };

  const getInviteLink = (sessionCode: string) => {
    if (typeof window === "undefined") return `?invite=${encodeURIComponent(sessionCode)}`;
    return `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(sessionCode)}`;
  };

  const getRoomName = (session: GroupSession) => {
    const source = session.sessionCode || session.id.slice(0, 8);
    const cleaned = source.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return `tasktutor-${cleaned}`;
  };

  const getRoomUrl = (session: GroupSession) => {
    const roomName = getRoomName(session);
    return `https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false`;
  };

  const toReadableError = (err: unknown, fallback: string) => {
    if (err instanceof Error) {
      if (err.message.includes("Failed to fetch")) {
        return "Network error: could not reach Supabase. Check internet connection and VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY.";
      }
      return err.message;
    }
    return fallback;
  };

  const loadSessions = async () => {
    try {
      type GroupSessionRow = {
        id: string;
        title: string;
        subject: string | null;
        starts_at: string | null;
        is_live: boolean | null;
        is_private: boolean | null;
        session_code: string | null;
        host_user_id: string;
      };

      const { data: sessionRows, error: sessionsError } = await supabase
        .from("group_sessions")
        .select("id, title, subject, starts_at, is_live, is_private, session_code, host_user_id")
        .order("starts_at", { ascending: true });

      if (sessionsError) {
        setErrorMsg(
          `Could not load sessions (${sessionsError.code ?? "unknown"}): ${sessionsError.message}`
        );
        return;
      }

      const { data: memberRows, error: membersError } = await supabase
        .from("group_session_members")
        .select("session_id, user_id");

      if (membersError) {
        setErrorMsg(
          `Could not load members (${membersError.code ?? "unknown"}): ${membersError.message}`
        );
        return;
      }

      const membersBySession = (memberRows ?? []).reduce<Record<string, string[]>>((acc, row) => {
        const list = acc[row.session_id] ?? [];
        list.push(row.user_id);
        acc[row.session_id] = list;
        return acc;
      }, {});

      const mapped = ((sessionRows ?? []) as GroupSessionRow[]).map((row) => {
        const members = membersBySession[row.id] ?? [];
        const joined = members.includes(userId);
        return {
          id: row.id,
          title: row.title,
          subject: row.subject ?? "General",
          startsAt: row.starts_at ?? new Date().toISOString(),
          isLive: Boolean(row.is_live),
          isPrivate: Boolean(row.is_private),
          sessionCode: row.session_code ?? "",
          hostUserId: row.host_user_id,
          memberCount: members.length,
          joined,
        };
      });

      setSessions(mapped);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not load sessions."));
    }
  };

  const loadMaterials = async () => {
    try {
      type SharedMaterialRow = {
        id: string;
        session_id: string;
        title: string;
        url: string;
        material_type: "link" | "file" | null;
        storage_path: string | null;
        file_name: string | null;
        mime_type: string | null;
        file_size: number | null;
        created_at: string;
        created_by: string;
      };

      const fullSelect =
        "id, session_id, title, url, material_type, storage_path, file_name, mime_type, file_size, created_at, created_by";
      let { data, error } = await supabase
        .from("group_session_materials")
        .select(fullSelect)
        .order("created_at", { ascending: false });

      if (error && (error.message.includes("material_type") || error.message.includes("storage_path"))) {
        // Fallback for older table schema before file support is enabled.
        const fallback = await supabase
          .from("group_session_materials")
          .select("id, session_id, title, url, created_at, created_by")
          .order("created_at", { ascending: false });
        data = fallback.data as SharedMaterialRow[] | null;
        error = fallback.error;
      }

      if (error) {
        if (error.code === "PGRST205") {
          setErrorMsg(
            "Shared materials table not found. Create `group_session_materials` in Supabase to enable collaborative links and files."
          );
          return;
        }
        setErrorMsg(`Could not load materials (${error.code ?? "unknown"}): ${error.message}`);
        return;
      }

      const grouped = ((data ?? []) as SharedMaterialRow[]).reduce<Record<string, SharedMaterial[]>>(
        (acc, row) => {
          const list = acc[row.session_id] ?? [];
          list.push({
            id: row.id,
            sessionId: row.session_id,
            title: row.title,
            url: row.url,
            materialType: row.material_type === "file" ? "file" : "link",
            storagePath: row.storage_path,
            fileName: row.file_name,
            mimeType: row.mime_type,
            fileSize: row.file_size,
            createdAt: row.created_at,
            createdBy: row.created_by,
          });
          acc[row.session_id] = list;
          return acc;
        },
        {}
      );

      setMaterialsBySession(grouped);
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not load shared materials."));
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSessions(), loadMaterials()]).finally(() => setLoading(false));

    const channel = supabase
      .channel(`group-study-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_sessions" },
        () => {
          loadSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_session_members" },
        () => {
          loadSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_session_materials" },
        () => {
          loadMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const inviteCode = new URLSearchParams(window.location.search).get("invite");
    if (inviteCode) {
      setJoinCode(normalizeCode(inviteCode));
    }
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title.trim()) {
      setErrorMsg("Please enter a session title.");
      return;
    }

    if (!newSession.isLive && !newSession.startsAt) {
      setErrorMsg("Set a start time or mark it as live now.");
      return;
    }

    setCreating(true);
    setErrorMsg("");

    const startsAt = newSession.isLive
      ? new Date().toISOString()
      : new Date(newSession.startsAt).toISOString();
    const sessionCode = makeSessionCode();

    try {
      const { data, error } = await supabase
        .from("group_sessions")
        .insert([
          {
            title: newSession.title.trim(),
            subject: newSession.subject.trim() || "General",
            starts_at: startsAt,
            is_live: newSession.isLive,
            is_private: newSession.isPrivate,
            session_code: sessionCode,
            host_user_id: userId,
          },
        ])
        .select("id")
        .single();

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data?.id) {
        await supabase
          .from("group_session_members")
          .upsert({ session_id: data.id, user_id: userId }, { onConflict: "session_id,user_id" });
      }

      setNewSession({ title: "", subject: "", startsAt: "", isLive: false, isPrivate: false });
      setShowCreateForm(false);
      loadSessions();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not create session."));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      const { error } = await supabase
        .from("group_session_members")
        .upsert({ session_id: sessionId, user_id: userId }, { onConflict: "session_id,user_id" });

      if (error) {
        setErrorMsg(error.message);
      } else if (!selectedMaterialsSessionId) {
        setSelectedMaterialsSessionId(sessionId);
      }
      loadSessions();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not join session."));
    } finally {
      setBusySessionId(null);
    }
  };

  const handleLeave = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      const { error } = await supabase
        .from("group_session_members")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      if (error) setErrorMsg(error.message);
      loadSessions();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not leave session."));
    } finally {
      setBusySessionId(null);
    }
  };

  const handleJoinByCode = async () => {
    const code = normalizeCode(joinCode);
    if (!code) {
      setErrorMsg("Enter a session code first.");
      return;
    }

    setJoiningByCode(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase
        .from("group_sessions")
        .select("id")
        .eq("session_code", code)
        .single();

      if (error || !data?.id) {
        setErrorMsg("Invalid session code. Ask your peer for a valid invite code.");
        return;
      }

      await handleJoin(data.id);
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not join by code."));
    } finally {
      setJoiningByCode(false);
    }
  };

  const handleCopyInviteLink = async (session: GroupSession) => {
    const inviteLink = getInviteLink(session.sessionCode);
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 1800);
    } catch {
      setErrorMsg("Could not copy invite link. Copy this manually: " + inviteLink);
    }
  };

  const handleCopyCode = async (session: GroupSession) => {
    try {
      await navigator.clipboard.writeText(session.sessionCode);
      setCopiedSessionId(session.id);
      setTimeout(() => setCopiedSessionId(null), 1800);
    } catch {
      setErrorMsg("Could not copy code. Share this manually: " + session.sessionCode);
    }
  };

  const handleOpenLiveRoom = (session: GroupSession) => {
    const url = getRoomUrl(session);
    setActiveRoom({ sessionId: session.id, title: session.title, url });
  };

  const handleOpenRoomInNewTab = (session: GroupSession) => {
    const url = getRoomUrl(session);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCloseSession = async (session: GroupSession) => {
    if (session.hostUserId !== userId) {
      setErrorMsg("Only the host can close this session.");
      return;
    }

    const ok = window.confirm(`Close session \"${session.title}\" for all members?`);
    if (!ok) return;

    setClosingSessionId(session.id);
    setErrorMsg("");
    try {
      const { error } = await supabase
        .from("group_sessions")
        .delete()
        .eq("id", session.id)
        .eq("host_user_id", userId);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (activeRoom?.sessionId === session.id) {
        setActiveRoom(null);
      }

      if (selectedMaterialsSessionId === session.id) {
        setSelectedMaterialsSessionId("");
      }

      loadSessions();
      loadMaterials();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not close session."));
    } finally {
      setClosingSessionId(null);
    }
  };

  const normalizeMaterialUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const formatFileSize = (size: number | null) => {
    if (!size || size <= 0) return "Unknown size";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatMaterialMeta = (material: SharedMaterial) => {
    const who = material.createdBy === userId ? "You" : "Peer";
    const when = new Date(material.createdAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${who} • ${when}`;
  };

  const handleUploadMaterialFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const sessionId = selectedMaterialsSessionId;
    if (!sessionId) {
      setErrorMsg("Join a session first, then choose it to upload files.");
      return;
    }

    const filePath = `${sessionId}/${Date.now()}-${sanitizeFileName(file.name)}`;
    setUploadingMaterial(true);
    setErrorMsg("");
    try {
      const upload = await supabase.storage.from(MATERIALS_BUCKET).upload(filePath, file, {
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

      if (upload.error) {
        setErrorMsg(`File upload failed: ${upload.error.message}`);
        return;
      }

      const insert = await supabase.from("group_session_materials").insert([
        {
          session_id: sessionId,
          title: file.name,
          url: "",
          material_type: "file",
          storage_path: filePath,
          file_name: file.name,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          created_by: userId,
        },
      ]);

      if (insert.error) {
        // Best effort cleanup if metadata insert fails after upload.
        await supabase.storage.from(MATERIALS_BUCKET).remove([filePath]);
        setErrorMsg(insert.error.message);
        return;
      }

      await loadMaterials();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not upload file material."));
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handleOpenMaterial = async (material: SharedMaterial) => {
    if (material.materialType === "link") {
      window.open(material.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!material.storagePath) {
      setErrorMsg("This file is missing a storage path.");
      return;
    }

    setOpeningMaterialId(material.id);
    try {
      const { data, error } = await supabase
        .storage
        .from(MATERIALS_BUCKET)
        .createSignedUrl(material.storagePath, 60 * 60);

      if (error || !data?.signedUrl) {
        setErrorMsg(error?.message || "Could not open file.");
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not open file."));
    } finally {
      setOpeningMaterialId(null);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionId = selectedMaterialsSessionId;
    if (!sessionId) {
      setErrorMsg("Join a session first, then choose it to add shared materials.");
      return;
    }
    const title = newMaterialTitle.trim();
    const normalizedUrl = normalizeMaterialUrl(newMaterialUrl);

    if (!title || !normalizedUrl) {
      setErrorMsg("Enter both a material title and link.");
      return;
    }

    try {
      const asUrl = new URL(normalizedUrl);
      if (!asUrl.hostname) throw new Error("invalid");
    } catch {
      setErrorMsg("Enter a valid material URL.");
      return;
    }

    setSavingMaterial(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.from("group_session_materials").insert([
        {
          session_id: sessionId,
          title,
          url: normalizedUrl,
          created_by: userId,
        },
      ]);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setNewMaterialTitle("");
      setNewMaterialUrl("");
      await loadMaterials();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not add material."));
    } finally {
      setSavingMaterial(false);
    }
  };

  const handleRemoveMaterial = async (material: SharedMaterial) => {
    setRemovingMaterialId(material.id);
    try {
      if (material.materialType === "file" && material.storagePath) {
        const storageDelete = await supabase.storage.from(MATERIALS_BUCKET).remove([material.storagePath]);
        if (storageDelete.error) {
          setErrorMsg(`Could not remove file from storage: ${storageDelete.error.message}`);
          return;
        }
      }

      const { error } = await supabase.from("group_session_materials").delete().eq("id", material.id);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      await loadMaterials();
    } catch (err) {
      setErrorMsg(toReadableError(err, "Could not remove material."));
    } finally {
      setRemovingMaterialId(null);
    }
  };

  const visibleSessions = sessions.filter(
    (session) => !session.isPrivate || session.joined || session.hostUserId === userId
  );
  const joinedSessions = sessions.filter((session) => session.joined);
  const selectedMaterialsSession = joinedSessions.find((session) => session.id === selectedMaterialsSessionId) ?? null;
  const materialsForSelectedSession = selectedMaterialsSession
    ? materialsBySession[selectedMaterialsSession.id] ?? []
    : [];

  useEffect(() => {
    if (joinedSessions.length === 0) {
      setSelectedMaterialsSessionId("");
      return;
    }

    if (!joinedSessions.some((session) => session.id === selectedMaterialsSessionId)) {
      setSelectedMaterialsSessionId(joinedSessions[0].id);
    }
  }, [joinedSessions, selectedMaterialsSessionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Study</h1>
          <p className="text-gray-600">Create sessions, invite peers, and study together live.</p>
        </div>
        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {showCreateForm ? "Cancel" : "Create Session"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Join with session code</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC-123"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={handleJoinByCode}
            disabled={joiningByCode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg disabled:opacity-60"
          >
            {joiningByCode ? "Joining..." : "Join by Code"}
          </button>
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      ) : null}

      {showCreateForm ? (
        <form onSubmit={handleCreateSession} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session title</label>
              <input
                value={newSession.title}
                onChange={(e) => setNewSession((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Calculus Problem Solving"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                value={newSession.subject}
                onChange={(e) => setNewSession((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Math"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
              <input
                type="datetime-local"
                value={newSession.startsAt}
                onChange={(e) => setNewSession((prev) => ({ ...prev, startsAt: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                disabled={newSession.isLive}
              />
            </div>

            <label className="flex items-center gap-3 mt-8 md:mt-0">
              <input
                type="checkbox"
                checked={newSession.isLive}
                onChange={(e) => setNewSession((prev) => ({ ...prev, isLive: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Start live now</span>
            </label>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={newSession.isPrivate}
              onChange={(e) => setNewSession((prev) => ({ ...prev, isPrivate: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Private session (only users with invite code/link can join)</span>
          </label>

          <button
            type="submit"
            disabled={creating}
            className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create Session"}
          </button>
        </form>
      ) : null}

      {activeRoom ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Room: {activeRoom.title}</h2>
              <p className="text-sm text-gray-600">Screen share, audio, video, and chat are available in this room.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.open(activeRoom.url, "_blank", "noopener,noreferrer")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Open in New Tab
              </button>
              <button
                type="button"
                onClick={() => setActiveRoom(null)}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Close Room
              </button>
            </div>
          </div>

          <iframe
            title="Task Tutor Live Room"
            src={activeRoom.url}
            className="w-full h-[65vh] rounded-lg border border-gray-200"
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">Loading sessions...</div>
          ) : visibleSessions.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600">Create a session or ask a peer for a private invite code.</p>
            </div>
          ) : (
            visibleSessions.map((session) => (
              <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-violet-600 rounded-full p-2">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{session.title}</h3>
                      <p className="text-sm text-gray-600">
                        {session.subject} • {session.memberCount} {session.memberCount === 1 ? "member" : "members"}
                      </p>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Code: {session.sessionCode || "N/A"}</span>
                        {session.isPrivate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.isLive
                          ? "Live now"
                          : `Starts ${new Date(session.startsAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}`}
                      </p>
                    </div>
                  </div>
                  {session.isLive ? (
                    <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">Live</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(session)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyInviteLink(session)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Link2 className="w-4 h-4" />
                    Share Invite Link
                  </button>
                  {copiedSessionId === session.id ? <span className="text-xs text-emerald-700 self-center">Copied</span> : null}

                  {session.hostUserId === userId ? (
                    <button
                      type="button"
                      onClick={() => handleCloseSession(session)}
                      disabled={closingSessionId === session.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {closingSessionId === session.id ? "Closing..." : "Close Session"}
                    </button>
                  ) : null}
                </div>

                {session.joined ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLiveRoom(session)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Open Live Room
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenRoomInNewTab(session)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
                    >
                      New Tab
                    </button>
                    <button
                      onClick={() => handleLeave(session.id)}
                      disabled={busySessionId === session.id}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {busySessionId === session.id ? "Please wait..." : "Leave Session"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(session.id)}
                    disabled={busySessionId === session.id}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {busySessionId === session.id ? "Please wait..." : "Join Session"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Session Insights</h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                <p className="font-medium text-gray-900">Total sessions</p>
                <p className="text-violet-700">{sessions.length}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-gray-900">Live right now</p>
                <p className="text-green-700">{sessions.filter((s) => s.isLive).length}</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-gray-900">You joined</p>
                <p className="text-blue-700">{sessions.filter((s) => s.joined).length}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="font-medium text-gray-900">Live Room Provider</p>
                <p className="text-emerald-700">Jitsi Meet</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">Signed in as: {userLabel}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Shared Materials</h2>
            <p className="text-xs text-gray-500 mb-4">Add links for notes, docs, and references your group can use.</p>

            {joinedSessions.length > 0 ? (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Session</label>
                <select
                  value={selectedMaterialsSessionId}
                  onChange={(e) => setSelectedMaterialsSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {joinedSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3 mb-3">
                Join a session to view and add shared materials.
              </div>
            )}

            <form onSubmit={handleAddMaterial} className="space-y-2 mb-4">
              <input
                type="text"
                value={newMaterialTitle}
                onChange={(e) => setNewMaterialTitle(e.target.value)}
                placeholder="Material title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!selectedMaterialsSession}
              />
              <input
                type="text"
                value={newMaterialUrl}
                onChange={(e) => setNewMaterialUrl(e.target.value)}
                placeholder="https://example.com/resource"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!selectedMaterialsSession}
              />
              <button
                type="submit"
                disabled={!selectedMaterialsSession || savingMaterial}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-60"
              >
                {savingMaterial ? "Adding..." : "Add Material"}
              </button>
            </form>

            <div className="mb-4">
              <label
                className={`w-full inline-flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm ${
                  selectedMaterialsSession && !uploadingMaterial
                    ? "text-gray-700 hover:bg-gray-50 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <Upload className="w-4 h-4" />
                {uploadingMaterial ? "Uploading file..." : "Upload File"}
                <input
                  type="file"
                  className="hidden"
                  disabled={!selectedMaterialsSession || uploadingMaterial}
                  onChange={handleUploadMaterialFile}
                />
              </label>
            </div>

            {materialsForSelectedSession.length === 0 ? (
              <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-3">
                {selectedMaterialsSession ? "No shared materials yet for this session." : "No session selected."}
              </div>
            ) : (
              <div className="space-y-2">
                {materialsForSelectedSession.map((item) => (
                  <div key={item.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <button
                          type="button"
                          onClick={() => handleOpenMaterial(item)}
                          disabled={openingMaterialId === item.id}
                          className="text-xs text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 truncate disabled:opacity-60"
                        >
                          {item.materialType === "file" ? <FileText className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                          <span className="truncate">
                            {openingMaterialId === item.id
                              ? "Opening..."
                              : item.materialType === "file"
                              ? item.fileName || item.title
                              : item.url}
                          </span>
                        </button>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {item.materialType === "file"
                            ? `${formatFileSize(item.fileSize)} • ${formatMaterialMeta(item)}`
                            : formatMaterialMeta(item)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(item)}
                        disabled={removingMaterialId === item.id}
                        className="text-red-600 hover:text-red-700 p-1 disabled:opacity-60"
                        aria-label="Remove material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
