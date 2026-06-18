import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initDb, insertLead, getAllLeads, getDbStatus } from "./db";

dotenv.config();

// Lazily initialize Gemini to prevent crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Falling back to local template response.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// API routes first
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { name, age, answers } = req.body;

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return a simulated high-quality response if API key is not present
      console.log("Simulating analysis response (Missing GEMINI_API_KEY)");
      const score = calculateMockScore(answers);
      const category = score >= 80 ? "BIEN_PREPARE" : score >= 50 ? "A_RENFORCER" : "ACTION_RECOMMANDEE";
      const userFirstName = name || "Mehdi";
      
      return res.json({
        letter: `Bonjour ${userFirstName},\n\nIci ton double de 65 ans. J'ai le plaisir de t'annoncer que je me porte merveilleusement bien ! C'est fou de regarder en arrière et de voir à quel point les choix que tu fais aujourd'hui tracent la voie pour notre équilibre et notre liberté de demain. Chaque jour est prédisposé par notre sérénité d'aujourd'hui. Tu es pleinement engagé dans la construction de notre futur. Continue d'y accorder l'attention requise, tu as tout à y gagner !`,
        percentageScore: score,
        category: category,
        tips: [
          {
            title: "Créez votre filet d'épargne individuelle",
            desc: "Pour un profil comme le vôtre, le programme CIMR Al Moustaqbal offre une souplesse totale permettant d'épargner à votre rythme avec des versements ajustables.",
            solution: "CIMR Al Moustaqbal"
          },
          {
            title: "Estimez vos droits futurs",
            desc: "La CIMR met à disposition un simulateur interactif pour comptabiliser vos points retraite acquis et futurs afin d'éviter tout imprévu.",
            solution: "Mon Espace CIMR"
          }
        ]
      });
    }

    const ai = getGeminiClient();
    const prompt = `
      Tu es le "Futur Vous" (âgé de 65 ans) de l'utilisateur nommé ${name || "Mehdi"} (qui a actuellement ${age || 25} ans).
      Analyse son profil et ses réponses au questionnaire de préparation retraite de la CIMR (Caisse Interprofessionnelle Marocaine de Retraite) ci-dessous :
      
      - Âge de départ souhaité : ${answers?.departureAge || "Non spécifié"}
      - Statut d'épargne actuel : ${answers?.savingsStatus || "Non spécifié"}
      - Part de revenus épargnée : ${answers?.savingsRate || "Non spécifié"}
      - Connaissance de sa future pension : ${answers?.pensionKnowledge || "Non spécifié"}
      - Priorité principale à la retraite : ${answers?.primaryPriority || "Non spécifié"}

      Rédige une lettre touchante, inspirante et réaliste en français de "toi-même à 65 ans" envoyée à ton "toi jeune d'aujourd'hui" (${name }).
      Insiste sur l'importance de préparer sa retraite dès aujourd'hui auprès de la CIMR.
      Propose également 2 ou 3 conseils financiers clés très personnalisés qui mentionnent des produits retraite réels de la CIMR Maroc comme :
      - "CIMR Al Moustaqbal" (idéal pour les versements individuels libres et souples)
      - "CIMR Al Kamel" (retraite complémentaire par capitalisation)
      - "Mon Espace CIMR" (portail de suivi et simulation de points)
      
      Renvoie la réponse sous forme de JSON structuré correspondant exactement au schéma demandé.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Tu es le double de l'utilisateur à 65 ans, plein de sagesse et de bienveillance. Tu t'exprimes avec émotion et donnes des conseils financiers de la CIMR pertinents en français.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letter: {
              type: Type.STRING,
              description: "Une lettre touchante et personnalisée pour le jeune Mehdi (ou le prénom de l'utilisateur) de la part de lui-même à 65 ans. Fais référence à son âge et à ses choix."
            },
            percentageScore: {
              type: Type.INTEGER,
              description: "Le score global estimé de préparation retraite entre 10 et 100."
            },
            category: {
              type: Type.STRING,
              description: "La catégorie de préparation. Doit être l'une des valeurs : 'BIEN_PREPARE', 'A_RENFORCER', 'ACTION_RECOMMANDEE'."
            },
            tips: {
              type: Type.ARRAY,
              description: "La liste de 2 ou 3 conseils personnalisés pour optimiser sa retraite avec la CIMR.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Un titre percutant pour le conseil." },
                  desc: { type: Type.STRING, description: "Explication détaillée avec mention d'un service ou produit CIMR." },
                  solution: { type: Type.STRING, description: "La solution CIMR recommandée (ex: 'CIMR Al Moustaqbal', 'CIMR Al Kamel', 'Mon Espace CIMR')." }
                },
                required: ["title", "desc", "solution"]
              }
            }
          },
          required: ["letter", "percentageScore", "category", "tips"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText.trim());
    res.json(data);

  } catch (error: any) {
    console.error("Error with Gemini analysis route:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'analyse IA." });
  }
});

// Enregistrer un nouveau lead (bilan retraite) dans PostgreSQL
app.post("/api/leads", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, age, score, category, answers, letter } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "L'adresse email est requise." });
    }

    const leadId = await insertLead({
      firstName: firstName || "",
      lastName: lastName || "",
      email: email,
      phone: phone || "",
      age: age ? parseInt(age, 10) : 0,
      score: score ? parseInt(score, 10) : 0,
      category: category || "A_RENFORCER",
      answers: answers || {},
      letter: letter || ""
    });

    // Sync to remote Railway Primary instance
    const railwayApiUrl = process.env.RAILWAY_API_URL;
    if (railwayApiUrl) {
      console.log(`📬 Synclink: Sending lead to ${railwayApiUrl}/api/leads`);
      fetch(`${railwayApiUrl}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: firstName || "",
          lastName: lastName || "",
          email: email,
          phone: phone || "",
          age: age ? parseInt(age, 10) : 0,
          score: score ? parseInt(score, 10) : 0,
          category: category || "A_RENFORCER",
          answers: answers || {},
          letter: letter || ""
        })
      })
      .then(async (r) => {
        if (r.ok) {
          console.log(`✅ Status 200: Lead synced to Railway production successfully.`);
        } else {
          console.warn(`⚠️ Status ${r.status}: Sync payload rejected on production server.`);
        }
      })
      .catch((err) => {
        console.error(`❌ Sync Network Error: Could not reach live Railway domain:`, err.message);
      });
    }

    res.json({ success: true, leadId });
  } catch (error: any) {
    console.error("Error saving lead to database:", error);
    res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement de votre bilan." });
  }
});

// Récupérer tous les leads de la base de données
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await getAllLeads();
    res.json({ leads });
  } catch (error: any) {
    console.error("Error retrieving leads:", error);
    res.status(500).json({ error: "Une erreur est survenue lors du chargement des bilans." });
  }
});

// Récupérer le statut de la base de données
app.get("/api/db/status", async (req, res) => {
  try {
    const status = getDbStatus();
    const leads = await getAllLeads().catch(() => []);
    const railwayUrl = process.env.RAILWAY_API_URL || "";
    res.json({ 
      ...status, 
      count: leads.length,
      railwayUrl,
      syncEnabled: !!railwayUrl
    });
  } catch (err) {
    res.json({ connected: false, fallback: true, host: "Error", count: 0, railwayUrl: "", syncEnabled: false });
  }
});

// Exporter les données PostgreSQL en fichier CSV (site leads data file)
app.get("/api/leads/export", async (req, res) => {
  try {
    const leads = await getAllLeads();
    
    // Construct CSV Header and rows
    const headers = [
      "ID",
      "Date de creation",
      "Prenom",
      "Nom",
      "Email",
      "Telephone",
      "Age",
      "Score Diagnostic (%)",
      "Categorie"
    ];
    
    const rows = leads.map((lead: any) => [
      lead.id,
      lead.created_at ? new Date(lead.created_at).toISOString() : "",
      `"${(lead.first_name || "").replace(/"/g, '""')}"`,
      `"${(lead.last_name || "").replace(/"/g, '""')}"`,
      `"${(lead.email || "").replace(/"/g, '""')}"`,
      `"${(lead.phone || "").replace(/"/g, '""')}"`,
      lead.age || 0,
      lead.score || 0,
      lead.category || ""
    ]);
    
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="leads_cimr_database.csv"');
    res.send(csvContent);
  } catch (error: any) {
    console.error("Failed to export leads:", error);
    res.status(500).send("Erreur lors de la génération du fichier.");
  }
});

// Helper function to calculate a mock score based on questionnaire answers
function calculateMockScore(answers: any): number {
  if (!answers) return 55;
  let score = 30;
  
  if (answers.departureAge === "Après 65 ans") score += 15;
  else if (answers.departureAge === "60-65 ans") score += 20;
  else score += 10; // Early retirement is harder to prepare

  if (answers.savingsStatus === "Oui, régulièrement") score += 25;
  else if (answers.savingsStatus === "Oui, occasionnellement") score += 15;
  else score += 5;

  if (answers.savingsRate === "Plus de 15%") score += 25;
  else if (answers.savingsRate === "Entre 5% et 15%") score += 15;
  else score += 5;

  if (answers.pensionKnowledge === "Oui, précisément") score += 20;
  else if (answers.pensionKnowledge === "Vaguement") score += 10;
  else score += 5;

  return Math.min(score, 100);
}

// Vite integration
async function setupVite() {
  // Initialize database tables
  await initDb();

  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static assets from /dist in production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CIMR Future Mirror Server listening on host 0.0.0.0, port ${PORT}`);
  });
}

setupVite();
