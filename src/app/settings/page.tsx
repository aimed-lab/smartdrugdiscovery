"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Dr. Sarah Chen",
    email: "sarah.chen@pharmatech.com",
    role: "Principal Scientist",
    org: "PharmaTech Research Inc.",
  });

  const [keyVisibility, setKeyVisibility] = useState<Record<string, boolean>>({
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
      id: "chembl",
      name: "ChEMBL API",
      key: "sk-chembl-xxxx-xxxx-xxxx-1234",
      description: "Access to ChEMBL compound and bioactivity database",
      lastUsed: "2 hours ago",
    },
    {
      id: "pubmed",
      name: "PubMed API",
      key: "pm-api-xxxx-xxxx-5678",
      description: "Literature search and article retrieval",
      lastUsed: "1 day ago",
    },
    {
      id: "openai",
      name: "OpenAI API",
      key: "sk-openai-xxxx-xxxx-xxxx-9012",
      description: "AI-powered analysis and molecular generation",
      lastUsed: "3 hours ago",
    },
    {
      id: "uniprot",
      name: "UniProt API",
      key: "up-xxxx-xxxx-3456",
      description: "Protein sequence and functional information",
      lastUsed: "5 days ago",
    },
    {
      id: "pdb",
      name: "PDB API",
      key: "pdb-xxxx-xxxx-7890",
      description: "Protein Data Bank structure access",
      lastUsed: "1 week ago",
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
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  SC
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.role}</p>
                </div>
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
                  <label className="text-sm font-medium">Email Address</label>
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
                  <label className="text-sm font-medium">Role</label>
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

              <div className="flex justify-end">
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
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
                  Manage your API keys for external data sources and services
                </CardDescription>
              </CardHeader>
            </Card>

            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{apiKey.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {apiKey.description}
                    </p>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">
                      {maskKey(apiKey.key, keyVisibility[apiKey.id])}
                    </code>
                    <p className="text-xs text-muted-foreground">
                      Last used: {apiKey.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
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
                  <dd className="text-sm font-medium">SmartDrugDiscovery</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Version</dt>
                  <dd className="text-sm font-medium">1.0.0-beta</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Build</dt>
                  <dd className="text-sm font-medium">2026.03.25</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">License</dt>
                  <dd className="text-sm font-medium">Enterprise</dd>
                </div>
              </dl>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Next.js 14",
                    "React 18",
                    "TypeScript",
                    "Tailwind CSS",
                    "Radix UI",
                    "Recharts",
                    "Prisma",
                  ].map((tech) => (
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
                &copy; 2026 PharmaTech Research Inc. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
