import React, { useState } from "react";
import { 
  MapPin, Calendar, Users, Target, Landmark, Plus, CheckCircle, Play, AlertTriangle, X, Award, ChevronRight
} from "lucide-react";

interface StopItem {
  id: string;
  zoneId?: number; // Optional for custom added areas
  city: string; // Used for the Name of the Zone/Pôle
  location: string;
  dates: string;
  status: "completed" | "active" | "scheduled";
  baseParticipants: number;
  baseLeads: number;
  participants: number; // local state backup/fallback
  leads: number; // local state backup/fallback
  targetLeads: number;
  staff: number;
}

interface RoadshowTrackerProps {
  dbStatus: any;
  leads?: any[];
  onSimulateActivity: (location?: string) => Promise<void>;
}

export default function RoadshowTracker({ dbStatus, leads = [], onSimulateActivity }: RoadshowTrackerProps) {
  // Local list of stops focusing exclusively on Casablanca Zones
  const [stops, setStops] = useState<StopItem[]>([
    {
      id: "zone-1",
      zoneId: 1,
      city: "Pôle Finance & Services",
      location: "Casa Finance City / Casanearshore",
      dates: "12 Juin - 18 Juin 2026",
      status: "completed",
      baseParticipants: 14500,
      baseLeads: 1620,
      participants: 0,
      leads: 0,
      targetLeads: 2000,
      staff: 6
    },
    {
      id: "zone-2",
      zoneId: 2,
      city: "Pôle Tertiaire & Bureaux",
      location: "Zerktouni / Anfa / Racine / Gauthier",
      dates: "19 Juin - 25 Juin 2026",
      status: "active",
      baseParticipants: 16800,
      baseLeads: 1840,
      participants: 0,
      leads: 0,
      targetLeads: 2200,
      staff: 8
    },
    {
      id: "zone-3",
      zoneId: 3,
      city: "Pôle Industriel Nord",
      location: "Ain Sebaa / Zenata",
      dates: "28 Juin - 02 Juillet 2026",
      status: "scheduled",
      baseParticipants: 9500,
      baseLeads: 780,
      participants: 0,
      leads: 0,
      targetLeads: 1000,
      staff: 5
    },
    {
      id: "zone-4",
      zoneId: 4,
      city: "Pôle Industriel Est",
      location: "Berrechid",
      dates: "05 Juillet - 09 Juillet 2026",
      status: "scheduled",
      baseParticipants: 4200,
      baseLeads: 310,
      participants: 0,
      leads: 0,
      targetLeads: 500,
      staff: 4
    },
    {
      id: "zone-5",
      zoneId: 5,
      city: "Pôle Industriel Sud",
      location: "Bouskoura Zone Industrielle",
      dates: "15 Juillet - 19 Juillet 2026",
      status: "scheduled",
      baseParticipants: 5000,
      baseLeads: 450,
      participants: 0,
      leads: 0,
      targetLeads: 600,
      staff: 4
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newDates, setNewDates] = useState("");
  const [newTarget, setNewTarget] = useState("40");
  const [newStaff, setNewStaff] = useState("4");
  const [isSimulating, setIsSimulating] = useState(false);

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

  // Add stop logic (custom zone in Casablanca)
  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity || !newLoc || !newDates) return;

    const stop: StopItem = {
      id: "custom-" + newCity.toLowerCase().replace(/\s+/g, "-"),
      city: newCity,
      location: newLoc,
      dates: newDates,
      status: "scheduled",
      baseParticipants: 0,
      baseLeads: 0,
      participants: 0,
      leads: 0,
      targetLeads: parseInt(newTarget) || 100,
      staff: parseInt(newStaff) || 4
    };

    setStops([...stops, stop]);
    setNewCity("");
    setNewLoc("");
    setNewDates("");
    setShowAddForm(false);
  };

  // Trigger traffic simulation
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    try {
      // Find the active zone location or default
      const activeStop = stops.find(s => s.status === "active");
      const activeLocation = activeStop ? activeStop.location.split("/")[0].trim() : "Zerktouni";
      
      await onSimulateActivity(activeLocation);
    } catch (e) {
      console.warn("Simulation failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const serverZoneParticipants = dbStatus?.zoneStats?.participants || {};

  // Compute stats dynamically by merging base database stats with current state
  const computedStops = stops.map(s => {
    if (s.zoneId) {
      const extraParticipants = serverZoneParticipants[s.zoneId] || 0;
      const extraLeads = leads.filter(lead => {
        const city = lead.city || lead.answers?.city || "";
        return getZoneIdFromCity(city) === s.zoneId;
      }).length;

      return {
        ...s,
        participants: s.baseParticipants + extraParticipants,
        leads: s.baseLeads + extraLeads
      };
    }
    return s;
  });

  return (
    <div className="space-y-6" id="roadshow-tracker">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F3566]">Suivi du Déploiement Casablanca</h2>
          <p className="text-sm text-slate-500">
            Supervisez l'activation physique de la borne interactive à travers les pôles et quartiers de Grand Casablanca.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerSimulation}
            disabled={isSimulating}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-[#1F3566] px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 text-[#7CB342] ${isSimulating ? "animate-ping" : ""}`} />
            {isSimulating ? "Simulation en cours..." : "Simuler un passage Borne"}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Planifier une zone
          </button>
        </div>
      </div>

      {/* Casablanca Activation Banner */}
      <div className="bg-[#1F3566] text-white rounded-2xl p-6 shadow-md border border-[#163A8A]/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-[#7CB342]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[10px] font-bold text-[#7CB342] bg-[#7CB342]/15 border border-[#7CB342]/20 px-2.5 py-1 rounded uppercase tracking-wider inline-block">
              Visualisation Métropolitaine
            </span>
            <h3 className="text-lg font-bold font-display uppercase tracking-wide leading-snug">
              Expérience CIMR Future Me : Activation Grand Casablanca 2026
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed max-w-xl">
              Le dispositif d'activation de la borne "Future Mirror" cible de manière exclusive les grands pôles tertiaires, industriels et d'affaires de Casablanca à la rencontre des salariés et actifs pour faire leur bilan retraite instantané.
            </p>
            {/* Active Stop Mini Status */}
            <div className="pt-2 flex items-center gap-3">
              <span className="w-3 h-3 bg-[#7CB342] rounded-full animate-ping shrink-0" />
              <div className="text-xs">
                <span className="text-slate-300">Pôle Actuel : </span>
                <span className="font-bold text-white">Pôle Tertiaire & Bureaux (Zerktouni / Anfa / Gauthier - 8 animateurs)</span>
              </div>
            </div>
          </div>

          {/* Casablanca Coordination representation */}
          <div className="lg:col-span-5 bg-black/25 rounded-xl p-4 border border-white/5 space-y-2">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block mb-2">Coordination du Dispositif</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Dispositif</span>
                <span className="text-white font-semibold">1 Stand + 4 Bornes IA</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Collecte RGPD</span>
                <span className="text-white font-semibold">Validation CNDP N°98</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Objectif global</span>
                <span className="text-[#7CB342] font-bold">5 000 leads qualifiés</span>
              </div>
              <div className="bg-white/5 p-2 rounded border border-white/5">
                <span className="text-slate-400 block text-[9px] uppercase font-mono">Satisfaction</span>
                <span className="text-[#7CB342] font-bold">96.4% Recommandé</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stops cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {computedStops.map((s) => {
          const isCompleted = s.status === "completed";
          const isActive = s.status === "active";
          const percent = s.targetLeads > 0 ? Math.min(100, Math.round((s.leads / s.targetLeads) * 100)) : 0;
          
          return (
            <div 
              key={s.id} 
              className={`bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                isActive ? "border-blue-200 ring-2 ring-[#1F3566]/5" : "border-slate-100"
              }`}
            >
              {/* Highlight ribbon */}
              {isActive && (
                <div className="absolute top-0 right-0 bg-[#7CB342] text-white text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl tracking-wider uppercase animate-pulse">
                  PÔLE ACTIF
                </div>
              )}
              {isCompleted && (
                <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold font-mono px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  COMPLÉTÉ
                </div>
              )}

              {/* Card top */}
              <div>
                <div className="flex items-start gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                    isActive ? "bg-blue-50 text-[#163A8A]" : isCompleted ? "bg-slate-50 text-slate-400" : "bg-emerald-50 text-[#7CB342]"
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F3566]">{s.city}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{s.location}</p>
                  </div>
                </div>

                {/* Date & staff */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.dates}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.staff} Animateurs</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 block">Participants</span>
                    <span className="text-sm font-bold text-slate-700">{s.participants.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-slate-400 block">Leads Collectés</span>
                    <span className="text-sm font-bold text-slate-700">
                      {s.leads.toLocaleString()} <span className="text-slate-400 font-normal">/ {s.targetLeads}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <span>Objectif Pôle</span>
                  <span className={`font-bold ${percent >= 100 ? "text-[#7CB342]" : "text-[#1F3566]"}`}>
                    {percent}% atteint
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percent >= 100 ? "bg-[#7CB342]" : "bg-[#163A8A]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Plan New Stop Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-[#1F3566] rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F3566] text-lg">Planifier un nouveau pôle</h3>
                <p className="text-xs text-slate-500">Ajoutez une zone ou quartier d'activation dans Casablanca.</p>
              </div>
            </div>

            <form onSubmit={handleAddStop} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom du Pôle / Quartier</label>
                <input
                  type="text"
                  required
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Ex: Pôle Maârif, Zone Sidi Maârouf"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Lieux & Boulevard</label>
                <input
                  type="text"
                  required
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  placeholder="Ex: Boulevard d'Anfa, Nearshore Park"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Dates d'activation</label>
                <input
                  type="text"
                  required
                  value={newDates}
                  onChange={(e) => setNewDates(e.target.value)}
                  placeholder="Ex: 24 Juillet - 28 Juillet 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Objectif de Leads</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Animateurs affectés</label>
                  <input
                    type="number"
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#1F3566] hover:bg-[#163A8A] text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  Enregistrer l'activation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
