import React, { useState, useEffect, useMemo } from "react";
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  Link, 
  useLocation, 
  useNavigate 
} from "react-router-dom";
import { 
  Users, BarChart2, MapPin, Monitor, RefreshCw, AlertTriangle, 
  Landmark, ShieldCheck, Database, Check, Server, Shield, Key, 
  ChevronDown, Lock, ArrowRight, ShieldAlert, LogOut, Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DashboardOverview from "./components/DashboardOverview";
import RoadshowTracker from "./components/RoadshowTracker";
import CRMConsole from "./components/CRMConsole";
import TabletSimulator from "./components/TabletSimulator";
import AccessManager from "./components/AccessManager";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { CIMRLogin } from "./components/CIMRLogin";
import { CIMRLogo } from "./components/CIMRLogo";

// -------------------------------------------------------------
// MAIN ENTRY APP COMPONENT
// -------------------------------------------------------------
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

// -------------------------------------------------------------
// INTERNAL WORKSPACE APP CONTENT (CONNECTED TO ROUTING & AUTH)
// -------------------------------------------------------------
function AppContent() {
  const { user, logout, changePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Set the dynamic CIMR favicon on mount
  useEffect(() => {
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="80 15 340 155" width="32" height="32">
  <g fill="%235D9B2F">
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(-81, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(-63, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(-45, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(-27, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(-9, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(9, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(27, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(45, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(63, 250, 154)" />
    <rect x="238" y="22" width="24" height="100" rx="12" transform="rotate(81, 250, 154)" />
  </g>
  <path d="M 100,154 L 218,154 A 32,32 0 0,1 282,154 L 400,154 C 400,140 390,132 375,132 L 125,132 C 110,132 100,140 100,154 Z" fill="%235D9B2F" />
  <path d="M 218,154 A 32,32 0 0,1 282,154 Z" fill="%23E7A11A" />
</svg>`;
    const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement("link");
    link.type = "image/svg+xml";
    link.rel = "icon";
    link.href = `data:image/svg+xml;utf8,${faviconSvg}`;
    document.getElementsByTagName("head")[0].appendChild(link);
  }, []);

  // Core CRM & Kiosk Live State Engine
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

  // Profile / Options Dropdown UI states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Password Update Modal form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  // Synchronize leads and database metrics from API
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const leadsRes = await fetch("/api/leads");
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        const sortedLeads = (leadsData.leads || []).sort(
          (a: any, b: any) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
        );
        setLeads(sortedLeads);
      }

      const statusRes = await fetch("/api/db/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setDbStatus(statusData);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Certains services de synchronisation en direct sont indisponibles. Mode simulation local activé.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger setup/creation of Postgres database schema
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
          message: data.message || "La connexion ou la configuration de la base de données a échoué. Veuillez vérifier la variable DATABASE_URL dans les paramètres." 
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

  // Simulate analytics traffic (used in Roadshow panel)
  const handleSimulateActivity = async (locationName?: string) => {
    try {
      const response = await fetch("/api/analytics/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: locationName })
      });
      if (response.ok) {
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

  // Delete lead handler
  const handleDeleteLead = async (id: any) => {
    try {
      const response = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setLeads(prev => prev.filter(lead => lead.id !== id));
        fetchDashboardData();
      } else {
        // Fallback local deletion
        setLeads(prev => prev.filter(lead => lead.id !== id));
      }
    } catch (e) {
      // Local fallback in offline mode
      setLeads(prev => prev.filter(lead => lead.id !== id));
    }
  };

  // Handle password modification
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!user) return;
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPwdError("Veuillez remplir tous les champs.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    if (newPassword.length < 4) {
      setPwdError("Le nouveau mot de passe doit comporter au moins 4 caractères.");
      return;
    }

    setPwdSubmitting(true);

    try {
      await changePassword(user.username, oldPassword, newPassword);
      setPwdSuccess("Mot de passe modifié avec succès !");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPwdSuccess("");
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || "Impossible de modifier le mot de passe.");
    } finally {
      setPwdSubmitting(false);
    }
  };

  // Calculate session validity countdown for display
  const sessionExpiresInMins = useMemo(() => {
    if (!user) return null;
    const expires = new Date(user.expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expires - now;
    return diff > 0 ? Math.ceil(diff / 1000 / 60) : 0;
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans antialiased text-[#1F3566] flex flex-col justify-between" id="app-container">
      
      {/* Premium Corporate Navbar Header */}
      <header className="bg-white border-b border-slate-100 shadow-xs sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Brand Identity Section */}
          <Link to="/" className="flex items-center gap-3 self-start cursor-pointer hover:opacity-90 pl-1">
            <CIMRLogo 
              showText={true} 
              className="h-9 sm:h-11 md:h-12 lg:h-[54px] py-1.5 transition-all" 
            />
            <div className="border-l border-slate-200 pl-3 py-1 hidden sm:block">
              <h1 className="text-sm font-extrabold tracking-tight text-[#1F3566] uppercase leading-none">Future Me</h1>
              <p className="text-[8px] font-bold text-[#5D9B2F] uppercase tracking-wider font-mono mt-1">Marketing & CRM</p>
            </div>
          </Link>

          {/* Interactive Navigation Tabs & Profile Switcher */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
            <nav className="flex items-center overflow-x-auto gap-1 bg-slate-150/40 p-1 rounded-xl w-full md:w-auto scrollbar-none">
              
              {/* Public link - Future Mirror */}
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  location.pathname === "/" 
                    ? "bg-[#1F3566] text-white shadow-xs" 
                    : "text-slate-600 hover:text-[#1F3566] hover:bg-slate-50"
                }`}
              >
                <Monitor className="w-4 h-4 text-[#7CB342]" />
                <span>Future Mirror</span>
              </Link>

              {/* Protected Links - require login, hidden for "animateur" role */}
              {(!user || user.role !== "animateur") && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      location.pathname === "/dashboard" 
                        ? "bg-[#1F3566] text-white shadow-xs" 
                        : "text-slate-600 hover:text-[#1F3566] hover:bg-slate-50"
                    }`}
                  >
                    <BarChart2 className="w-4 h-4 text-[#7CB342]" />
                    <span>Vue d'ensemble</span>
                  </Link>

                  <Link
                    to="/roadshow"
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      location.pathname === "/roadshow" 
                        ? "bg-[#1F3566] text-white shadow-xs" 
                        : "text-slate-600 hover:text-[#1F3566] hover:bg-slate-50"
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-[#7CB342]" />
                    <span>Suivi Roadshow</span>
                  </Link>

                  <Link
                    to="/crm"
                    className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      location.pathname === "/crm" 
                        ? "bg-[#1F3566] text-white shadow-xs" 
                        : "text-slate-600 hover:text-[#1F3566] hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#7CB342]" />
                    <span>Console CRM</span>
                  </Link>

                  {user && user.role === "admin_global" && (
                    <Link
                      to="/roles"
                      className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        location.pathname === "/roles" 
                          ? "bg-[#1F3566] text-white shadow-xs" 
                          : "text-slate-600 hover:text-[#1F3566] hover:bg-slate-50"
                      }`}
                    >
                      <Shield className="w-4 h-4 text-[#7CB342]" />
                      <span>Rôles & Accès</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Profile Selector & Session Info Dropdown */}
            {user ? (
              <div className="relative shrink-0 w-full md:w-auto">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-full md:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-[#1F3566] px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between md:justify-start gap-2 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#7CB342]" />
                    <span className="truncate">{user.name}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100 space-y-2">
                      <div className="border-b border-slate-100 pb-2 mb-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Session Active Sécurisée</span>
                        <div className="text-xs font-bold text-[#1F3566] mt-1">{user.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">Role : {user.role.toUpperCase()}</div>
                        {user.region && (
                          <div className="text-[10px] text-[#7CB342] font-semibold mt-0.5">Région : {user.region}</div>
                        )}
                        <div className="text-[10px] text-amber-600 font-medium mt-1.5 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>Expire dans {sessionExpiresInMins ?? 30} min</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            setShowChangePasswordModal(true);
                          }}
                          className="w-full text-left p-2 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Key className="w-4 h-4 text-slate-400" />
                          <span>Changer de mot de passe</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            logout();
                            navigate("/");
                          }}
                          className="w-full text-left p-2 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Se déconnecter</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="w-full md:w-auto bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>Accès Direction CRM</span>
              </Link>
            )}
          </div>
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

        {/* PostgreSQL Database Manager Widget - Restricted to Global Admin users */}
        {user && user.role === "admin_global" && (location.pathname === "/dashboard" || location.pathname === "/crm") && (
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
                        <span className="text-[10px] text-slate-500">Compteurs d'engagements par zone</span>
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

        {/* Dynamic Client Router Pages */}
        <Routes>
          {/* Public Route - Kiosk Simulator */}
          <Route path="/" element={
            <div className="space-y-4">
              {user && (
                <div className="max-w-2xl mx-auto mb-4 bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>
                      Saisie Borne Connectée : <strong>{user.name}</strong> 
                      {user.region && <span className="font-bold text-[#7CB342] ml-1">📍 {user.region}</span>}
                    </span>
                  </div>
                  <button 
                    onClick={() => { logout(); navigate("/"); }} 
                    className="text-[10px] font-bold text-rose-700 hover:underline uppercase tracking-wide bg-rose-50 px-2 py-1 rounded"
                  >
                    Fermer Session
                  </button>
                </div>
              )}
              <TabletSimulator onLeadSubmitted={fetchDashboardData} />
            </div>
          } />

          {/* Secure CRM Routes under AuthGuard wrapper */}
          <Route path="/dashboard" element={
            <AuthGuard>
              <DashboardOverview 
                leads={leads} 
                dbStatus={dbStatus} 
                loading={loading}
                onNavigateToTab={(tab) => {
                  if (tab === "kiosk") navigate("/");
                  else navigate("/" + tab);
                }}
              />
            </AuthGuard>
          } />

          <Route path="/roadshow" element={
            <AuthGuard>
              <RoadshowTracker 
                dbStatus={dbStatus} 
                leads={leads}
                onSimulateActivity={handleSimulateActivity}
              />
            </AuthGuard>
          } />

          <Route path="/crm" element={
            <AuthGuard>
              <CRMConsole 
                leads={leads} 
                onDeleteLead={handleDeleteLead}
                loading={loading}
              />
            </AuthGuard>
          } />

          <Route path="/roles" element={
            <AuthGuard>
              <AccessManager />
            </AuthGuard>
          } />

          {/* Login Page Route */}
          <Route path="/login" element={
            user ? (
              user.role === "animateur" ? <Navigate to="/" replace /> : <Navigate to="/dashboard" replace />
            ) : (
              <CIMRLogin onSuccess={(role) => navigate(role === "animateur" ? "/" : "/dashboard")} />
            )
          } />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Corporate Dashboard Footer bar */}
      <footer className="bg-white border-t border-slate-100 py-4 px-6 text-center text-[10px] text-slate-400 font-medium mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Caisse Interprofessionnelle Marocaine de Retraite (CIMR). Tous droits réservés.</span>
          <div className="flex items-center gap-1 text-[#7CB342]">
            <ShieldCheck className="w-4 h-4" />
            <span>Serveur d'Infrastructures Sécurisé CIMR Cloud Run</span>
          </div>
        </div>
      </footer>

      {/* Change Password secure modal */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowChangePasswordModal(false);
                setPwdError("");
                setPwdSuccess("");
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full relative z-10 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-50 text-[#1F3566] rounded-2xl flex items-center justify-center mb-4">
                  <Key className="w-6 h-6 text-[#163A8A]" />
                </div>
                
                <h3 className="text-lg font-bold text-[#1F3566]">Modifier votre mot de passe</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mettez à jour le mot de passe d'accès sécurisé pour votre session <strong>{user?.username}</strong>.
                </p>

                <form onSubmit={handlePasswordChangeSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Ancien mot de passe</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Saisissez votre mot de passe actuel"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Saisissez le nouveau mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmez le nouveau mot de passe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                    />
                  </div>

                  {pwdError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{pwdError}</span>
                    </div>
                  )}

                  {pwdSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{pwdSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePasswordModal(false);
                        setPwdError("");
                        setPwdSuccess("");
                      }}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={pwdSubmitting}
                      className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <span>Mettre à jour</span>
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
