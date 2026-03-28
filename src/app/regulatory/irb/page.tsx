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

type ProtocolStatus = "Active" | "Pending" | "Approved" | "Expired";

interface IrbProtocol {
  protocolId: string;
  studyTitle: string;
  status: ProtocolStatus;
  principalInvestigator: string;
  submissionDate: string;
  expiryDate: string | null;
}

const protocols: IrbProtocol[] = [
  {
    protocolId: "IRB-2026-001",
    studyTitle: "Phase I BRAF V600E Inhibitor Safety Study",
    status: "Active",
    principalInvestigator: "Dr. Jake Chen",
    submissionDate: "2026-01-15",
    expiryDate: "2027-01-14",
  },
  {
    protocolId: "IRB-2026-002",
    studyTitle: "Tau-Targeted Therapy Biomarker Study",
    status: "Pending",
    principalInvestigator: "Dr. Sarah Chen",
    submissionDate: "2026-03-01",
    expiryDate: null,
  },
  {
    protocolId: "IRB-2025-008",
    studyTitle: "KRAS G12C Cohort Expansion",
    status: "Approved",
    principalInvestigator: "Dr. Raj Patel",
    submissionDate: "2025-06-10",
    expiryDate: "2026-06-09",
  },
  {
    protocolId: "IRB-2025-003",
    studyTitle: "Digital Twin Validation Study",
    status: "Approved",
    principalInvestigator: "Dr. Elena Vasquez",
    submissionDate: "2025-02-20",
    expiryDate: "2026-02-19",
  },
  {
    protocolId: "IRB-2024-011",
    studyTitle: "Pan-Cancer Genomic Profiling",
    status: "Expired",
    principalInvestigator: "Dr. Marcus Kim",
    submissionDate: "2024-01-05",
    expiryDate: "2025-01-04",
  },
];

const statusColors: Record<ProtocolStatus, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const TODAY = new Date("2026-03-28");
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / (24 * 60 * 60 * 1000));
}

const upcomingRenewals = protocols.filter(
  (p) =>
    p.expiryDate !== null &&
    p.status !== "Expired" &&
    daysUntil(p.expiryDate) >= 0 &&
    daysUntil(p.expiryDate) <= 90
);

export default function IrbProtocolsPage() {
  const [_view] = useState("list");

  const activeCount = protocols.filter((p) => p.status === "Active").length;
  const pendingCount = protocols.filter((p) => p.status === "Pending").length;
  const approvedCount = protocols.filter((p) => p.status === "Approved").length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IRB Protocols</h1>
        <p className="text-muted-foreground">
          Institutional Review Board submissions, approvals, and amendments
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Protocols</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently enrolling participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting IRB board decision</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl">{approvedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total approved protocols on record</p>
          </CardContent>
        </Card>
      </div>

      {/* Protocols Table */}
      <Card>
        <CardHeader>
          <CardTitle>Protocol Registry</CardTitle>
          <CardDescription>All IRB protocol submissions and their current status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Protocol ID</th>
                  <th className="px-4 py-3 text-left font-medium">Study Title</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Principal Investigator</th>
                  <th className="px-4 py-3 text-left font-medium">Submission Date</th>
                  <th className="px-4 py-3 text-left font-medium">Expiry Date</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {protocols.map((p, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{p.protocolId}</td>
                    <td className="px-4 py-3 font-medium max-w-xs">{p.studyTitle}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[p.status]
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.principalInvestigator}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.submissionDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.expiryDate ?? <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Deadlines</CardTitle>
          <CardDescription>Protocol renewals due within the next 90 days</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingRenewals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No renewals due within the next 90 days.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingRenewals.map((p, i) => {
                const days = daysUntil(p.expiryDate!);
                const urgency =
                  days <= 30
                    ? "text-red-600 dark:text-red-400"
                    : days <= 60
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-muted-foreground";
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.studyTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.protocolId} &middot; {p.principalInvestigator}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", urgency)}>
                        {days === 0 ? "Expires today" : `${days} day${days !== 1 ? "s" : ""} left`}
                      </p>
                      <p className="text-xs text-muted-foreground">Expires {p.expiryDate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
