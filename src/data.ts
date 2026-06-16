import { DemoProfile } from "./types";

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "mehdi",
    name: "Mehdi",
    gender: "M",
    age: 25,
    youngPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    quote: "Le futur dépend entièrement des décisions que vous prenez aujourd'hui."
  },
  {
    id: "sarah",
    name: "Sarah",
    gender: "F",
    age: 28,
    youngPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
    quote: "Anticiper de bonne heure, c’est s'offrir le luxe de vivre pleinement demain."
  },
  {
    id: "thomas",
    name: "Thomas",
    gender: "M",
    age: 34,
    youngPhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=80",
    quote: "Se projeter à 65 ans me donne de l'ambition pour bâtir un capital solide."
  },
  {
    id: "sofia",
    name: "Sofia",
    gender: "F",
    age: 30,
    youngPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=80",
    quote: "La retraite n'est pas une fin, c’est le commencement d'une seconde jeunesse libre."
  }
];

export interface DiagnosticQuestion {
  key: "departureAge" | "savingsStatus" | "savingsRate" | "pensionKnowledge" | "primaryPriority";
  text: string;
  options: { label: string; icon: string }[];
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    key: "departureAge",
    text: "À quel âge aimeriez-vous idéalement partir à la retraite ?",
    options: [
      { label: "Avant 60 ans", icon: "🚀" },
      { label: "60 à 65 ans", icon: "📅" },
      { label: "Après 65 ans", icon: "⏳" }
    ]
  },
  {
    key: "savingsStatus",
    text: "Avez-vous déjà commencé à vous constituer une épargne retraite ?",
    options: [
      { label: "Oui, régulièrement", icon: "💎" },
      { label: "Oui, occasionnellement", icon: "🌱" },
      { label: "Non, pas encore", icon: "💤" }
    ]
  },
  {
    key: "savingsRate",
    text: "Quelle proportion de vos revenus mensuels pouvez-vous y consacrer ?",
    options: [
      { label: "Moins de 5%", icon: "🪙" },
      { label: "Entre 5% et 15%", icon: "💰" },
      { label: "Plus de 15%", icon: "👑" }
    ]
  },
  {
    key: "pensionKnowledge",
    text: "Connaissez-vous le montant estimé de votre future pension à ce jour ?",
    options: [
      { label: "Oui, précisément", icon: "🎯" },
      { label: "Vaguement / En partie", icon: "🔍" },
      { label: "Non, pas du tout", icon: "🌫️" }
    ]
  },
  {
    key: "primaryPriority",
    text: "Quelle est votre priorité absolue pour votre avenir en fin de carrière ?",
    options: [
      { label: "Maintenir mon niveau de vie", icon: "🏡" },
      { label: "Financer mes projets & voyages", icon: "✈️" },
      { label: "Assurer la sécurité de mes proches", icon: "❤️" }
    ]
  }
];
