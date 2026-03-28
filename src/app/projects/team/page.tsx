"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const teams = [
  {
    name: "Oncology Team",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    members: [
      { name: "Dr. Sarah Chen",     role: "Principal Investigator", initials: "SC", expertise: ["BRAF inhibitors", "Kinase selectivity"] },
      { name: "Dr. Raj Patel",      role: "Computational Chemist",  initials: "RP", expertise: ["Molecular dynamics", "Virtual screening"] },
      { name: "Dr. Robert Kim",     role: "Project Lead",           initials: "RK", expertise: ["EGFR resistance", "IND filing"] },
      { name: "Dr. Lucia Romano",   role: "Regulatory Scientist",   initials: "LR", expertise: ["IND packages", "Toxicology"] },
    ],
    projects: ["BRAF Inhibitor Program", "EGFR-T790M Resistance Program", "JAK2 Inhibitor Optimization"],
  },
  {
    name: "Neurology Team",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    members: [
      { name: "Dr. James Wilson",   role: "Project Lead",           initials: "JW", expertise: ["Tau biology", "Neurodegeneration"] },
      { name: "Dr. Elena Vasquez",  role: "Medicinal Chemist",      initials: "EV", expertise: ["Fragment-based design", "Kinase inhibitors"] },
      { name: "Dr. Amanda Foster",  role: "Clinical Scientist",     initials: "AF", expertise: ["Biomarkers", "Clinical feasibility"] },
      { name: "Dr. Wei Zhang",      role: "Structural Biologist",   initials: "WZ", expertise: ["X-ray crystallography", "Cryo-EM"] },
    ],
    projects: ["Alzheimer's Tau Program"],
  },
  {
    name: "AI Agents",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    members: [
      { name: "Drug-GPT",           role: "SMILES Generation Agent",    initials: "DG", expertise: ["Molecule design", "ADMET prediction"] },
      { name: "Literature Bot",     role: "Literature Mining Agent",     initials: "LB", expertise: ["PubMed analysis", "Trend extraction"] },
      { name: "ADMET Predictor",    role: "Property Prediction Agent",   initials: "AP", expertise: ["Toxicity", "PK/PD modeling"] },
    ],
    projects: ["All projects"],
  },
];

function getColor(initials: string) {
  const palette = ["bg-blue-600","bg-green-600","bg-purple-600","bg-pink-600","bg-indigo-600","bg-teal-600","bg-orange-600"];
  let h = 0;
  for (let i = 0; i < initials.length; i++) h = initials.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function TeamPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Team Directory</h1>
        <p className="text-muted-foreground text-sm mt-1">Researchers, clinicians, and AI agents grouped by domain team</p>
      </div>

      {teams.map((team) => (
        <Card key={team.name}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", team.color)}>
                {team.members.length} members
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Projects: {team.projects.join(" · ")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members.map((m) => (
                <div key={m.name} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0", getColor(m.initials))}>
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.expertise.map((e) => (
                        <span key={e} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
