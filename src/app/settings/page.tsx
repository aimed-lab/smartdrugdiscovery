"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_CONFIG } from "@/lib/platform-config";
import { RoleAvatar } from "@/components/role-avatar";
import { ROLE_META, type AppRole, hasRole } from "@/lib/roles";
import {
  MODULE_GROUPS, MODULE_LABELS, CONFIGURABLE_ROLES,
  type AccessLevel, type ModuleKey, type ModuleAccessConfig,
  loadModuleAccess, saveModuleAccess,
} from "@/lib/module-access";
import { MembersPanel } from "@/components/members-panel";

export default function SettingsPage() {
  const { user, updateUser, initiateOwnerTransfer, cancelOwnerTransfer } = useAuth();

  // Ownership transfer state
  const [transferEmail, setTransferEmail] = useState("");
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  function getTransferHoursLeft(): number {
    if (!user?.pendingOwnerTransfer) return 0;
    const initiated = new Date(user.pendingOwnerTransfer.initiatedAt).getTime();
    const elapsed   = (Date.now() - initiated) / 1000 / 3600;
    return Math.max(0, 24 - elapsed);
  }
  const hoursLeft = getTransferHoursLeft();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    orgEmail: "",
    role: "",
    org: "",
    linkedin: "",
    twitter: "",
    orcid: "",
  });

  // Org email verification state
  const [orgEmailState, setOrgEmailState] = useState<"idle" | "sending" | "sent" | "verified">("idle");
  const [orgEmailCode, setOrgEmailCode] = useState("");
  const MOCK_CODE = "123456"; // In production this would be a server-generated OTP

  function handleSendOrgVerification() {
    if (!profile.orgEmail.includes("@") || profile.orgEmail === profile.email) return;
    setOrgEmailState("sending");
    setTimeout(() => setOrgEmailState("sent"), 1200);
  }

  function handleVerifyOrgCode() {
    if (orgEmailCode === MOCK_CODE) {
      setOrgEmailState("verified");
      // Persist verified org email immediately so it survives a page reload
      updateUser({ orgEmail: profile.orgEmail, orgEmailVerified: true });
    }
  }

  // Save confirmation banner
  const [saveConfirm, setSaveConfirm] = useState(false);

  // Only populate form fields on initial load (when user first appears from localStorage).
  // Using a ref flag prevents updateUser() calls (which mutate `user`) from resetting
  // form fields the user is actively editing.
  const profileLoaded = useRef(false);
  useEffect(() => {
    if (user && !profileLoaded.current) {
      profileLoaded.current = true;
      setProfile({
        name:     user.name,
        email:    user.email,
        orgEmail: user.orgEmail  ?? "",
        role:     user.title || user.role,
        org:      user.institution,
        linkedin: user.linkedin  ?? "",
        twitter:  user.twitter   ?? "",
        orcid:    user.orcid     ?? "",
      });
      // Restore verified state if previously saved
      if (user.orgEmailVerified && user.orgEmail) {
        setOrgEmailState("verified");
      }
    }
  }, [user]);

  // Avatar editor
  const [emojiInput, setEmojiInput] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [photoUploading, setPhotoUploading] = useState(false);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset immediately so same file can be picked again
    setPhotoUploading(true);

    // Use createObjectURL to avoid browser restrictions on data: URIs for Image src
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height, 200);
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const sx = (img.width  - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      updateUser({ avatarType: "photo", avatarPhoto: canvas.toDataURL("image/jpeg", 0.85) });
      setPhotoUploading(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback: store raw base64 without resize
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        updateUser({ avatarType: "photo", avatarPhoto: dataUrl });
        setPhotoUploading(false);
      };
      reader.onerror = () => setPhotoUploading(false);
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  }

  function applyEmoji() {
    const em = Array.from(emojiInput).find(c => c.trim()) ?? "";
    if (!em) return;
    updateUser({ avatar: em, avatarType: "emoji", avatarPhoto: undefined });
    setEmojiInput("");
  }

  function resetToInitials() {
    if (!user) return;
    const initials = user.name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    updateUser({ avatar: initials, avatarType: "initials", avatarPhoto: undefined });
  }

  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({
    anthropic: false,
    openai: false,
    google: false,
    deepseek: false,
    groq: false,
    perplexity: false,
    kimi: false,
    glm: false,
    chembl: false,
    pubmed: false,
    uniprot: false,
    pdb: false,
  });

  // Editable API key values (loaded from/saved to localStorage)
  const [editableKeys, setEditableKeys] = useState<Record<string, string>>({
    anthropic: "",
    openai: "",
    google: "",
    deepseek: "",
    groq: "",
    perplexity: "",
    kimi: "",
    glm: "",
    chembl: "",
    pubmed: "",
    uniprot: "",
    pdb: "",
  });
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Load saved keys on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sdd-api-keys");
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        setEditableKeys((prev) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
  }, []);

  function saveApiKeys() {
    localStorage.setItem("sdd-api-keys", JSON.stringify(editableKeys));
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 3000);
  }

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sdd-theme") === "dark" ||
        document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [defaultProject, setDefaultProject] = useState("project-alpha");
  const [notifications, setNotifications] = useState({
    experimentCompletion: true,
    compoundScreening: true,
    projectMilestone: true,
    weeklySummary: false,
  });
  const [language, setLanguage] = useState("en");
  const [autoSave, setAutoSave] = useState("5");

  const apiKeys = [
    {
      id: "anthropic",
      name: "Anthropic API",
      key: "sk-ant-api03-xxxx-xxxx",
      description: "Claude Sonnet 4.5, Claude Opus 4 — powers Platform Assistant",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "openai",
      name: "OpenAI API",
      key: "sk-xxxx-xxxx-xxxx",
      description: "GPT-4o, GPT-4o mini — analysis and generation",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "google",
      name: "Google Gemini API",
      key: "AIza-xxxx-xxxx",
      description: "Gemini 2.5 Flash, Gemini 2.0 Flash — Google AI models",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "deepseek",
      name: "DeepSeek API",
      key: "sk-xxxx-xxxx",
      description: "DeepSeek-V3 (Chat) and DeepSeek-R1 (Reasoner) — cost-effective",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "groq",
      name: "Groq Cloud API",
      key: "gsk_xxxx-xxxx",
      description: "Llama 3.3 70B — ultra-fast open-model inference",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "perplexity",
      name: "Perplexity API",
      key: "pplx-xxxx-xxxx",
      description: "Sonar Pro — search-augmented AI with real-time web results",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "kimi",
      name: "Kimi (Moonshot) API",
      key: "sk-xxxx-xxxx",
      description: "Moonshot v1 models — up to 128K context window",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "glm",
      name: "GLM (Zhipu AI) API",
      key: "xxxx.xxxx",
      description: "GLM-4 Plus, GLM-4 Flash — Chinese AI foundation models",
      lastUsed: "Configure your own key",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "chembl",
      name: "ChEMBL API",
      key: "sk-chembl-xxxx-xxxx-xxxx-1234",
      description: "Compound and bioactivity database (MCP server)",
      lastUsed: "2 hours ago",
      modelProvider: false,
      serverSide: false,
    },
    {
      id: "pubmed",
      name: "PubMed API",
      key: "pm-api-xxxx-xxxx-5678",
      description: "Literature search and article retrieval (MCP server)",
      lastUsed: "1 day ago",
      modelProvider: false,
      serverSide: false,
    },
    {
      id: "uniprot",
      name: "UniProt API",
      key: "up-xxxx-xxxx-3456",
      description: "Protein sequence and functional information",
      lastUsed: "5 days ago",
      modelProvider: false,
      serverSide: false,
    },
    {
      id: "pdb",
      name: "PDB API",
      key: "pdb-xxxx-xxxx-7890",
      description: "Protein Data Bank structure access",
      lastUsed: "1 week ago",
      modelProvider: false,
      serverSide: false,
    },
  ];

  function maskKey(key: string, visible: boolean): string {
    if (visible) return key;
    const parts = key.split("-");
    if (parts.length <= 2) return key;
    const first = parts[0];
    const last = parts[parts.length - 1];
    const middle = parts.slice(1, -1).map(() => "••••••").join("-");
    return `${first}-${middle}-${last}`;
  }

  function toggleKeyVisibility(id: string) {
    setKeyVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, API keys, and platform preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Legal</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          {hasRole(user?.role, "Admin") && (
            <TabsTrigger value="members">Members</TabsTrigger>
          )}
          {hasRole(user?.role, "Admin") && (
            <TabsTrigger value="access-control">Access Control</TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details and organization info
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar display + editor */}
              <div className="flex flex-wrap items-start gap-6">
                {/* Large avatar — uses same RoleAvatar as sidebar */}
                {user && (
                  <RoleAvatar user={user} size="lg" onClick={() => photoInputRef.current?.click()} title="Click to upload photo" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold">{profile.name}</p>
                  <p className="text-sm text-muted-foreground mb-3">{profile.role}</p>

                  {/* Role badge */}
                  {user && (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_META[user.role]?.color ?? ""}`}>
                      {user.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar customization */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Customize Avatar</p>
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Photo upload */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Photo</p>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-60"
                    >
                      {photoUploading ? "Uploading…" : "Upload photo"}
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>

                  {/* Emoji input */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Emoji</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="🧬"
                        className="w-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                        value={emojiInput}
                        onChange={(e) => setEmojiInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyEmoji()}
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={applyEmoji}
                        disabled={!emojiInput.trim()}
                        className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-40"
                      >
                        Use
                      </button>
                    </div>
                  </div>

                  {/* Reset to initials */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reset</p>
                    <button
                      type="button"
                      onClick={resetToInitials}
                      className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Use initials
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70">
                  Role color ({user?.role}) is shown as solid background (initials) or glow ring (emoji/photo) — synchronized with the sidebar.
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Personal Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role / Title</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={profile.role}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, role: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organization</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={profile.org}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, org: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Organization email verification */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Organization Email</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verify your institutional email to unlock org-level features.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    className={inputClass + " flex-1"}
                    value={profile.orgEmail}
                    disabled={orgEmailState === "verified"}
                    onChange={(e) => {
                      setProfile((prev) => ({ ...prev, orgEmail: e.target.value }));
                      if (orgEmailState !== "idle") setOrgEmailState("idle");
                      setOrgEmailCode("");
                    }}
                  />
                  {orgEmailState === "verified" ? (
                    <span className="flex items-center gap-1.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-2 text-sm font-medium shrink-0">
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOrgVerification}
                      disabled={!profile.orgEmail || orgEmailState === "sending"}
                      className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {orgEmailState === "sending" ? "Sending…" : orgEmailState === "sent" ? "Resend" : "Send Code"}
                    </button>
                  )}
                </div>
                {orgEmailState === "sent" && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className={inputClass + " w-48 font-mono tracking-widest"}
                      value={orgEmailCode}
                      onChange={(e) => setOrgEmailCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      onClick={handleVerifyOrgCode}
                      disabled={orgEmailCode.length < 6}
                      className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                    >
                      Verify
                    </button>
                    <p className="text-xs text-muted-foreground">(demo code: 123456)</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Social / researcher profiles */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Researcher Profiles</label>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-bold text-[#0A66C2]">in</span> LinkedIn
                    </label>
                    <input
                      type="url"
                      placeholder="linkedin.com/in/username"
                      className={inputClass}
                      value={profile.linkedin}
                      onChange={(e) => setProfile((prev) => ({ ...prev, linkedin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-bold">𝕏</span> X / Twitter
                    </label>
                    <input
                      type="text"
                      placeholder="@handle"
                      className={inputClass}
                      value={profile.twitter}
                      onChange={(e) => setProfile((prev) => ({ ...prev, twitter: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="font-bold text-[#A6CE39]">ID</span> ORCID iD
                    </label>
                    <input
                      type="text"
                      placeholder="0000-0000-0000-0000"
                      pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]"
                      className={inputClass + " font-mono"}
                      value={profile.orcid}
                      onChange={(e) => setProfile((prev) => ({ ...prev, orcid: e.target.value }))}
                    />
                    {profile.orcid && (
                      <a
                        href={`https://orcid.org/${profile.orcid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary underline underline-offset-2"
                      >
                        View ORCID profile ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Platform Access Role</label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your role controls which features and settings are visible.
                  </p>
                </div>

                {user?.role === "Owner" ? (
                  /* Owner — locked, show all role cards for preview only */
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["Owner","Admin","TechSupport","Developer","User"] as import("@/lib/roles").AppRole[]).map((r) => (
                        <div
                          key={r}
                          className={`rounded-lg border p-3 space-y-1 ${r === "Owner" ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20" : "opacity-50"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${ROLE_META[r]?.dot ?? "bg-gray-400"}`} />
                            <span className="text-sm font-medium">{r}</span>
                            {r === "Owner" && <span className="text-[10px] text-orange-600 dark:text-orange-400 ml-auto">🔒 Active</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">{ROLE_META[r]?.description ?? ""}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground italic">Owner role is locked. To switch roles, transfer ownership first.</p>
                  </div>
                ) : (
                  /* Non-owner — interactive role cards */
                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["Admin","TechSupport","Developer","User"] as import("@/lib/roles").AppRole[]).map((r) => {
                        const active = user?.role === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => updateUser({ role: r })}
                            className={`rounded-lg border p-3 text-left space-y-1 transition-all hover:shadow-sm ${active ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full shrink-0 ${ROLE_META[r]?.dot ?? "bg-gray-400"}`} />
                              <span className="text-sm font-medium">{r}</span>
                              {active && <span className="text-[10px] text-primary ml-auto font-medium">● Active</span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">{ROLE_META[r]?.description ?? ""}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground italic">Role changes take effect immediately across all pages.</p>
                  </div>
                )}
              </div>

              {/* Ownership Transfer — intentionally low-profile, Owner only */}
              {user?.role === "Owner" && (
                <div className="pt-1">
                  {user.pendingOwnerTransfer ? (
                    <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 px-3 py-2.5 text-sm space-y-2">
                      <p className="font-medium text-yellow-800 dark:text-yellow-300 text-xs">⏳ Ownership transfer pending → {user.pendingOwnerTransfer.toEmail}</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {hoursLeft > 0
                          ? `Completes in ~${Math.ceil(hoursLeft)} hour${Math.ceil(hoursLeft) !== 1 ? "s" : ""} — you can cancel below.`
                          : "Cooling-off period complete — transfer finalises on next login."}
                      </p>
                      <button onClick={cancelOwnerTransfer} className="text-xs text-destructive hover:underline">Cancel transfer</button>
                    </div>
                  ) : (
                    <details className="group">
                      <summary className="cursor-pointer text-[11px] text-muted-foreground/60 hover:text-muted-foreground select-none list-none flex items-center gap-1 w-fit">
                        <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                        Transfer platform ownership…
                      </summary>
                      <div className="mt-3 rounded-lg border border-dashed p-3 space-y-2">
                        <p className="text-xs text-muted-foreground">Enter the email of the new Owner. They must have a platform account. A 24-hr cooling-off period applies.</p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="newowner@university.edu"
                            className={inputClass + " flex-1 text-xs"}
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                          />
                          <button
                            disabled={!transferEmail.includes("@")}
                            onClick={() => setTransferConfirmOpen(true)}
                            className="shrink-0 rounded-md border border-orange-400 text-orange-700 dark:text-orange-300 px-3 py-1.5 text-xs hover:bg-orange-50 dark:hover:bg-orange-950/30 disabled:opacity-40 transition-colors"
                          >
                            Initiate
                          </button>
                        </div>
                        {transferConfirmOpen && (
                          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                            <p className="text-xs font-medium text-destructive">Confirm: transfer ownership to {transferEmail}?</p>
                            <p className="text-[11px] text-muted-foreground">You remain Owner during the 24-hr window and can cancel at any time.</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { initiateOwnerTransfer(transferEmail); setTransferConfirmOpen(false); setTransferEmail(""); }}
                                className="flex-1 rounded-md bg-destructive text-destructive-foreground px-3 py-1.5 text-xs font-medium hover:bg-destructive/90"
                              >
                                Yes, start transfer
                              </button>
                              <button
                                onClick={() => setTransferConfirmOpen(false)}
                                className="flex-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Save confirmation */}
              {saveConfirm && (
                <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 px-4 py-2.5 text-sm text-green-800 dark:text-green-300 flex items-center justify-between">
                  <span>✓ Profile saved to local storage</span>
                  <span className="text-xs text-green-600 dark:text-green-400 italic ml-3">
                    Note: persisted in your browser — a server DB can be connected later.
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // Only regenerate initials if user hasn't set emoji/photo
                    const avatarType = user?.avatarType ?? "initials";
                    const newAvatar = avatarType === "initials"
                      ? profile.name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()
                      : user?.avatar ?? "";
                    updateUser({
                      name:             profile.name,
                      email:            profile.email,
                      title:            profile.role,
                      institution:      profile.org,
                      avatar:           newAvatar,
                      orgEmail:         profile.orgEmail || undefined,
                      orgEmailVerified: orgEmailState === "verified",
                      linkedin:         profile.linkedin  || undefined,
                      twitter:          profile.twitter   || undefined,
                      orcid:            profile.orcid     || undefined,
                    });
                    setSaveConfirm(true);
                    setTimeout(() => setSaveConfirm(false), 4000);
                  }}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Save Profile
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage keys for AI model providers and external data sources. Your API key powers the <span className="font-semibold text-primary">Platform Assistant</span> (bottom-right chat bot) and the <a href="/models" className="text-primary underline underline-offset-2">Foundation Models</a> page. Set up at least one provider key (Anthropic, OpenAI, or Groq) to activate the assistant.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Model Provider Keys */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">AI Model Providers</p>
            {apiKeys.filter((k) => k.modelProvider).map((ak) => (
              <Card key={ak.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{ak.name}</p>
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">Foundation Model</span>
                        {ak.serverSide && (
                          <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 text-[10px] font-medium">✓ Server env var</span>
                        )}
                        {!ak.serverSide && editableKeys[ak.id] && (
                          <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 text-[10px] font-medium">✓ Saved locally</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{ak.description}</p>
                    </div>
                  </div>
                  {/* Anthropic: show both env-var status and optional client key input */}
                  {ak.serverSide ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground italic">Server env var active — AI chat will use it automatically.</p>
                      <details className="group">
                        <summary className="cursor-pointer text-[11px] text-muted-foreground/70 hover:text-muted-foreground select-none list-none flex items-center gap-1 w-fit">
                          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                          Override with a personal API key…
                        </summary>
                        <div className="mt-2 flex gap-2">
                          <input
                            type={keyVisibility[ak.id] ? "text" : "password"}
                            placeholder="sk-ant-api03-…"
                            className={inputClass + " flex-1 font-mono text-xs"}
                            value={editableKeys[ak.id] ?? ""}
                            onChange={(e) => setEditableKeys((p) => ({ ...p, [ak.id]: e.target.value }))}
                            autoComplete="off"
                          />
                          <button onClick={() => toggleKeyVisibility(ak.id)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent shrink-0">
                            {keyVisibility[ak.id] ? "Hide" : "Show"}
                          </button>
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type={keyVisibility[ak.id] ? "text" : "password"}
                        placeholder={ak.id === "groq" ? "gsk-…" : ak.id === "openai" ? "sk-…" : "API key…"}
                        className={inputClass + " flex-1 font-mono text-xs"}
                        value={editableKeys[ak.id] ?? ""}
                        onChange={(e) => setEditableKeys((p) => ({ ...p, [ak.id]: e.target.value }))}
                        autoComplete="off"
                      />
                      <button onClick={() => toggleKeyVisibility(ak.id)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent shrink-0">
                        {keyVisibility[ak.id] ? "Hide" : "Show"}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Data Source Keys */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-2">Data Sources & Services</p>
            {apiKeys.filter((k) => !k.modelProvider).map((ak) => (
              <Card key={ak.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium">{ak.name}</p>
                    <p className="text-xs text-muted-foreground">{ak.description}</p>
                    {editableKeys[ak.id] && (
                      <span className="inline-flex rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 text-[10px] font-medium">✓ Saved locally</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type={keyVisibility[ak.id] ? "text" : "password"}
                      placeholder="API key…"
                      className={inputClass + " flex-1 font-mono text-xs"}
                      value={editableKeys[ak.id] ?? ""}
                      onChange={(e) => setEditableKeys((p) => ({ ...p, [ak.id]: e.target.value }))}
                      autoComplete="off"
                    />
                    <button onClick={() => toggleKeyVisibility(ak.id)} className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent shrink-0">
                      {keyVisibility[ak.id] ? "Hide" : "Show"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Save button */}
            <div className="flex items-center justify-between pt-2">
              {apiKeySaved && (
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">✓ API keys saved to browser storage</span>
              )}
              {!apiKeySaved && (
                <span className="text-xs text-muted-foreground italic">Keys are stored in your browser — never sent to our servers unless you use them in an API call.</span>
              )}
              <button
                onClick={saveApiKeys}
                className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 shrink-0"
              >
                Save API Keys
              </button>
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your platform experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Dark Mode</label>
                  <p className="text-xs text-muted-foreground">
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={(checked) => {
                    setDarkMode(checked);
                    if (checked) {
                      document.documentElement.classList.add("dark");
                      localStorage.setItem("sdd-theme", "dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                      localStorage.setItem("sdd-theme", "light");
                    }
                  }}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Default Project</label>
                <select
                  className={inputClass}
                  value={defaultProject}
                  onChange={(e) => setDefaultProject(e.target.value)}
                >
                  <option value="project-alpha">Project Alpha - EGFR Inhibitors</option>
                  <option value="project-beta">Project Beta - KRAS G12C</option>
                  <option value="project-gamma">Project Gamma - PD-L1 Antibodies</option>
                  <option value="project-delta">Project Delta - JAK2 Inhibitors</option>
                </select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Notifications</h3>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Experiment completion alerts</label>
                  <Switch
                    checked={notifications.experimentCompletion}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        experimentCompletion: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Compound screening results</label>
                  <Switch
                    checked={notifications.compoundScreening}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        compoundScreening: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Project milestone updates</label>
                  <Switch
                    checked={notifications.projectMilestone}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        projectMilestone: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm">Weekly pipeline summary email</label>
                  <Switch
                    checked={notifications.weeklySummary}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        weeklySummary: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  className={inputClass}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="zh">Mandarin</option>
                  <option value="es">Spanish</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-save Interval</label>
                <select
                  className={inputClass}
                  value={autoSave}
                  onChange={(e) => setAutoSave(e.target.value)}
                >
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Overview of your stored data and export options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Compounds</CardDescription>
                    <CardTitle className="text-2xl">380</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Targets</CardDescription>
                    <CardTitle className="text-2xl">24</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Experiments</CardDescription>
                    <CardTitle className="text-2xl">156</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Projects</CardDescription>
                    <CardTitle className="text-2xl">8</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Data Points</CardDescription>
                    <CardTitle className="text-2xl">12,450</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Storage</CardDescription>
                    <CardTitle className="text-2xl">2.4 GB</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Export Data</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent w-full">
                    Export Compounds (CSV)
                  </button>
                  <button className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent w-full">
                    Export Targets (JSON)
                  </button>
                  <button className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent w-full">
                    Export Results (CSV)
                  </button>
                  <button className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent w-full">
                    Full Backup (SQL)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last backup: March 25, 2026 at 2:30 PM UTC
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy & Legal Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Notice</CardTitle>
              <CardDescription>How SmartDrugDiscovery collects, uses, and protects your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm text-muted-foreground leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Analytics & Usage Data</h3>
                <p>SmartDrugDiscovery collects <strong className="text-foreground">anonymized, aggregated</strong> usage analytics — including page visits, feature interactions, session durations, and error rates — solely to improve platform performance and user experience. No personally identifiable information (PII), patient data, proprietary compound structures, or research results are included in these analytics.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Product Improvement</h3>
                <p>Anonymized interaction patterns may be used internally for model training, UI optimization, and feature prioritization. All such use is aggregated across users and cannot be traced back to any individual or institution. You may opt out of analytics collection at any time in the Preferences tab.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Third-Party Integrations</h3>
                <p>Office and productivity integrations (Google Drive, OneDrive, Notion, Gmail, etc.) operate under their respective providers&apos; privacy policies. SmartDrugDiscovery requests only the <strong className="text-foreground">minimum permissions</strong> necessary for each integration to function. File contents accessed through integrations are processed transiently and are never stored, indexed, or shared beyond the immediate session operation.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Research Data</h3>
                <p>Compound libraries, assay results, target data, and all research assets you upload or generate remain exclusively yours. SmartDrugDiscovery does not claim ownership of, license to, or access rights over your proprietary research data beyond what is required to render the platform&apos;s services to you.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Legal Disclaimer</h3>
                <p>SmartDrugDiscovery is provided as a research productivity platform and does not constitute medical, clinical, or regulatory advice. The platform is not liable for decisions made based on computational predictions, AI-generated outputs, or literature summaries. Outputs should be validated through appropriate experimental and regulatory processes before clinical use.</p>
                <p>Use of this platform is governed by applicable federal and state laws, including but not limited to HIPAA (for clinical data), GDPR (for EU users), and institutional data governance policies. Users are responsible for ensuring their use of the platform complies with applicable regulations at their institution.</p>
                <p>To the maximum extent permitted by applicable law, SmartDrugDiscovery disclaims all liability for indirect, incidental, or consequential damages arising from use of the platform or its AI-generated outputs.</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm">Contact</h3>
                <p>For privacy inquiries, data deletion requests, or compliance questions, contact: <a href="mailto:privacy@smartdrugdiscovery.org" className="text-primary underline underline-offset-2">privacy@smartdrugdiscovery.org</a></p>
                <p className="text-xs">Last updated: March 28, 2026 · Effective for all platform versions ≥ v1.100</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>
                Platform information and version details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Platform</dt>
                  <dd className="text-sm font-medium">{PLATFORM_CONFIG.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Version</dt>
                  <dd className="text-sm font-medium">v{PLATFORM_CONFIG.version}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Build</dt>
                  <dd className="text-sm font-medium">{PLATFORM_CONFIG.build}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">License</dt>
                  <dd className="text-sm font-medium">{PLATFORM_CONFIG.license}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Institution</dt>
                  <dd className="text-sm font-medium">UAB Systems Pharmacology AI Research Center</dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_CONFIG.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground">
                {PLATFORM_CONFIG.copyright}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MEMBERS TAB ──────────────────────────────────────────────── */}
        <TabsContent value="members">
          <MembersPanel />
        </TabsContent>

        {/* ── ACCESS CONTROL TAB ───────────────────────────────────────── */}
        <TabsContent value="access-control">
          <AccessControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Access Control Panel (Admin/Owner only) ───────────────────────────────

function AccessControlPanel() {
  const [config, setConfig]   = useState<ModuleAccessConfig>({});
  const [saved,  setSaved]    = useState(false);
  const [expand, setExpand]   = useState<Record<string, boolean>>({});

  // Load on mount
  useEffect(() => { setConfig(loadModuleAccess()); }, []);

  function setAccess(moduleKey: ModuleKey, role: AppRole, level: AccessLevel) {
    setConfig((prev) => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] ?? {}), [role]: level },
    }));
  }

  function resetAll() {
    setConfig({});
    saveModuleAccess({});
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function saveAll() {
    saveModuleAccess(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const ACCESS_OPTIONS: { value: AccessLevel; label: string; color: string }[] = [
    { value: "full",    label: "Full",    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    { value: "partial", label: "Partial", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
    { value: "hidden",  label: "Hidden",  color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Module Access Control</CardTitle>
          <CardDescription>
            Configure which platform modules are visible to each role. Owner and Admin always have full access.
            Changes apply immediately after saving — users see the updated nav on next page load.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            {ACCESS_OPTIONS.map(({ value, label, color }) => (
              <span key={value} className="flex items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 font-medium ${color}`}>{label}</span>
                <span className="text-muted-foreground">
                  {value === "full"    ? "— visible and fully usable" :
                   value === "partial" ? "— shown with 🔒 badge; page shows restricted notice" :
                                        "— completely invisible in navigation"}
                </span>
              </span>
            ))}
          </div>

          {/* Role column headers */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-56">Module</th>
                  {CONFIGURABLE_ROLES.map((role) => (
                    <th key={role} className="text-center py-2 px-3 font-medium text-muted-foreground min-w-[110px]">
                      <span className={`rounded-full px-2 py-0.5 ${ROLE_META[role].color}`}>
                        {ROLE_META[role].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map((group) => {
                  const isExpanded = expand[group.label] !== false; // default expanded
                  return (
                    <>
                      {/* Group header row */}
                      <tr key={group.label} className="bg-muted/40">
                        <td colSpan={CONFIGURABLE_ROLES.length + 1} className="py-1.5 px-2">
                          <button
                            onClick={() => setExpand((prev) => ({ ...prev, [group.label]: !isExpanded }))}
                            className="flex items-center gap-1.5 font-semibold text-foreground text-xs"
                          >
                            <span className={`transition-transform inline-block ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                            {group.label}
                          </button>
                        </td>
                      </tr>
                      {/* Module rows */}
                      {isExpanded && group.keys.map((key) => {
                        const isSubItem = key.includes("/");
                        return (
                          <tr key={key} className="border-b border-border/50 hover:bg-accent/20">
                            <td className={`py-2 pr-4 text-xs ${isSubItem ? "pl-6 text-muted-foreground" : "pl-2 font-medium"}`}>
                              {MODULE_LABELS[key]}
                            </td>
                            {CONFIGURABLE_ROLES.map((role) => {
                              const current: AccessLevel = config[key]?.[role] ?? "full";
                              return (
                                <td key={role} className="text-center py-2 px-3">
                                  <select
                                    value={current}
                                    onChange={(e) => setAccess(key, role, e.target.value as AccessLevel)}
                                    className={`rounded-md border px-2 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer
                                      ${current === "full"    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300" :
                                        current === "partial" ? "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300" :
                                                                "border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"}`}
                                  >
                                    {ACCESS_OPTIONS.map(({ value, label }) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Access control settings saved</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={saveAll}
              className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={resetAll}
              className="rounded-md border px-5 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Reset All to Full Access
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
