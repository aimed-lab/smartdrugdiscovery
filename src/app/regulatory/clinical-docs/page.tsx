"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DocCategory =
  | "Protocol"
  | "Consent Forms"
  | "Investigator Brochure"
  | "Safety Reports"
  | "Submissions";

type DocStatus = "Draft" | "Under Review" | "Approved" | "Superseded";

type TabFilter = "All" | DocCategory;

interface ClinicalDocument {
  name: string;
  category: DocCategory;
  version: string;
  status: DocStatus;
  lastUpdated: string;
  owner: string;
}

const documents: ClinicalDocument[] = [
  {
    name: "Study Protocol v3.1",
    category: "Protocol",
    version: "v3.1",
    status: "Approved",
    lastUpdated: "2026-02-15",
    owner: "Dr. Jake Chen",
  },
  {
    name: "Informed Consent Form — Adult",
    category: "Consent Forms",
    version: "v2.0",
    status: "Approved",
    lastUpdated: "2026-01-20",
    owner: "Dr. Sarah Chen",
  },
  {
    name: "Investigator's Brochure",
    category: "Investigator Brochure",
    version: "v5.0",
    status: "Under Review",
    lastUpdated: "2026-03-10",
    owner: "Dr. Raj Patel",
  },
  {
    name: "Serious Adverse Event Report Q1 2026",
    category: "Safety Reports",
    version: "v1.0",
    status: "Approved",
    lastUpdated: "2026-03-28",
    owner: "Dr. Elena Vasquez",
  },
  {
    name: "IND Application — BRAF Program",
    category: "Submissions",
    version: "v2.0",
    status: "Approved",
    lastUpdated: "2025-11-30",
    owner: "Dr. Jake Chen",
  },
  {
    name: "Protocol Amendment 3 — Dose Escalation",
    category: "Protocol",
    version: "v3.2",
    status: "Draft",
    lastUpdated: "2026-03-25",
    owner: "Dr. Marcus Kim",
  },
];

const tabs: TabFilter[] = [
  "All",
  "Protocol",
  "Consent Forms",
  "Investigator Brochure",
  "Safety Reports",
  "Submissions",
];

const categoryColors: Record<DocCategory, string> = {
  Protocol: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Consent Forms": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Investigator Brochure": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Safety Reports": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Submissions: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

const statusColors: Record<DocStatus, string> = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Under Review": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Superseded: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function ClinicalDocsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("All");

  const filtered =
    activeTab === "All" ? documents : documents.filter((d) => d.category === activeTab);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clinical Trial Documents</h1>
          <p className="text-muted-foreground">
            ICH-E6 compliant document management for regulatory submissions
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors">
          Upload Document
        </button>
      </div>

      {/* Tab Filter */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({documents.filter((d) => d.category === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "All" ? "All Documents" : activeTab}
          </CardTitle>
          <CardDescription>
            {filtered.length} document{filtered.length !== 1 ? "s" : ""} &middot; Click to view version history
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Document Name</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Version</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Last Updated</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">History</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {doc.status === "Superseded" ? (
                        <span className="line-through text-muted-foreground">{doc.name}</span>
                      ) : (
                        doc.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          categoryColors[doc.category]
                        )}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{doc.version}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[doc.status]
                        )}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.lastUpdated}</td>
                    <td className="px-4 py-3 text-muted-foreground">{doc.owner}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium whitespace-nowrap">
                        View history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ICH-E6 Compliance Note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ICH-E6 GCP Compliance</CardTitle>
          <CardDescription>Document retention and version control standards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retention Period</span>
            <span className="font-medium">15 years post-trial completion</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version Control</span>
            <span className="font-medium">Sequential versioning required</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Audit Trail</span>
            <span className="font-medium">All edits logged with timestamp &amp; author</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-Signature Standard</span>
            <span className="font-medium">21 CFR Part 11 compliant</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
