"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquarePlus, X, Bug, Lightbulb, Sparkles, Send,
  Paperclip, Mic, MicOff, ImagePlus, Trash2, Bot, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type FeedbackType     = "bug" | "enhancement" | "idea" | "question" | "praise";
type FeedbackPriority = "p0" | "p1" | "p2" | "p3";
type PanelTab         = "ask" | "feedback" | "docs";

interface Attachment {
  id: string; name: string; mimeType: string; dataUrl: string;
  kind: "image" | "audio" | "file";
}
interface FeedbackForm {
  type: FeedbackType; priority: FeedbackPriority; title: string; description: string;
}
interface ChatMessage { role: "user" | "assistant"; content: string; }

// ── Config ────────────────────────────────────────────────────────────────────

const typeConfig: Record<FeedbackType, { label: string; emoji: string; icon: React.ComponentType<{ className?: string }>; active: string }> = {
  bug:         { label: "Bug",         emoji: "🐛", icon: Bug,       active: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  enhancement: { label: "Enhancement", emoji: "✨", icon: Sparkles,  active: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  idea:        { label: "Idea",        emoji: "💡", icon: Lightbulb, active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  question:    { label: "Question",    emoji: "❓", icon: Lightbulb, active: "border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  praise:      { label: "Praise",      emoji: "🌟", icon: Sparkles,  active: "border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
};
const priorityConfig: Record<FeedbackPriority, { label: string; active: string }> = {
  p0: { label: "P0 Critical", active: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  p1: { label: "P1 High",     active: "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  p2: { label: "P2 Medium",   active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  p3: { label: "P3 Low",      active: "border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
};

const FREE_QUESTIONS_LIMIT = 5;

const QUICK_LINKS = [
  { label: "Getting Started",      href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/getting-started.md" },
  { label: "Roles & Permissions",  href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/roles-and-permissions.md" },
  { label: "Ownership Transfer",   href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/ownership-transfer.md" },
  { label: "Platform Architecture",href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/platform-architecture.md" },
  { label: "API Reference",        href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/api-reference.md" },
  { label: "RELEASES.md",          href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/RELEASES.md" },
];

const STARTER_QUESTIONS = [
  "How do I install a plugin?",
  "What can the Owner role do?",
  "How do I connect my Anthropic API key?",
  "What are A.G.E. scores?",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resizeImage(dataUrl: string, maxPx = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) { const r = Math.min(maxPx/w, maxPx/h); w=Math.round(w*r); h=Math.round(h*r); }
      const c = document.createElement("canvas"); c.width=w; c.height=h;
      c.getContext("2d")!.drawImage(img,0,0,w,h);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
}
function formatSeconds(s: number) { const m=Math.floor(s/60); return `${m}:${String(s%60).padStart(2,"0")}`; }

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackWidget({ user }: { user: { name: string; email: string; role?: string } | null }) {
  const [open, setOpen]         = useState(false);
  const [tab, setTab]           = useState<PanelTab>("ask");
  const [currentUrl, setUrl]    = useState("");

  // Ask tab
  const [chatHistory, setHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion]   = useState("");
  const [asking, setAsking]       = useState(false);
  const [questionsUsed, setUsed]  = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Feedback tab
  const [status, setStatus]     = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [form, setForm]         = useState<FeedbackForm>({ type: "bug", priority: "p2", title: "", description: "" });
  const [attachments, setAttach]= useState<Attachment[]>([]);
  const [recording, setRec]     = useState(false);
  const [recTime, setRecTime]   = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<BlobPart[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (open) setUrl(window.location.pathname); }, [open]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const isPaidUser = user?.role === "Owner" || user?.role === "Admin" || user?.role === "Developer";
  const limitReached = !isPaidUser && questionsUsed >= FREE_QUESTIONS_LIMIT;

  // ── Ask ────────────────────────────────────────────────────────────────────

  const sendQuestion = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || asking || limitReached) return;
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    setHistory((h) => [...h, userMsg]);
    setQuestion("");
    setAsking(true);
    setUsed((n) => n + 1);

    try {
      // Read saved API key from localStorage (set in Settings → API Keys)
      let clientApiKey: string | undefined;
      try {
        const stored = localStorage.getItem("sdd-api-keys");
        if (stored) clientApiKey = (JSON.parse(stored) as Record<string, string>).anthropic || undefined;
      } catch { /* ignore */ }

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          pageContext: currentUrl,
          role: user?.role ?? "User",
          history: [...chatHistory, userMsg].slice(-6),
          ...(clientApiKey ? { apiKey: clientApiKey } : {}),
        }),
      });
      const data = await res.json() as { answer: string };
      setHistory((h) => [...h, { role: "assistant", content: data.answer }]);
    } catch {
      setHistory((h) => [...h, { role: "assistant", content: "Sorry, I couldn't reach the server. Please try again." }]);
    } finally {
      setAsking(false);
    }
  };

  // ── Feedback file helpers ─────────────────────────────────────────────────

  const addImageFile = async (file: File) => {
    const raw = await readAsDataUrl(file);
    const dataUrl = file.type.startsWith("image/") ? await resizeImage(raw) : raw;
    setAttach((p) => [...p, { id: crypto.randomUUID(), name: file.name||"image.jpg", mimeType: file.type||"image/jpeg", dataUrl, kind: "image" }]);
  };
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(e.target.files ?? [])) {
      if (file.type.startsWith("image/")) await addImageFile(file);
      else { const d = await readAsDataUrl(file); setAttach((p) => [...p, { id: crypto.randomUUID(), name: file.name, mimeType: file.type, dataUrl: d, kind: "file" }]); }
    }
    e.target.value = "";
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) await addImageFile(file);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!open || tab !== "feedback") return;
    for (const item of Array.from(e.clipboardData?.items ?? [])) {
      if (item.type.startsWith("image/")) { const f = item.getAsFile(); if (f) await addImageFile(f); }
    }
  }, [open, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.addEventListener("paste", handlePaste); return () => document.removeEventListener("paste", handlePaste); }, [handlePaste]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType||"audio/webm" });
        const dataUrl = await readAsDataUrl(blob as unknown as File);
        const ext = (mr.mimeType||"audio/webm").includes("mp4") ? "m4a" : "webm";
        setAttach((p) => [...p, { id: crypto.randomUUID(), name: `voice-note.${ext}`, mimeType: mr.mimeType||"audio/webm", dataUrl, kind: "audio" }]);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start(250); mediaRecRef.current = mr; setRec(true); setRecTime(0);
      let t = 0;
      timerRef.current = setInterval(() => { t++; setRecTime(t); if (t >= 120) stopRecording(); }, 1000);
    } catch { /* mic denied */ }
  };
  const stopRecording = () => { mediaRecRef.current?.stop(); if (timerRef.current) clearInterval(timerRef.current); setRec(false); setRecTime(0); };
  const removeAttachment = (id: string) => setAttach((p) => p.filter((a) => a.id !== id));

  const resetFeedback = () => { setStatus("idle"); setForm({ type: "bug", priority: "p2", title: "", description: "" }); setAttach([]); };
  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, url: window.location.href, pageTitle: document.title, user: user ? { name: user.name, email: user.email } : null, timestamp: new Date().toISOString(), attachments: attachments.map(({ name, mimeType, dataUrl, kind }) => ({ name, mimeType, dataUrl, kind })) }),
      });
      if (res.ok) { setStatus("success"); setTimeout(() => { setOpen(false); resetFeedback(); }, 2500); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  const close = () => { setOpen(false); resetFeedback(); };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*,audio/*,video/*,.pdf" multiple className="hidden" onChange={handleFileInput} />

      {/* Floating trigger */}
      <button
        onClick={() => { setOpen(true); setTab("ask"); }}
        className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center"
        title="Assistant & Feedback"
        aria-label="Open assistant"
      >
        <Bot className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-50 bg-black/30" onClick={close} />}

      {/* Panel */}
      <div className={cn(
        "fixed z-50 bg-card border rounded-xl shadow-2xl transition-all duration-200 flex flex-col",
        "inset-x-3 bottom-3 max-h-[92vh]",
        "sm:inset-auto sm:right-6 sm:bottom-20 sm:w-[28rem] sm:max-h-[88vh]",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Platform Assistant</span>
          </div>
          <button onClick={close} className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          {([
            { key: "ask",      label: "Ask AI",  icon: Bot },
            { key: "feedback", label: "Feedback",icon: MessageSquarePlus },
            { key: "docs",     label: "Docs",    icon: BookOpen },
          ] as { key: PanelTab; label: string; icon: React.ComponentType<{className?: string}> }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2",
                tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">

          {/* ── ASK TAB ─────────────────────────────────────────────────── */}
          {tab === "ask" && (
            <div className="flex flex-col h-full">
              {/* Chat history */}
              <div className="flex-1 p-4 space-y-3 min-h-[200px]">
                {chatHistory.length === 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Ask anything about the platform, roles, MCP tools, or drug discovery.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {STARTER_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendQuestion(q)}
                          className="rounded-lg border bg-muted/40 px-2.5 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors leading-snug"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    {!isPaidUser && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        Free tier: {FREE_QUESTIONS_LIMIT - questionsUsed} question{FREE_QUESTIONS_LIMIT - questionsUsed !== 1 ? "s" : ""} remaining this session.{" "}
                        <span className="text-primary">Upgrade to Owner/Admin for unlimited.</span>
                      </p>
                    )}
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "rounded-xl px-3 py-2 text-sm max-w-[85%] leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}>
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 mb-1 opacity-60">
                          <Bot className="h-3 w-3" />
                          <span className="text-[10px] font-medium">Assistant</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex justify-start">
                    <div className="rounded-xl bg-muted px-3 py-2 text-sm rounded-bl-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input row */}
              <div className="p-3 border-t shrink-0">
                {limitReached ? (
                  <div className="rounded-lg bg-muted/50 p-3 text-center space-y-1">
                    <p className="text-xs text-muted-foreground">Free question limit reached for this session.</p>
                    <p className="text-xs text-primary">Upgrade your role to Admin+ for unlimited questions.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuestion(question); } }}
                      placeholder="Ask about the platform…"
                      rows={1}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ minHeight: "2.4rem", maxHeight: "6rem" }}
                    />
                    <button
                      onClick={() => sendQuestion(question)}
                      disabled={!question.trim() || asking}
                      className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {!isPaidUser && !limitReached && (
                  <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
                    {FREE_QUESTIONS_LIMIT - questionsUsed} / {FREE_QUESTIONS_LIMIT} free questions
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── FEEDBACK TAB ─────────────────────────────────────────────── */}
          {tab === "feedback" && (
            <div className="p-4 space-y-3">
              {status === "success" ? (
                <div className="py-8 text-center space-y-2">
                  <div className="text-3xl">✅</div>
                  <p className="font-semibold">Ticket submitted!</p>
                  <p className="text-sm text-muted-foreground">The support team will review it shortly.</p>
                  <button onClick={resetFeedback} className="text-xs text-primary hover:underline">Submit another</button>
                </div>
              ) : (
                <>
                  {/* Quick type chips — emoji + label, one row */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.entries(typeConfig) as [FeedbackType, typeof typeConfig[FeedbackType]][]).map(([key, cfg]) => (
                      <button key={key} onClick={() => setForm((f) => ({ ...f, type: key }))}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                          form.type === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent"
                        )}>
                        <span>{cfg.emoji}</span>{cfg.label}
                      </button>
                    ))}
                  </div>

                  {/* Title — primary field, required */}
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={form.type === "bug" ? "Describe the bug…" : form.type === "praise" ? "What did you love?" : form.type === "question" ? "What's your question?" : "Short description…"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && form.title.trim() && handleSubmit()}
                    autoFocus
                  />

                  {/* Optional details — collapsed by default */}
                  <details className="group">
                    <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground select-none list-none flex items-center gap-1">
                      <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                      Add details, priority, or attachments…
                    </summary>
                    <div className="mt-2 space-y-3">
                      {/* Priority */}
                      <div className="grid grid-cols-4 gap-1">
                        {(Object.entries(priorityConfig) as [FeedbackPriority, typeof priorityConfig[FeedbackPriority]][]).map(([key, cfg]) => (
                          <button key={key} onClick={() => setForm((f) => ({ ...f, priority: key }))}
                            className={cn("rounded-md border px-1 py-1 text-[10px] font-medium transition-colors",
                              form.priority === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent")}>
                            {cfg.label}
                          </button>
                        ))}
                      </div>
                      {/* Details textarea */}
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Steps to reproduce, expected vs actual, or any extra context…"
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                      {/* Attachments drop zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={cn("rounded-lg border-2 border-dashed px-3 py-2.5 transition-colors", dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50")}
                      >
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                            <ImagePlus className="h-3.5 w-3.5" />Screenshot
                          </button>
                          {!recording ? (
                            <button type="button" onClick={startRecording}
                              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors">
                              <Mic className="h-3.5 w-3.5" />Voice note
                            </button>
                          ) : (
                            <button type="button" onClick={stopRecording}
                              className="flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 dark:bg-red-950 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 animate-pulse">
                              <MicOff className="h-3.5 w-3.5" />{formatSeconds(recTime)} Stop
                            </button>
                          )}
                        </div>
                      </div>
                      {attachments.length > 0 && (
                        <div className="space-y-1.5">
                          {attachments.map((att) => (
                            <div key={att.id} className="flex items-center gap-2 rounded-lg border p-2">
                              {att.kind === "image" && <img src={att.dataUrl} alt={att.name} className="h-8 w-8 rounded object-cover border shrink-0" />}
                              {att.kind === "audio" && <audio controls src={att.dataUrl} className="h-7 w-28 max-w-full shrink-0" />}
                              {att.kind === "file" && <div className="h-7 w-7 shrink-0 rounded bg-muted flex items-center justify-center"><Paperclip className="h-3.5 w-3.5 text-muted-foreground" /></div>}
                              <p className="text-xs truncate flex-1">{att.name}</p>
                              <button onClick={() => removeAttachment(att.id)} className="p-1 rounded text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>

                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentUrl} {user && `· ${user.name}`}
                  </p>
                  {status === "error" && <p className="text-xs text-destructive">Submission failed — please try again.</p>}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!form.title.trim() || status === "submitting"}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    {status === "submitting" ? "Submitting…" : `Submit${attachments.length > 0 ? ` (${attachments.length} file${attachments.length > 1 ? "s" : ""})` : ""}`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── DOCS TAB ──────────────────────────────────────────────────── */}
          {tab === "docs" && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Platform documentation lives in the <code className="bg-muted px-1 rounded font-mono">/docs</code> directory on GitHub. Ask the AI assistant any question, or browse the pages below.
              </p>
              <div className="space-y-1.5">
                {QUICK_LINKS.map(({ label, href }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:bg-accent transition-colors group">
                    <span>{label}</span>
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                  </a>
                ))}
              </div>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium">Can&apos;t find an answer?</p>
                <p className="text-xs text-muted-foreground">Switch to the <strong>Ask AI</strong> tab — the assistant has read all the docs and can answer follow-up questions.</p>
                <button onClick={() => setTab("ask")} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 w-full mt-1">
                  Ask the assistant →
                </button>
              </div>
              {!isPaidUser && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                  <p className="text-xs font-medium text-primary">Agentic features (paid)</p>
                  <p className="text-xs text-muted-foreground">Admin+ roles unlock unlimited questions, proactive suggestions, file analysis, and automated task execution from the assistant.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
