import React, { useState, useEffect, useRef } from "react";
import { startSnapOldAgeSession, stopActiveSnapSession } from "./utils/snapCamera";
import { 
  Camera, QrCode, RefreshCw, User, Mail, Phone, ArrowRight, ArrowLeft, 
  CheckCircle, TrendingUp, Sparkles, Download, Info, X, Award, HelpCircle, 
  Briefcase, Calendar, ChevronRight, Monitor, Check, Activity, ShieldCheck, 
  Users, BarChart2, Star, Percent, Settings, FileSpreadsheet, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppStep, DiagnosticAnswers, LeadInfo, AnalysisResult } from "./types";
import { DEMO_PROFILES, DIAGNOSTIC_QUESTIONS } from "./data";

export default function App() {
  // Navigation & User State
  const [step, setStep] = useState<AppStep>(AppStep.ACCUEIL);
  const [username, setUsername] = useState<string>("Mehdi");
  const [userage, setUserage] = useState<number>(25);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("mehdi");
  
  // Photo capture states
  const [originalPhoto, setOriginalPhoto] = useState<string>(DEMO_PROFILES[0].youngPhoto);
  const [agedPhoto, setAgedPhoto] = useState<string>(DEMO_PROFILES[0].oldPhoto);
  const [isAgeifying, setIsAgeifying] = useState<boolean>(false);
  const [ageifyError, setAgeifyError] = useState<string | null>(null);

  // Client-side image optimization to support JPG, PNG, WEBP and resize max dimension to 800px
  const optimizeImage = (dataUrl: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as high-quality JPEG format with 0.8 quality
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(optimizedDataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = dataUrl;
    });
  };

  const processAgeifyImage = async (imageSrc: string) => {
    if (!imageSrc) return;
    
    // Skip if it's dynamic asset link from young demo profiles to prevent unwanted API requests
    if (imageSrc.startsWith("/") && !imageSrc.startsWith("data:")) {
      return; 
    }
    
    setIsAgeifying(true);
    setAgeifyError(null);
    try {
      // 10. Optimize image size before upload
      const optimizedBase64 = await optimizeImage(imageSrc, 800, 800);
      
      // Send the image to the backend endpoint POST /api/ageify
      const response = await fetch("/api/ageify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: optimizedBase64 }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Une erreur s'est produite lors de la transformation.");
      }

      const data = await response.json();
      if (data.success && data.imageUrl) {
        setAgedPhoto(data.imageUrl);
      } else {
        throw new Error("L'image de vieillissement n'a pas pu être générée.");
      }
    } catch (err: any) {
      console.error("AI aging error:", err);
      setAgeifyError(err?.message || "Une erreur inconnue est survenue.");
    } finally {
      setIsAgeifying(false);
    }
  };

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapActive, setSnapActive] = useState<boolean>(false);
  const [snapLoading, setSnapLoading] = useState<boolean>(false);
  const [showSnapDiagnostics, setShowSnapDiagnostics] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Progress & calculations logic
  const [transformProgress, setTransformProgress] = useState<number>(0);
  const [transformStatus, setTransformStatus] = useState<string>("");
  
  // Diagnostic Questionnaire states
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswers>({
    departureAge: "60 à 65 ans",
    savingsStatus: "Non, pas encore",
    savingsRate: "Moins de 5%",
    pensionKnowledge: "Non, pas du tout",
    primaryPriority: "Maintenir mon niveau de vie"
  });
  const [diagnosticIndex, setDiagnosticIndex] = useState<number>(0);
  
  // AI analysis results
  const [resultData, setResultData] = useState<AnalysisResult>({
    letter: `Bonjour Mehdi,\n\nIci ton double de 65 ans. J'ai le plaisir de t'annoncer que je me porte merveilleusement bien ! C'est fou de regarder en arrière et de voir à quel point les choix que tu fais aujourd'hui tracent la voie pour notre équilibre et notre liberté de demain. Chaque jour est prédisposé par notre sérénité d'aujourd'hui. Tu es pleinement engagé dans la construction de notre futur. Continue d'y accorder l'attention requise, tu as tout à y gagner !`,
    percentageScore: 55,
    category: "A_RENFORCER",
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
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  
  // Lead info
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    lastName: "",
    firstName: "",
    phone: "",
    email: ""
  });
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);
  const [submittingLead, setSubmittingLead] = useState<boolean>(false);
  
  // UI Display Toggles
  const [showKioskWrap, setShowKioskWrap] = useState<boolean>(true);
  const [qrCodeScannedSim, setQrCodeScannedSim] = useState<boolean>(false);
  
  // PostgreSQL Admin Panel & API status states
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminLeads, setAdminLeads] = useState<any[]>([]);
  const [loadingAdminLeads, setLoadingAdminLeads] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Helper code to compress and resize image prior to upload
  const fetchAdminData = async () => {
    setLoadingAdminLeads(true);
    try {
      const [leadsRes, statusRes] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/db/status").then((r) => r.json()),
      ]);
      setAdminLeads(leadsRes.leads || []);
      setDbStatus(statusRes);
    } catch (err) {
      console.error("Failed to load admin leads/status:", err);
    } finally {
      setLoadingAdminLeads(false);
    }
  };

  useEffect(() => {
    if (showAdminPanel) {
      fetchAdminData();
    }
  }, [showAdminPanel]);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Name when demo profile changes
  useEffect(() => {
    const activeProfile = DEMO_PROFILES.find(p => p.id === selectedProfileId);
    if (activeProfile && step === AppStep.ACCUEIL) {
      setUsername(activeProfile.name);
      setUserage(activeProfile.age);
      setOriginalPhoto(activeProfile.youngPhoto);
      setAgedPhoto(activeProfile.oldPhoto);
    }
  }, [selectedProfileId, step]);

  // Cleanup snapchat camera on unmount
  useEffect(() => {
    return () => {
      stopActiveSnapSession();
    };
  }, []);

  // Turn on/off camera
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setSnapActive(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      stopActiveSnapSession();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 500, height: 500, facingMode: "user" } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed", err);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur ou utilisez un fichier ou un modèle de démonstration ci-dessous.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    stopActiveSnapSession();
    setCameraActive(false);
    setSnapActive(false);
  };

  // Start webcam, initialize Snapchat Camera Kit and apply the requested lens
  const startSnapchatCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setSnapLoading(true);
    setSnapActive(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      stopActiveSnapSession();

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 500, height: 500, facingMode: "user" } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      if (canvasRef.current) {
        await startSnapOldAgeSession(stream, canvasRef.current);
        setSnapActive(true);
      } else {
        throw new Error("Target canvas element is not ready.");
      }
    } catch (err: any) {
      console.error("Snapchat Camera Kit failed", err);
      const errorStr = String(err?.message || err || "");
      if (errorStr.includes("permission denied") || errorStr.includes("[7]") || errorStr.includes("gRPC")) {
        setCameraError("Erreur Snapchat [7] : Accès refusé (Permission Denied). Le domaine actuel ou votre clé Snap API Token n'a pas accès à la Lens sélectionnée.");
      } else if (errorStr.includes("apiToken") || errorStr.includes("bootstrap")) {
        setCameraError("Erreur d'initialisation Snapchat : Clé de validation API manquante ou invalide.");
      } else {
        setCameraError(`Impossible d'accéder à la caméra Snapchat : ${errorStr || "Vérifiez vos autorisations."}`);
      }
      setShowSnapDiagnostics(true);
      setCameraActive(false);
      setSnapActive(false);
    } finally {
      setSnapLoading(false);
    }
  };

  // Capture current webcam or Snapchat filtered snapshot
  const capturePhoto = async () => {
    setSelectedProfileId("custom");
    if (snapActive && canvasRef.current) {
      const photoData = canvasRef.current.toDataURL("image/jpeg");
      setOriginalPhoto(photoData);
      stopCamera();
      await processAgeifyImage(photoData);
      return;
    }

    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw video mirrored for natural camera interaction
        ctx.translate(500, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, 500, 500);
        
        const photoData = canvas.toDataURL("image/jpeg");
        setOriginalPhoto(photoData);
        stopCamera();
        await processAgeifyImage(photoData);
      }
    }
  };

  // Upload pictures from file
  const handleUploadedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopCamera();
      setSelectedProfileId("custom");
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const uploadedSrc = event.target.result as string;
          setOriginalPhoto(uploadedSrc);
          await processAgeifyImage(uploadedSrc);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Select demo model snapshot
  const selectDemoProfile = async (id: string) => {
    stopCamera();
    setSelectedProfileId(id);
    const profile = DEMO_PROFILES.find(p => p.id === id);
    if (profile) {
      setUsername(profile.name);
      setUserage(profile.age);
      setOriginalPhoto(profile.youngPhoto);
      setAgedPhoto(profile.oldPhoto);
    }
  };

  // Trigger transformation scanner details and progress
  const startTransformationAnimation = () => {
    setStep(AppStep.TRANSFORMATION);
    setTransformProgress(0);
    
    const statuses = [
      "Initialisation de la borne de capture...",
      "Analyse de la symétrie faciale...",
      "Détection de l'implantation capillaire...",
      "Génération du masque de vieillesse (65 ans)...",
      "Application de la matrice de sénescence...",
      "Raffinement des ridules et zones de sagesse...",
      "Synchronisation des projections de vie...",
      "Préparation de votre rendez-vous émotionnel..."
    ];

    let currentVal = 0;
    const interval = setInterval(() => {
      currentVal += 1.5;
      if (currentVal >= 100) {
        currentVal = 100;
        clearInterval(interval);
        setTimeout(() => {
          setStep(AppStep.EMOTION);
        }, 500);
      }
      setTransformProgress(Math.floor(currentVal));
      
      const statusIndex = Math.min(
        Math.floor((currentVal / 100) * statuses.length),
        statuses.length - 1
      );
      setTransformStatus(statuses[statusIndex]);
    }, 45);
  };

  // Send request to Gemini server action
  const fetchGeminiAnalysis = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          age: userage,
          answers: diagnosticAnswers
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResultData(data);
      } else {
        throw new Error("Failed server-side generation");
      }
    } catch (err) {
      console.warn("Using client-side fallback due to error:", err);
      // Fallback calculation in case of connection limits
      let score = 40;
      if (diagnosticAnswers.savingsStatus === "Oui, régulièrement") score += 25;
      else if (diagnosticAnswers.savingsStatus === "Oui, occasionnellement") score += 15;
      
      if (diagnosticAnswers.savingsRate === "Plus de 15%") score += 25;
      else if (diagnosticAnswers.savingsRate === "Entre 5% et 15%") score += 15;

      if (diagnosticAnswers.pensionKnowledge === "Oui, précisément") score += 20;
      
      const valScore = Math.min(score + 10, 95);
      const category = valScore >= 75 ? "BIEN_PREPARE" : valScore >= 45 ? "A_RENFORCER" : "ACTION_RECOMMANDEE";

      setResultData({
        letter: `Bonjour ${username},\n\nIci ton double de 65 ans. C'est magique de me projeter et de constater combien notre dynamisme de jeunesse m'habite encore ! Le diagnostic montre que tu commences à y penser. Pour m'aider à couler des jours heureux au Maroc, sache que s'y prendre tôt est la clé absolue. À très vite,\nTon toi du futur.`,
        percentageScore: valScore,
        category: category,
        tips: [
          {
            title: "Valorisez votre épargne retraite dès aujourd'hui",
            desc: "Souscrivez au régime individuel 'CIMR Al Moustaqbal'. Modifiable à volonté, il sécurisera votre rythme de vie futur.",
            solution: "CIMR Al Moustaqbal"
          },
          {
            title: "Simulez vos futurs points",
            desc: "Créez votre compte sur 'Mon Espace CIMR' pour suivre en direct vos cotisations et points accumulés.",
            solution: "Mon Espace CIMR"
          }
        ]
      });
    } finally {
      setLoadingAI(false);
      setStep(AppStep.RESULTAT);
    }
  };

  // Handle lead form submission
  const submitLeadForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLead(true);
    
    try {
      const resp = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: leadInfo.firstName,
          lastName: leadInfo.lastName,
          email: leadInfo.email,
          phone: leadInfo.phone,
          age: userage,
          score: resultData.percentageScore,
          category: resultData.category,
          answers: diagnosticAnswers,
          letter: resultData.letter
        })
      });

      if (!resp.ok) {
        throw new Error(`Server returned status ${resp.status}`);
      }

      setLeadSubmitted(true);
      setStep(AppStep.FIN);
    } catch (error) {
      console.error("PostgreSQL DB lead submission failed:", error);
      // Fallback gracefully so user experience isn't broken
      setLeadSubmitted(true);
      setStep(AppStep.FIN);
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleRestart = () => {
    stopCamera();
    setStep(AppStep.ACCUEIL);
    setDiagnosticIndex(0);
    setLeadSubmitted(false);
    setLeadInfo({ lastName: "", firstName: "", phone: "", email: "" });
    setQrCodeScannedSim(false);
  };

  return (
    <div className="min-h-screen bg-[#050A18] text-white flex flex-col items-center justify-start p-4 md:p-8 font-sans relative selection:bg-[#00529B] selection:text-white">
      
      {/* Decorative premium light glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00529B]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header controls for kiosk display */}
      <header className="w-full max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center px-6 py-6 border-b border-white/10 gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00529B] rounded-full flex items-center justify-center font-bold text-xl italic text-white shadow-[0_0_15px_rgba(0,82,155,0.5)]">
            C
          </div>
          <div>
            <h1 className="text-sm tracking-widest font-semibold uppercase text-white font-display">
              CIMR <span className="text-white/40">|</span> FUTURE MIRROR
            </h1>
            <p className="text-[10px] text-white/50 tracking-widest uppercase font-mono">Borne Interactive N° 842</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[10px] font-mono text-white/60 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 tracking-[0.15em] uppercase">
            SIMULATEUR +65 ANS
          </span>
          <button
            onClick={() => setShowAdminPanel(true)}
            id="db-admin-btn"
            className="flex items-center gap-2 text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 px-4 py-2 rounded-xl transition duration-150 border border-orange-500/30 active:scale-95 cursor-pointer font-medium"
          >
            <Settings className="w-4 h-4 text-orange-400" />
            PostgreSQL & API status
          </button>
          <button
            onClick={() => setShowKioskWrap(!showKioskWrap)}
            id="toggle-kiosk"
            className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 hover:text-white text-white/80 px-4 py-2 rounded-xl transition duration-150 border border-white/10 active:scale-95 cursor-pointer font-medium"
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            {showKioskWrap ? "Masquer Totem" : "Afficher Totem"}
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 mb-8">
        
        {/* LEFT COLUMN: Physical Kiosk Blue Aluminum Totem (Only visible when toggled) */}
        {showKioskWrap && (
          <div className="lg:col-span-4 bg-white/5 rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden relative group transition duration-300 transform hover:scale-[1.01] glow-blue">
            {/* Glossy top metallic highlights */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-400 to-orange-500 shadow-md" />
            
            <div className="mb-6 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase bg-orange-500/10 text-orange-400 rounded px-2 py-0.5 border border-orange-500/20">
                  DISPOSITIF PHYSIQUE PROPOSÉ
                </span>
                <h3 className="text-xl font-medium font-display text-white mt-2">Borne Future Mirror</h3>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-orange-400 shadow">
                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
              </div>
            </div>

            {/* Concept text */}
            <p className="text-sm text-white/70 mb-6 leading-relaxed font-light">
              Une tablette verticale de 21 pouces, élégamment insérée sur pied bleu nuit laqué avec un habillage signature <b className="text-white font-medium">CIMR</b>. Située en agence ou lors d'événements physiques.
            </p>

            {/* Simulated Totem Graphics */}
            <div className="bg-[#050A18]/80 rounded-2xl p-4 border border-white/10 mb-6 flex flex-col items-center">
              <span className="text-[10px] text-white/40 mb-4 font-mono tracking-wider">RENDU 3D DE LA BORNE EN AGENCE</span>
              
              <div className="w-24 bg-[#0a142c] h-64 rounded-t-3xl rounded-b-md border-x-4 border-t-4 border-white/10 relative flex flex-col items-center p-1.5 shadow-inner">
                {/* Internal tablet */}
                <div className="w-20 bg-[#050A18] h-28 rounded-xl border border-white/10 p-0.5 flex flex-col justify-between items-center relative overflow-hidden shadow-md">
                  <div className="w-6 h-1 rounded-full bg-white/20 mt-1" />
                  {/* Miniature display screen based on simulated profile */}
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-orange-400/50 flex items-center justify-center bg-[#050A18]">
                    <img
                      src={originalPhoto}
                      alt="Mini projection"
                      className="w-full h-full object-cover transition duration-300"
                    />
                  </div>
                  <div className="text-[5px] text-orange-400 font-mono tracking-widest text-center uppercase mb-1">
                    CIMR FUTURE
                  </div>
                  {/* Scanner laser lines */}
                  {step === AppStep.TRANSFORMATION && (
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-500 animate-bounce shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </div>

                {/* Brand decal */}
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">CIMR</span>
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping mt-1" />
                </div>

                {/* Base platform */}
                <div className="absolute bottom-0 w-28 h-2 bg-white/20 rounded-t-lg -mb-2 shadow-2xl" />
              </div>

              <div className="mt-5 w-full bg-white/5 rounded-xl p-3 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-white/70">Statut Borne</span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Actif h24
                </span>
              </div>
            </div>

            {/* Notre Dispositif */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">Notre Dispositif</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#050A18]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80">Borne physique tactile</span>
                </div>
                <div className="bg-[#050A18]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span className="text-white/80">Animateurs de terrain</span>
                </div>
                <div className="bg-[#050A18]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-400" />
                  <span className="text-white/80">Cadeau personnalisé</span>
                </div>
                <div className="bg-[#050A18]/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span className="text-white/80">Collecte RGPD sécurisée</span>
                </div>
              </div>
            </div>

            {/* Nos Objectifs stats */}
            <div className="bg-[#050A18]/80 rounded-2xl p-4 border border-white/5">
              <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest block mb-3">Nos Objectifs de Performance</span>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>Flyers distribués</span>
                    <span className="font-bold text-white">50 000</span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>Leads qualifiés espérés</span>
                    <span className="font-bold text-white">5 000</span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-400 h-full w-[72%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>Visibilité positive</span>
                    <span className="font-bold text-white">100%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                    <div className="bg-[#00529B] h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Interactive Bezel-Style Tablet Tablet (Client Interface Simulator) */}
        <div className={`${showKioskWrap ? "lg:col-span-8" : "lg:col-span-12"} w-full flex justify-center`}>
          <div className="w-full max-w-2xl bg-[#0a142c] rounded-[40px] p-5 shadow-2xl border-4 border-white/10 relative z-10 glow-blue overflow-hidden">
            {/* Tablet details like camera lens bead */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl flex items-center justify-center z-40">
              <div className="w-2 h-2 rounded-full bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-900 ml-2" />
            </div>

            {/* Screen Inner Viewport (simulating iPad viewport ratio) */}
            <div className="bg-[#050A18] w-full rounded-[28px] overflow-hidden min-h-[640px] flex flex-col justify-between p-5 md:p-8 border border-white/10 relative">
              <AnimatePresence mode="wait">
                    {/* STEP 1: WELCOME SCREEN (ACCUEIL) */}
                    {step === AppStep.ACCUEIL && (
                  <motion.div
                    key="accueil"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    {/* Brand header badge */}
                    <div className="text-center mt-3 animate-fade-in">
                      <div className="inline-flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                        <span className="text-xl font-bold tracking-widest text-white font-display">CIMR</span>
                        <span className="text-[8px] font-mono tracking-wider text-white/50 uppercase mt-1">LA RETRAITE • NOTRE MÉTIER • VOUS ACCOMPAGNER</span>
                      </div>
                    </div>

                    {/* Split Portrait Graphics (Half-young / Half-old) */}
                    <div className="my-8 flex justify-center items-center">
                      <div className="w-56 h-56 rounded-full overflow-hidden border-2 border-[#00529B]/55 shadow-2xl relative glow-blue bg-[#050A18] group">
                        
                        {/* Split line */}
                        <div className="absolute left-1/2 inset-y-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-400 to-orange-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20" />
                        
                        <div className="absolute inset-0 grid grid-cols-2">
                          {/* Young side */}
                          <div className="overflow-hidden relative h-full">
                            <img
                              src={originalPhoto}
                              alt="Young Side"
                              className="w-56 h-full object-cover max-w-none absolute left-0"
                              style={{ width: '224px' }}
                            />
                            <div className="absolute bottom-2 left-2 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest text-[#00529B] font-bold">
                              Aujourd'hui
                            </div>
                          </div>
                          {/* Aged side */}
                          <div className="overflow-hidden relative h-full">
                            <img
                              src={agedPhoto}
                              alt="Old Side"
                              className="w-56 h-full object-cover max-w-none absolute right-0"
                              style={{ width: '224px', left: '-112px' }}
                            />
                            <div className="absolute bottom-2 right-2 bg-orange-500/80 border border-orange-600 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest text-white font-semibold">
                              65 Ans
                            </div>
                          </div>
                        </div>

                        {/* Interactive slide overlay badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00529B] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/20 z-20">
                          <RefreshCw className="w-4 h-4 animate-spin-slow" />
                        </div>
                      </div>
                    </div>

                    {/* Information Text */}
                    <div className="text-center max-w-md mx-auto space-y-4">
                      <h2 className="text-3xl font-light font-display text-white leading-tight uppercase tracking-tight">
                        Rencontrer votre <span className="text-orange-400 font-bold">Futur Vous</span>
                      </h2>
                      <p className="text-sm text-white/70 leading-relaxed font-light">
                        Découvrez à quoi vous ressemblerez à 65 ans et préparez votre avenir sereinement en évaluant vos objectifs retraite dès maintenant.
                      </p>
                    </div>

                    {/* Pre-made demo selector label */}
                    <div className="mt-8 border-t border-white/15 pt-5 space-y-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-center text-white/50 block">
                        Choisissez un profil de démonstration pour le test :
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {DEMO_PROFILES.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => selectDemoProfile(p.id)}
                            className={`p-1.5 rounded-xl border text-center transition duration-150 flex flex-col items-center gap-1 active:scale-95 cursor-pointer ${
                              selectedProfileId === p.id 
                                ? "bg-[#00529B]/20 border-[#00529B] text-white shadow-inner" 
                                : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <img
                              src={p.youngPhoto}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-white/10"
                            />
                            <span className="text-[10px] font-medium text-white/80">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Footer start CTA button */}
                    <div className="mt-8 self-center w-full max-w-xs flex flex-col items-center gap-2">
                      <button
                        onClick={() => setStep(AppStep.PHOTO)}
                        className="w-full bg-white hover:bg-blue-50 active:scale-98 text-[#050A18] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition duration-150 text-sm tracking-widest uppercase cursor-pointer"
                      >
                        COMMENCER L'EXPÉRIENCE 👉
                      </button>
                      <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase">
                        🔒 CONFORMITÉ RGPD • 100% CONFIDENTIEL
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: PHOTO CAPTURE AND SELECTION SCREEN (PHOTO) */}
                {step === AppStep.PHOTO && (
                  <motion.div
                    key="photo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <button 
                        onClick={() => handleRestart()}
                        className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'accueil
                      </button>
                      <h2 className="text-xl font-light font-display text-white mt-4 text-center uppercase tracking-wider">
                        📸 Prendre une Photo
                      </h2>
                      <p className="text-xs text-white/50 text-center mt-1">
                        Projetez votre propre visage dans le futur ou scannez le QR code.
                      </p>
                    </div>

                     {/* Camera view container */}
                    <div className="my-5 w-full flex justify-center">
                      <div className="w-72 h-72 rounded-2xl border border-dashed border-white/20 bg-black/40 overflow-hidden relative flex flex-col items-center justify-center shadow-xl">
                        
                        {cameraActive ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                              style={{ display: !snapActive ? "block" : "none" }}
                            />
                            <canvas
                              ref={canvasRef}
                              className="w-full h-full object-cover"
                              style={{ display: snapActive ? "block" : "none" }}
                            />
                            {/* Snapchat Loading State Overlay */}
                            {snapLoading && (
                              <div className="absolute inset-0 bg-[#050A18]/80 flex flex-col items-center justify-center p-4 text-center z-30">
                                <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mb-2" />
                                <p className="text-xs text-white/80 font-mono">Chargement de l'effet Snapchat...</p>
                              </div>
                            )}
                            {/* Scanning hud overlay */}
                            <div className="absolute inset-x-4 top-1/4 h-0.5 bg-blue-500/40 shadow-md animate-pulse" />
                            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                              <button
                                onClick={capturePhoto}
                                className="bg-white hover:bg-slate-100 text-[#050A18] px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg relative z-20 cursor-pointer"
                              >
                                <Camera className="w-4 h-4" /> Prendre le cliché
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-5 text-center flex flex-col items-center justify-center h-full space-y-4 w-full">
                            {originalPhoto ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={originalPhoto}
                                  alt="Portrait de base"
                                  className="w-full h-full object-cover rounded-xl"
                                />

                                {isAgeifying && (
                                  <div className="absolute inset-0 bg-[#050A18]/90 flex flex-col items-center justify-center p-4 text-center z-30 rounded-xl">
                                    <RefreshCw className="w-8 h-8 text-[#FFFC00] animate-spin mb-3" />
                                    <span className="text-[10px] font-mono tracking-widest text-[#FFFC00] uppercase font-bold animate-pulse">
                                      Vieillissement IA [70 Ans]...
                                    </span>
                                    <p className="text-[11px] text-white/70 mt-1 max-w-[200px] font-light leading-relaxed">
                                      Le modèle OpenAI (gpt-image-1) sculpte les traits de votre double du futur.
                                    </p>
                                  </div>
                                )}

                                {ageifyError && (
                                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center z-40 rounded-xl border border-red-500/35">
                                    <AlertTriangle className="w-8 h-8 text-red-500 mb-2 animate-bounce" />
                                    <span className="text-xs font-bold text-red-400 uppercase font-mono tracking-wider">
                                      Erreur de Vieillissement
                                    </span>
                                    <p className="text-[10px] text-white/70 mt-1 mb-3 leading-normal max-w-[240px] max-h-16 overflow-y-auto font-mono scrollbar-thin">
                                      {ageifyError}
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => processAgeifyImage(originalPhoto)}
                                        className="bg-[#FFFC00]/20 hover:bg-[#FFFC00]/30 border border-[#FFFC00]/30 text-[#FFFC00] text-[9px] uppercase font-mono px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer font-bold"
                                      >
                                        Réessayer 🔄
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setAgeifyError(null)}
                                        className="bg-white/10 hover:bg-white/25 text-white/70 text-[9px] uppercase font-mono px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                                      >
                                        Ignorer
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="absolute bottom-2 inset-x-2 flex flex-col gap-2">
                                  <button
                                    onClick={startCamera}
                                    className="bg-black/80 hover:bg-black/90 text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1.5 rounded-lg border border-white/10 text-center cursor-pointer"
                                  >
                                    Re-capturer 🎥
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center space-y-4 w-full px-4">
                                <Camera className="w-12 h-12 text-white/20" />
                                <p className="text-xs text-white/50 leading-normal max-w-[200px] font-light">
                                  Autorisez votre webcam pour vous voir en temps réel
                                </p>
                                <div className="flex flex-col gap-2 w-full">
                                  <button
                                    onClick={startCamera}
                                    className="w-full bg-white hover:bg-slate-100 text-[#050A18] font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                                  >
                                    <Camera className="w-4 h-4" /> Activer ma caméra
                                  </button>
                                  <button
                                    onClick={startSnapchatCamera}
                                    className="w-full bg-[#FFFC00] hover:bg-[#e6e300] text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                                  >
                                    <Sparkles className="w-4 h-4 text-slate-900" /> Open Snapchat Old Age
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {cameraError && (
                          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center">
                            <Info className="w-8 h-8 text-orange-400 mb-2" />
                            <p className="text-xs text-white/80 leading-normal mb-3">{cameraError}</p>
                            <button
                              onClick={() => setCameraError(null)}
                              className="text-orange-400 underline text-xs font-mono cursor-pointer"
                            >
                              Masquer l'alerte
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi selection panels: File, Snapchat qr-code, or demo profiles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      
                      {/* Left Block: Snapchat Lens Old age */}
                      <div className="space-y-4 border-r border-white/10 pr-1 md:pr-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                            Filtre Snapchat Old
                          </span>
                          <p className="text-[11px] text-white/70 leading-normal font-light">
                            Utilisez le filtre officiel Snapchat directement dans la borne ou scannez le code pour l'essayer sur votre smartphone.
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3 pt-1">
                          <div className="bg-white p-1 rounded-lg shrink-0">
                            {/* Stylized simulated QR Code rendering */}
                            <QrCode className="w-14 h-14 text-slate-900" />
                          </div>
                          <div className="flex flex-col gap-1.5 w-full">
                            <button
                              onClick={startSnapchatCamera}
                              type="button"
                              className="w-full text-[11px] bg-[#FFFC00] hover:bg-[#e6e300] text-black font-bold px-3 py-2 rounded-xl inline-flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-black" /> Open Snapchat Old Age
                            </button>
                            <a
                              href="https://www.snapchat.com/lens/a375b6d69d0c4feda05a84e0ab58e471?sender_web_id=fdc91e89-bdd9-43fd-918d-4fa2483e986a&device_type=desktop&is_copy_url=true"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-white/50 hover:text-white underline text-center"
                            >
                              Ouvrir sur Snap.com ↗
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: File upload and demographics options */}
                      <div className="space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                            Soumettre un fichier portrait
                          </span>
                          <p className="text-[11px] text-white/70 leading-normal mb-2 font-light">
                            Glissez ou sélectionnez un portrait existant sur votre ordinateur.
                          </p>
                        </div>
                        
                        <div>
                          <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp"
                            ref={fileInputRef}
                            onChange={handleUploadedFile}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/90 px-3 py-2.5 rounded-xl text-center active:scale-95 transition cursor-pointer"
                          >
                            Choisir un fichier (.jpg, .png, .webp)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Snapchat API Diagnostic & Setup Guide */}
                    <div className="mt-4 bg-[#FFFC00]/5 border border-[#FFFC00]/20 rounded-2xl p-4 text-left space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#FFFC00]" />
                          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                            Guide Diagnostique Snapchat AR Kit
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSnapDiagnostics(!showSnapDiagnostics)}
                          className="text-[10px] text-white/50 hover:text-white underline font-mono cursor-pointer"
                        >
                          {showSnapDiagnostics ? "Masquer" : "Afficher les détails & solutions"}
                        </button>
                      </div>
                      
                      {showSnapDiagnostics && (
                        <div className="text-[11px] text-white/80 space-y-3 font-light leading-relaxed">
                          <p>
                            L'erreur <code className="bg-white/10 px-1 rounded text-[#FFFC00] font-mono">[7] Permission Denied</code> indique qu'un conflit d'autorisation se produit au chargement de la Lens AR. Cela signifie généralement que l'API Token n'est pas autorisé pour le nom de domaine actuel de l'application ou n'a pas accès à la ressource.
                          </p>
                          
                          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400 block font-bold">
                              Étape 1 : Autoriser les domaines du projet
                            </span>
                            <p className="text-white/70">
                              Connectez-vous sur votre portail de développement <strong><a href="https://camera-kit.snapchat.com" target="_blank" rel="noopener noreferrer" className="underline text-[#FFFC00] hover:text-[#FFFC00]/80">camera-kit.snapchat.com ↗</a></strong>, sélectionnez votre clé d'API, et ajoutez exactement ces noms de domaine d'exécution autorisés :
                            </p>
                            <div className="space-y-1 font-mono text-[10px] bg-white/5 p-2 rounded border border-white/5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-blue-400 select-all overflow-hidden text-ellipsis">ais-dev-3wl64nx4rasky3i4juxieu-941643780074.europe-west2.run.app</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText("ais-dev-3wl64nx4rasky3i4juxieu-941643780074.europe-west2.run.app")}
                                  className="text-[9px] hover:text-[#FFFC00] text-white/40 cursor-pointer underline shrink-0"
                                >
                                  Copier
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 mt-1">
                                <span className="text-blue-400 select-all overflow-hidden text-ellipsis">ais-pre-3wl64nx4rasky3i4juxieu-941643780074.europe-west2.run.app</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText("ais-pre-3wl64nx4rasky3i4juxieu-941643780074.europe-west2.run.app")}
                                  className="text-[9px] hover:text-[#FFFC00] text-white/40 cursor-pointer underline shrink-0"
                                >
                                  Copier
                                </button>
                              </div>
                              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1 mt-1">
                                <span className="text-blue-400 select-all">localhost</span>
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText("localhost")}
                                  className="text-[9px] hover:text-[#FFFC00] text-white/40 cursor-pointer underline shrink-0"
                                >
                                  Copier
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400 block font-bold">
                              Étape 2 : Configurer les Variables d'Environnement
                            </span>
                            <p className="text-white/70">
                              Si vous testez à l'aide de vos propres maquettes Snapchat Camera Kit, vous pouvez également configurer votre propre Lens / ID de filtre dans vos secrets ou vos variables locales :
                            </p>
                            <table className="w-full text-left font-mono text-[10px] text-white/60">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="py-1 text-[#FFFC00] font-normal">Variable</th>
                                  <th className="py-1 text-[#FFFC00] font-normal">Rôle</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="py-1 select-all font-semibold text-white">VITE_SNAP_API_TOKEN</td>
                                  <td className="py-1">Jeton d'API de validation client</td>
                                </tr>
                                <tr>
                                  <td className="py-1 select-all font-semibold text-white">VITE_SNAP_LENS_ID</td>
                                  <td className="py-1">ID du filtre Snapchat</td>
                                </tr>
                                <tr>
                                  <td className="py-1 select-all font-semibold text-white">VITE_SNAP_LENS_GROUP_ID</td>
                                  <td className="py-1">ID du groupe associé</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simple user settings input box to configure letter simulation */}
                    <div className="my-4 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Votre prénom :</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            placeholder="Ex: Mehdi"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-white/50 block mb-1">Votre âge actuel :</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                          <input
                            type="number"
                            value={userage}
                            onChange={(e) => setUserage(Math.max(18, parseInt(e.target.value) || 18))}
                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            placeholder="Ex: 25"
                            min="18"
                            max="64"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transform CTA Button */}
                    <div className="mt-4 flex flex-col items-center">
                      <button
                        onClick={startTransformationAnimation}
                        disabled={!originalPhoto}
                        className={`w-full max-w-xs font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition duration-150 active:scale-98 cursor-pointer ${
                          originalPhoto 
                            ? "bg-white hover:bg-slate-100 text-[#050A18] tracking-widest uppercase" 
                            : "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                        }`}
                      >
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        TRANSFORMER MON VISAGE
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: TRANSFORMATION PROGRESS SCREEN (TRANSFORMATION) */}
                {step === AppStep.TRANSFORMATION && (
                  <motion.div
                    key="transformation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-center items-center py-10 space-y-8"
                  >
                    {/* Glowing face cage matrix visualizer */}
                    <div className="relative w-56 h-56 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center shadow-inner">
                      <img
                        src={originalPhoto}
                        alt="Scanning Face"
                        className="w-full h-full object-cover opacity-60 filter blur-[0.5px]"
                      />
                      
                      {/* Glass holographic scanner bars and overlays */}
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-orange-500/5 pointer-events-none" />
                      
                      {/* Laser scanner grid line */}
                      <motion.div 
                        animate={{ top: ["5%", "95%", "5%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)] z-10"
                      />

                      {/* Sci-fi tech circles in neon */}
                      <div className="absolute inset-4 rounded-full border border-dashed border-blue-400/30 animate-spin-slow pointer-events-none" />
                      <div className="absolute inset-8 rounded-full border border-double border-orange-500/20 animate-reverse-spin pointer-events-none" />

                      {/* Center big neon percentage text */}
                      <div className="absolute bg-black/60 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md flex flex-col items-center">
                        <span className="text-3xl font-bold font-mono tracking-tighter text-orange-400 animate-pulse">
                          {transformProgress}%
                        </span>
                        <span className="text-[8px] font-mono uppercase text-white/50 tracking-widest mt-0.5">
                          MUTATION RETRAITE
                        </span>
                      </div>
                    </div>

                    <div className="text-center space-y-3 max-w-sm">
                      <h3 className="text-lg font-light font-display text-white tracking-widest uppercase">
                        TRANSFORMATION EN COURS...
                      </h3>
                      
                      <div className="w-full bg-white/5 border border-white/10 rounded-full h-2 overflow-hidden px-0.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-500 h-full rounded-full transition-all duration-75"
                          style={{ width: `${transformProgress}%` }}
                        />
                      </div>

                      <p className="text-xs text-white/50 font-mono italic animate-pulse h-4 mt-1">
                        {transformStatus}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: EMOTIONAL IMPACT MESSAGE (EMOTION) */}
                {step === AppStep.EMOTION && (
                  <motion.div
                    key="emotion"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-light font-display text-white text-center uppercase tracking-wider">
                        Voici votre futur vous
                      </h2>
                      <p className="text-xs text-orange-400 text-center font-mono mt-0.5 tracking-wider font-semibold">
                        Projeté à l'âge de la retraite (65 ans)
                      </p>
                    </div>

                    {/* Dual comparison slide/portrait panel */}
                    <div className="my-6 grid grid-cols-2 gap-4">
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex flex-col items-center shadow-md">
                        <div className="w-full h-44 rounded-xl overflow-hidden border border-white/10 mb-2 relative">
                          <img
                            src={originalPhoto}
                            alt="Moi d'aujourd'hui"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">
                          AUJOURD'HUI ({userage} ANS)
                        </span>
                      </div>

                      <div className="bg-[#00529B]/20 border border-white/15 rounded-2xl p-2.5 flex flex-col items-center shadow-lg hover:border-orange-500/30">
                        <div className="w-full h-44 rounded-xl overflow-hidden border border-orange-500/20 mb-2 relative">
                          <img
                            src={agedPhoto}
                            alt="Moi à 65 ans"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-orange-400 uppercase font-semibold tracking-widest animate-pulse">
                          À 65 ANS (VOTRE FUTUR VOUS)
                        </span>
                      </div>

                    </div>

                    {/* Emotive letter from future identity block */}
                    <div className="bg-[#050A18] border border-white/10 rounded-2xl p-4 shadow-inner">
                      <div className="flex items-center gap-2 mb-2 text-white/70">
                        <Star className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#00529B] font-bold">Un message de votre futur vous...</span>
                      </div>
                      <blockquote className="text-sm font-sans italic text-white/90 leading-relaxed pl-3 border-l-2 border-orange-500 p-0.5 font-light">
                        "Bonjour <b>{username}</b>,<br/>
                        Je suis vous dans 25 ans. Les décisions que vous prenez aujourd'hui détermineront d'une main ferme votre qualité de vie et votre liberté financière de demain."
                      </blockquote>
                      <div className="mt-3 text-[10px] text-right font-mono text-white/40">
                        — Projette-toi à {65 - userage} ans d'ici pour la CIMR
                      </div>
                    </div>

                    {/* Progress to Diagnostic Button */}
                    <div className="mt-6 flex flex-col items-center">
                      <button
                        onClick={() => setStep(AppStep.DIAGNOSTIC)}
                        className="w-full max-w-xs bg-white hover:bg-slate-100 text-[#050A18] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition active:scale-95 text-sm tracking-wider uppercase cursor-pointer"
                      >
                        ÉVALUER MA PRÉPARATION RETRAITE
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: DIAGNOSTIC FORM QUESTIONNAIRE (DIAGNOSTIC) */}
                {step === AppStep.DIAGNOSTIC && (
                  <motion.div
                    key="diagnostic"
                    initial={{ opacity: 0, x: 25 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -25 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs text-white/40 font-mono">
                        <span className="uppercase tracking-widest">DIAGNOSTIC RETRAITE EXPRESS</span>
                        <span className="text-orange-400 font-semibold">
                          Question {diagnosticIndex + 1}/{DIAGNOSTIC_QUESTIONS.length}
                        </span>
                      </div>
                      
                      {/* Segmented linear bar progress indicator */}
                      <div className="w-full bg-white/5 border border-white/10 rounded-full h-1.5 mt-2 flex gap-1 overflow-hidden p-0.5">
                        {DIAGNOSTIC_QUESTIONS.map((_, i) => (
                          <div
                            key={i}
                            className={`h-full rounded-full flex-1 transition duration-250 ${
                              i <= diagnosticIndex ? "bg-orange-500" : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Current Active Question Display */}
                    <div className="my-8 text-center space-y-6">
                      <div className="bg-[#00529B]/10 p-4 rounded-xl border border-white/10">
                        <h3 className="text-base md:text-lg font-light font-display text-white leading-relaxed uppercase tracking-wide">
                          {DIAGNOSTIC_QUESTIONS[diagnosticIndex].text}
                        </h3>
                      </div>

                      {/* Display select option items as large touch-clickable lists */}
                      <div className="space-y-3 text-left">
                        {DIAGNOSTIC_QUESTIONS[diagnosticIndex].options.map((opt) => {
                          const questionKey = DIAGNOSTIC_QUESTIONS[diagnosticIndex].key;
                          const isSelected = diagnosticAnswers[questionKey] === opt.label;
                          
                          return (
                            <button
                              key={opt.label}
                              onClick={() => {
                                setDiagnosticAnswers({
                                  ...diagnosticAnswers,
                                  [questionKey]: opt.label
                                });
                              }}
                              className={`w-full p-4 rounded-xl border text-xs flex items-center justify-between transition relative active:scale-[0.99] cursor-pointer ${
                                isSelected 
                                  ? "bg-[#00529B]/25 border-orange-500 text-white font-medium shadow-md"
                                  : "bg-white/5 border-white/10 text-white/80 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl bg-black/40 w-10 h-10 rounded-lg flex items-center justify-center border border-white/10">
                                  {opt.icon}
                                </span>
                                <span>{opt.label}</span>
                              </div>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                                isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-white/10"
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Prev & Next button footers */}
                    <div className="flex justify-between items-center gap-4 mt-4 select-none">
                      <button
                        onClick={() => {
                          if (diagnosticIndex > 0) {
                            setDiagnosticIndex(diagnosticIndex - 1);
                          } else {
                            setStep(AppStep.EMOTION);
                          }
                        }}
                        className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-white/80 flex items-center gap-1 hover:text-white transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> précédent
                      </button>

                      {diagnosticIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                        <button
                          onClick={() => setDiagnosticIndex(diagnosticIndex + 1)}
                          className="px-5 py-3 bg-[#00529B] hover:bg-[#004179] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          SUIVANT <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={fetchGeminiAnalysis}
                          disabled={loadingAI}
                          className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-950/40 cursor-pointer"
                        >
                          {loadingAI ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> ANALYSE IA EN COURS...
                            </>
                          ) : (
                            <>
                              Calculer mon score <ChevronRight className="w-4 h-4 stroke-[3px]" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === AppStep.RESULTAT && (
                  <motion.div
                    key="resultat"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-light font-display text-white text-center uppercase tracking-wider">
                        Votre diagnostic Retraite
                      </h2>
                      <p className="text-xs text-white/50 text-center font-mono mt-0.5 tracking-wider uppercase">
                        Établi par l'expert d'analyse CIMR & Gemini AI
                      </p>
                    </div>

                    {/* Circular Score Gauge rendering */}
                    <div className="my-5 flex flex-col items-center">
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        
                        {/* Dynamic Circular progress SVG */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="58"
                            className="stroke-white/10"
                            strokeWidth="10"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="72"
                            cy="72"
                            r="58"
                            className={`transition-all duration-1000 ${
                              resultData.category === "BIEN_PREPARE" 
                                ? "stroke-emerald-500" 
                                : resultData.category === "A_RENFORCER" 
                                  ? "stroke-orange-400" 
                                  : "stroke-rose-500"
                            }`}
                            strokeWidth="10"
                            strokeDasharray={2 * Math.PI * 58}
                            strokeDashoffset={2 * Math.PI * 58 * (1 - resultData.percentageScore / 100)}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>

                        {/* Centered text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-light font-display text-white tracking-tighter">
                            {Math.round(resultData.percentageScore / 10)}<span className="text-white/40 text-base">/10</span>
                          </span>
                          
                          {/* Alert pill status */}
                          <span className={`text-[9px] uppercase font-mono px-2 py-0.5 mt-1 rounded-full border ${
                            resultData.category === "BIEN_PREPARE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 font-semibold"
                              : resultData.category === "A_RENFORCER"
                                ? "bg-orange-500/10 text-orange-400 border-orange-500/25 font-semibold"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/25 font-semibold"
                          }`}>
                            {resultData.category === "BIEN_PREPARE" 
                              ? "🟢 BIEN PRÉPARÉ" 
                              : resultData.category === "A_RENFORCER" 
                                ? "🟠 À RENFORCER" 
                                : "🔴 ACTION RECOMMANDÉE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gemini advice narrative box */}
                    <div className="bg-[#00529B]/10 border border-white/10 rounded-2xl p-4 shadow-inner mb-4 max-h-48 overflow-y-auto">
                      <div className="flex items-center gap-1.5 text-orange-400 mb-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">L'analyse d'épargne de votre futur vous :</span>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap font-light">
                        {resultData.letter}
                      </p>
                    </div>

                    {/* Highly dynamic custom tips based on response */}
                    <div className="space-y-2 mb-4">
                      <span className="text-[10px] font-mono text-white/50 block uppercase tracking-wider">Solutions de préparation CIMR recommandées :</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {resultData.tips.map((tip, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white/5 p-2.5 rounded-xl border border-white/10 hover:border-white/20 transition flex items-start gap-2.5"
                          >
                            <div className="p-1.5 bg-orange-500/15 rounded-lg text-orange-400 shrink-0 text-sm font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{tip.title}</h4>
                              <p className="text-[10px] text-white/60 leading-normal mt-0.5">{tip.desc}</p>
                              <span className="text-[9px] font-mono text-orange-400 font-medium block mt-1">
                                Solution recommandée : <b className="underline uppercase tracking-wide">{tip.solution}</b>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA redirection */}
                    <div className="flex flex-col items-center mt-2">
                      <button
                        onClick={() => setStep(AppStep.LEAD)}
                        className="w-full max-w-xs bg-white hover:bg-slate-100 text-[#050A18] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition active:scale-95 text-sm tracking-widest uppercase cursor-pointer"
                      >
                        RECEVOIR MON BILAN RETRAITE
                        <ChevronRight className="w-4 h-4 ml-0.5 stroke-[3px]" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 7: QUALIFY LEAD COLLECTION (LEAD) */}
                {step === AppStep.LEAD && (
                  <motion.div
                    key="lead"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <h2 className="text-xl font-light font-display text-white text-center uppercase tracking-wider">
                        Recevoir votre bilan retraite
                      </h2>
                      <p className="text-xs text-white/50 text-center mt-1">
                        Saisissez vos coordonnées pour recevoir gratuitement votre bilan consolidé et vos photos.
                      </p>
                    </div>

                    {/* Interactive Lead qualifying form */}
                    <form onSubmit={submitLeadForm} className="my-6 space-y-4 max-w-md mx-auto w-full">
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Nom</label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                            <input
                              type="text"
                              required
                              className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              value={leadInfo.lastName}
                              onChange={(e) => setLeadInfo({ ...leadInfo, lastName: e.target.value })}
                              placeholder="Ex: Alami"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Prénom(s)</label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                            <input
                              type="text"
                              required
                              className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                              value={leadInfo.firstName}
                              onChange={(e) => setLeadInfo({ ...leadInfo, firstName: e.target.value })}
                              placeholder="Ex: Mehdi"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Téléphone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                          <input
                            type="tel"
                            required
                            pattern="(\+212|0)[5-7][0-9]{8}"
                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            value={leadInfo.phone}
                            onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                            placeholder="Ex: 0661234567"
                          />
                        </div>
                        <span className="text-[9px] text-white/40 font-mono block mt-1">Format recommandé marocain : 06xxxxxxxx ou +212xxxxxxxx</span>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-white/50 block mb-1 uppercase tracking-wider">Email professionnel ou privé</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                          <input
                            type="email"
                            required
                            className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-9 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            value={leadInfo.email}
                            onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                            placeholder="Ex: mehdi.alami@email.ma"
                          />
                        </div>
                      </div>

                      <div className="bg-[#050A18] p-3 rounded-xl border border-white/10 text-[10px] text-white/60 leading-normal flex items-start gap-2.5 mt-3 select-none">
                        <input
                          type="checkbox"
                          id="privacy"
                          required
                          defaultChecked
                          className="mt-0.5 rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/60"
                        />
                        <label htmlFor="privacy" className="cursor-pointer">
                          En soumettant ce formulaire, j'accepte d'être recontacté gratuitement par un expert CIMR et que mes données soient traitées conformément à la politique de confidentialité.
                        </label>
                      </div>

                      <div className="pt-3 flex flex-col items-center">
                        <button
                          type="submit"
                          disabled={submittingLead}
                          className="w-full max-w-xs bg-white hover:bg-slate-100 text-[#050A18] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition duration-150 active:scale-95 cursor-pointer text-sm tracking-widest uppercase"
                        >
                          {submittingLead ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" /> ENVOI EN COURS...
                            </>
                          ) : (
                            <>
                              <Mail className="w-5 h-5" /> RECEVOIR MON BILAN GRATUIT
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* STEP 8: FINAL OUTCOME (FIN) */}
                {step === AppStep.FIN && (
                  <motion.div
                    key="fin"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex-1 flex flex-col justify-between items-center"
                  >
                    <div className="text-center space-y-2 mt-4 select-none">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 glow-blue">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl font-light font-display text-white tracking-widest">MERCI !</h2>
                      <p className="text-xs text-white/70 max-w-xs mx-auto font-light">
                        Votre bilan personnalisé CIMR a été envoyé avec succès à l'adresse <b>{leadInfo.email || "votre email"}</b>.
                      </p>
                    </div>

                    {/* Frame photo container of aged face */}
                    <div className="my-6 text-center space-y-4">
                      
                      <div className="relative inline-block w-48 h-48 rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-xl box-content glow-blue">
                        <img
                          src={agedPhoto}
                          alt="Grand portrait vieilli"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-widest">
                          PROJETÉ A 65 ANS
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 pt-1">
                        <a 
                          href={agedPhoto} 
                          download={`Futur_Moi_CIMR_${username}.jpg`}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer font-light"
                        >
                          <Download className="w-3.5 h-3.5 text-orange-400" /> Télécharger mon cliché souvenir
                        </a>
                      </div>

                    </div>

                    {/* Signature and Slogan */}
                    <div className="text-center space-y-2 max-w-sm">
                      <div className="inline-flex flex-col items-center justify-center mb-1">
                        <span className="text-base font-bold tracking-widest text-white font-display">CIMR</span>
                        <span className="text-[7px] text-white/40 font-mono tracking-widest">LA RETRAITE QUE VOUS MÉRITEZ</span>
                      </div>
                      <p className="text-sm font-light italic text-white/80">
                        "Votre futur commence aujourd'hui."
                      </p>
                    </div>

                    {/* Action to restart */}
                    <div className="mt-6 flex justify-center w-full">
                      <button
                        onClick={handleRestart}
                        className="bg-[#00529B] hover:bg-[#004179] border border-white/10 text-xs px-6 py-3.5 rounded-xl text-white flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin-slow" /> Refaire une nouvelle simulation
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* Tablet physical bottom button decoration */}
            <div className="w-full flex justify-center mt-3 pt-1">
              <button
                onClick={handleRestart}
                className="w-10 h-10 rounded-full bg-black border-2 border-white/15 flex items-center justify-center hover:border-white/30 transition tracking-tighter cursor-pointer"
                title="Tablet home button"
              >
                <div className="w-3 h-3 rounded bg-white/5 border border-white/10 animate-pulse" />
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Decorative corporate footer footer */}
      <footer className="w-full max-w-7xl mx-auto border-t border-white/10 pt-5 mt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/40 gap-3 select-none font-light">
        <span>© 2026 CIMR (Caisse Interprofessionnelle Marocaine de Retraite). Tous droits réservés.</span>
        <div className="flex gap-4">
          <a className="hover:text-white cursor-pointer transition">Conditions d'Utilisation</a>
          <a className="hover:text-white cursor-pointer transition">Protection des Données (RGPD)</a>
          <a className="hover:text-white cursor-pointer transition">Mentions Légales</a>
        </div>
      </footer>

      {/* PostgreSQL Database & API Admin Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0b132b] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111a36]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Settings className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-wide">
                      Console d'Administration CIMR Database
                    </h2>
                    <p className="text-xs text-white/50 tracking-wider">
                      Gestion des fichiers de données PostgreSQL & API Status
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Status Dashboard Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* PostgreSQL Status Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                      Statut Connexion PostgreSQL
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span className="text-sm font-semibold">
                        {dbStatus?.connected ? "PostgreSQL Actif" : "Mode In-Memory Actif"}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/45 mt-1 truncate font-mono">
                      Hôte: {dbStatus?.host || "Recherche..."}
                    </p>
                  </div>

                  {/* API Credentials Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                      Clé API & Identification
                    </span>
                    <div className="mt-2 flex items-center gap-1.5 justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono bg-black/35 px-1.5 py-0.5 rounded text-white/85 select-all">
                          cimrdatabase1
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-white/40 truncate mt-1">
                      Key: Activée & Sécurisée
                    </p>
                  </div>

                  {/* Leads Count Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                      Formulaires Enregistrés (Leads)
                    </span>
                    <div className="mt-2 flex items-end justify-between">
                      <span className="text-2xl font-bold text-white font-mono leading-none">
                        {loadingAdminLeads ? "..." : (dbStatus?.count ?? adminLeads.length)}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                        Total Kiosque
                      </span>
                    </div>
                  </div>

                  {/* Railway Live Sync Card */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between">
                    <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono">
                      API Link Production Railway
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-400">
                        Synchronisé
                      </span>
                    </div>
                    <p className="text-[9px] text-white/45 mt-1 truncate font-mono" title={dbStatus?.railwayUrl || "https://cimr-2-production.up.railway.app"}>
                      {dbStatus?.railwayUrl || "https://cimr-2-production.up.railway.app"}
                    </p>
                  </div>
                </div>

                {/* Info Note on Railway Network Hostnames */}
                <div className="p-4 bg-[#111a36]/50 border border-white/5 rounded-2xl text-xs text-white/70 space-y-2 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">Connexion avec l'Hôte Interne Railway</p>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        Ce site est entièrement câblé sur l'API PostgreSQL d'écriture et de lecture. Comme le conteneur de prévisualisation actuel de l'AI Studio s'exécute à l'extérieur du réseau privé de Railway (excluant ainsi la résolution directe de <code className="font-mono text-emerald-400 text-[10px]">postgres.railway.internal</code>), un dispositif de basculement robuste en mémoire vive (RAM) s'active automatiquement pour garantir la parfaite fluidité de l'expérience et le suivi complet de vos soumissions, qui s'enregistrent localement et s'affichent ci-dessous !
                      </p>
                    </div>
                  </div>
                </div>

                {/* Leads Database Table / Fichiers de données */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Fichiers de données des Bilans Patients / Clients
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={fetchAdminData}
                        disabled={loadingAdminLeads}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition duration-150 border border-white/10 flex items-center justify-center disabled:opacity-55 cursor-pointer"
                        title="Actualiser la liste"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminLeads ? 'animate-spin' : ''}`} />
                      </button>

                      <a
                        href="/api/leads/export"
                        download="leads_cimr_database.csv"
                        className="flex items-center justify-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-xl transition duration-150 cursor-pointer text-center"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        Télécharger Fichier (.CSV)
                      </a>
                    </div>
                  </div>

                  {/* Table Element */}
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#111a36] text-white/60 font-mono tracking-wider border-b border-white/10">
                            <th className="p-3.5">ID</th>
                            <th className="p-3.5">Prénom / Nom</th>
                            <th className="p-3.5">E-mail</th>
                            <th className="p-3.5">Téléphone</th>
                            <th className="p-3.5 text-center">Âge</th>
                            <th className="p-3.5 text-center">Score</th>
                            <th className="p-3.5 text-center">Catégorie</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {loadingAdminLeads ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-white/50 italic">
                                Chargement des bilans depuis l'API PostgreSQL...
                              </td>
                            </tr>
                          ) : adminLeads.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-white/50 italic">
                                Aucun enregistrement trouvé. Soumettez un bilan dans le simulateur pour le voir apparaître instantanément !
                              </td>
                            </tr>
                          ) : (
                            adminLeads.map((lead: any) => (
                              <tr key={lead.id} className="hover:bg-white/5 transition duration-150">
                                <td className="p-3.5 font-mono text-white/40">#{lead.id}</td>
                                <td className="p-3.5 font-medium text-white/90">
                                  {lead.first_name || ""} {lead.last_name || ""}
                                </td>
                                <td className="p-3.5 text-white/70 font-mono">{lead.email}</td>
                                <td className="p-3.5 text-white/70 font-mono">{lead.phone || "-"}</td>
                                <td className="p-3.5 text-center text-white/70 font-mono">{lead.age || "25"} ans</td>
                                <td className="p-3.5 text-center text-orange-400 font-mono font-bold">
                                  {lead.score || 0}%
                                </td>
                                <td className="p-3.5">
                                  <div className="flex justify-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wide whitespace-nowrap ${
                                      lead.category === "BIEN_PREPARE" 
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                        : lead.category === "A_RENFORCER"
                                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    }`}>
                                      {lead.category ? lead.category.replace("_", " ") : "Non analysé"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-[#111a36] flex items-center justify-between text-[11px] text-white/50">
                <span className="font-mono text-white/40">API Active: /api/leads & /api/leads/export</span>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl transition active:scale-95 cursor-pointer text-xs"
                >
                  Fermer la console
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
