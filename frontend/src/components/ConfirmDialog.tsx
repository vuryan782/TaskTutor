import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        e.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-[#ef4444] hover:bg-[#dc2626] text-white"
      : "bg-[#7c5cfc] hover:bg-[#6a4ce0] text-white";
  const iconTone =
    variant === "danger"
      ? "bg-[#ef4444]/15 text-[#ef4444]"
      : "bg-[#7c5cfc]/15 text-[#7c5cfc]";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="w-full max-w-md bg-[#16161e] border border-[#2a2a3a] rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${iconTone}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="confirm-dialog-title"
                className="text-lg font-semibold text-[#e8e8ed]"
              >
                {title}
              </h2>
              <p className="text-sm text-[#8b8b9e] mt-1">{message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-[#5c5c72] hover:text-[#e8e8ed] p-1 rounded disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#1c1c27] hover:bg-[#22222e] text-[#e8e8ed] px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-[#2a2a3a] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 ${confirmClasses} px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
