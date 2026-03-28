"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, X, Bug, Lightbulb, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackType = "bug" | "enhancement" | "idea";
type FeedbackPriority = "p0" | "p1" | "p2" | "p3";

interface FeedbackForm {
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
}

const typeConfig: Record<FeedbackType, { label: string; icon: React.ComponentType<{ className?: string }>; active: string }> = {
  bug: { label: "Bug", icon: Bug, active: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  enhancement: { label: "Enhancement", icon: Sparkles, active: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  idea: { label: "Idea", icon: Lightbulb, active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
};

const priorityConfig: Record<FeedbackPriority, { label: string; active: string }> = {
  p0: { label: "P0 Critical", active: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  p1: { label: "P1 High", active: "border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  p2: { label: "P2 Medium", active: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
  p3: { label: "P3 Low", active: "border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
};

export function FeedbackWidget({ user }: { user: { name: string; email: string } | null }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [currentUrl, setCurrentUrl] = useState("");
  const [form, setForm] = useState<FeedbackForm>({
    type: "bug",
    priority: "p2",
    title: "",
    description: "",
  });

  useEffect(() => {
    setCurrentUrl(window.location.pathname);
  }, [open]);

  const reset = () => {
    setStatus("idle");
    setForm({ type: "bug", priority: "p2", title: "", description: "" });
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
          url: window.location.href,
          pageTitle: document.title,
          user: user ? { name: user.name, email: user.email } : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          setOpen(false);
          reset();
        }, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center"
        title="Send feedback"
        aria-label="Open feedback form"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30"
          onClick={() => { setOpen(false); reset(); }}
        />
      )}

      {/* Feedback panel — slides up from bottom-right on desktop, bottom sheet on mobile */}
      <div
        className={cn(
          "fixed z-50 bg-card border rounded-xl shadow-2xl transition-all duration-200",
          // Mobile: bottom sheet
          "inset-x-3 bottom-3",
          // Desktop: anchored near trigger button
          "sm:inset-auto sm:right-6 sm:bottom-20 sm:w-96",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">Share Feedback</span>
          <button
            onClick={() => { setOpen(false); reset(); }}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, type: key }))}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        form.type === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
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
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, priority: key }))}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors",
                      form.priority === key ? cfg.active : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary *</p>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Brief description of the issue or request..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {/* Details */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Details (optional)</p>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Steps to reproduce, expected behavior, or additional context..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {/* Context footer */}
            <p className="text-[11px] text-muted-foreground">
              Page: <code className="font-mono bg-muted px-1 rounded">{currentUrl}</code>
              {user && <span className="ml-2">· {user.name}</span>}
            </p>

            {status === "error" && (
              <p className="text-xs text-destructive">Submission failed — feedback saved locally. Try again.</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!form.title.trim() || status === "submitting"}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" />
              {status === "submitting" ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
