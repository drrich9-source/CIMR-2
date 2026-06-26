import React from "react";
import { useAuth } from "../AuthContext";
import { 
  Users, UserCheck, TrendingUp, Landmark, Calendar, Clock, Award, CheckCircle2, ChevronRight, MapPin, Target, Sparkles, AlertCircle, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  PieChart, Pie, Cell 
} from "recharts";
import { CIMRLogo } from "./CIMRLogo";

interface DashboardOverviewProps {
  leads: any[];
  dbStatus: any;
  loading: boolean;
  onNavigateToTab: (tab: "overview" | "roadshow" | "crm" | "kiosk") => void;
}

interface ZoneData {
  id: number;
  name: string;
  category: string;
  locations: string[];
  type: string;
  color: string;
  baseParticipants: number;
  baseLeads: number;
  mapX: number; // Percentage X on SVG map
  mapY: number; // Percentage Y on SVG map
}

const CASABLANCA_ZONES: ZoneData[] = [
  {
    id: 1,
    name: "Pôle Finance & Services",
    category: "Services Financiers / Tech",
    locations: ["Casa Finance City", "Casanearshore"],
    type: "Bureaux / Services Financiers",
    color: "#1F3566", // Bleu CIMR
    baseParticipants: 14500,
    baseLeads: 1620,
    mapX: 38,
    mapY: 58
  },
  {
    id: 2,
    name: "Pôle Tertiaire & Bureaux",
    category: "Administration / Commerce",
    locations: ["Zerktouni", "Anfa", "Racine", "Gauthier"],
    type: "Cadres et Employés",
    color: "#7CB342", // Vert CIMR
    baseParticipants: 16800,
    baseLeads: 1840,
    mapX: 28,
    mapY: 34
  },
  {
    id: 3,
    name: "Pôle Industriel Nord",
    category: "Industrie / Logistique",
    locations: ["Ain Sebaa", "Zenata"],
    type: "Ouvriers & Techniciens",
    color: "#8E24AA", // Violet
    baseParticipants: 9500,
    baseLeads: 780,
    mapX: 62,
    mapY: 24
  },
  {
    id: 4,
    name: "Pôle Industriel Est",
    category: "Industrie Manufacturière",
    locations: ["Berrechid"],
    type: "Ouvriers & Techniciens",
    color: "#FB8C00", // Orange
    baseParticipants: 4200,
    baseLeads: 310,
    mapX: 82,
    mapY: 72
  },
  {
    id: 5,
    name: "Pôle Industriel Sud",
    category: "Industrie & Tech",
    locations: ["Bouskoura Zone Industrielle"],
    type: "Ouvriers & Cadres Techniques",
    color: "#E53935", // Rouge
    baseParticipants: 5000,
    baseLeads: 450,
    mapX: 48,
    mapY: 82
  }
];

export default function DashboardOverview({ leads, dbStatus, loading, onNavigateToTab }: DashboardOverviewProps) {
  const { user } = useAuth();
  const [activeZoneId, setActiveZoneId] = React.useState<number | null>(null);
  const [viewMode, setViewMode] = React.useState<"standard" | "heatmap">("standard");

  // Filter leads based on user's assigned region if they are a regional admin
  const regionFilteredLeads = React.useMemo(() => {
    if (!user || user.role === "admin_global" || user.role === "consultation") {
      return leads;
    }
    const region = user.region || "Casablanca";
    return leads.filter(lead => {
      const city = lead.city || lead.answers?.city || "Casablanca";
      return city.toLowerCase().includes(region.toLowerCase());
    });
  }, [leads, user]);

  // Map location string to Zone ID (1 to 5)
  const getZoneIdFromCity = (cityStr: string): number => {
    if (!cityStr) return 0;
    const loc = cityStr.toLowerCase();
    if (loc.includes("finance") || loc.includes("nearshore")) return 1;
    if (loc.includes("zerktouni") || loc.includes("anfa") || loc.includes("racine") || loc.includes("gauthier")) return 2;
    if (loc.includes("sebaa") || loc.includes("zenata")) return 3;
    if (loc.includes("berrechid")) return 4;
    if (loc.includes("bouskoura")) return 5;
    return 0;
  };

  // Real-time extra statistics from backend
  const serverZoneParticipants = dbStatus?.zoneStats?.participants || {};
  const serverZoneLeads = dbStatus?.zoneStats?.leads || {};

  // Compute stats per zone
  const computedZones = CASABLANCA_ZONES.map(zone => {
    const extraParticipants = serverZoneParticipants[zone.id] || 0;
    
    // Sum real leads mapped to this zone
    const extraLeads = regionFilteredLeads.filter(lead => {
      const city = lead.city || lead.answers?.city || "";
      return getZoneIdFromCity(city) === zone.id;
    }).length;

    const totalParticipantsInZone = zone.baseParticipants + extraParticipants;
    const totalLeadsInZone = zone.baseLeads + extraLeads;
    const conversionRateInZone = totalParticipantsInZone > 0 
      ? parseFloat(((totalLeadsInZone / totalParticipantsInZone) * 100).toFixed(2))
      : 0;

    return {
      ...zone,
      participants: totalParticipantsInZone,
      leads: totalLeadsInZone,
      conversionRate: conversionRateInZone
    };
  });

  // Global Campaign totals from Grand Casablanca zones
  const campaignParticipants = computedZones.reduce((sum, z) => sum + z.participants, 0);
  const campaignLeads = computedZones.reduce((sum, z) => sum + z.leads, 0);
  
  const participantsProgress = parseFloat(((campaignParticipants / 50000) * 100).toFixed(1));
  const leadsProgress = parseFloat(((campaignLeads / 5000) * 100).toFixed(1));

  // Top-performing zone
  const topZone = [...computedZones].sort((a, b) => b.leads - a.leads)[0];

  // Standard overall KPIs
  const totalLeads = regionFilteredLeads.length;
  const totalParticipants = dbStatus?.participantsCount ?? 147;
  const conversionRate = totalParticipants > 0 
    ? parseFloat(((totalLeads / totalParticipants) * 100).toFixed(1)) 
    : 0;

  // Age group demographics calculation
  const ageGroupCounts = {
    "18-25 ans": 0,
    "26-35 ans": 0,
    "36-45 ans": 0,
    "46-55 ans": 0,
    "56 ans et plus": 0
  };

  regionFilteredLeads.forEach(lead => {
    const ageRange = lead.answers?.ageRange || lead.age_range;
    if (ageRange && ageGroupCounts[ageRange] !== undefined) {
      ageGroupCounts[ageRange]++;
    } else {
      const age = lead.age;
      if (age >= 18 && age <= 25) ageGroupCounts["18-25 ans"]++;
      else if (age >= 26 && age <= 35) ageGroupCounts["26-35 ans"]++;
      else if (age >= 36 && age <= 45) ageGroupCounts["36-45 ans"]++;
      else if (age >= 46 && age <= 55) ageGroupCounts["46-55 ans"]++;
      else if (age >= 56) ageGroupCounts["56 ans et plus"]++;
    }
  });

  const ageChartData = Object.keys(ageGroupCounts).map(key => ({
    name: key.replace(" ans", "").replace(" et plus", "+"),
    "Leads Qualifiés": ageGroupCounts[key],
    "Participants": Math.round(ageGroupCounts[key] * 1.5) + 3
  }));

  // Prizes won breakdown
  const prizeCounts: { [key: string]: number } = {};
  regionFilteredLeads.forEach(lead => {
    const gift = lead.gift_won || lead.giftWon || (lead.answers && lead.answers.giftWon);
    if (gift) {
      prizeCounts[gift] = (prizeCounts[gift] || 0) + 1;
    }
  });

  const prizeChartData = Object.keys(prizeCounts).length > 0 
    ? Object.keys(prizeCounts).map(name => ({ name, value: prizeCounts[name] }))
    : [
        { name: "Casquette CIMR 🧢", value: Math.max(1, Math.round(totalLeads * 0.3)) },
        { name: "Sac CIMR 🛍️", value: Math.max(1, Math.round(totalLeads * 0.25)) },
        { name: "Goodie CIMR 🎁", value: Math.max(1, Math.round(totalLeads * 0.2)) },
        { name: "Participation tirage au sort 🎟️", value: Math.max(1, Math.round(totalLeads * 0.15)) },
        { name: "Cadeau surprise 🌟", value: Math.max(1, Math.round(totalLeads * 0.1)) }
      ];

  const COLORS = ["#1F3566", "#163A8A", "#7CB342", "#689F38", "#E5A93C", "#F43F5E"];

  // Activity Feed Generator based on leads
  const recentActivities = regionFilteredLeads.slice(0, 4).map((lead, idx) => {
    const city = lead.city || "Casablanca";
    const name = `${lead.first_name || lead.firstName || "Visiteur"} ${lead.last_name || lead.lastName || ""}`;
    const gift = lead.gift_won || lead.giftWon || "Pins & Goodies 🎁";
    const score = lead.score || 55;
    
    let timeLabel = "À l'instant";
    if (idx === 1) timeLabel = "Il y a 10 min";
    if (idx === 2) timeLabel = "Il y a 1 h";
    if (idx === 3) timeLabel = "Il y a 3 h";

    return {
      id: lead.id || idx,
      name,
      city,
      gift,
      score,
      time: timeLabel,
      type: idx % 2 === 0 ? "lead" : "prize"
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="dashboard-overview">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-4">
          <CIMRLogo showText={false} className="h-12 w-auto hidden sm:block shrink-0" />
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1F3566]">Tableau de Bord Exécutif</h2>
            <p className="text-sm text-slate-500">
              Analyse des performances du Roadshow CIMR National, des bornes agences et du suivi territorial.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-xs font-medium text-slate-600 self-start md:self-auto">
          <Clock className="w-4 h-4 text-[#5D9B2F] animate-pulse" />
          <span>Dernière synchronisation : En direct</span>
        </div>
      </div>

      {user && user.role === "admin_regional" && (
        <div className="bg-[#1F3566]/5 border border-[#1F3566]/20 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-[#1F3566] shadow-xs">
          <ShieldAlert className="w-4.5 h-4.5 text-[#7CB342] shrink-0" />
          <span>
            <strong>Données Filtrées :</strong> Session d'accès restreint pour <strong>{user.name}</strong>. Les indicateurs et dossiers affichés sont limités à l'escale : <strong className="text-[#7CB342]">{user.region}</strong>.
          </span>
        </div>
      )}

      {/* Campaign Objectives Progression Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#1F3566]" />
            <div>
              <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider">Progression des Objectifs Globaux</h3>
              <p className="text-[11px] text-slate-400">Objectifs cumulés du plan d'activation Grand Casablanca.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#7CB342] bg-[#7CB342]/10 px-2.5 py-0.5 rounded-full">
              Objectifs CIMR 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Objectif 1: Participants */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 flex items-center gap-1">👥 Participants Sensibilisés (Borne)</span>
              <span className="text-[#1F3566]">{campaignParticipants.toLocaleString()} / 50 000 ({participantsProgress}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#1F3566] to-[#163A8A] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, participantsProgress)}%` }}
              />
            </div>
          </div>

          {/* Objectif 2: Leads */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 flex items-center gap-1">📈 Leads Qualifiés Enregistrés</span>
              <span className="text-[#7CB342]">{campaignLeads.toLocaleString()} / 5 000 ({leadsProgress}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#7CB342] to-[#689F38] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, leadsProgress)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1F3566] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Engagements Totaux</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#1F3566]">{loading ? "..." : campaignParticipants.toLocaleString()}</span>
              <span className="text-[10px] font-semibold text-[#7CB342] bg-emerald-50 px-1.5 py-0.5 rounded">
                +14.2%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Débuts d'expérience cumulés</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-[#7CB342] shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Leads Générés (CRM)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#1F3566]">{loading ? "..." : campaignLeads.toLocaleString()}</span>
              <span className="text-[10px] font-semibold text-[#7CB342] bg-emerald-50 px-1.5 py-0.5 rounded">
                +8.7%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Bilan retraite et leads validés</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-[#7CB342] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Pôle Leader Casablanca</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-[#1F3566] truncate max-w-[130px]" title={topZone?.name}>
                {topZone?.name.split(" ")[1] || "Tertiaire"}
              </span>
              <span className="text-[10px] font-semibold text-[#163A8A] bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                ⭐ {topZone?.leads} L
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Volume d'acquisition maximal</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition hover:shadow-md">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Zones d'Activation</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#1F3566]">5 Pôles</span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                G. Casa
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block truncate">Finance, Tertiaire, Ind. Nord...</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CASABLANCA MAP & ZONES PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive SVG Map */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#1F3566]" />
              <div>
                <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider">Zones d'Activation CIMR</h3>
                <p className="text-xs text-slate-500">Carte interactive territoriale de Casablanca avec géolocalisation des pôles.</p>
              </div>
            </div>

            {/* Map Mode selectors */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode("standard")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  viewMode === "standard" ? "bg-[#1F3566] text-white shadow-sm" : "text-slate-500 hover:text-[#1F3566]"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === "heatmap" ? "bg-[#7CB342] text-white shadow-sm" : "text-slate-500 hover:text-[#7CB342]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Heatmap
              </button>
            </div>
          </div>

          {/* Interactive Map Visual Stage */}
          <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner h-[320px] flex flex-col justify-between">
            {/* Grid & Map vector assets */}
            <div className="absolute inset-0 z-0 opacity-45 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="oceanGlow" cx="30%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#1F3566" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#050A18" stopOpacity="0" />
                  </radialGradient>
                </defs>
                
                {/* Visual Grid lines */}
                <path d="M 0,20 L 100,20 M 0,40 L 100,40 M 0,60 L 100,60 M 0,80 L 100,80 M 20,0 L 20,100 M 40,0 L 40,100 M 60,0 L 60,100 M 80,0 L 80,100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
                
                {/* Coastline Ocean glow */}
                <rect x="0" y="0" width="100" height="100" fill="url(#oceanGlow)" />
                <path d="M 0,22 Q 25,35 60,37 T 100,38 L 100,0 L 0,0 Z" fill="rgba(31,53,102,0.12)" />

                {/* Main Boulevard / Highway Vectors */}
                <path d="M 5,100 L 32,45 L 85,0" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M 0,55 L 28,34 L 100,44" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeDasharray="2,2" />
                <path d="M 38,58 Q 50,70 82,100" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
              </svg>
              <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-800 text-[9px] font-mono text-slate-400 px-2 py-0.5 rounded uppercase tracking-wider">
                Océan Atlantique 🌊
              </div>
            </div>

            {/* Heatmap blur halos overlay */}
            {viewMode === "heatmap" && (
              <div className="absolute inset-0 pointer-events-none z-0">
                {computedZones.map((zone) => {
                  const relativeActivity = zone.participants / 17000;
                  const heatScale = Math.max(0.7, Math.min(2.2, relativeActivity));
                  return (
                    <div
                      key={`heat-${zone.id}`}
                      className="absolute w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full filter blur-2xl opacity-40 animate-pulse transition-all duration-700"
                      style={{
                        left: `${zone.mapX}%`,
                        top: `${zone.mapY}%`,
                        backgroundColor: zone.color,
                        transform: `translate(-50%, -50%) scale(${heatScale})`,
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Interactive Markers Layer */}
            <div className="absolute inset-0 z-10">
              {computedZones.map((zone) => {
                const isSelected = activeZoneId === zone.id;
                return (
                  <button
                    key={`marker-${zone.id}`}
                    onClick={() => setActiveZoneId(isSelected ? null : zone.id)}
                    className="absolute group transition-transform hover:scale-125 active:scale-95 focus:outline-none -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ left: `${zone.mapX}%`, top: `${zone.mapY}%` }}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Active Ring Glow */}
                      <div 
                        className="absolute w-7 h-7 rounded-full opacity-30 animate-ping"
                        style={{ backgroundColor: zone.color }}
                      />
                      {/* Outer marker ring */}
                      <div 
                        className={`w-5 h-5 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all ${
                          isSelected ? "scale-125 ring-4 ring-white/25" : ""
                        }`}
                        style={{ backgroundColor: zone.color }}
                      >
                        <span className="text-[8px] font-bold text-white leading-none">
                          {zone.id}
                        </span>
                      </div>
                      
                      {/* Hover Tooltip label */}
                      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white text-[9px] font-bold py-1 px-2 rounded-md shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {zone.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Zone HUD Overlay card */}
            <div className="z-20 mt-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl m-2 transition-all">
              {activeZoneId ? (
                (() => {
                  const z = computedZones.find(x => x.id === activeZoneId)!;
                  return (
                    <div className="flex flex-col gap-1 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wide">{z.name}</h4>
                        </div>
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#7CB342] bg-[#7CB342]/10 px-2 py-0.5 rounded-full">
                          Statut : Actif
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center pt-2 mt-1 border-t border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-mono text-slate-500 uppercase">Participants</span>
                          <span className="text-xs font-black text-white">{z.participants.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-mono text-slate-500 uppercase">Leads Qualifiés</span>
                          <span className="text-xs font-black text-white">{z.leads.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-mono text-slate-500 uppercase">Conv. Rate</span>
                          <span className="text-xs font-black text-[#7CB342]">{z.conversionRate}%</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-2 flex justify-between pt-1 border-t border-slate-800/40">
                        <span>📍 Localisation : {z.locations.join(", ")}</span>
                        <span className="italic font-mono text-[8px]">{z.type}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#7CB342]" />
                  <span>Sélectionnez un pôle interactif (1-5) pour afficher l'analyse territoriale CIMR.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Casablanca Zones stats table */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider">Pôles Métropolitains</h3>
              <span className="text-[9px] font-mono font-bold bg-[#1F3566]/10 text-[#1F3566] px-2 py-0.5 rounded-full uppercase">
                Grand Casablanca
              </span>
            </div>
            <p className="text-xs text-slate-500">Statistiques territoriales cumulées (bases historiques et temps réel borne).</p>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {computedZones.map((z) => {
              const isSelected = activeZoneId === z.id;
              const isTop = z.id === topZone?.id;
              return (
                <button
                  key={z.id}
                  onClick={() => setActiveZoneId(isSelected ? null : z.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected 
                      ? "bg-[#1F3566]/5 border-[#1F3566] shadow-sm" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0" 
                      style={{ backgroundColor: z.color }}
                    >
                      {z.id}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#1F3566] truncate">{z.name}</span>
                        {isTop && (
                          <span className="text-[7px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded flex items-center gap-0.5 shrink-0 uppercase tracking-widest">
                            ⭐ Leader
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 truncate block">📍 {z.locations.join(", ")}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div className="text-xs font-black text-[#1F3566]">{z.leads.toLocaleString()} L</div>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">{z.participants.toLocaleString()} part.</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Top Performer summary section */}
          <div className="bg-[#1F3566]/5 rounded-xl p-3 flex items-center justify-between text-xs border border-[#1F3566]/10">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <div>
                <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">Pôle le plus performant</span>
                <span className="font-bold text-[#1F3566]">{topZone?.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#7CB342] bg-[#7CB342]/10 px-2 py-1 rounded-lg block">
                {topZone?.leads.toLocaleString()} Leads
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Chart: Age demographics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider">Répartition Démographique des Prospects</h3>
            <p className="text-xs text-slate-500">Comparatif entre participants (début d'expérience) et leads qualifiés par tranche d'âge.</p>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Participants" fill="#163A8A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Leads Qualifiés" fill="#7CB342" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Prizes Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider">Récompenses Distribuées (Roue)</h3>
            <p className="text-xs text-slate-500">Répartition des lots et cadeaux gagnés par les participants sur les bornes.</p>
          </div>
          <div className="h-64 mt-4 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prizeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {prizeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#1F3566]">{totalLeads}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Gagnants</span>
            </div>
          </div>
          {/* Custom legend */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
            {prizeChartData.slice(0, 4).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate text-slate-600 font-medium" title={entry.name}>{entry.name}</span>
                <span className="text-slate-400">({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Quick Simulation & Live Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Simulator CTA Card */}
        <div className="bg-gradient-to-br from-[#1F3566] to-[#163A8A] text-white p-6 rounded-2xl shadow-md lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[9px] font-semibold text-[#7CB342] bg-[#7CB342]/10 border border-[#7CB342]/20 px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">
              Expérience Interactive
            </span>
            <h4 className="text-lg font-bold font-display uppercase tracking-wide leading-tight">
              Testez la Borne Interactive "Future Mirror"
            </h4>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Vivez l'expérience immersive client en direct ! Prenez un selfie, découvrez votre projection à 65 ans par IA, faites le questionnaire et gagnez un cadeau. 
            </p>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigateToTab("kiosk")}
              className="w-full bg-[#7CB342] hover:bg-[#689F38] active:scale-95 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition text-xs tracking-widest uppercase cursor-pointer"
            >
              Lancer le Simulateur 📱
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Event Ticker Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1F3566] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Flux d'Activité en Direct
            </h3>
            <p className="text-xs text-slate-500">Dernières interactions enregistrées sur les bornes d'exposition du Roadshow.</p>
          </div>

          <div className="mt-4 space-y-3.5">
            {recentActivities.length > 0 ? (
              recentActivities.map((act, index) => (
                <div key={index} className="flex items-start justify-between gap-4 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      act.type === "lead" 
                        ? "bg-emerald-50 text-[#7CB342]" 
                        : "bg-blue-50 text-[#1F3566]"
                    }`}>
                      {act.type === "lead" ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1F3566] truncate">{act.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {act.type === "lead" 
                          ? `A validé son bilan de préparation retraite (Score : ${act.score}%)`
                          : `A fait tourner la Roue et remporté : ${act.gift}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block">{act.time}</span>
                    <span className="text-[10px] text-[#7CB342] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded block mt-1 w-fit ml-auto">
                      {act.city}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Aucune activité enregistrée pour le moment.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
