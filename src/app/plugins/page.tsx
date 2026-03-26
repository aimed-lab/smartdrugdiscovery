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

type PluginType = "mcp" | "api" | "docker" | "jupyter" | "source";

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: PluginType;
  version: string;
  author: string;
  license: string;
  url: string;
  fair: {
    findable: boolean;
    accessible: boolean;
    interoperable: boolean;
    reusable: boolean;
  };
  installed: boolean;
  category: string;
  compatibleWith: string[];
}

const typeConfig: Record<
  PluginType,
  { label: string; badge: string; preference: number }
> = {
  mcp: {
    label: "MCP Server",
    badge: "bg-blue-100 text-blue-800",
    preference: 1,
  },
  api: {
    label: "API",
    badge: "bg-green-100 text-green-800",
    preference: 2,
  },
  docker: {
    label: "Docker Image",
    badge: "bg-purple-100 text-purple-800",
    preference: 3,
  },
  jupyter: {
    label: "Jupyter Notebook",
    badge: "bg-orange-100 text-orange-800",
    preference: 4,
  },
  source: {
    label: "Source Code",
    badge: "bg-gray-100 text-gray-800",
    preference: 5,
  },
};

const plugins: Plugin[] = [
  {
    id: "chembl-mcp",
    name: "ChEMBL MCP Server",
    description:
      "Access ChEMBL compound database, bioactivity data, and target information via Model Context Protocol",
    type: "mcp",
    version: "v2.1.0",
    author: "ChEMBL Team",
    license: "Apache 2.0",
    url: "https://github.com/chembl/chembl-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true,
    category: "Data",
    compatibleWith: ["A1", "A2", "A3", "A4"],
  },
  {
    id: "pubmed-mcp",
    name: "PubMed MCP Server",
    description:
      "Search and retrieve biomedical literature, article metadata, and full-text articles",
    type: "mcp",
    version: "v1.8.0",
    author: "NCBI",
    license: "Public Domain",
    url: "https://github.com/ncbi/pubmed-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true,
    category: "Literature",
    compatibleWith: ["A7", "A8", "A9", "A10"],
  },
  {
    id: "open-targets-mcp",
    name: "Open Targets MCP",
    description:
      "Query Open Targets Platform for target-disease associations and genetic evidence",
    type: "mcp",
    version: "v1.5.0",
    author: "Open Targets",
    license: "Apache 2.0",
    url: "https://github.com/opentargets/ot-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    category: "Data",
    compatibleWith: ["A1", "A2", "A3"],
  },
  {
    id: "uniprot-api",
    name: "UniProt REST API",
    description:
      "Protein sequence, function, and structural information for target characterization",
    type: "api",
    version: "v3.0",
    author: "UniProt Consortium",
    license: "CC BY 4.0",
    url: "https://www.uniprot.org/help/api",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true,
    category: "Data",
    compatibleWith: ["A1", "A2"],
  },
  {
    id: "clinicaltrials-api",
    name: "ClinicalTrials.gov API",
    description:
      "Search clinical trials, eligibility criteria, endpoints, and results",
    type: "api",
    version: "v2.0",
    author: "NLM/NIH",
    license: "Public Domain",
    url: "https://clinicaltrials.gov/api",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    category: "Clinical",
    compatibleWith: ["A7", "A8", "A9"],
  },
  {
    id: "rdkit-api",
    name: "RDKit REST Service",
    description:
      "Cheminformatics toolkit for molecular property calculation and structure manipulation",
    type: "api",
    version: "v2024.03",
    author: "RDKit Community",
    license: "BSD-3",
    url: "https://github.com/rdkit/rdkit-rest",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    category: "Chemistry",
    compatibleWith: ["A1", "A4"],
  },
  {
    id: "alphafold-docker",
    name: "AlphaFold Structure Prediction",
    description:
      "Protein structure prediction using AlphaFold2 for target structural analysis and docking",
    type: "docker",
    version: "v2.3.2",
    author: "DeepMind",
    license: "Apache 2.0",
    url: "https://github.com/deepmind/alphafold",
    fair: { findable: true, accessible: true, interoperable: false, reusable: true },
    installed: false,
    category: "Structure",
    compatibleWith: ["A1", "A3"],
  },
  {
    id: "autodock-vina-docker",
    name: "AutoDock Vina GPU",
    description:
      "GPU-accelerated molecular docking for high-throughput virtual screening",
    type: "docker",
    version: "v1.2.5",
    author: "Scripps Research",
    license: "Apache 2.0",
    url: "https://github.com/ccsb-scripps/AutoDock-Vina",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    category: "Docking",
    compatibleWith: ["A1", "A4"],
  },
  {
    id: "admet-jupyter",
    name: "ADMET Property Predictor",
    description:
      "Ensemble ML models for ADMET prediction with interactive visualization and analysis",
    type: "jupyter",
    version: "v1.0.3",
    author: "PharmAI Lab",
    license: "MIT",
    url: "https://github.com/pharmai/admet-predictor",
    fair: { findable: true, accessible: true, interoperable: false, reusable: true },
    installed: false,
    category: "ADMET",
    compatibleWith: ["A4", "A6"],
  },
  {
    id: "scrnaseq-jupyter",
    name: "scRNA-seq Analysis Pipeline",
    description:
      "Single-cell RNA sequencing analysis for tissue-level drug response characterization",
    type: "jupyter",
    version: "v2.1.0",
    author: "Broad Institute",
    license: "BSD-3",
    url: "https://github.com/broadinstitute/scrnaseq-pipeline",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    category: "Genomics",
    compatibleWith: ["A5"],
  },
  {
    id: "netpharm-source",
    name: "Network Pharmacology Toolkit",
    description:
      "Python package for constructing and analyzing drug-target-disease networks",
    type: "source",
    version: "v0.9.1",
    author: "NetPharm Lab",
    license: "GPL-3.0",
    url: "https://github.com/netpharm/toolkit",
    fair: { findable: true, accessible: true, interoperable: false, reusable: false },
    installed: false,
    category: "Network",
    compatibleWith: ["A2", "A3"],
  },
  {
    id: "dtwin-source",
    name: "Digital Twin Simulator",
    description:
      "Patient digital twin simulation framework for individualized drug response prediction",
    type: "source",
    version: "v0.5.0",
    author: "DTwin Research",
    license: "MIT",
    url: "https://github.com/dtwin/simulator",
    fair: { findable: true, accessible: false, interoperable: false, reusable: true },
    installed: false,
    category: "Simulation",
    compatibleWith: ["A7", "A8"],
  },
];

const filterOptions: { label: string; value: PluginType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "MCP Server", value: "mcp" },
  { label: "API", value: "api" },
  { label: "Docker", value: "docker" },
  { label: "Jupyter", value: "jupyter" },
  { label: "Source Code", value: "source" },
];

function StarRating({ filled }: { filled: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < filled ? "text-yellow-500" : "text-gray-300"
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function FairBadge({ letter, met }: { letter: string; met: boolean }) {
  return (
    <span
      className={cn(
        "h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center",
        met ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}
    >
      {letter}
    </span>
  );
}

export default function PluginsPage() {
  const [typeFilter, setTypeFilter] = useState<PluginType | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = plugins
    .filter((p) => typeFilter === "all" || p.type === typeFilter)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    })
    .sort(
      (a, b) => typeConfig[a.type].preference - typeConfig[b.type].preference
    );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plugins</h1>
        <p className="text-muted-foreground mt-1">
          FAIR-compliant third-party integrations for extending the platform
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                typeFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full sm:w-64"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((plugin) => {
          const config = typeConfig[plugin.type];
          const starCount = 6 - config.preference;

          return (
            <Card key={plugin.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                        config.badge
                      )}
                    >
                      {config.label}
                    </span>
                    <StarRating filled={starCount} />
                  </div>
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 flex-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{plugin.version}</span>
                  <span>{plugin.author}</span>
                  <span>{plugin.license}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">
                    FAIR:
                  </span>
                  <FairBadge letter="F" met={plugin.fair.findable} />
                  <FairBadge letter="A" met={plugin.fair.accessible} />
                  <FairBadge letter="I" met={plugin.fair.interoperable} />
                  <FairBadge letter="R" met={plugin.fair.reusable} />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Compatible with:
                  </span>
                  {plugin.compatibleWith.map((level) => (
                    <span
                      key={level}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                    >
                      {level}
                    </span>
                  ))}
                </div>

                <div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {plugin.category}
                  </span>
                </div>

                <div className="mt-auto pt-2">
                  {plugin.installed ? (
                    <button
                      disabled
                      className="w-full rounded-md border border-green-500 text-green-700 bg-green-50 px-4 py-2 text-sm font-medium cursor-default"
                    >
                      Installed
                    </button>
                  ) : (
                    <button className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                      Install Plugin
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No plugins found matching your criteria.
        </div>
      )}
    </div>
  );
}
