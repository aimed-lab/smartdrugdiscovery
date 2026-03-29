"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { can, ROLE_META } from "@/lib/roles";

// ── Types ─────────────────────────────────────────────────────────────────────

type PluginType = "mcp" | "api" | "docker" | "jupyter" | "source";
type PluginPricing = "free" | "freemium" | "paid";

interface TestStep {
  label: string;          // e.g. "compound_search(\"vemurafenib\")"
  result: string;         // mock/real result to display
}

interface InstallStep {
  title: string;
  code?: string;          // code block to copy (bash, JSON, etc.)
  note?: string;          // plain-text annotation
  actionUrl?: string;     // optional external link
  actionLabel?: string;   // label for the external link button
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  type: PluginType;
  version: string;
  author: string;
  license: string;
  url: string;
  pricing: PluginPricing;
  requiresKey: boolean;   // true = user must supply API key / login
  fair: { findable: boolean; accessible: boolean; interoperable: boolean; reusable: boolean };
  installed: boolean;     // hardcoded default (pre-installed at launch)
  connected?: boolean;    // hardcoded default active connection
  connectedTools?: string[];
  category: string;
  compatibleWith: string[];
  testSteps: TestStep[];
  installInstructions?: InstallStep[];
}

// ── Type config ────────────────────────────────────────────────────────────────

const typeConfig: Record<PluginType, { label: string; badge: string; preference: number }> = {
  mcp:     { label: "MCP Server",        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",       preference: 1 },
  api:     { label: "API",               badge: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",   preference: 2 },
  docker:  { label: "Docker Image",      badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", preference: 3 },
  jupyter: { label: "Jupyter Notebook",  badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300", preference: 4 },
  source:  { label: "Source Code",       badge: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",          preference: 5 },
};

const pricingBadge: Record<PluginPricing, { label: string; color: string }> = {
  free:     { label: "Free",     color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  freemium: { label: "Freemium", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  paid:     { label: "Paid",     color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
};

// ── Plugin catalogue ───────────────────────────────────────────────────────────

const plugins: Plugin[] = [
  {
    id: "chembl-mcp",
    name: "ChEMBL MCP Server",
    description: "Real-time access to 2.4M+ compounds, 15,000+ targets, and 20M+ bioactivity measurements via Model Context Protocol.",
    type: "mcp", version: "v2.1.0", author: "ChEMBL Team / UAB SysPAI",
    license: "Apache 2.0", pricing: "free", requiresKey: false,
    url: "https://github.com/chembl/chembl-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true, connected: true,
    connectedTools: ["compound_search", "drug_search", "target_search", "get_bioactivity", "get_mechanism", "get_admet"],
    category: "Data", compatibleWith: ["A1", "A2", "A3", "A4"],
    testSteps: [
      { label: 'compound_search("vemurafenib", max_phase=4)', result: "✓ CHEMBL1229517 · Vemurafenib (Zelboraf) · MW 489.93 · ALogP 5.54 · Approved 2011" },
      { label: 'target_search(gene_symbol="BRAF", organism="Homo sapiens")', result: "✓ CHEMBL5145 · Serine/threonine-protein kinase B-raf · UniProt P15056 · 100+ PDB structures" },
      { label: 'get_bioactivity(target="CHEMBL5145", IC50, pChEMBL≥8)', result: "✓ 6 hits returned (of 3,993 total) · Most potent: IC50 = 5 nM (pChEMBL 8.30)" },
    ],
  },
  {
    id: "pubmed-mcp",
    name: "PubMed MCP Server",
    description: "Search and retrieve biomedical literature, article metadata, and full-text articles from PubMed Central.",
    type: "mcp", version: "v1.8.0", author: "NCBI",
    license: "Public Domain", pricing: "free", requiresKey: false,
    url: "https://github.com/ncbi/pubmed-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true, connected: false,
    category: "Literature", compatibleWith: ["A7", "A8", "A9", "A10"],
    testSteps: [
      { label: 'search_articles("BRAF V600E melanoma treatment")', result: "✓ 847 articles found · Top result: PMID 21639808 · Chapman et al. NEJM 2011" },
      { label: 'get_article_metadata("PMID:21639808")', result: "✓ Title: 'Improved survival with vemurafenib in melanoma with BRAF V600E mutation' · IF: 91.2" },
    ],
  },
  {
    id: "open-targets-mcp",
    name: "Open Targets MCP",
    description: "Query Open Targets Platform for target-disease associations, genetic evidence, and drug mechanisms.",
    type: "mcp", version: "v1.5.0", author: "Open Targets",
    license: "Apache 2.0", pricing: "free", requiresKey: false,
    url: "https://github.com/opentargets/ot-mcp",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, category: "Data", compatibleWith: ["A1", "A2", "A3"],
    testSteps: [
      { label: 'target_associations("BRAF", disease="melanoma")', result: "✓ Score 0.94 · 23 genetic variants · 12 somatic mutations · L2G score 0.87" },
    ],
    installInstructions: [
      {
        title: "Add to Claude Desktop config",
        code: `{
  "mcpServers": {
    "open-targets": {
      "command": "npx",
      "args": ["-y", "@opentargets/ot-mcp-server"]
    }
  }
}`,
        note: 'Open claude_desktop_config.json (macOS: ~/Library/Application Support/Claude/claude_desktop_config.json) and merge this block into the "mcpServers" object.',
      },
      {
        title: "Restart Claude Desktop",
        note: "Quit and relaunch Claude Desktop. The Open Targets tools will appear in the tool selector (🔧 icon) in your next conversation.",
      },
      {
        title: "Verify installation",
        note: 'In a new Claude conversation, ask: "What are the top genetic targets for melanoma?" — Claude should call target_associations and return ranked results.',
      },
    ],
  },
  {
    id: "uniprot-api",
    name: "UniProt REST API",
    description: "Protein sequence, function, and structural information for target characterization.",
    type: "api", version: "v3.0", author: "UniProt Consortium",
    license: "CC BY 4.0", pricing: "free", requiresKey: false,
    url: "https://www.uniprot.org/help/api",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: true, category: "Data", compatibleWith: ["A1", "A2"],
    testSteps: [
      { label: 'GET /uniprotkb/P15056 (BRAF)', result: "✓ Gene: BRAF · 766 aa · Kinase domain 457-717 · 3 isoforms · Subcellular: cytoplasm, nucleus" },
    ],
  },
  {
    id: "clinicaltrials-api",
    name: "ClinicalTrials.gov API",
    description: "Search clinical trials, eligibility criteria, endpoints, and results.",
    type: "api", version: "v2.0", author: "NLM/NIH",
    license: "Public Domain", pricing: "free", requiresKey: false,
    url: "https://clinicaltrials.gov/api",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, category: "Clinical", compatibleWith: ["A7", "A8", "A9"],
    testSteps: [
      { label: 'search_trials("BRAF inhibitor melanoma", phase=3, status=completed)', result: "✓ 18 trials found · NCT01227889 (BRIM-3) · NCT01584648 (coBRIM) · NCT01689519 (COMBI-v)" },
    ],
    installInstructions: [
      {
        title: "No API key required — endpoint is public",
        code: "# Base URL\nhttps://clinicaltrials.gov/api/v2\n\n# Example: search completed Phase 3 BRAF trials\ncurl \"https://clinicaltrials.gov/api/v2/studies?query.cond=BRAF+melanoma&filter.advanced=AREA%5BPhase%5DPHASE3&pageSize=5\"",
        note: "ClinicalTrials.gov v2 API is open and requires no registration. Rate limit: 100 requests/min per IP.",
      },
      {
        title: "Add as a custom API connector in Settings → Services",
        note: 'Navigate to Services → Add-on Services → Custom APIs and enter the base URL above. SDD will proxy requests through its backend to avoid CORS issues.',
      },
      {
        title: "Verify by clicking Mark as Installed below",
        note: "Once added to Services, click Mark as Installed to enable the 🧪 Test button on this card.",
      },
    ],
  },
  {
    id: "alphafold-docker",
    name: "AlphaFold Structure Prediction",
    description: "Protein structure prediction using AlphaFold2 for target structural analysis and docking prep.",
    type: "docker", version: "v2.3.2", author: "DeepMind",
    license: "Apache 2.0", pricing: "free", requiresKey: false,
    url: "https://github.com/deepmind/alphafold",
    fair: { findable: true, accessible: true, interoperable: false, reusable: true },
    installed: false, category: "Structure", compatibleWith: ["A1", "A3"],
    testSteps: [
      { label: "predict_structure(sequence=BRAF_kinase_domain)", result: "✓ pLDDT 91.3 · TM-score vs 4MNE: 0.97 · ATP binding pocket identified · PDB generated" },
    ],
    installInstructions: [
      {
        title: "Prerequisites",
        note: "Requires: Docker Desktop, NVIDIA GPU ≥ 16 GB VRAM, CUDA 11.x driver, nvidia-container-toolkit. Estimated download size: ~4.5 GB.",
      },
      {
        title: "Pull the Docker image",
        code: "docker pull ghcr.io/deepmind/alphafold:v2.3.2",
      },
      {
        title: "Run a structure prediction",
        code: `docker run --rm --gpus all \\
  -v $(pwd)/input:/input \\
  -v $(pwd)/output:/output \\
  ghcr.io/deepmind/alphafold:v2.3.2 \\
  --fasta_paths=/input/sequence.fasta \\
  --output_dir=/output \\
  --model_preset=monomer \\
  --max_template_date=2024-01-01`,
        note: "Place your FASTA file at ./input/sequence.fasta. Output PDB will appear in ./output/.",
      },
      {
        title: "Verify by clicking Mark as Installed below",
        note: "Once the container runs successfully, mark as installed to unlock the Test demo on this card.",
      },
    ],
  },
  {
    id: "autodock-vina-docker",
    name: "AutoDock Vina GPU",
    description: "GPU-accelerated molecular docking for high-throughput virtual screening.",
    type: "docker", version: "v1.2.5", author: "Scripps Research",
    license: "Apache 2.0", pricing: "free", requiresKey: false,
    url: "https://github.com/ccsb-scripps/AutoDock-Vina",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, category: "Docking", compatibleWith: ["A1", "A4"],
    testSteps: [
      { label: "dock(ligand=vemurafenib.sdf, receptor=4MNE.pdb)", result: "✓ Best pose: ΔG = -9.8 kcal/mol · RMSD vs crystal: 1.2 Å · Hinge contacts: T529, C532" },
    ],
    installInstructions: [
      {
        title: "Pull the Docker image",
        code: "docker pull ghcr.io/ccsb-scripps/autodock-vina:v1.2.5-gpu",
        note: "GPU version requires NVIDIA GPU + nvidia-container-toolkit. CPU-only: omit -gpu suffix.",
      },
      {
        title: "Prepare receptor and ligand files",
        code: `# Convert PDB to PDBQT (requires AutoDockTools or Open Babel)
obabel receptor.pdb -O receptor.pdbqt -xr
obabel ligand.sdf -O ligand.pdbqt --gen3d`,
      },
      {
        title: "Run molecular docking",
        code: `docker run --rm --gpus all -v $(pwd):/workspace \\
  ghcr.io/ccsb-scripps/autodock-vina:v1.2.5-gpu \\
  vina \\
  --receptor /workspace/receptor.pdbqt \\
  --ligand   /workspace/ligand.pdbqt \\
  --center_x 10.5 --center_y 22.3 --center_z -8.1 \\
  --size_x 25 --size_y 25 --size_z 25 \\
  --exhaustiveness 32 --num_modes 9`,
        note: "Set center_x/y/z to your binding site coordinates (from PDB or SiteMap).",
      },
    ],
  },
  {
    id: "admet-jupyter",
    name: "ADMET Property Predictor",
    description: "Ensemble ML models for ADMET prediction with interactive visualizations. Requires institutional account.",
    type: "jupyter", version: "v1.0.3", author: "PharmAI Lab",
    license: "MIT", pricing: "freemium", requiresKey: true,
    url: "https://github.com/pharmai/admet-predictor",
    fair: { findable: true, accessible: true, interoperable: false, reusable: true },
    installed: false, category: "ADMET", compatibleWith: ["A4", "A6"],
    testSteps: [
      { label: 'predict_admet(smiles="CCCS(=O)(=O)Nc1...")', result: "✓ Caco-2 permeability: 22.3 nm/s · hERG IC50: 18 µM · Microsomal t½: 42 min · BBB: No" },
    ],
  },
  {
    id: "scrnaseq-jupyter",
    name: "scRNA-seq Analysis Pipeline",
    description: "Single-cell RNA sequencing analysis for tissue-level drug response characterization.",
    type: "jupyter", version: "v2.1.0", author: "Broad Institute",
    license: "BSD-3", pricing: "free", requiresKey: false,
    url: "https://github.com/broadinstitute/scrnaseq-pipeline",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, category: "Genomics", compatibleWith: ["A5"],
    testSteps: [
      { label: "cluster_cells(matrix=melanoma_10x.h5, resolution=0.6)", result: "✓ 12 clusters · CD8+ T cells: 18% · Tumor cells: 34% · BRAF+ cells: 91% of tumor cluster" },
    ],
    installInstructions: [
      {
        title: "Create a conda environment",
        code: "conda create -n scrnaseq python=3.10 -y\nconda activate scrnaseq",
      },
      {
        title: "Install dependencies",
        code: "pip install scanpy==1.9.6 leidenalg python-igraph scrublet anndata cellrank",
        note: "Installation takes 3-5 minutes. Requires ~800 MB disk space.",
      },
      {
        title: "Clone the pipeline repository",
        code: "git clone https://github.com/broadinstitute/scrnaseq-pipeline\ncd scrnaseq-pipeline",
        actionUrl: "https://github.com/broadinstitute/scrnaseq-pipeline",
        actionLabel: "View on GitHub →",
      },
      {
        title: "Launch JupyterLab",
        code: "jupyter lab notebooks/01_preprocessing.ipynb",
        note: "Open the notebook in your browser and follow the step-by-step analysis. Data files go in the data/ subdirectory.",
      },
    ],
  },
  {
    id: "netpharm-source",
    name: "Network Pharmacology Toolkit",
    description: "Python package for constructing and analyzing drug-target-disease networks.",
    type: "source", version: "v0.9.1", author: "NetPharm Lab",
    license: "GPL-3.0", pricing: "free", requiresKey: false,
    url: "https://github.com/netpharm/toolkit",
    fair: { findable: true, accessible: true, interoperable: false, reusable: false },
    installed: false, category: "Network", compatibleWith: ["A2", "A3"],
    testSteps: [
      { label: 'build_network(drug="vemurafenib", disease="melanoma")', result: "✓ 147 nodes · 623 edges · Hub targets: BRAF, ERK2, MEK1 · Shortest path to apoptosis: 3 hops" },
    ],
    installInstructions: [
      {
        title: "Install from PyPI",
        code: "pip install netpharm-toolkit",
        note: "Requires Python ≥ 3.9. For GPU-accelerated graph algorithms, also install: pip install netpharm-toolkit[gpu]",
      },
      {
        title: "Basic usage",
        code: `from netpharm import NetworkBuilder

net = NetworkBuilder()
net.build(drug="vemurafenib", disease="melanoma")
net.visualize()  # opens interactive network in browser

# Get hub targets
hubs = net.get_hubs(top_n=10)
print(hubs)`,
        actionUrl: "https://github.com/netpharm/toolkit",
        actionLabel: "Documentation →",
      },
    ],
  },
  {
    id: "huggingface-api",
    name: "Hugging Face Hub",
    description: "Access 500,000+ pretrained models (BioGPT, ESM2, ChemBERTa, MolBERT) and datasets via the HF Inference API. Browse, run, and fine-tune biomedical models without local GPU.",
    type: "api", version: "v1.0", author: "Hugging Face",
    license: "Various (per model)", pricing: "freemium", requiresKey: true,
    url: "https://huggingface.co/docs/api-inference",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, connected: false,
    category: "Foundation Models",
    compatibleWith: ["A1", "A2", "A4", "A5"],
    testSteps: [
      { label: 'model_info("facebook/esm2_t33_650M_UR50D")', result: "✓ ESM-2 650M · Protein language model · 250M+ UniRef50 sequences · Downloads: 1.2M/month" },
      { label: 'inference("MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHFVHSQELLSRYPDLDAKGRERAIAKDLGAVFLVGIGGKLSDGHRHDVRAPDYDDWSTPSELGHAGLNGDILVWNPVLEDAFELSSMGIRVDADTLKHQLALTGDEDRLELEWHQALLRGEMPQTIGGGIGQSRLTMLLLQLPHIGQVQAGVWPAAVRESVPSLL")', result: "✓ Embedding generated (1280-dim) · Top motif: kinase domain (conf 0.97) · Predicted structure: α/β fold" },
      { label: 'dataset_search("drug discovery SMILES", task="molecular-generation")', result: "✓ 47 datasets found · ZINC-250k (250K drug-like) · ChEMBL-30 · MOSES benchmark · QM9 (134K molecules)" },
    ],
  },
  {
    id: "kaggle-api",
    name: "Kaggle Datasets & Notebooks",
    description: "Access curated drug discovery datasets, competition notebooks, and genomics data. Includes TCGA, GDSC, BindingDB, and community-contributed pharmaceutical datasets.",
    type: "api", version: "v1.6", author: "Google / Kaggle",
    license: "Various (per dataset)", pricing: "free", requiresKey: true,
    url: "https://www.kaggle.com/docs/api",
    fair: { findable: true, accessible: true, interoperable: true, reusable: false },
    installed: false, connected: false,
    category: "Datasets",
    compatibleWith: ["A4", "A5", "A8", "A9"],
    testSteps: [
      { label: 'dataset_search("drug sensitivity cancer cell lines")', result: "✓ 12 datasets · GDSC2 (1,001 cell lines × 298 drugs) · CCLE (1,457 lines) · NCI-60 panel" },
      { label: 'dataset_download("gcpr/gdsc-drug-sensitivity", file="GDSC2_fitted_dose_response.xlsx")', result: "✓ 310 MB · 324,765 IC50 measurements · 25 cancer types · Ready for pandas/sklearn ingestion" },
      { label: 'notebook_search("BRAF melanoma machine learning", sort_by="vote_count")', result: "✓ 34 notebooks · Top: 'BRAF Mutation Drug Response Predictor' (⭐ 412) · XGBoost AUC 0.87" },
    ],
  },
  {
    id: "sdd-chrome",
    name: "SmartDrugDiscovery for Chrome",
    description: "Browser extension for one-click data clipping from PubMed, ChEMBL, ClinicalTrials.gov, and patent databases directly into your projects. Highlights and saves structures, tables, and citations.",
    type: "source", version: "v0.9 (beta)", author: "UAB SysPAI",
    license: "Enterprise", pricing: "free",
    requiresKey: false,
    url: "https://chrome.google.com/webstore",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, connected: false,
    category: "Browser",
    compatibleWith: ["All models"],
    testSteps: [
      { label: "clip_selection() on PubMed abstract", result: "✓ Title, authors, DOI, abstract, and MeSH terms captured → added to active project" },
      { label: "clip_structure() on ChEMBL compound page", result: "✓ SMILES, InChI, MW, logP, TPSA extracted → linked to compound asset" },
      { label: "clip_table() on ClinicalTrials.gov results", result: "✓ 18-row HTML table parsed → CSV asset attached to project" },
    ],
    installInstructions: [
      {
        title: "Open the Chrome Web Store",
        note: 'Search for "SmartDrugDiscovery" in the Chrome Web Store and click Add to Chrome.',
        actionUrl: "https://chrome.google.com/webstore/search/SmartDrugDiscovery",
        actionLabel: "Open Chrome Web Store →",
      },
      {
        title: "Pin the extension",
        note: "After installation, click the puzzle icon (🧩) in the Chrome toolbar → find SmartDrugDiscovery → click the pin icon to keep it visible.",
      },
      {
        title: "Sign in with your ORCID",
        note: "Click the SDD extension icon → Sign in with ORCID. Your projects and active session will sync automatically.",
      },
      {
        title: "Test the clip function",
        note: 'Visit any PubMed article page, select text, and right-click → "Clip to SDD" or use the keyboard shortcut Ctrl+Shift+C (Mac: ⌘+Shift+C).',
      },
    ],
  },
  {
    id: "sdd-powerpoint",
    name: "SmartDrugDiscovery for PowerPoint",
    description: "Office add-in for generating publication-quality slide decks from your project data — compound dashboards, A1–A10 validation summaries, survival curves, and MCP-pulled literature slides.",
    type: "source", version: "v0.8 (beta)", author: "UAB SysPAI",
    license: "Enterprise", pricing: "free",
    requiresKey: false,
    url: "https://appsource.microsoft.com",
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false, connected: false,
    category: "Office",
    compatibleWith: ["All models"],
    testSteps: [
      { label: 'generate_slide("BRAF compound validation summary")', result: "✓ 6-slide deck: executive summary, target overview, A1–A10 heatmap, ADMET profile, literature evidence, go/no-go recommendation" },
      { label: 'export_survival_curve({ project_id: "P-001", format: "pptx" })', result: "✓ Kaplan-Meier chart embedded as editable PowerPoint chart object (not image)" },
      { label: 'insert_mcp_slide({ source: "pubmed", query: "BRAF V600E resistance mechanisms" })', result: "✓ 1 literature slide with top-3 abstracts, citation table, and key figure placeholder" },
    ],
    installInstructions: [
      {
        title: "Open Microsoft AppSource",
        note: 'Search for "SmartDrugDiscovery" in AppSource and click Get it now.',
        actionUrl: "https://appsource.microsoft.com/en-us/search?search=SmartDrugDiscovery",
        actionLabel: "Open Microsoft AppSource →",
      },
      {
        title: "Add to PowerPoint",
        note: "In PowerPoint, go to Insert → Get Add-ins (or My Add-ins) → search for SmartDrugDiscovery → click Add.",
      },
      {
        title: "Activate with your SDD account",
        note: "The add-in panel will open on the right side of PowerPoint. Sign in with your ORCID credentials to connect to your projects.",
      },
      {
        title: "Generate your first slide deck",
        note: 'In the SDD panel, choose a project → click "Generate Deck" → select a template (Validation Summary, ADMET Report, or Cohort Analysis). The deck is inserted into your current presentation.',
      },
    ],
  },
  {
    id: "talent-kg",
    name: "Talent Knowledge Graph",
    description: "Query researcher profiles, skills, availability, and project history to build optimal drug discovery teams from structured data",
    type: "mcp",
    version: "v1.0.0",
    author: "UAB SysPAI",
    license: "Internal",
    url: "mcp://talent-kg.syspai.uab.edu",
    pricing: "free",
    requiresKey: false,
    fair: { findable: true, accessible: true, interoperable: true, reusable: true },
    installed: false,
    connected: false,
    category: "People & Teams",
    compatibleWith: ["All models"],
    testSteps: [
      { label: 'search_experts({ skill: "BRAF kinase inhibitor" })', result: "3 matches: Dr. Sarah Chen (95%), Dr. Raj Patel (88%), Dr. Elena Vasquez (82%)" },
      { label: 'get_availability({ person_ids: ["SC","RP"] })', result: "Sarah Chen: Available (80% capacity) · Raj Patel: Available (60% capacity)" },
      { label: 'get_project_history({ person_id: "SC" })', result: "5 oncology programs: BRAF (lead), EGFR, KRAS, CDK4/6, MEK — all IND-stage or later" },
    ],
    installInstructions: [
      {
        title: "Add to Claude Desktop config",
        code: `{
  "mcpServers": {
    "talent-kg": {
      "command": "npx",
      "args": ["-y", "@uab-syspai/talent-kg-mcp"],
      "env": {
        "TALENT_KG_ENDPOINT": "https://talent-kg.syspai.uab.edu",
        "TALENT_KG_TOKEN": "<your-institutional-token>"
      }
    }
  }
}`,
        note: 'Open claude_desktop_config.json and merge this block. Replace <your-institutional-token> with the token from your IT administrator.',
      },
      {
        title: "Obtain your institutional token",
        note: "Contact UAB SysPAI IT (syspai-it@uab.edu) to request a Talent KG access token. Tokens are issued per-user and linked to your ORCID identity.",
      },
      {
        title: "Restart Claude Desktop",
        note: "Quit and relaunch Claude Desktop. The talent_kg tools will appear in the tool selector in your next conversation.",
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function FairBadge({ letter, met }: { letter: string; met: boolean }) {
  return (
    <span className={cn("h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center", met ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300")}>
      {letter}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 rounded-md bg-muted/80 hover:bg-muted border border-input px-2 py-1 text-[10px] font-medium transition-colors"
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Install modal ─────────────────────────────────────────────────────────────

function InstallModal({
  plugin,
  onClose,
  onInstalled,
}: {
  plugin: Plugin;
  onClose: () => void;
  onInstalled: () => void;
}) {
  const steps = plugin.installInstructions ?? [];
  const tc = typeConfig[plugin.type];

  const handleDone = () => {
    onInstalled();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b shrink-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-lg">
            {plugin.type === "mcp" ? "🔌" : plugin.type === "api" ? "🌐" : plugin.type === "docker" ? "🐳" : plugin.type === "jupyter" ? "📓" : "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Install — {plugin.name}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tc.badge)}>{tc.label}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground shrink-0"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No install instructions available for this plugin.</p>
          ) : (
            steps.map((step, i) => (
              <div key={i} className="space-y-2">
                {/* Step title */}
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium">{step.title}</p>
                </div>

                {/* Code block */}
                {step.code && (
                  <div className="relative">
                    <pre className="rounded-lg bg-muted/60 border border-border px-4 py-3 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre pr-16">
                      {step.code}
                    </pre>
                    <CopyButton text={step.code} />
                  </div>
                )}

                {/* Note */}
                {step.note && (
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">{step.note}</p>
                )}

                {/* External action */}
                {step.actionUrl && (
                  <div className="pl-7">
                    <a
                      href={step.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                    >
                      {step.actionLabel ?? "Open link →"}
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Follow all steps above, then click <span className="font-semibold text-foreground">Mark as Installed</span> to enable the 🧪 Test button.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Mark as Installed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Test modal ────────────────────────────────────────────────────────────────

function TestModal({ plugin, onClose }: { plugin: Plugin; onClose: () => void }) {
  const [step, setStep] = useState(0);   // 0 = idle, 1..n = running step n, 99 = done
  const [lines, setLines] = useState<{ label: string; result: string; done: boolean }[]>([]);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setLines([]);
    setStep(0);
    for (let i = 0; i < plugin.testSteps.length; i++) {
      setStep(i + 1);
      setLines((prev) => [...prev, { label: plugin.testSteps[i].label, result: "", done: false }]);
      await new Promise((r) => setTimeout(r, 900));
      setLines((prev) =>
        prev.map((l, idx) =>
          idx === i ? { ...l, result: plugin.testSteps[i].result, done: true } : l
        )
      );
      await new Promise((r) => setTimeout(r, 300));
    }
    setStep(99);
    setRunning(false);
  };

  // auto-run on open
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Test — {plugin.name}</p>
            <p className="text-xs text-muted-foreground">{plugin.connectedTools?.length ?? "?"} tools · running live test query</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 p-5 space-y-3 max-h-96 overflow-y-auto font-mono text-xs">
          {/* User prompt */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-sm not-italic font-sans">
              Test connection to <span className="font-semibold">{plugin.name}</span> — run example query
            </div>
          </div>

          {/* Tool calls */}
          {lines.map((l, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-start gap-2 text-muted-foreground">
                <span className="text-blue-500 shrink-0">▶</span>
                <span className="text-blue-600 dark:text-blue-400">{l.label}</span>
              </div>
              {l.done ? (
                <div className="ml-4 text-green-600 dark:text-green-400">{l.result}</div>
              ) : (
                <div className="ml-4 flex gap-1 text-muted-foreground">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </div>
              )}
            </div>
          ))}

          {/* Final verdict */}
          {step === 99 && (
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 not-italic font-sans">
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                Connection verified — {plugin.name} is working
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                All {plugin.testSteps.length} test {plugin.testSteps.length === 1 ? "query" : "queries"} returned valid responses.
                You can now use this plugin in Design with AI.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex items-center justify-between gap-3">
          <button
            onClick={run}
            disabled={running}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <svg className={cn("h-3.5 w-3.5", running && "animate-spin")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Run again
          </button>
          <button
            onClick={onClose}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Credential modal (connect paid/freemium plugins with API key) ──────────────

function CredentialModal({
  plugin,
  onClose,
  onConnect,
}: {
  plugin: Plugin;
  onClose: () => void;
  onConnect: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-base font-semibold">Connect — {plugin.name}</h3>
        <p className="text-xs text-muted-foreground">
          This plugin requires your personal API key or login credentials.
          Your key is stored only in your browser session.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-medium">API Key / Access Token</label>
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => setShow(!show)} className="rounded-md border px-3 py-2 text-xs hover:bg-muted transition-colors">
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">Cancel</button>
          <button
            disabled={!apiKey.trim()}
            onClick={() => { if (apiKey.trim()) { onConnect(); onClose(); } }}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Uninstall modal ────────────────────────────────────────────────────────────

function UninstallModal({
  plugin,
  onClose,
  onConfirm,
}: {
  plugin: Plugin;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ready = typed.trim().toLowerCase() === "yes";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-base">Uninstall Plugin</h3>
            <p className="text-sm text-muted-foreground">{plugin.name}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-300 space-y-1">
          <p className="font-medium">This action cannot be undone.</p>
          <p>All connected tool access will be revoked. Any workflows using this plugin will immediately stop working.</p>
        </div>

        {/* Confirm input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">yes</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="yes"
            autoFocus
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (ready) { onConfirm(); onClose(); } }}
            disabled={!ready}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2",
              ready
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-100 text-red-300 dark:bg-red-900/20 cursor-not-allowed"
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Uninstall
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PluginsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "User";

  const [typeFilter, setTypeFilter] = useState<PluginType | "all">("all");
  const [search, setSearch]         = useState("");
  const [testPlugin, setTestPlugin] = useState<Plugin | null>(null);
  const [credPlugin, setCredPlugin]         = useState<Plugin | null>(null);
  const [uninstallPlugin, setUninstallPlugin] = useState<Plugin | null>(null);
  const [installPlugin, setInstallPlugin]   = useState<Plugin | null>(null);

  // ── Installed state backed by localStorage ──────────────────────────────────
  // Start with hardcoded defaults (plugins where installed: true)
  const [installedIds, setInstalledIds] = useState<Set<string>>(
    () => new Set(plugins.filter((p) => p.installed).map((p) => p.id))
  );

  // Merge with any previously saved installs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sdd-plugin-installs");
      if (stored) {
        const arr: string[] = JSON.parse(stored);
        setInstalledIds((prev) => new Set(Array.from(prev).concat(arr)));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const markInstalled = (id: string) => {
    setInstalledIds((prev) => {
      const next = new Set(Array.from(prev).concat([id]));
      try { localStorage.setItem("sdd-plugin-installs", JSON.stringify(Array.from(next))); } catch { /* noop */ }
      return next;
    });
  };

  const markUninstalled = (id: string) => {
    setInstalledIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try { localStorage.setItem("sdd-plugin-installs", JSON.stringify(Array.from(next))); } catch { /* noop */ }
      return next;
    });
  };

  // ── Derived helpers ─────────────────────────────────────────────────────────
  const isDev    = can(role, "viewIntegrationGuide");
  const canAdmin = can(role, "uninstallPlugin");

  const filtered = plugins
    .filter((p) => typeFilter === "all" || p.type === typeFilter)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    })
    .sort((a, b) => typeConfig[a.type].preference - typeConfig[b.type].preference);

  const roleMeta = ROLE_META[role];

  return (
    <div className="container mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Tool Plugins</h1>
          <p className="text-muted-foreground mt-1">FAIR-compliant integrations for extending the AIDD platform</p>
        </div>
        {/* Role banner */}
        <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs", roleMeta.color)}>
          <span className="font-semibold">{roleMeta.label}</span>
          <span className="opacity-70">— {roleMeta.description}</span>
        </div>
      </div>

      {/* View differs by role */}
      {!isDev && (
        <div className="mb-5 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3 text-xs text-yellow-800 dark:text-yellow-400">
          <span className="font-semibold">User view:</span> You can browse all plugins, install free ones directly, and connect paid plugins with your own API key.
          Configuration details and the integration guide are visible to Developers and above.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {(["all", "mcp", "api", "docker", "jupyter", "source"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {t === "all" ? "All" : typeConfig[t].label}
            </button>
          ))}
        </div>
        <input
          type="text" placeholder="Search plugins…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full sm:w-64"
        />
      </div>

      {/* Plugin grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((plugin) => {
          const tc = typeConfig[plugin.type];
          const pc = pricingBadge[plugin.pricing];
          const isInstalled = installedIds.has(plugin.id);
          const isConnected = plugin.connected ?? false;
          const testable = isInstalled || isConnected;
          return (
            <Card key={plugin.id} className={cn("flex flex-col", isConnected && "border-green-200 dark:border-green-800")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{plugin.name}</CardTitle>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium whitespace-nowrap", tc.badge)}>{tc.label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", pc.color)}>{pc.label}</span>
                  </div>
                </div>
                <CardDescription className="text-xs mt-1">{plugin.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 flex-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{plugin.version}</span>
                  <span>{plugin.author}</span>
                  <span>{plugin.license}</span>
                </div>

                {/* FAIR badges */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">FAIR:</span>
                  <FairBadge letter="F" met={plugin.fair.findable} />
                  <FairBadge letter="A" met={plugin.fair.accessible} />
                  <FairBadge letter="I" met={plugin.fair.interoperable} />
                  <FairBadge letter="R" met={plugin.fair.reusable} />
                </div>

                {/* Compatible models */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Models:</span>
                  {plugin.compatibleWith.map((l) => (
                    <span key={l} className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{l}</span>
                  ))}
                </div>

                {/* Connected tools — shown only to Developers+ */}
                {isConnected && plugin.connectedTools && isDev && (
                  <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2">
                    <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {plugin.connectedTools.length} live tools
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plugin.connectedTools.map((t) => (
                        <span key={t} className="rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 text-[10px] font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connected indicator for Users (simplified) */}
                {isConnected && !isDev && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected and ready to use
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-2 flex gap-2">
                  {/* Primary action */}
                  {isConnected ? (
                    <button disabled className="flex-1 rounded-md border border-green-500 text-green-700 bg-green-50 dark:bg-green-950/20 px-3 py-2 text-xs font-medium cursor-default flex items-center justify-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      Connected
                    </button>
                  ) : isInstalled ? (
                    <button disabled className="flex-1 rounded-md border border-blue-400 text-blue-700 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 text-xs font-medium cursor-default flex items-center justify-center gap-2">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      Installed
                    </button>
                  ) : plugin.requiresKey ? (
                    <button
                      onClick={() => setCredPlugin(plugin)}
                      className="flex-1 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Connect with API Key
                    </button>
                  ) : (
                    <button
                      onClick={() => setInstallPlugin(plugin)}
                      className="flex-1 rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v14M5 9l7 7 7-7" /><path d="M5 22h14" />
                      </svg>
                      Install Free
                    </button>
                  )}

                  {/* Test button — all roles, only if installed/connected */}
                  {testable && (
                    <button
                      onClick={() => setTestPlugin(plugin)}
                      title="Test connection"
                      className="rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      🧪
                    </button>
                  )}

                  {/* Uninstall — Admin+ only */}
                  {canAdmin && isInstalled && (
                    <button
                      onClick={() => setUninstallPlugin(plugin)}
                      title="Uninstall"
                      className="rounded-md border border-red-200 text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No plugins found matching your criteria.</div>
      )}

      {/* Integration Guide reference — full guide lives in Support Center */}
      {isDev && (
        <div className="mt-10 rounded-xl border border-dashed bg-muted/30 px-6 py-5 flex items-start gap-4">
          <span className="text-3xl shrink-0">🔌</span>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold text-sm">MCP Integration Guide</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The step-by-step guide for finding, installing, configuring, and testing MCP servers has moved to the Support Center — alongside documentation, training videos, and external portals.
            </p>
            <div className="flex gap-3 pt-1">
              <a href="/support" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors">
                Open Support Center →
              </a>
              <a href="/support#mcp-guide" className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                Jump to MCP Guide
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {installPlugin && (
        <InstallModal
          plugin={installPlugin}
          onClose={() => setInstallPlugin(null)}
          onInstalled={() => markInstalled(installPlugin.id)}
        />
      )}
      {testPlugin && (
        <TestModal plugin={testPlugin} onClose={() => setTestPlugin(null)} />
      )}
      {credPlugin && (
        <CredentialModal
          plugin={credPlugin}
          onClose={() => setCredPlugin(null)}
          onConnect={() => markInstalled(credPlugin.id)}
        />
      )}
      {uninstallPlugin && (
        <UninstallModal
          plugin={uninstallPlugin}
          onClose={() => setUninstallPlugin(null)}
          onConfirm={() => markUninstalled(uninstallPlugin.id)}
        />
      )}
    </div>
  );
}
