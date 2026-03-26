import { NextRequest, NextResponse } from "next/server";

interface MockCompound {
  chemblId: string;
  name: string;
  smiles: string;
  mw: number;
  logP: number;
  maxPhase: number;
  moleculeType: string;
}

const mockDatabase: MockCompound[] = [
  { chemblId: "CHEMBL25", name: "Aspirin", smiles: "CC(=O)Oc1ccccc1C(O)=O", mw: 180.16, logP: 1.2, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL941", name: "Imatinib", smiles: "Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1", mw: 493.60, logP: 2.5, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL553025", name: "Erlotinib", smiles: "COCCOc1cc2ncnc(Nc3cccc(C#C)c3)c2cc1OCCOC", mw: 393.44, logP: 2.7, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL1421", name: "Gefitinib", smiles: "COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN1CCOCC1", mw: 446.90, logP: 3.2, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL1336", name: "Sorafenib", smiles: "CNC(=O)c1cc(Oc2ccc(NC(=O)Nc3ccc(Cl)c(C(F)(F)F)c3)cc2)ccn1", mw: 464.83, logP: 3.8, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL1089", name: "Vemurafenib", smiles: "CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2cc[nH]c2C)c1F", mw: 489.92, logP: 3.6, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL2007641", name: "Osimertinib", smiles: "COc1cc(N(C)CCN(C)C)c(NC(=O)C=C)cc1Nc1nccc(-c2cn(C)c3ccccc23)n1", mw: 499.62, logP: 3.4, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL288441", name: "Crizotinib", smiles: "CC(Oc1cc(-c2cnn(C3CCNCC3)c2)cnc1N)c1c(Cl)ccc(F)c1Cl", mw: 450.34, logP: 3.7, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL2028663", name: "Dabrafenib", smiles: "CC(C)(C)c1nc(-c2cccc(NS(=O)(=O)c3c(F)cccc3F)c2F)c(-c2ccnc(N)n2)s1", mw: 519.56, logP: 3.1, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL2103875", name: "Trametinib", smiles: "CC(=O)Nc1cccc(-n2c(=O)c3c(Nc4ccc(I)cc4F)n(C)c(=O)n3c2=O)c1", mw: 615.40, logP: 2.9, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL1201583", name: "Lapatinib", smiles: "CS(=O)(=O)CCNCc1ccc(-c2ccc3ncnc(Nc4ccc(OCc5cccc(F)c5)c(Cl)c4)c3c2)o1", mw: 581.06, logP: 4.6, maxPhase: 4, moleculeType: "Small molecule" },
  { chemblId: "CHEMBL1642", name: "Metformin", smiles: "CN(C)C(=N)NC(=N)N", mw: 129.16, logP: -1.4, maxPhase: 4, moleculeType: "Small molecule" },
];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  if (!q) {
    return NextResponse.json({ results: [], error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // TODO: Replace with actual ChEMBL API integration
  const results = mockDatabase.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.chemblId.toLowerCase().includes(q)
  );

  return NextResponse.json({ results });
}
