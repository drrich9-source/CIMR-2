export enum AppStep {
  ACCUEIL = "ACCUEIL",
  PHOTO = "PHOTO",
  TRANSFORMATION = "TRANSFORMATION",
  EMOTION = "EMOTION",
  DIAGNOSTIC = "DIAGNOSTIC",
  RESULTAT = "RESULTAT",
  LEAD = "LEAD",
  FIN = "FIN"
}

export interface DiagnosticAnswers {
  departureAge: string;
  savingsStatus: string;
  savingsRate: string;
  pensionKnowledge: string;
  primaryPriority: string;
}

export interface LeadInfo {
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
}

export interface TipItem {
  title: string;
  desc: string;
  solution: string;
}

export interface AnalysisResult {
  letter: string;
  percentageScore: number;
  category: "BIEN_PREPARE" | "A_RENFORCER" | "ACTION_RECOMMANDEE";
  tips: TipItem[];
}

export interface DemoProfile {
  id: string;
  name: string;
  gender: "M" | "F";
  age: number;
  youngPhoto: string;
  oldPhoto: string;
  quote: string;
}
