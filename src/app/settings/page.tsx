"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_CONFIG } from "@/lib/platform-config";
import { RoleAvatar } from "@/components/role-avatar";
import { ROLE_META } from "@/lib/roles";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

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

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Resize to max 200×200 JPEG using canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height, 200);
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const sx = (img.width  - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
        updateUser({ avatarType: "photo", avatarPhoto: canvas.toDataURL("image/jpeg", 0.85) });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
    groq: false,
    chembl: false,
    pubmed: false,
    openai: false,
    uniprot: false,
    pdb: false,
  });

  const [darkMode, setDarkMode] = useState(false);
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
      key: "sk-ant-api03-xxxx-xxxx-xxxx-configured",
      description: "Claude models (Sonnet, Opus) — powers AI Chat and Foundation Models",
      lastUsed: "Active (server-side env var)",
      modelProvider: true,
      serverSide: true,
    },
    {
      id: "groq",
      name: "Groq Cloud API",
      key: "gsk-xxxx-xxxx-xxxx-0000",
      description: "Llama 3.3 70B via Groq Cloud — fast inference for open models",
      lastUsed: "Available",
      modelProvider: true,
      serverSide: false,
    },
    {
      id: "openai",
      name: "OpenAI API",
      key: "sk-openai-xxxx-xxxx-xxxx-9012",
      description: "GPT-4o and other OpenAI models for analysis and generation",
      lastUsed: "3 hours ago",
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
                      className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Upload photo
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
                    Your role controls which features and settings are visible. Contact an Admin to change your organization role.
                  </p>
                </div>
                <select
                  value={user?.role ?? "User"}
                  onChange={(e) => updateUser({ role: e.target.value as import("@/lib/roles").AppRole })}
                  className={inputClass}
                >
                  <option value="Owner">Owner — Full control: org settings, billing, transfer</option>
                  <option value="Admin">Admin — Manage users, roles, plugins, and models</option>
                  <option value="Developer">Developer — Install and configure MCP servers, view API keys</option>
                  <option value="User">User — Browse, install free plugins, add personal API keys</option>
                </select>
                <p className="text-xs text-muted-foreground italic">Role changes take effect immediately across all pages.</p>
              </div>

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
                  Manage keys for AI model providers and external data sources. Keys marked <span className="font-semibold text-primary">Foundation Model</span> are selectable in the <a href="/models" className="text-primary underline underline-offset-2">Foundation Models</a> page.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Model Provider Keys */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">AI Model Providers</p>
            {apiKeys.filter((k) => k.modelProvider).map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="flex items-center justify-between py-4 gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{apiKey.name}</p>
                      <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">Foundation Model</span>
                      {apiKey.serverSide && (
                        <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 text-[10px] font-medium">✓ Server env var</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{apiKey.description}</p>
                    {apiKey.serverSide ? (
                      <p className="text-xs text-muted-foreground italic">Configured as Vercel environment variable — not exposed to client</p>
                    ) : (
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {maskKey(apiKey.key, keyVisibility[apiKey.id])}
                      </code>
                    )}
                    <p className="text-xs text-muted-foreground">Status: {apiKey.lastUsed}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!apiKey.serverSide && (
                      <>
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
                        >
                          {keyVisibility[apiKey.id] ? "Hide" : "Show"}
                        </button>
                        <button className="text-sm text-destructive hover:bg-destructive/10 rounded-md px-3 py-1.5">
                          Rotate
                        </button>
                      </>
                    )}
                    {apiKey.serverSide && (
                      <span className="text-xs text-muted-foreground">Manage in Vercel</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Data Source Keys */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-2">Data Sources & Services</p>
            {apiKeys.filter((k) => !k.modelProvider).map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="flex items-center justify-between py-4 gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium">{apiKey.name}</p>
                    <p className="text-xs text-muted-foreground">{apiKey.description}</p>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">
                      {maskKey(apiKey.key, keyVisibility[apiKey.id])}
                    </code>
                    <p className="text-xs text-muted-foreground">Last used: {apiKey.lastUsed}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
                    >
                      {keyVisibility[apiKey.id] ? "Hide" : "Show"}
                    </button>
                    <button className="text-sm text-destructive hover:bg-destructive/10 rounded-md px-3 py-1.5">
                      Regenerate
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    document.documentElement.classList.toggle("dark");
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
      </Tabs>
    </div>
  );
}
