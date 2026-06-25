import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, ArrowLeft, ArrowRight, ChevronRight, Check, Award, RefreshCw, 
  Sparkles, Monitor, ShieldCheck, Mail, Phone, User, Briefcase, QrCode, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppStep, DiagnosticAnswers, LeadInfo, AnalysisResult } from "../types";
import { DEMO_PROFILES, DIAGNOSTIC_QUESTIONS } from "../data";
import { startSnapOldAgeSession, stopActiveSnapSession } from "../utils/snapCamera";

interface TabletSimulatorProps {
  onLeadSubmitted: () => void;
}

export default function TabletSimulator({ onLeadSubmitted }: TabletSimulatorProps) {
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
  const [isAgedPhotoFallback, setIsAgedPhotoFallback] = useState<boolean>(false);

  // Tablet slider states
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Camera capture states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [snapActive, setSnapActive] = useState<boolean>(false);
  const [snapLoading, setSnapLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Progress states
  const [transformProgress, setTransformProgress] = useState<number>(0);
  const [transformStatus, setTransformStatus] = useState<string>("");
  
  // Diagnostic Questionnaire states
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswers>({
    ageRange: "26-35 ans",
    situationPro: "Salarié du secteur privé",
    salaireRange: "10 000 - 20 000 DHS",
    connaissance: "Vaguement / En partie",
    epargneActuelle: "Aucune épargne"
  });
  const [diagnosticIndex, setDiagnosticIndex] = useState<number>(0);
  const [showDiagnosticResults, setShowDiagnosticResults] = useState<boolean>(false);
  
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
  
  // Wheel of fortune states
  const PRIZES = [
    "Goodie CIMR 🎁",
    "Casquette CIMR 🧢",
    "Stylo CIMR ✍️",
    "Sac CIMR 🛍️",
    "Participation tirage au sort 🎟️",
    "Cadeau surprise 🌟"
  ];
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<string | null>(null);
  const [showPrizeOverlay, setShowPrizeOverlay] = useState<boolean>(false);

  // Lead collection
  const [leadInfo, setLeadInfo] = useState<LeadInfo & { casaLocation?: string }>({
    lastName: "",
    firstName: "",
    phone: "",
    email: "",
    city: "Casablanca",
    casaLocation: "Casa Finance City",
    company: ""
  });
  const [kioskLocation, setKioskLocation] = useState<string>("Casa Finance City");

  // Synchronize leadInfo defaults with selected kiosk location
  useEffect(() => {
    setLeadInfo(prev => ({ ...prev, city: "Casablanca", casaLocation: kioskLocation }));
  }, [kioskLocation]);

  const [submittingLead, setSubmittingLead] = useState<boolean>(false);
  const [leadError, setLeadError] = useState<string | null>(null);

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

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      stopActiveSnapSession();
    };
  }, []);

  // Image optimize helper prior to API post
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
        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(optimizedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  };

  // Image quality checks before proceeding
  const [isVerifyingQuality, setIsVerifyingQuality] = useState<boolean>(false);
  const [qualitySteps, setQualitySteps] = useState<{ label: string; status: "pending" | "success" }[]>([
    { label: "Analyse du format d'image", status: "pending" },
    { label: "Vérification de la luminosité", status: "pending" },
    { label: "Centrage et détection faciale", status: "pending" }
  ]);

  const verifyImageQualityAndProceed = (photoData: string) => {
    setIsVerifyingQuality(true);
    setQualitySteps([
      { label: "Analyse du format d'image", status: "pending" },
      { label: "Vérification de la luminosité", status: "pending" },
      { label: "Centrage et détection faciale", status: "pending" }
    ]);

    setTimeout(() => {
      setQualitySteps(prev => [
        { ...prev[0], status: "success" },
        { ...prev[1], status: "pending" },
        { ...prev[2], status: "pending" }
      ]);
      
      setTimeout(() => {
        setQualitySteps(prev => [
          { ...prev[0], status: "success" },
          { ...prev[1], status: "success" },
          { ...prev[2], status: "pending" }
        ]);

        setTimeout(() => {
          setQualitySteps(prev => [
            { ...prev[0], status: "success" },
            { ...prev[1], status: "success" },
            { ...prev[2], status: "success" }
          ]);

          setTimeout(() => {
            setIsVerifyingQuality(false);
            setStep(AppStep.PROJECTION);
            triggerProjectionAgeify(photoData);
          }, 600);
        }, 800);
      }, 700);
    }, 600);
  };

  const triggerProjectionAgeify = async (photo: string) => {
    setTransformProgress(0);
    setTransformStatus("Analyse tridimensionnelle des traits...");
    
    // Simulate progression
    const intervals = [
      { progress: 15, status: "Détection des zones de pigmentation..." },
      { progress: 35, status: "Cartographie thermique du vieillissement cutané..." },
      { progress: 55, status: "Modélisation de la densité osseuse à 65 ans..." },
      { progress: 75, status: "Ajustement des textures et rides d'expression..." },
      { progress: 90, status: "Rendu de la simulation vintage par IA..." },
      { progress: 100, status: "Projection terminée avec succès !" }
    ];

    for (const step of intervals) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setTransformProgress(step.progress);
      setTransformStatus(step.status);
    }
  };

  // Webcam controls
  const startCamera = async () => {
    setCameraError(null);
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
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Impossible d'accéder à la caméra. Veuillez autoriser la permission ou importer une photo.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Flip horizontal for mirroring
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoData = canvas.toDataURL("image/jpeg");
        setOriginalPhoto(photoData);
        // Apply filters or mock aged photo
        setAgedPhoto(photoData);
        setIsAgedPhotoFallback(true);
        setSnapActive(true);
        
        // Stop camera tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const handleUploadedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (result) {
          setOriginalPhoto(result);
          setAgedPhoto(result);
          setIsAgedPhotoFallback(true);
          setSnapActive(false);
          setCameraActive(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Slider Mouse Movements
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  // Wheel of fortune spin
  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    setShowPrizeOverlay(false);
    
    const prizeIdx = Math.floor(Math.random() * PRIZES.length);
    const degreesPerWedge = 360 / PRIZES.length;
    const extraDegrees = 360 - (prizeIdx * degreesPerWedge) - (degreesPerWedge / 2);
    const targetRotation = wheelRotation + (360 * 5) + extraDegrees;
    
    setWheelRotation(targetRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      const selectedPrize = PRIZES[prizeIdx];
      setWonPrize(selectedPrize);
      setShowPrizeOverlay(true);
      setLeadInfo(prev => ({
        ...prev,
        giftWon: selectedPrize
      }));
    }, 4000);
  };

  // Diagnostic submit AI analyze
  const fetchAIDiagnosticResult = async () => {
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

      const data = await response.json();
      setResultData({
        letter: data.letter,
        percentageScore: data.percentageScore || 55,
        category: data.category || "A_RENFORCER",
        tips: data.tips || []
      });
      setShowDiagnosticResults(true);
    } catch (err) {
      console.warn("AI generation offline, loading standard fallback templates.", err);
      // Hard fallback
      setShowDiagnosticResults(true);
    } finally {
      setLoadingAI(false);
    }
  };

  // Lead Collection submission POST
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadError(null);
    setSubmittingLead(true);

    try {
      const cityString = leadInfo.city === "Casablanca"
        ? `Casablanca - ${leadInfo.casaLocation || "Casa Finance City"}`
        : leadInfo.city;

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: leadInfo.firstName || username,
          lastName: leadInfo.lastName || "Maroc",
          email: leadInfo.email,
          phone: leadInfo.phone,
          city: cityString,
          company: leadInfo.company,
          age: userage,
          score: resultData.percentageScore,
          category: resultData.category,
          answers: {
            ...diagnosticAnswers,
            youngPhoto: originalPhoto,
            oldPhoto: agedPhoto,
            giftWon: wonPrize,
            city: cityString,
            company: leadInfo.company
          },
          letter: resultData.letter
        })
      });

      if (!response.ok) {
        throw new Error("Impossible d'enregistrer le bilan retraite. Veuillez vérifier vos coordonnées.");
      }

      // Success
      setStep(AppStep.FIN);
      onLeadSubmitted(); // Tell parent dashboard to reload leads!
    } catch (e: any) {
      setLeadError(e.message || "Une erreur réseau s'est produite.");
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleStartExperience = async () => {
    setStep(AppStep.SELFIE);
    try {
      await fetch("/api/analytics/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: kioskLocation })
      });
      if (onLeadSubmitted) {
        onLeadSubmitted();
      }
    } catch (err) {
      console.error("Could not send start analytics:", err);
    }
  };

  const handleRestart = () => {
    setStep(AppStep.ACCUEIL);
    setOriginalPhoto(DEMO_PROFILES[0].youngPhoto);
    setAgedPhoto(DEMO_PROFILES[0].oldPhoto);
    setSelectedProfileId("mehdi");
    setWonPrize(null);
    setShowDiagnosticResults(false);
    setDiagnosticIndex(0);
    setLeadInfo({ lastName: "", firstName: "", phone: "", email: "", city: "Casablanca", casaLocation: kioskLocation, company: "" });
  };

  return (
    <div className="flex flex-col items-center justify-center py-4" id="tablet-simulator">
      
      {/* Configuration de la Borne d'Activation */}
      <div className="w-full max-w-lg mb-6 bg-[#1F3566]/5 border border-[#1F3566]/10 rounded-2xl p-4 flex flex-col gap-2 shadow-sm text-[#1F3566]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7CB342] animate-ping" />
            Configuration de la Borne
          </span>
          <span className="text-[10px] font-mono bg-[#1F3566]/10 text-[#1F3566] px-2.5 py-0.5 rounded-full font-bold">
            STATUT : ACTIF
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Localisation de cette Borne CIMR :</label>
            <select
              value={kioskLocation}
              onChange={(e) => setKioskLocation(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1F3566] cursor-pointer shadow-sm"
            >
              <optgroup label="Zones d'Activation Grand Casablanca">
                <option value="Casa Finance City">Pôle Finance : Casa Finance City</option>
                <option value="Casanearshore">Pôle Finance : Casanearshore</option>
                <option value="Zerktouni">Pôle Tertiaire : Zerktouni</option>
                <option value="Anfa">Pôle Tertiaire : Anfa</option>
                <option value="Racine">Pôle Tertiaire : Racine</option>
                <option value="Gauthier">Pôle Tertiaire : Gauthier</option>
                <option value="Ain Sebaa">Pôle Industriel Nord : Ain Sebaa</option>
                <option value="Zenata">Pôle Industriel Nord : Zenata</option>
                <option value="Berrechid">Pôle Industriel Est : Berrechid</option>
                <option value="Bouskoura Zone Industrielle">Pôle Industriel Sud : Bouskoura Z.I.</option>
              </optgroup>
            </select>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          * Les participants qui commencent ou soumettent un bilan sur cette borne seront rattachés à la zone/escale sélectionnée ci-dessus.
        </p>
      </div>

      {/* Tablet Metal Outer Bezel (Styled exactly like iPad Pro) */}
      <div className="w-full max-w-lg bg-[#1F3566] rounded-[48px] p-4 shadow-2xl border-[10px] border-slate-800 relative ring-4 ring-slate-900/10 overflow-hidden">
        
        {/* Tablet camera lens and sensor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 rounded-b-2xl flex items-center justify-center z-40">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/80 ml-2 animate-pulse" />
        </div>

        {/* Glossy Reflection highlight overlay */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-tr from-white/0 via-white/2 to-white/0 transform rotate-12 pointer-events-none z-30" />

        {/* Simulated Screen Body (iPad aspect ratio) */}
        <div className="bg-[#050A18] w-full rounded-[36px] overflow-hidden min-h-[640px] p-6 sm:p-8 flex flex-col justify-between relative text-white">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: WELCOME SCREEN (ACCUEIL) */}
            {step === AppStep.ACCUEIL && (
              <motion.div
                key="accueil"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                {/* Brand Header */}
                <div className="text-center flex flex-col items-center mt-2">
                  <div className="inline-flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                    <span className="text-xl font-extrabold tracking-widest text-[#7CB342] font-display">CIMR</span>
                    <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase mt-0.5">FUTURE ME • EXPERIENCE IMMERSIVE</span>
                  </div>
                </div>

                {/* Double Portrait Graphic split */}
                <div className="flex justify-center my-2">
                  <div className="relative w-44 h-44 rounded-full p-1 bg-gradient-to-tr from-[#1F3566] to-[#7CB342] shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-950 relative bg-black">
                      <div className="absolute left-1/2 inset-y-0 w-0.5 bg-[#7CB342] z-20" />
                      <div className="absolute inset-0 grid grid-cols-2">
                        <div className="overflow-hidden relative h-full">
                          <img src={originalPhoto} className="w-44 h-full object-cover max-w-none absolute left-0" style={{ width: "176px" }} />
                        </div>
                        <div className="overflow-hidden relative h-full">
                          <img src={agedPhoto} className="w-44 h-full object-cover max-w-none absolute right-0" style={{ width: "176px", left: "-88px" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Title */}
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black font-display tracking-tight text-white uppercase">
                    Future Me by CIMR
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed max-w-sm mx-auto font-medium">
                    "Parce qu'il est plus facile de préparer son avenir lorsqu'on peut le visualiser."
                  </p>
                </div>

                {/* Demo Selector Grid */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block text-center">Profils de démonstration</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DEMO_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`p-1 rounded-xl border text-center transition flex flex-col items-center gap-1 active:scale-95 cursor-pointer ${
                          selectedProfileId === p.id 
                            ? "bg-[#1F3566]/60 border-[#7CB342] text-white font-bold" 
                            : "bg-white/5 border-white/5 hover:border-white/10 text-white/70"
                        }`}
                      >
                        <img src={p.youngPhoto} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                        <span className="text-[8px] font-semibold">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Begin Kiosk Trigger */}
                <div className="pt-2">
                  <button
                    onClick={handleStartExperience}
                    className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition tracking-wider uppercase text-xs cursor-pointer active:scale-[0.98]"
                  >
                    Commencer l'expérience
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <p className="text-[8px] text-center text-slate-500 uppercase tracking-widest mt-2">🔒 CONFORME CNDP MAROC</p>
                </div>

              </motion.div>
            )}

            {/* STEP 2: CAMERA OR SELECT SELFIE */}
            {step === AppStep.SELFIE && (
              <motion.div
                key="selfie"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div>
                  <button onClick={handleRestart} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition cursor-pointer">
                    <ArrowLeft className="w-3 h-3" /> Retour
                  </button>
                  <h3 className="text-md font-bold font-display uppercase tracking-wide text-center mt-2">Étape Selfie Portrait</h3>
                </div>

                {isVerifyingQuality ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <RefreshCw className="w-8 h-8 text-[#7CB342] animate-spin" />
                    <span className="text-xs font-mono uppercase tracking-widest text-[#7CB342] animate-pulse">Validation IA...</span>
                    <div className="w-full max-w-xs space-y-2 pt-2 border-t border-white/5">
                      {qualitySteps.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-300">{q.label}</span>
                          {q.status === "success" ? <span className="text-[#7CB342]">OK ✓</span> : <span className="text-slate-500 animate-pulse">Vérification...</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Viewfinder frame */}
                    <div className="flex justify-center">
                      <div className="w-52 h-52 rounded-2xl border-2 border-dashed border-white/20 bg-black/40 overflow-hidden relative flex flex-col items-center justify-center shadow-xl">
                        {cameraActive ? (
                          <>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                            <canvas ref={canvasRef} className="hidden" />
                            <button
                              onClick={capturePhoto}
                              className="absolute bottom-3 bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 transition cursor-pointer shadow-md"
                            >
                              <Camera className="w-3.5 h-3.5 text-blue-900" /> Capturer photo
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full relative">
                            <img src={originalPhoto} alt="Portrait ready" className="w-full h-full object-cover rounded-xl" />
                            <button
                              onClick={startCamera}
                              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/75 hover:bg-black border border-white/10 text-white px-3 py-1.5 rounded-lg text-[9px] uppercase font-mono tracking-widest cursor-pointer"
                            >
                              Prendre une photo 🎥
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Choose file upload or prefill data details */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-[#7CB342] uppercase tracking-wider block">Optionnel : Importer fichier</span>
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleUploadedFile} />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white/5 hover:bg-white/10 text-[9px] uppercase font-mono tracking-wider px-2 py-1 border border-white/10 text-white rounded cursor-pointer"
                        >
                          Parcourir
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <div>
                          <label className="text-[8px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Prénom</label>
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">Votre Âge</label>
                          <input
                            type="number"
                            value={userage}
                            onChange={(e) => setUserage(Math.max(18, parseInt(e.target.value) || 18))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => verifyImageQualityAndProceed(originalPhoto)}
                      className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition tracking-wider uppercase text-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Lancer la Projection !
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 3: INTERACTIVE SLIDER VIEW */}
            {step === AppStep.PROJECTION && (
              <motion.div
                key="projection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="text-center">
                  <h3 className="text-md font-bold font-display uppercase tracking-wide">Projection Future</h3>
                  <span className="text-[10px] font-semibold text-[#7CB342] font-mono uppercase tracking-widest block">Simulation Portrait à 65 ans</span>
                </div>

                {transformProgress < 100 ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <RefreshCw className="w-8 h-8 text-[#7CB342] animate-spin" />
                    <span className="text-xs font-mono text-slate-400 animate-pulse">{transformStatus}</span>
                    <div className="w-40 bg-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-[#7CB342] h-full" style={{ width: `${transformProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div 
                        ref={sliderRef}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleTouchMove}
                        onMouseDown={() => setIsSliding(true)}
                        onMouseUp={() => setIsSliding(false)}
                        onMouseLeave={() => setIsSliding(false)}
                        className="w-52 h-52 rounded-2xl overflow-hidden border-2 border-[#163A8A] relative shadow-2xl bg-[#050A18] cursor-ew-resize select-none"
                      >
                        <img src={originalPhoto} alt="Young portrait" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
                          <img src={agedPhoto} alt="Aged portrait" className="absolute inset-0 w-full h-full object-cover pointer-events-none grayscale-[10%]" />
                        </div>
                        
                        {/* Divider handle */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-[#7CB342] z-20 pointer-events-none" style={{ left: `${sliderPosition}%` }}>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1F3566] border border-white/25 w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white font-bold shadow-md">
                            ↔
                          </div>
                        </div>
                        <span className="absolute bottom-1.5 left-2 bg-black/60 px-1 py-0.5 rounded text-[7px] font-mono uppercase tracking-widest text-slate-300 pointer-events-none">Avant</span>
                        <span className="absolute bottom-1.5 right-2 bg-[#7CB342] px-1 py-0.5 rounded text-[7px] font-mono uppercase tracking-widest text-white pointer-events-none font-bold">Après (65 Ans)</span>
                      </div>
                    </div>

                    <div className="bg-[#1F3566]/40 border border-[#7CB342]/30 p-3 rounded-xl text-center">
                      <p className="text-[11px] text-slate-100 font-semibold leading-relaxed">
                        "Voici la personne que vous pourriez devenir à l'âge de la retraite."
                      </p>
                    </div>

                    <button
                      onClick={() => setStep(AppStep.DIAGNOSTIC)}
                      className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1 shadow-lg transition tracking-wider uppercase text-xs cursor-pointer active:scale-[0.98]"
                    >
                      Découvrir mon diagnostic retraite
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 4: DIAGNOSTIC RETRAITE */}
            {step === AppStep.DIAGNOSTIC && (
              <motion.div
                key="diagnostic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                {!showDiagnosticResults ? (
                  <>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#7CB342] font-semibold">QUESTIONNAIRE CIMR</span>
                      <span className="text-slate-400 font-bold">Question {diagnosticIndex + 1}/{DIAGNOSTIC_QUESTIONS.length}</span>
                    </div>

                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="bg-[#7CB342] h-full" style={{ width: `${((diagnosticIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }} />
                    </div>

                    <div className="my-2 bg-white/5 border border-white/10 p-3.5 rounded-xl text-center">
                      <h4 className="text-xs font-semibold leading-relaxed">{DIAGNOSTIC_QUESTIONS[diagnosticIndex].text}</h4>
                    </div>

                    <div className="space-y-2">
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
                            className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition active:scale-[0.99] cursor-pointer ${
                              isSelected 
                                ? "bg-[#1F3566]/60 border-[#7CB342] text-white font-bold" 
                                : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-sm bg-black/40 w-6 h-6 rounded flex items-center justify-center">{opt.icon}</span>
                              <span>{opt.label}</span>
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#7CB342] stroke-[3px]" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center gap-4 pt-2 shrink-0">
                      <button
                        onClick={() => {
                          if (diagnosticIndex > 0) setDiagnosticIndex(diagnosticIndex - 1);
                          else setStep(AppStep.PROJECTION);
                        }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] uppercase font-semibold text-slate-300 hover:text-white cursor-pointer"
                      >
                        Précédent
                      </button>

                      {diagnosticIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                        <button
                          onClick={() => setDiagnosticIndex(diagnosticIndex + 1)}
                          className="px-4 py-2 bg-[#1F3566] text-white rounded-lg text-[10px] uppercase font-semibold cursor-pointer"
                        >
                          Suivant
                        </button>
                      ) : (
                        <button
                          onClick={fetchAIDiagnosticResult}
                          disabled={loadingAI}
                          className="px-4 py-2 bg-[#7CB342] hover:bg-[#689F38] text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          {loadingAI ? "Génération..." : "Calculer mon score"}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="text-center space-y-1">
                      <span className="text-[#7CB342] text-[10px] font-mono tracking-widest uppercase block">Score de préparation retraite</span>
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#7CB342] bg-white/5 shadow-inner">
                        <span className="text-2xl font-black text-white font-mono">{resultData.percentageScore}%</span>
                      </div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mt-1">
                        Catégorie : {resultData.category === "BIEN_PREPARE" ? "Profil Optimal" : resultData.category === "A_RENFORCER" ? "À Consolider" : "Action urgente requise"}
                      </h4>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 max-h-36 overflow-y-auto space-y-2">
                      <span className="text-[9px] font-bold text-[#7CB342] uppercase tracking-wider block">Recommandations produits CIMR</span>
                      {resultData.tips?.map((tip, idx) => (
                        <div key={idx} className="text-[10px] border-l-2 border-[#163A8A] pl-2 py-0.5 space-y-0.5">
                          <p className="font-bold text-white">{tip.title}</p>
                          <p className="text-slate-400">{tip.desc}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setStep(AppStep.ROUE)}
                      className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition tracking-widest uppercase text-xs cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-white" />
                      Lancer la Roue Cadeau ! 🎁
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 5: WHEEL OF FORTUNE */}
            {step === AppStep.ROUE && (
              <motion.div
                key="roue"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col justify-between items-center space-y-4"
              >
                <div className="text-center">
                  <h3 className="text-md font-bold font-display uppercase tracking-wide">Roue de la Fortune</h3>
                  <span className="text-[9px] font-mono text-[#7CB342] uppercase tracking-widest block">Tournez et remportez un cadeau souvenir !</span>
                </div>

                {/* Spinning physical Wheel graphics */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* Outer ring */}
                  <div className="absolute inset-0 border-4 border-slate-700 rounded-full z-10 pointer-events-none" />
                  {/* Selector pointer */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-5 bg-[#7CB342] rounded-t z-20 shadow-md transform rotate-180" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
                  
                  {/* Rotating inner wheel */}
                  <div 
                    className="w-40 h-40 rounded-full border-2 border-[#163A8A] overflow-hidden shadow-inner relative transition-transform duration-[4000ms] ease-out bg-gradient-to-tr from-[#1F3566] to-[#163A8A]"
                    style={{ transform: `rotate(${wheelRotation}deg)` }}
                  >
                    {/* Visual segments representation */}
                    {PRIZES.map((prz, idx) => {
                      const rotation = idx * (360 / PRIZES.length);
                      return (
                        <div 
                          key={idx} 
                          className="absolute inset-0 flex items-start justify-center origin-center pt-2"
                          style={{ transform: `rotate(${rotation}deg)` }}
                        >
                          <div className="text-[6px] font-bold text-center uppercase tracking-wider text-white/90 max-w-[30px] leading-tight">
                            {prz.split(" ")[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Wheel results dialog */}
                {wonPrize && showPrizeOverlay && (
                  <div className="bg-[#7CB342]/10 border border-[#7CB342]/30 p-3 rounded-xl text-center space-y-1 animate-bounce">
                    <span className="text-[10px] text-slate-400 block font-mono">FÉLICITATIONS !</span>
                    <p className="text-xs font-bold text-white uppercase tracking-wide">Vous avez gagné :</p>
                    <p className="text-sm font-black text-[#7CB342] font-display">{wonPrize}</p>
                  </div>
                )}

                <div className="w-full">
                  {wonPrize ? (
                    <button
                      onClick={() => setStep(AppStep.LEAD)}
                      className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-1 shadow-lg transition tracking-wider uppercase text-xs cursor-pointer"
                    >
                      Enregistrer mon Bilan Retraite
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={spinWheel}
                      disabled={isSpinning}
                      className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1 shadow-lg transition tracking-wider uppercase text-xs cursor-pointer"
                    >
                      {isSpinning ? "La roue tourne..." : "Lancer le tournage ! 🎡"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 6: LEAD CAPTURE FORM */}
            {step === AppStep.LEAD && (
              <motion.div
                key="lead"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col justify-between space-y-4"
              >
                <div className="text-center">
                  <h3 className="text-md font-bold font-display uppercase tracking-wide">Enregistrement Final</h3>
                  <span className="text-[9px] font-mono text-[#7CB342] uppercase tracking-widest block">Validez vos données pour recevoir votre simulation</span>
                </div>

                {leadError && (
                  <p className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-center font-mono">{leadError}</p>
                )}

                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">Prénom *</label>
                      <input
                        type="text"
                        required
                        value={leadInfo.firstName || username}
                        onChange={(e) => setLeadInfo({ ...leadInfo, firstName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">Nom *</label>
                      <input
                        type="text"
                        required
                        value={leadInfo.lastName}
                        onChange={(e) => setLeadInfo({ ...leadInfo, lastName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="Ex: El Alaoui"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">Téléphone *</label>
                      <input
                        type="tel"
                        required
                        value={leadInfo.phone}
                        onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="+212 6..."
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">E-mail *</label>
                      <input
                        type="email"
                        required
                        value={leadInfo.email}
                        onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="ex: nom@domaine.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">Ville d'Activation</label>
                      <input
                        type="text"
                        readOnly
                        value="Casablanca"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-mono uppercase text-slate-400 block mb-0.5">Entreprise (Facultatif)</label>
                      <input
                        type="text"
                        value={leadInfo.company}
                        onChange={(e) => setLeadInfo({ ...leadInfo, company: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        placeholder="Ex: OCP, Maroc Telecom"
                      />
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-1">
                    <label className="text-[8px] font-mono uppercase text-[#7CB342] font-semibold block">Quartier / Zone d'Activation Casablanca</label>
                    <select
                      value={leadInfo.casaLocation || "Casa Finance City"}
                      onChange={(e) => setLeadInfo({ ...leadInfo, casaLocation: e.target.value })}
                      className="w-full bg-[#050A18] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Casa Finance City">Casa Finance City (Pôle Finance)</option>
                      <option value="Casanearshore">Casanearshore (Pôle Finance)</option>
                      <option value="Zerktouni">Zerktouni (Pôle Tertiaire)</option>
                      <option value="Anfa">Anfa (Pôle Tertiaire)</option>
                      <option value="Racine">Racine (Pôle Tertiaire)</option>
                      <option value="Gauthier">Gauthier (Pôle Tertiaire)</option>
                      <option value="Ain Sebaa">Ain Sebaa (Pôle Industriel Nord)</option>
                      <option value="Zenata">Zenata (Pôle Industriel Nord)</option>
                      <option value="Berrechid">Berrechid (Pôle Industriel Est)</option>
                      <option value="Bouskoura Zone Industrielle">Bouskoura Zone Industrielle (Pôle Industriel Sud)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingLead}
                      className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1 shadow-lg transition tracking-widest uppercase text-xs cursor-pointer"
                    >
                      {submittingLead ? "Validation CRM en cours..." : "Soumettre et Recevoir mon Bilan Retraite"}
                    </button>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block mt-1.5 text-center leading-normal">
                      Conformément à la loi 09-08, vous disposez d'un droit d'accès et de rectification de vos données.
                    </span>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 7: FIN THANK YOU SCREEN */}
            {step === AppStep.FIN && (
              <motion.div
                key="fin"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col justify-between items-center space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 text-[#7CB342] rounded-full flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-md font-bold font-display uppercase tracking-wide">Félicitations !</h3>
                  <span className="text-[9px] font-mono text-[#7CB342] uppercase tracking-widest block">Votre Bilan Retraite CIMR est validé</span>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center space-y-3 w-full">
                  <p className="text-[11px] text-slate-200 leading-relaxed font-semibold">
                    Votre cadeau <span className="text-[#7CB342]">{wonPrize || "Pins & Goodies CIMR"}</span> est réservé sur place auprès des animateurs CIMR !
                  </p>
                  
                  {/* Simulated QR Code for download */}
                  <div className="flex flex-col items-center gap-1 bg-white p-2.5 rounded-xl w-fit mx-auto shadow-md">
                    <QrCode className="w-20 h-20 text-slate-900" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider font-mono">Bilan #CIMR-{Math.floor(Math.random()*10000)}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 max-w-xs leading-normal">
                    Scannez le QR Code pour enregistrer instantanément votre bilan sur votre smartphone ou consultez votre messagerie électronique !
                  </p>
                </div>

                <button
                  onClick={handleRestart}
                  className="w-full bg-[#163A8A] hover:bg-blue-900 text-white font-bold py-3 rounded-xl transition tracking-widest uppercase text-xs cursor-pointer shadow-md"
                >
                  Faire une nouvelle simulation
                </button>
              </motion.div>
            )}

          </AnimatePresence>
          
          {/* Tablet Virtual Physical Home Button */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <button
              onClick={handleRestart}
              className="w-9 h-9 rounded-full bg-slate-950 border border-white/15 flex items-center justify-center hover:border-white/30 hover:bg-black transition active:scale-95 cursor-pointer shadow-inner"
              title="Simulator Home Button"
            >
              <div className="w-2.5 h-2.5 rounded bg-white/10 border border-white/20 animate-pulse" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
