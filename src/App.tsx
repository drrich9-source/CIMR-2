import React, { useState, useEffect } from "react";
import { 
  Users, BarChart2, MapPin, Monitor, RefreshCw, AlertTriangle, Landmark, ShieldCheck, Database, Check, Server, Shield, Key, ChevronDown, Lock, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DashboardOverview from "./components/DashboardOverview";
import RoadshowTracker from "./components/RoadshowTracker";
import CRMConsole from "./components/CRMConsole";
import TabletSimulator from "./components/TabletSimulator";
import AccessManager, { AccessProfile } from "./components/AccessManager";

type ActiveTab = "overview" | "roadshow" | "crm" | "kiosk" | "access";

const DEFAULT_PROFILES: AccessProfile[] = [
  {
    id: "profile-admin",
    name: "Administrateur Global",
    roleType: "admin",
    allowedTabs: ["overview", "roadshow", "crm", "kiosk", "access"],
    description: "Accès complet aux statistiques, au suivi du roadshow, à la console CRM, au simulateur et à la configuration des rôles.",
    isDefault: true,
    password: "admin"
  },
  {
    id: "profile-animateur",
    name: "Animateur Casa CFC",
    roleType: "animateur",
    allowedTabs: ["kiosk"],
    description: "Animateur affecté au pôle Finance de Casablanca. Voit uniquement le simulateur de borne.",
    assignedLocation: "Casa Finance City",
    isDefault: true,
    password: "animateur"
  }
];

export default function App() {
  const [profiles, setProfiles] = useState<AccessProfile[]>(() => {
    try {
      const saved = localStorage.getItem("cimr_profiles");
      return saved ? JSON.parse(saved) : DEFAULT_PROFILES;
    } catch {
      return DEFAULT_PROFILES;
    }
  });

  const [activeProfile, setActiveProfile] = useState<AccessProfile>(() => {
    try {
      const saved = localStorage.getItem("cimr_active_profile_id");
      if (saved) {
        const savedProfiles = localStorage.getItem("cimr_profiles");
        const list = savedProfiles ? JSON.parse(savedProfiles) : DEFAULT_PROFILES;
        const found = list.find((p: any) => p.id === saved);
        if (found) return found;
      }
      return DEFAULT_PROFILES[0];
    } catch {
      return DEFAULT_PROFILES[0];
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const savedActiveId = localStorage.getItem("cimr_active_profile_id");
      if (savedActiveId === "profile-animateur" || (savedActiveId && savedActiveId.includes("animateur"))) {
        return "kiosk";
      }
    } catch {}
    return "overview";
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("cimr_profiles", JSON.stringify(profiles));
    } catch (e) {
      console.warn("Could not save profiles", e);
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem("cimr_active_profile_id", activeProfile.id);
    } catch (e) {
      console.warn("Could not save active profile ID", e);
    }
    // Adjust active tab if it's no longer allowed
    if (!activeProfile.allowedTabs.includes(activeTab)) {
      setActiveTab(activeProfile.allowedTabs[0] || "kiosk");
    }
  }, [activeProfile, activeTab]);

  // Password Verification State
  const [profilePendingAuth, setProfilePendingAuth] = useState<AccessProfile | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleSelectProfile = (profile: AccessProfile) => {
    // If selecting the active profile, do nothing
    if (profile.id === activeProfile.id) {
      setShowProfileDropdown(false);
      return;
    }
    
    // Trigger password authentication modal
    setProfilePendingAuth(profile);
    setAuthPassword("");
    setAuthError("");
    setShowProfileDropdown(false);
  };

  const handleConfirmAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profilePendingAuth) return;
    
    const expectedPassword = profilePendingAuth.password || (profilePendingAuth.roleType === "admin" ? "admin" : "animateur");
    
    if (authPassword.trim() === expectedPassword) {
      setActiveProfile(profilePendingAuth);
      if (profilePendingAuth.allowedTabs.length > 0) {
        if (!profilePendingAuth.allowedTabs.includes(activeTab)) {
          setActiveTab(profilePendingAuth.allowedTabs[0]);
        }
      }
      setProfilePendingAuth(null);
      setAuthPassword("");
      setAuthError("");
    } else {
      setAuthError("Mot de passe incorrect. Veuillez réessayer.");
    }
  };

  const handleAddProfile = (newProfile: AccessProfile) => {
    setProfiles(prev => [...prev, newProfile]);
  };

  const handleDeleteProfile = (id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfile.id === id) {
      setActiveProfile(profiles.find(p => p.id !== id) || DEFAULT_PROFILES[0]);
    }
  };

  const [leads, setLeads] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>({
    status: "ok",
    count: 0,
    participantsCount: 147,
    conversionRate: "0"
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dbSetupLoading, setDbSetupLoading] = useState<boolean>(false);
  const [dbSetupResult, setDbSetupResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDbPanel, setShowDbPanel] = useState<boolean>(false);

  const handleSetupDatabase = async () => {
    setDbSetupLoading(true);
    setDbSetupResult(null);
    try {
      const response = await fetch("/api/db/setup", {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDbSetupResult({ success: true, message: data.message });
        fetchDashboardData();
      } else {
        setDbSetupResult({ 
          success: false, 
          message: data.message || "La connexion ou la configuration de la base de données a échoué. Veuillez vérifier la variable DATABASE_URL." 
        });
      }
    } catch (err: any) {
      setDbSetupResult({ 
        success: false, 
        message: `Erreur d'initialisation : ${err.message || err}` 
      });
    } finally {
      setDbSetupLoading(false);
    }
  };

  // Synchronize leads and participant metrics from the server
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch leads
      const leadsRes = await fetch("/api/leads");
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        // Sort leads by newest first
        const sortedLeads = (leadsData.leads || []).sort(
          (a: any, b: any) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
        );
        setLeads(sortedLeads);
      }

      // Fetch DB metrics
      const statusRes = await fetch("/api/db/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDbStatus(statusData);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Certains services de synchronisation en direct sont indisponibles. Mode simulation activé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Simulate traffic / participant start experience
  const handleSimulateActivity = async (location?: string) => {
    try {
      const response = await fetch("/api/analytics/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });
      if (response.ok) {
        const data = await response.json();
        // Refresh full dashboard data to synchronize everything
        fetchDashboardData();
      }
    } catch (err) {
      console.warn("Could not post analytics start, updating locally", err);
      setDbStatus((prev: any) => ({
        ...prev,
        participantsCount: prev.participantsCount + 1
      }));
    }
  };

  // Admin deletion of a lead
  const handleDeleteLead = async (id: any) => {
    // Standard mock delete on the client state to stay responsive and robust
    setLeads(prev => prev.filter(lead => lead.id !== id));
    setDbStatus((prev: any) => {
      const newCount = Math.max(0, prev.count - 1);
      return {
        ...prev,
        count: newCount,
        conversionRate: prev.participantsCount > 0 ? ((newCount / prev.participantsCount) * 100).toFixed(1) : "0"
      };
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#1F3566] flex flex-col justify-between" id="app-container">
      
      {/* Premium Corporate Navbar Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Brand Identity Section */}
          <div className="flex items-center gap-3">
            <div className="bg-[#1F3566] text-white px-4 py-2.5 rounded-xl flex flex-col items-center shadow-md">
              <span className="text-lg font-black tracking-widest leading-none">CIMR</span>
              <span className="text-[7px] font-mono tracking-wider font-semibold uppercase mt-0.5 text-[#7CB342]">ROADSHOW HUB</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#1F3566] uppercase">CIMR Future Me</h1>
              <p className="text-[10px] font-semibold text-[#7CB342] uppercase tracking-wider font-mono">PLATEFORME MARKETING DIRECT & CRM</p>
            </div>
          </div>

          {/* Interactive Navigation Tabs & Profile Switcher */}
          {activeProfile.roleType === "admin" ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <nav className="flex items-center overflow-x-auto gap-1 bg-slate-100/75 p-1 rounded-xl self-start md:self-auto scrollbar-none">
                {activeProfile.allowedTabs.includes("overview") && (
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "overview" 
                        ? "bg-white text-[#1F3566] shadow-sm" 
                        : "text-slate-600 hover:text-[#1F3566]"
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-[#1F3566]" />
                    Vue d'ensemble
                  </button>
                )}
                {activeProfile.allowedTabs.includes("roadshow") && (
                  <button
                    onClick={() => setActiveTab("roadshow")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "roadshow" 
                        ? "bg-white text-[#1F3566] shadow-sm" 
                        : "text-slate-600 hover:text-[#1F3566]"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#7CB342]" />
                    Suivi Roadshow
                  </button>
                )}
                {activeProfile.allowedTabs.includes("crm") && (
                  <button
                    onClick={() => setActiveTab("crm")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "crm" 
                        ? "bg-white text-[#1F3566] shadow-sm" 
                        : "text-slate-600 hover:text-[#1F3566]"
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#7CB342]" />
                    Console CRM
                  </button>
                )}
                {activeProfile.allowedTabs.includes("kiosk") && (
                  <button
                    onClick={() => setActiveTab("kiosk")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "kiosk" 
                        ? "bg-white text-[#1F3566] shadow-sm" 
                        : "text-slate-600 hover:text-[#1F3566]"
                    }`}
                  >
                    <Monitor className="w-4 h-4 text-amber-500 animate-pulse" />
                    Simulateur Borne
                  </button>
                )}
                {activeProfile.allowedTabs.includes("access") && (
                  <button
                    onClick={() => setActiveTab("access")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "access" 
                        ? "bg-white text-[#1F3566] shadow-sm" 
                        : "text-slate-600 hover:text-[#1F3566]"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-[#1F3566]" />
                    Rôles & Accès
                  </button>
                )}
              </nav>

              {/* Profile Selector Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#1F3566] px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#163A8A]" />
                  <span>{activeProfile.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Changer de Profil d'accès</span>
                      </div>
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {profiles.map((p) => {
                          const isSel = p.id === activeProfile.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleSelectProfile(p)}
                              className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                                isSel ? "bg-[#1F3566]/5 text-[#1F3566] font-semibold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.roleType === 'admin' ? 'bg-[#163A8A]' : 'bg-amber-500'}`} />
                              <div className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  {isSel && <Check className="w-3 h-3 text-[#7CB342]" />}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Animateur Mode: minimalist connection status with quick logout option */
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-medium">
                  Saisie Borne active : <strong>{activeProfile.name}</strong>
                </span>
                {activeProfile.assignedLocation && (
                  <span className="text-[10px] text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md font-mono font-bold shrink-0">📍 {activeProfile.assignedLocation}</span>
                )}
              </div>

              {/* Quick Switch Profile dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quitter la session</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Changer de Profil d'accès</span>
                      </div>
                      <div className="space-y-1 max-h-80 overflow-y-auto">
                        {profiles.map((p) => {
                          const isSel = p.id === activeProfile.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleSelectProfile(p)}
                              className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                                isSel ? "bg-[#1F3566]/5 text-[#1F3566] font-semibold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.roleType === 'admin' ? 'bg-[#163A8A]' : 'bg-amber-500'}`} />
                              <div className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span>{p.name}</span>
                                  {isSel && <Check className="w-3 h-3 text-[#7CB342]" />}
                                </div>
                                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        
        {/* Offline / Fallback Notice Banner */}
        {error && (
          <div className="mb-6 bg-amber-50 border border-amber-100 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 shadow-sm animate-bounce">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
            <span className="font-medium">{error}</span>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto underline font-bold text-amber-900 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reconnecter
            </button>
          </div>
        )}

        {/* PostgreSQL Database Manager Widget - Restricted to Admin users */}
        {activeProfile.roleType === "admin" && (
          <div className="mb-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-xs" id="db-manager-panel">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  dbStatus.fallback ? "bg-amber-100/70 text-amber-700" : "bg-emerald-100/70 text-emerald-700"
                }`}>
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F3566] flex items-center gap-2 flex-wrap">
                    Base de données CIMR 
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      dbStatus.fallback ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {dbStatus.fallback ? "Simulation en mémoire (RAM)" : "PostgreSQL Connecté"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dbStatus.fallback 
                      ? "L'application fonctionne actuellement avec un stockage temporaire en RAM. Configurez DATABASE_URL pour persister durablement."
                      : `Toutes les tables sont synchronisées sur l'hôte : ${dbStatus.host}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowDbPanel(!showDbPanel)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 px-4 py-2 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  {showDbPanel ? "Masquer détails" : "Gérer les tables / Instructions"}
                </button>
                <button
                  onClick={handleSetupDatabase}
                  disabled={dbSetupLoading}
                  className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95 cursor-pointer font-sans"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbSetupLoading ? "animate-spin" : ""}`} />
                  {dbSetupLoading ? "Initialisation..." : "Créer / Initialiser les Tables"}
                </button>
              </div>
            </div>

            {/* Expanded DB Details and Setup Status */}
            {showDbPanel && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-200">
                {dbSetupResult && (
                  <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    dbSetupResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {dbSetupResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    </div>
                    <div>
                      <span className="font-bold">{dbSetupResult.success ? "Succès de la configuration" : "Échec d'initialisation"}</span>
                      <p className="mt-1 leading-relaxed">{dbSetupResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider font-mono">Schéma des Tables de l'application</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Les tables suivantes sont automatiquement créées et préparées pour faire tourner toute l'expérience marketing et CRM :
                    </p>
                    
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="font-mono text-[11px] text-slate-700 font-bold">📋 participants</span>
                        <span className="text-[10px] text-slate-500">Formulaire & leads de la borne</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="font-mono text-[11px] text-slate-700 font-bold">📊 analytics</span>
                        <span className="text-[10px] text-slate-500">Statistiques et taux de conversion</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="font-mono text-[11px] text-slate-700 font-bold">🔢 cimr_stats</span>
                        <span className="text-[10px] text-slate-500">Compteurs cumulés d'engagements par zone</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="font-mono text-[11px] text-slate-700 font-bold">📝 cimr_leads</span>
                        <span className="text-[10px] text-slate-500">Bilan diagnostic (compatibilité)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider font-mono">Comment connecter PostgreSQL ?</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5 space-y-1">
                        Pour utiliser un serveur SQL en direct (Supabase, Railway, Neon, etc.) :<br />
                        1. Ouvrez les <strong>Paramètres</strong> (icône engrenage en haut à droite).<br />
                        2. Renseignez la variable <code>DATABASE_URL</code> avec votre URI de connexion PostgreSQL.<br />
                        3. Cliquez sur <strong>"Créer / Initialiser les Tables"</strong> pour valider la connexion et injecter la structure SQL.
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">Hôte détecté : <strong className="text-slate-600 font-medium">{dbStatus.host || "In-memory Fallback"}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {activeTab === "overview" && (
              <DashboardOverview 
                leads={leads} 
                dbStatus={dbStatus} 
                loading={loading}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === "roadshow" && (
              <RoadshowTracker 
                dbStatus={dbStatus} 
                leads={leads}
                onSimulateActivity={handleSimulateActivity}
              />
            )}

            {activeTab === "crm" && (
              <CRMConsole 
                leads={leads} 
                onDeleteLead={handleDeleteLead}
                loading={loading}
              />
            )}

            {activeTab === "kiosk" && (
              <TabletSimulator 
                onLeadSubmitted={fetchDashboardData}
              />
            )}

            {activeTab === "access" && (
              <AccessManager 
                profiles={profiles}
                activeProfile={activeProfile}
                onSelectProfile={handleSelectProfile}
                onAddProfile={handleAddProfile}
                onDeleteProfile={handleDeleteProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Corporate Dashboard Footer bar */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-[10px] text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Caisse Interprofessionnelle Marocaine de Retraite (CIMR). Tous droits réservés.</span>
          <div className="flex items-center gap-1 text-[#7CB342]">
            <ShieldCheck className="w-4 h-4" />
            <span>Serveur d'Infrastructures Sécurisé CIMR Cloud Run</span>
          </div>
        </div>
      </footer>

      {/* Password verification modal */}
      <AnimatePresence>
        {profilePendingAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setProfilePendingAuth(null);
                setAuthPassword("");
                setAuthError("");
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-50 text-[#1F3566] rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-[#163A8A]" />
                </div>
                
                <h3 className="text-lg font-bold text-[#1F3566]">Validation requise</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Vous tentez de vous connecter au profil d'accès <strong>{profilePendingAuth.name}</strong>. Saisissez le mot de passe requis pour cette session.
                </p>

                <form onSubmit={(e) => handleConfirmAuth(e)} className="mt-4 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Mot de passe d'accès</label>
                    <input
                      type="password"
                      autoFocus
                      required
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        setAuthError("");
                      }}
                      placeholder="Saisissez le mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                    />
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] text-slate-400 font-medium">
                    <span className="text-[#1F3566] font-semibold block mb-0.5">💡 Aide de test :</span>
                    Le mot de passe de ce rôle est <strong className="text-slate-600 font-mono">"{profilePendingAuth.password || (profilePendingAuth.roleType === "admin" ? "admin" : "animateur")}"</strong>.
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePendingAuth(null);
                        setAuthPassword("");
                        setAuthError("");
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <span>Se connecter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
