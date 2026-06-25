export enum AppStep {
  ACCUEIL = "ACCUEIL",
  SELFIE = "SELFIE",
  PROJECTION = "PROJECTION",
  DIAGNOSTIC = "DIAGNOSTIC",
  ROUE = "ROUE",
  LEAD = "LEAD",
  FIN = "FIN"
}

export interface DiagnosticAnswers {
  ageRange: string;
  situationPro: string;
  salaireRange: string;
  connaissance: string;
  epargneActuelle: string;
}

export interface LeadInfo {
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  city: string;
  company: string;
  giftWon?: string;
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
