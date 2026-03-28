"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Quarter = "Q1 2026" | "Q2 2026" | "Q3 2026" | "Q4 2026";
type Subject = "person" | "agent" | "team";

interface Review {
  id: string;
  subject: string;
  type: Subject;
  quarter: Quarter;
  goalsSet: number;
  goalsMet: number;
  highlights: string[];
  rating: "Exceeds" | "Meets" | "Below";
  nextQuarterGoals: string[];
}

const reviews: Review[] = [
  {
    id: "rev-001",
    subject: "Dr. Sarah Chen",
    type: "person",
    quarter: "Q1 2026",
    goalsSet: 5,
    goalsMet: 5,
    highlights: ["Completed BRAF lead optimization ahead of schedule", "Published 2 first-author papers", "Mentored 2 postdocs"],
    rating: "Exceeds",
    nextQuarterGoals: ["Candidate nomination for BRAF program", "IND pre-submission meeting"],
  },
  {
    id: "rev-002",
    subject: "Dr. James Wilson",
    type: "person",
    quarter: "Q1 2026",
    goalsSet: 4,
    goalsMet: 3,
    highlights: ["Hit-to-lead completed for Tau program", "Established BACE1 SAR"],
    rating: "Meets",
    nextQuarterGoals: ["Complete tau PET tracer optimization", "Initiate lead optimization phase"],
  },
  {
    id: "rev-003",
    subject: "Drug-GPT Agent",
    type: "agent",
    quarter: "Q1 2026",
    goalsSet: 8,
    goalsMet: 7,
    highlights: ["Generated 1,240 novel SMILES candidates", "ADMET accuracy 89% vs. wet lab", "Zero hallucinated structures"],
    rating: "Exceeds",
    nextQuarterGoals: ["Extend to macrocycle design", "Integrate Glide docking feedback"],
  },
  {
    id: "rev-004",
    subject: "Literature Bot",
    type: "agent",
    quarter: "Q1 2026",
    goalsSet: 6,
    goalsMet: 4,
    highlights: ["Indexed 12,400 papers", "Surfaced 3 novel target hypotheses"],
    rating: "Meets",
    nextQuarterGoals: ["Reduce false-positive rate from 18% to 10%", "Add ClinicalTrials.gov feed"],
  },
  {
    id: "rev-005",
    subject: "Oncology Team",
    type: "team",
    quarter: "Q1 2026",
    goalsSet: 10,
    goalsMet: 9,
    highlights: ["BRAF candidate nominated", "EGFR IND accepted", "Zero safety incidents"],
    rating: "Exceeds",
    nextQuarterGoals: ["Phase I protocol submission for BRAF", "JAK2 ADMET completion"],
  },
  {
    id: "rev-006",
    subject: "Neurology Team",
    type: "team",
    quarter: "Q1 2026",
    goalsSet: 8,
    goalsMet: 5,
    highlights: ["Tau hit-to-lead milestone met", "Established cryo-EM pipeline"],
    rating: "Meets",
    nextQuarterGoals: ["Complete lead optimization", "Identify biomarker panel for Phase I"],
  },
];

const ratingConfig = {
  Exceeds: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", dot: "bg-green-500" },
  Meets:   { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",    dot: "bg-blue-500" },
  Below:   { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",        dot: "bg-red-500" },
};

const typeConfig: Record<Subject, { label: string; color: string }> = {
  person: { label: "Person",    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  agent:  { label: "AI Agent",  color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  team:   { label: "Team",      color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
};

export default function PerformancePage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Performance Evaluations</h1>
        <p className="text-muted-foreground text-sm mt-1">Quarterly reviews for persons, AI agents, and teams — Q1 2026</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {(["person", "agent", "team"] as Subject[]).map((t) => {
          const count = reviews.filter(r => r.type === t).length;
          const exceeds = reviews.filter(r => r.type === t && r.rating === "Exceeds").length;
          return (
            <Card key={t}>
              <CardContent className="pt-5 pb-4">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", typeConfig[t].color)}>{typeConfig[t].label}</span>
                <p className="text-2xl font-bold mt-2">{exceeds}/{count}</p>
                <p className="text-xs text-muted-foreground">Exceeds expectations</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reviews */}
      {reviews.map((r) => {
        const rc = ratingConfig[r.rating];
        const tc = typeConfig[r.type];
        const pct = Math.round((r.goalsMet / r.goalsSet) * 100);
        return (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-base">{r.subject}</CardTitle>
                  <CardDescription>{r.quarter}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tc.color)}>{tc.label}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5", rc.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", rc.dot)} />
                    {r.rating}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Goal completion bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Goals achieved</span>
                  <span>{r.goalsMet}/{r.goalsSet} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-green-500" : pct >= 70 ? "bg-blue-500" : "bg-orange-400")} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium mb-2">Q1 Highlights</p>
                  <ul className="space-y-1">
                    {r.highlights.map((h) => (
                      <li key={h} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span>{h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Q2 Goals</p>
                  <ul className="space-y-1">
                    {r.nextQuarterGoals.map((g) => (
                      <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">→</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
