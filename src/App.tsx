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
  ChevronDown, Lock, ArrowRight, ShieldAlert, LogOut, Settings,
  Battery, Wifi, Clock
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
          + " (Ou lancez set_up_firebase / cloudsql-setup)"
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

  // Dynamic Live digital clock for the tablet status bar
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isKiosk = location.pathname === "/";

  return (
    <div className="min-h-screen bg-[#080d1a] font-sans antialiased text-[#1F3566] flex flex-col justify-center items-center p-4 relative overflow-hidden" id="app-container">
      
      {/* Immersive Space Backdrop Design */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#7CB342]/10 blur-[120px] pointer-events-none animate-pulse duration-10000" />

      {/* Tablet Metal Outer Bezel (Sleek Horizontal iPad Pro Kiosk Setup) */}
      <div 
        className="w-full max-w-6xl bg-[#111827] rounded-[48px] pt-4.5 pb-13 px-4 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] border-[14px] border-[#1e293b] relative ring-1 ring-white/10 flex flex-col h-[820px] max-h-[92vh] min-h-[660px] overflow-hidden" 
        id="tablet-frame"
      >
        {/* Tablet camera lens and sensor */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-24 h-4 bg-[#1e293b] rounded-b-2xl flex items-center justify-center gap-2.5 z-50">
          <div className="w-2 h-2 rounded-full bg-black border border-white/5" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
        </div>

        {/* Glossy Reflection Highlight Overlay */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-tr from-white/0 via-white/1 to-white/0 transform rotate-12 pointer-events-none z-40" />

        {/* Unified Internal Tablet Screen */}
        <div 
          className={`flex-1 rounded-[32px] overflow-hidden flex flex-col relative transition-all duration-300 ${
            isKiosk ? "bg-[#050A18]" : "bg-slate-50"
          }`} 
          id="tablet-screen"
        >
          
          {/* 1. TABLET SYSTEM STATUS BAR */}
          <div className={`h-7 px-6 flex items-center justify-between text-[10px] font-mono tracking-wider shrink-0 z-30 transition-all duration-300 ${
            isKiosk ? "bg-[#040813] text-slate-400 border-b border-white/5" : "bg-slate-100/90 text-slate-500 border-b border-slate-200"
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>CIMR Kiosk Active</span>
              <span className="opacity-40">|</span>
              <span className="text-[9px] uppercase font-semibold text-[#7CB342]">Kiosk Mode</span>
            </div>
            <div className="font-semibold text-center hidden md:block uppercase tracking-widest text-[9px]">
              {isKiosk ? "✨ Future Me Immersive Mirror" : "📊 CRM Control Console"}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 opacity-80" />
                <span className="font-bold">CIMR-Secure</span>
              </div>
              <div className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 opacity-80" />
                <span className="font-bold">98% ⚡</span>
              </div>
              <div className="font-bold flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3 text-[#7CB342]" />
                <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* 2. TABLET APPLICATION NAVIGATION HEADER */}
          <header className={`border-b shrink-0 z-30 transition-all duration-300 ${
            isKiosk ? "bg-[#050A18]/95 border-white/5 shadow-md px-6 py-2.5" : "bg-white border-slate-200/80 shadow-xs px-6 py-2.5"
          }`}>
            <div className="flex items-center justify-between gap-4">
              
              {/* Brand Identity */}
              <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-90 pl-1">
                <CIMRLogo 
                  showText={true} 
                  darkTheme={isKiosk}
                  className="h-8 py-0.5 transition-all" 
                />
                <div className={`border-l pl-2 py-0.5 hidden sm:block ${
                  isKiosk ? "border-white/10" : "border-slate-200"
                }`}>
                  <h1 className={`text-xs font-black tracking-tight uppercase leading-none ${
                    isKiosk ? "text-white" : "text-[#1F3566]"
                  }`}>Future Me</h1>
                  <p className="text-[7px] font-bold text-[#5D9B2F] uppercase tracking-wider font-mono mt-0.5">Marketing & CRM</p>
                </div>
              </Link>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-3">
                <nav className={`flex items-center gap-1 p-1 rounded-xl w-full sm:w-auto overflow-x-auto ${
                  isKiosk ? "bg-white/5" : "bg-slate-100"
                }`}>
                  
                  {/* Public link - Future Mirror */}
                  <Link
                    to="/"
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      location.pathname === "/" 
                        ? "bg-[#1F3566] text-white shadow-xs" 
                        : isKiosk 
                          ? "text-slate-300 hover:text-white hover:bg-white/5" 
                          : "text-slate-600 hover:text-[#1F3566] hover:bg-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-[#7CB342]" />
                    <span className="hidden md:inline">Future Mirror</span>
                  </Link>

                  {/* Protected Links - require login */}
                  {(!user || user.role !== "animateur") && (
                    <>
                      <Link
                        to="/dashboard"
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          location.pathname === "/dashboard" 
                            ? "bg-[#1F3566] text-white shadow-xs" 
                            : isKiosk 
                              ? "text-slate-300 hover:text-white hover:bg-white/5" 
                              : "text-slate-600 hover:text-[#1F3566] hover:bg-white"
                        }`}
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-[#7CB342]" />
                        <span className="hidden md:inline">Vue d'ensemble</span>
                      </Link>

                      <Link
                        to="/roadshow"
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          location.pathname === "/roadshow" 
                            ? "bg-[#1F3566] text-white shadow-xs" 
                            : isKiosk 
                              ? "text-slate-300 hover:text-white hover:bg-white/5" 
                              : "text-slate-600 hover:text-[#1F3566] hover:bg-white"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#7CB342]" />
                        <span className="hidden md:inline">Suivi Roadshow</span>
                      </Link>

                      <Link
                        to="/crm"
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          location.pathname === "/crm" 
                            ? "bg-[#1F3566] text-white shadow-xs" 
                            : isKiosk 
                              ? "text-slate-300 hover:text-white hover:bg-white/5" 
                              : "text-slate-600 hover:text-[#1F3566] hover:bg-white"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-[#7CB342]" />
                        <span className="hidden md:inline">Console CRM</span>
                      </Link>

                      {user && user.role === "admin_global" && (
                        <Link
                          to="/roles"
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition duration-150 flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            location.pathname === "/roles" 
                              ? "bg-[#1F3566] text-white shadow-xs" 
                              : isKiosk 
                                ? "text-slate-300 hover:text-white hover:bg-white/5" 
                                : "text-slate-600 hover:text-[#1F3566] hover:bg-white"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5 text-[#7CB342]" />
                          <span className="hidden md:inline">Rôles & Accès</span>
                        </Link>
                      )}
                    </>
                  )}
                </nav>

                {/* Profile Selector or Admin Login Access */}
                {user ? (
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between gap-1.5 transition cursor-pointer shadow-xs border ${
                        isKiosk 
                          ? "bg-white/10 hover:bg-white/15 border-white/10 text-white" 
                          : "bg-white hover:bg-slate-50 border-slate-200 text-[#1F3566]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7CB342]" />
                        <span className="truncate max-w-[65px]">{user.name}</span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    {showProfileDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                        <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-100 space-y-2 text-slate-800">
                          <div className="border-b border-slate-100 pb-2 mb-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Session Active</span>
                            <div className="text-xs font-bold text-[#1F3566] mt-0.5">{user.username}</div>
                            <div className="text-[9px] text-slate-500 font-mono">Role : {user.role.toUpperCase()}</div>
                            {user.region && (
                              <div className="text-[9px] text-[#7CB342] font-semibold mt-0.5">Région : {user.region}</div>
                            )}
                            <div className="text-[9px] text-amber-600 font-medium mt-1.5 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                              <Lock className="w-2.5 h-2.5 shrink-0" />
                              <span>Expire : {sessionExpiresInMins ?? 30} min</span>
                            </div>
                          </div>
                          
                          <div className="space-y-0.5">
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                setShowChangePasswordModal(true);
                              }}
                              className="w-full text-left p-1.5 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5 text-slate-400" />
                              <span>Changer de mot de passe</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                logout();
                                navigate("/");
                              }}
                              className="w-full text-left p-1.5 hover:bg-rose-50 text-rose-700 rounded-lg text-[10px] font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5 text-rose-500" />
                              <span>Se déconnecter</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                      isKiosk 
                        ? "bg-white/15 hover:bg-white/20 text-white border border-white/10" 
                        : "bg-[#1F3566] hover:bg-[#163A8A] text-white"
                    }`}
                  >
                    <Lock className="w-3 h-3 text-white" />
                    <span>Accès Admin</span>
                  </Link>
                )}
              </div>

            </div>
          </header>

          {/* 3. TABLET INTERNAL SCROLLABLE VIEWPORT CONTAINER */}
          <div 
            className={`flex-1 overflow-y-auto ${
              isKiosk ? "p-0 bg-[#050A18] scrollbar-none" : "p-6 md:p-8 bg-slate-50 text-slate-800 scrollbar-thin scrollbar-thumb-slate-200"
            }`} 
            id="tablet-viewport-body"
          >
            
            {/* Offline / Live Sync Notice banner inside internal screen */}
            {error && (
              <div className="mb-4 bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 shadow-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium truncate flex-1">{error}</span>
                <button 
                  onClick={fetchDashboardData}
                  className="ml-auto underline font-bold text-amber-900 cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  <RefreshCw className="w-3 h-3" /> Reconnecter
                </button>
              </div>
            )}

            {/* PostgreSQL Database Manager Widget inside Tablet Scroll View (Global Admin Only) */}
            {user && user.role === "admin_global" && (location.pathname === "/dashboard" || location.pathname === "/crm") && (
              <div className="mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs" id="db-manager-panel">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      dbStatus.fallback ? "bg-amber-100/70 text-amber-700" : "bg-emerald-100/70 text-emerald-700"
                    }`}>
                      <Database className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#1F3566] flex items-center gap-2 flex-wrap">
                        Base de données CIMR 
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          dbStatus.fallback ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {dbStatus.fallback ? "En mémoire (RAM)" : "PostgreSQL Connecté"}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                        {dbStatus.fallback 
                          ? "L'application fonctionne actuellement avec un stockage temporaire en RAM. Renseignez DATABASE_URL pour persister durablement."
                          : `Toutes les tables sont synchronisées sur l'hôte : ${dbStatus.host}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowDbPanel(!showDbPanel)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700 px-3 py-1.5 rounded-lg transition"
                    >
                      {showDbPanel ? "Masquer détails" : "Gérer les tables"}
                    </button>
                    <button
                      onClick={handleSetupDatabase}
                      disabled={dbSetupLoading}
                      className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${dbSetupLoading ? "animate-spin" : ""}`} />
                      {dbSetupLoading ? "Initialisation..." : "Créer les Tables"}
                    </button>
                  </div>
                </div>

                {/* Expanded DB Details inside Kiosk */}
                {showDbPanel && (
                  <div className="mt-3 pt-3 border-t border-slate-150 space-y-3 animate-in fade-in duration-150 text-left">
                    {dbSetupResult && (
                      <div className={`p-3 rounded-xl text-[10px] flex items-start gap-2 ${
                        dbSetupResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-rose-50 text-rose-800 border border-rose-100"
                      }`}>
                        <div className="shrink-0 mt-0.5">
                          {dbSetupResult.success ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        </div>
                        <div>
                          <span className="font-bold">{dbSetupResult.success ? "Configuration Réussie" : "Échec d'initialisation"}</span>
                          <p className="mt-0.5 leading-relaxed">{dbSetupResult.message}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 space-y-2">
                        <h4 className="text-[9px] font-bold text-[#1F3566] uppercase tracking-wider font-mono">Schéma des Tables</h4>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex items-center justify-between p-1 px-2 bg-white rounded border border-slate-100">
                            <span className="font-mono text-[10px] text-slate-700 font-bold">📋 participants</span>
                            <span className="text-[9px] text-slate-500">Formulaire & leads de la borne</span>
                          </div>
                          <div className="flex items-center justify-between p-1 px-2 bg-white rounded border border-slate-100">
                            <span className="font-mono text-[10px] text-slate-700 font-bold">📊 analytics</span>
                            <span className="text-[9px] text-slate-500">Statistiques et taux de conversion</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-150 flex flex-col justify-between text-[10px]">
                        <p className="text-slate-500 leading-normal">
                          Renseignez la variable <code>DATABASE_URL</code> dans les paramètres du projet pour lier votre instance PostgreSQL, puis relancez l'initialisation.
                        </p>
                        <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 flex items-center gap-1.5 mt-2">
                          <Server className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">Hôte : <strong className="text-slate-600 font-medium">{dbStatus.host || "Simulation RAM"}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Router view outlet inside the Tablet Viewport */}
            <Routes>
              
              {/* Public Route - Kiosk Simulator */}
              <Route path="/" element={
                <div className="space-y-4">
                  {user && (
                    <div className="max-w-xl mx-auto bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl flex items-center justify-between text-[10px] text-amber-200 shadow-sm animate-in fade-in duration-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span>
                          Saisie Borne Connectée : <strong className="text-white">{user.name}</strong> 
                          {user.region && <span className="font-bold text-[#7CB342] ml-1">📍 {user.region}</span>}
                        </span>
                      </div>
                      <button 
                        onClick={() => { logout(); navigate("/"); }} 
                        className="text-[8px] font-bold text-rose-300 hover:text-white uppercase tracking-wider bg-rose-900/30 px-2 py-1 rounded-lg"
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

          </div>

        </div>

        {/* 4. PHYSICAL VIRTUAL HOME BUTTON (Center bottom bezel of tablet) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-[#0d131f] border border-white/10 flex items-center justify-center hover:border-white/35 hover:bg-black transition active:scale-90 cursor-pointer shadow-inner"
            title="Kiosk Home Screen"
          >
            <div className="w-2.5 h-2.5 rounded bg-white/5 border border-white/15 animate-pulse" />
          </button>
        </div>

      </div>

      {/* Modern Kiosk stand shadow support indicator */}
      <div className="w-96 h-2.5 bg-black/55 blur-md rounded-full mt-3 opacity-60 pointer-events-none" />
      <div className="text-[9px] text-slate-500 font-mono mt-4 text-center tracking-widest uppercase pointer-events-none">
        CIMR Interactive Marketing Terminal • Security Certified
      </div>

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
