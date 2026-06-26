import { DemoProfile } from "./types";

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "mehdi",
    name: "Mehdi",
    gender: "M",
    age: 25,
    youngPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=80",
    quote: "Le futur dépend entièrement des décisions que vous prenez aujourd'hui."
  },
  {
    id: "sarah",
    name: "Sarah",
    gender: "F",
    age: 28,
    youngPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80",
    quote: "Anticiper de bonne heure, c’est s'offrir le luxe de vivre pleinement demain."
  },
  {
    id: "thomas",
    name: "Thomas",
    gender: "M",
    age: 34,
    youngPhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
    oldPhoto: "https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=500&auto=format&fit=crop&q=80",
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
  key: "ageRange" | "situationPro" | "salaireRange" | "connaissance" | "epargneActuelle";
  text: string;
  options: { label: string; icon: string }[];
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    key: "ageRange",
    text: "Quel âge avez-vous ?",
    options: [
      { label: "18-25 ans", icon: "👶" },
      { label: "26-35 ans", icon: "🧑" },
      { label: "36-45 ans", icon: "💼" },
      { label: "46-55 ans", icon: "📈" },
      { label: "56 ans et plus", icon: "👴" }
    ]
  },
  {
    key: "situationPro",
    text: "Êtes-vous salarié ?",
    options: [
      { label: "Oui, salarié du secteur privé", icon: "🏢" },
      { label: "Oui, salarié du secteur public", icon: "🏛️" },
      { label: "Non, travailleur indépendant", icon: "🎨" },
      { label: "Non, sans emploi / autre", icon: "👑" }
    ]
  },
  {
    key: "salaireRange",
    text: "Avez-vous déjà une retraite complémentaire ?",
    options: [
      { label: "Oui, via mon employeur actuel", icon: "🪙" },
      { label: "Oui, souscription individuelle", icon: "💵" },
      { label: "Non, aucune retraite complémentaire", icon: "💥" },
      { label: "Je ne sais pas", icon: "🌫️" }
    ]
  },
  {
    key: "connaissance",
    text: "Avez-vous une épargne ?",
    options: [
      { label: "Oui, épargne importante et structurée", icon: "🏛️" },
      { label: "Oui, épargne régulière modérée", icon: "📈" },
      { label: "Non, aucune épargne pour le moment", icon: "💤" }
    ]
  },
  {
    key: "epargneActuelle",
    text: "À quel âge souhaitez-vous prendre votre retraite ?",
    options: [
      { label: "Avant 60 ans", icon: "🚀" },
      { label: "À 60 ans (âge légal)", icon: "🎯" },
      { label: "À 65 ans (prolongation)", icon: "⏳" },
      { label: "Après 65 ans", icon: "👴" }
    ]
  }
];
