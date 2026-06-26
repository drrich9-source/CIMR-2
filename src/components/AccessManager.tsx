import React, { useState } from "react";
import { 
  Shield, Users, Plus, CheckCircle2, Check, Lock, Eye, ArrowRight, UserPlus, Trash2, Key, Info, MapPin
} from "lucide-react";

export interface AccessProfile {
  id: string;
  name: string;
  roleType: "admin" | "animateur";
  allowedTabs: ("overview" | "roadshow" | "crm" | "kiosk" | "access")[];
  description: string;
  assignedLocation?: string;
  isDefault?: boolean;
  password?: string;
}

interface AccessManagerProps {
  profiles: AccessProfile[];
  activeProfile: AccessProfile;
  onSelectProfile: (profile: AccessProfile) => void;
  onAddProfile: (profile: AccessProfile) => void;
  onDeleteProfile: (id: string) => void;
}

const AVAILABLE_TABS = [
  { id: "overview", name: "Vue d'ensemble", icon: "📊", desc: "Statistiques, graphiques et conversion" },
  { id: "roadshow", name: "Suivi Roadshow", icon: "📍", desc: "Cartographie et suivi des pôles" },
  { id: "crm", name: "Console CRM", icon: "👤", desc: "Liste et export des leads qualifiés" },
  { id: "kiosk", name: "Simulateur Borne", icon: "🖥️", desc: "Interface interactive de diagnostic" },
  { id: "access", name: "Gestion des Accès", icon: "🛡️", desc: "Configuration des profils et autorisations de l'application" }
] as const;

export default function AccessManager({ 
  profiles, 
  activeProfile, 
  onSelectProfile, 
  onAddProfile, 
  onDeleteProfile 
}: AccessManagerProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [roleType, setRoleType] = useState<"admin" | "animateur">("animateur");
  const [allowedTabs, setAllowedTabs] = useState<("overview" | "roadshow" | "crm" | "kiosk" | "access")[]>(["kiosk"]);
  const [description, setDescription] = useState("");
  const [assignedLocation, setAssignedLocation] = useState("Casa Finance City");
  const [formPassword, setFormPassword] = useState("animateur");
  const [errorMessage, setErrorMessage] = useState("");

  const handleTabToggle = (tabId: "overview" | "roadshow" | "crm" | "kiosk" | "access") => {
    if (allowedTabs.includes(tabId)) {
      if (allowedTabs.length === 1) return;
      setAllowedTabs(allowedTabs.filter(t => t !== tabId));
    } else {
      setAllowedTabs([...allowedTabs, tabId]);
    }
  };

  const handleRoleTypeChange = (type: "admin" | "animateur") => {
    setRoleType(type);
    if (type === "animateur") {
      setAllowedTabs(["kiosk"]);
      if (formPassword === "admin") {
        setFormPassword("animateur");
      }
    } else {
      setAllowedTabs(["overview", "roadshow", "crm", "kiosk", "access"]);
      if (formPassword === "animateur") {
        setFormPassword("admin");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Veuillez saisir un nom pour ce profil d'accès.");
      return;
    }

    if (!formPassword.trim()) {
      setErrorMessage("Veuillez saisir un mot de passe pour ce profil d'accès.");
      return;
    }

    if (allowedTabs.length === 0) {
      setErrorMessage("Veuillez autoriser au moins un écran pour ce profil.");
      return;
    }

    const newProfile: AccessProfile = {
      id: "profile-" + Date.now(),
      name: name.trim(),
      roleType,
      allowedTabs,
      description: description.trim() || (roleType === "admin" ? "Profil Administrateur personnalisé" : "Profil Animateur de borne"),
      assignedLocation: roleType === "animateur" ? assignedLocation : undefined,
      isDefault: false,
      password: formPassword.trim()
    };

    onAddProfile(newProfile);
    
    // Reset form
    setName("");
    setRoleType("animateur");
    setAllowedTabs(["kiosk"]);
    setDescription("");
    setAssignedLocation("Casa Finance City");
    setFormPassword("animateur");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="access-manager-section">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1F3566]">Gestion des Rôles & Accès</h2>
        <p className="text-sm text-slate-500 mt-1">
          Définissez les profils d'accès de l'application. Les animateurs sur site accèdent uniquement au simulateur de borne, tandis que les administrateurs supervisent les données globales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List of profiles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F3566] uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7CB342]" />
              Profils Utilisateurs Existants ({profiles.length})
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nouveau Profil
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {profiles.map((profile) => {
              const isActive = activeProfile.id === profile.id;
              
              return (
                <div 
                  key={profile.id} 
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isActive 
                      ? "border-[#1F3566] ring-2 ring-[#1F3566]/5 shadow-md" 
                      : "border-slate-100 hover:border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-[#1F3566]">{profile.name}</h4>
                        
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          profile.roleType === "admin" 
                            ? "bg-blue-100 text-[#163A8A] border border-blue-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {profile.roleType === "admin" ? "Administrateur" : "Animateur Borne"}
                        </span>

                        {profile.isDefault && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Par défaut
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-500 max-w-xl">{profile.description}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {profile.assignedLocation && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Pôle : {profile.assignedLocation}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium text-[#1F3566] bg-[#1F3566]/5 border border-[#1F3566]/10 px-2.5 py-1 rounded-lg">
                          <Key className="w-3.5 h-3.5 text-[#1F3566]" />
                          <span>Mot de passe : <strong className="text-[#1F3566] font-bold">{profile.password || (profile.roleType === "admin" ? "admin" : "animateur")}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectProfile(profile)}
                          className="bg-[#7CB342] hover:bg-[#689F38] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          Tester ce rôle
                        </button>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#7CB342]" />
                          Actif
                        </span>
                      )}

                      {!profile.isDefault && (
                        <button
                          onClick={() => onDeleteProfile(profile.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          title="Supprimer ce profil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions indicators */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[9px] uppercase font-mono text-slate-400 block mb-2 font-bold tracking-wider">Écrans & Accès autorisés</span>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TABS.map((tab) => {
                        const hasAccess = profile.allowedTabs.includes(tab.id);
                        return (
                          <div 
                            key={tab.id}
                            className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium border ${
                              hasAccess 
                                ? "bg-slate-50 text-slate-700 border-slate-200" 
                                : "bg-slate-50/30 text-slate-300 border-slate-100 line-through"
                            }`}
                          >
                            <span className={hasAccess ? "" : "grayscale"}>{tab.icon}</span>
                            <span>{tab.name}</span>
                            {hasAccess ? (
                              <Check className="w-3 h-3 text-[#7CB342]" />
                            ) : (
                              <Lock className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Form or info info */}
        <div>
          {showAddForm ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md space-y-5 animate-in fade-in slide-in-from-right duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#1F3566]" />
                  <h3 className="font-bold text-[#1F3566]">Nouveau Profil</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom du Profil / Rôle</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Animateur Casanearshore, Superviseur"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Courte description de ce rôle..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A] h-16 resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#1F3566]" />
                    Mot de passe requis
                  </label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mot de passe pour ce rôle"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Ce mot de passe sera demandé pour se connecter ou changer vers ce rôle.</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Niveau d'Autorité</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleRoleTypeChange("animateur")}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        roleType === "animateur" 
                          ? "bg-amber-50 text-amber-800 border-amber-300" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Animateur Borne
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleTypeChange("admin")}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        roleType === "admin" 
                          ? "bg-blue-50 text-[#163A8A] border-blue-300" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Administrateur
                    </button>
                  </div>
                </div>

                {roleType === "animateur" && (
                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Zone / Pôle Affecté</label>
                    <select
                      value={assignedLocation}
                      onChange={(e) => setAssignedLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A] cursor-pointer"
                    >
                      <option value="Casa Finance City">Casa Finance City</option>
                      <option value="Casanearshore">Casanearshore</option>
                      <option value="Zerktouni">Zerktouni</option>
                      <option value="Anfa">Anfa</option>
                      <option value="Gauthier">Gauthier</option>
                      <option value="Ain Sebaa">Ain Sebaa</option>
                      <option value="Berrechid">Berrechid</option>
                      <option value="Bouskoura Zone Industrielle">Bouskoura Z.I.</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Écrans Autorisés</label>
                  <p className="text-[10px] text-slate-400 mb-2">Sélectionnez les parties de l'application accessibles par ce profil.</p>
                  
                  <div className="space-y-2">
                    {AVAILABLE_TABS.map((tab) => {
                      const isChecked = allowedTabs.includes(tab.id);
                      return (
                        <label 
                          key={tab.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                            isChecked 
                              ? "bg-slate-50 border-slate-200" 
                              : "bg-white border-slate-100 hover:border-slate-200 opacity-60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTabToggle(tab.id)}
                            className="mt-0.5 accent-[#1F3566]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <span>{tab.icon}</span>
                              <span>{tab.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block">{tab.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  Enregistrer ce Profil
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 text-slate-600 space-y-4">
              <div className="w-10 h-10 bg-blue-100/50 text-[#1F3566] rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#1F3566]" />
              </div>
              <h3 className="font-bold text-sm text-[#1F3566] uppercase tracking-wider font-mono">Politique d'Accès CIMR</h3>
              <div className="text-xs space-y-2.5 leading-relaxed text-slate-500">
                <p>
                  Afin de garantir la conformité <strong>RGPD</strong> et les directives de la <strong>CNDP</strong>, les animateurs sur le terrain ont un périmètre d'accès strictement limité.
                </p>
                <p className="bg-white p-3 rounded-xl border border-slate-100 font-medium text-[#1F3566]">
                  💡 <strong>Principe de moindre privilège :</strong> Un animateur sur site ne peut en aucun cas visualiser la base de données globale ou exporter des listes de clients.
                </p>
                <p>
                  Sélectionnez un rôle "Animateur" pour simuler l'application telle qu'elle s'affiche sur la tablette physique de la borne interactive.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
