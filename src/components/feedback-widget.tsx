"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquarePlus, X, Bug, Lightbulb, Sparkles, Send,
  Paperclip, Mic, MicOff, ImagePlus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType     = "bug" | "enhancement" | "idea";
type FeedbackPriority = "p0" | "p1" | "p2" | "p3";

interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;       // base64 data URL (images resized to ≤800px)
  kind: "image" | "audio" | "file";
}

interface FeedbackForm {
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const typeConfig: Record<FeedbackType, { label: string; icon: React.ComponentType<{ className?: string }>; active: string }> = {
  bug:         { label: "Bug",         icon: Bug,      active: "border-red-300    bg-red-50    text-red-700    dark:bg-red-950    dark:text-red-300"    },
  enhancement: { label: "Enhancement", icon: Sparkles, active: "border-blue-300   bg-blue-50   text-blue-700   dark:bg-blue-950   dark:text-blue-300"   },
  idea:        { label: "Idea",        icon: Lightbulb,active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
};

const priorityConfig: Record<FeedbackPriority, { label: string; active: string }> = {
  p0: { label: "P0 Critical", active: "border-red-300    bg-red-50    text-red-700    dark:bg-red-950    dark:text-red-300"    },
  p1: { label: "P1 High",     active: "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  p2: { label: "P2 Medium",   active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  p3: { label: "P3 Low",      active: "border-green-300  bg-green-50  text-green-700  dark:bg-green-950  dark:text-green-300"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resize an image to ≤maxPx on the longest side, returns JPEG data URL */
function resizeImage(dataUrl: string, maxPx = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        const r = Math.min(maxPx / w, maxPx / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width  = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl); // fall back to original
    img.src = dataUrl;
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackWidget({ user }: { user: { name: string; email: string } | null }) {
  const [open, setOpen]             = useState(false);
  const [status, setStatus]         = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [currentUrl, setCurrentUrl] = useState("");
  const [form, setForm]             = useState<FeedbackForm>({ type: "bug", priority: "p2", title: "", description: "" });
  const [attachments, setAttach]    = useState<Attachment[]>([]);
  const [recording, setRecording]   = useState(false);
  const [recTime, setRecTime]       = useState(0);
  const [dragOver, setDragOver]     = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const mediaRecRef   = useRef<MediaRecorder | null>(null);
  const chunksRef     = useRef<BlobPart[]>([]);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (open) setCurrentUrl(window.location.pathname); }, [open]);

  // ── Paste anywhere while panel is open ──────────────────────────────────────
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!open) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) await addImageFile(file);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // ── File helpers ─────────────────────────────────────────────────────────────

  const addImageFile = async (file: File) => {
    const raw     = await readAsDataUrl(file);
    const dataUrl = file.type.startsWith("image/") ? await resizeImage(raw) : raw;
    setAttach((prev) => [...prev, {
      id:       crypto.randomUUID(),
      name:     file.name || "image.jpg",
      mimeType: file.type || "image/jpeg",
      dataUrl,
      kind:     "image",
    }]);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        await addImageFile(file);
      } else {
        const dataUrl = await readAsDataUrl(file);
        setAttach((prev) => [...prev, {
          id: crypto.randomUUID(), name: file.name,
          mimeType: file.type, dataUrl, kind: "file",
        }]);
      }
    }
    e.target.value = "";
  };

  // ── Drag & drop ──────────────────────────────────────────────────────────────

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      await addImageFile(file);
    }
  };

  // ── Audio recording ──────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob    = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dataUrl = await readAsDataUrl(blob as unknown as File);
        const ext     = (mr.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        setAttach((prev) => [...prev, {
          id: crypto.randomUUID(), name: `voice-note.${ext}`,
          mimeType: mr.mimeType || "audio/webm", dataUrl, kind: "audio",
        }]);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(250);
      mediaRecRef.current = mr;
      setRecording(true);
      setRecTime(0);
      let t = 0;
      timerRef.current = setInterval(() => {
        t++;
        setRecTime(t);
        if (t >= 120) stopRecording(); // 2 min max
      }, 1000);
    } catch {
      // Mic permission denied or not available — silently ignore
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setRecTime(0);
  };

  const removeAttachment = (id: string) =>
    setAttach((prev) => prev.filter((a) => a.id !== id));

  // ── Form submit ──────────────────────────────────────────────────────────────

  const reset = () => {
    setStatus("idle");
    setForm({ type: "bug", priority: "p2", title: "", description: "" });
    setAttach([]);
    setRecording(false);
    setRecTime(0);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          url:       window.location.href,
          pageTitle: document.title,
          user:      user ? { name: user.name, email: user.email } : null,
          timestamp: new Date().toISOString(),
          attachments: attachments.map(({ name, mimeType, dataUrl, kind }) => ({ name, mimeType, dataUrl, kind })),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => { setOpen(false); reset(); }, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*,.pdf"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center"
        title="Send feedback"
        aria-label="Open feedback form"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30"
          onClick={() => { setOpen(false); reset(); }} />
      )}

      {/* Panel */}
      <div className={cn(
        "fixed z-50 bg-card border rounded-xl shadow-2xl transition-all duration-200 flex flex-col",
        "inset-x-3 bottom-3 max-h-[92vh]",
        "sm:inset-auto sm:right-6 sm:bottom-20 sm:w-[26rem] sm:max-h-[88vh]",
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <span className="font-semibold text-sm">Share Feedback</span>
          <button onClick={() => { setOpen(false); reset(); }}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {status === "success" ? (
            <div className="p-8 text-center space-y-2">
              <div className="text-3xl">✅</div>
              <p className="font-semibold">Feedback submitted!</p>
              <p className="text-sm text-muted-foreground">
                Logged and a GitHub issue has been created for the team to review.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">

              {/* Type */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Type</p>
                <div className="flex gap-2">
                  {(Object.entries(typeConfig) as [FeedbackType, typeof typeConfig[FeedbackType]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button key={key} onClick={() => setForm((f) => ({ ...f, type: key }))}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                          form.type === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent"
                        )}>
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Priority</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.entries(priorityConfig) as [FeedbackPriority, typeof priorityConfig[FeedbackPriority]][]).map(([key, cfg]) => (
                    <button key={key} onClick={() => setForm((f) => ({ ...f, priority: key }))}
                      className={cn(
                        "rounded-lg border px-1 py-1.5 text-[11px] font-medium transition-colors",
                        form.priority === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent"
                      )}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary *</p>
                <input type="text" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of the issue or request…"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                />
              </div>

              {/* Details */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Details (optional)</p>
                <textarea value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Steps to reproduce, expected behavior, or additional context…"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* ── Attachments ─────────────────────────────────────────────── */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Attachments (optional)
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors",
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <p className="text-xs text-muted-foreground mb-3">
                    Paste a screenshot, drag & drop, or pick from your device
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {/* File / gallery picker */}
                    <button type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Gallery / Camera
                    </button>

                    {/* Audio recorder */}
                    {!recording ? (
                      <button type="button" onClick={startRecording}
                        className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors">
                        <Mic className="h-3.5 w-3.5" />
                        Voice Note
                      </button>
                    ) : (
                      <button type="button" onClick={stopRecording}
                        className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 dark:bg-red-950 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300 animate-pulse">
                        <MicOff className="h-3.5 w-3.5" />
                        {formatSeconds(recTime)} — Stop
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    You can also <kbd className="rounded border px-1 font-mono text-[10px]">Ctrl/⌘ V</kbd> to paste a screenshot
                  </p>
                </div>

                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-start gap-2 rounded-lg border p-2">
                        {att.kind === "image" && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={att.dataUrl} alt={att.name}
                            className="h-16 w-16 rounded object-cover border shrink-0" />
                        )}
                        {att.kind === "audio" && (
                          <div className="shrink-0 pt-1">
                            <audio controls src={att.dataUrl} className="h-8 w-40 max-w-full" />
                          </div>
                        )}
                        {att.kind === "file" && (
                          <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{att.name}</p>
                          <p className="text-[10px] text-muted-foreground">{att.mimeType}</p>
                        </div>
                        <button onClick={() => removeAttachment(att.id)}
                          className="shrink-0 p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Context */}
              <p className="text-[11px] text-muted-foreground">
                Page: <code className="font-mono bg-muted px-1 rounded">{currentUrl}</code>
                {user && <span className="ml-2">· {user.name}</span>}
              </p>

              {status === "error" && (
                <p className="text-xs text-destructive">Submission failed — please try again.</p>
              )}

              <button onClick={handleSubmit}
                disabled={!form.title.trim() || status === "submitting"}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
                <Send className="h-4 w-4" />
                {status === "submitting" ? "Submitting…" : `Submit Feedback${attachments.length > 0 ? ` + ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}` : ""}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
