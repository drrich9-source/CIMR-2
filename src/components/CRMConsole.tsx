import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { 
  Search, Filter, FileSpreadsheet, Eye, Trash2, X, Calendar, User, Phone, Mail, Award, ArrowRight, RefreshCw, Briefcase, ChevronRight, ShieldAlert, Printer, MailCheck, Download
} from "lucide-react";
import { CIMRLogo } from "./CIMRLogo";

interface CRMConsoleProps {
  leads: any[];
  onDeleteLead: (id: any) => Promise<void>;
  loading: boolean;
}

export default function CRMConsole({ leads, onDeleteLead, loading }: CRMConsoleProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<any | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [showPDFModal, setShowPDFModal] = useState<boolean>(false);

  // Filter leads based on user's region
  const baseLeads = React.useMemo(() => {
    if (!user || user.role === "admin_global" || user.role === "consultation") {
      return leads;
    }
    const region = user.region || "Casablanca";
    return leads.filter(lead => {
      const city = lead.city || lead.answers?.city || "Casablanca";
      return city.toLowerCase().includes(region.toLowerCase());
    });
  }, [leads, user]);

  // Filter leads
  const filteredLeads = baseLeads.filter(lead => {
    const name = `${lead.first_name || lead.firstName || ""} ${lead.last_name || lead.lastName || ""}`.toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const phone = (lead.phone || "").toLowerCase();
    const company = (lead.company || "").toLowerCase();
    
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          email.includes(searchTerm.toLowerCase()) || 
                          phone.includes(searchTerm.toLowerCase()) ||
                          company.includes(searchTerm.toLowerCase());
                          
    const leadCity = lead.city || "Casablanca";
    const matchesCity = cityFilter === "ALL" || 
                        leadCity.toUpperCase() === cityFilter.toUpperCase() ||
                        leadCity.toUpperCase().includes(cityFilter.toUpperCase());
    
    return matchesSearch && matchesCity;
  });

  // Client-side CSV generator
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = [
      "ID",
      "Prenom",
      "Nom",
      "Email",
      "Telephone",
      "Age",
      "Ville",
      "Entreprise",
      "Diagnostic Score (%)",
      "Categorie",
      "Cadeau Gagne",
      "Date de Creation"
    ];
    
    const rows = filteredLeads.map(lead => [
      lead.id,
      lead.first_name || lead.firstName || "",
      lead.last_name || lead.lastName || "",
      lead.email || "",
      lead.phone || "",
      lead.age || "",
      lead.city || "Casablanca",
      lead.company || "",
      lead.score || lead.percentageScore || 50,
      lead.category || "A_RENFORCER",
      lead.gift_won || lead.giftWon || "",
      lead.created_at || new Date().toISOString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cimr_leads_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: any) => {
    if (user?.role === "consultation") {
      alert("Action refusée : Les comptes d'accès 'Consultation' sont en lecture seule.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce prospect de la base de données ?")) return;
    setIsDeletingId(id);
    try {
      await onDeleteLead(id);
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(null);
      }
    } catch (e) {
      console.warn("Delete failed:", e);
    } finally {
      setIsDeletingId(null);
    }
  };

  // Convert categories to user friendly strings
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "BIEN_PREPARE":
        return <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-semibold text-[10px] tracking-wide border border-emerald-100 uppercase">PRÉPARÉ</span>;
      case "A_RENFORCER":
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold text-[10px] tracking-wide border border-amber-100 uppercase">À RENFORCER</span>;
      case "ACTION_RECOMMANDEE":
      default:
        return <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full font-semibold text-[10px] tracking-wide border border-rose-100 uppercase">ACTION REQUISE</span>;
    }
  };

  return (
    <div className="space-y-6 relative" id="crm-console">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1F3566]">Console Leads CRM</h2>
          <p className="text-sm text-slate-500">
            Consultez les bilans retraite individuels des participants du Roadshow et pilotez les actions marketing.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredLeads.length === 0}
          className="bg-[#7CB342] hover:bg-[#689F38] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition cursor-pointer self-start"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exporter CSV ({filteredLeads.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un prospect (Nom, email, téléphone, entreprise...)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#163A8A]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full md:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les escales</option>
            <option value="Casablanca">Casablanca (Tout)</option>
            <option value="Casa Finance City">└─ Casa Finance City</option>
            <option value="Casanearshore">└─ Casanearshore</option>
            <option value="Zerktouni">└─ Zerktouni</option>
            <option value="Anfa">└─ Anfa</option>
            <option value="Racine">└─ Racine</option>
            <option value="Gauthier">└─ Gauthier</option>
            <option value="Ain Sebaa">└─ Ain Sebaa</option>
            <option value="Zenata">└─ Zenata</option>
            <option value="Berrechid">└─ Berrechid</option>
            <option value="Bouskoura Zone Industrielle">└─ Bouskoura Z.I.</option>
            <option value="Rabat">Rabat</option>
            <option value="Marrakech">Marrakech</option>
            <option value="Tanger">Tanger</option>
            <option value="Agadir">Agadir</option>
          </select>
        </div>
      </div>

      {/* CRM Database Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 text-[#163A8A] animate-spin" />
            <p className="text-xs font-semibold font-mono uppercase tracking-widest text-[#163A8A]">Chargement de la base de données...</p>
          </div>
        ) : filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-4">Nom Complet</th>
                  <th className="px-5 py-4">Escale / Ville</th>
                  <th className="px-5 py-4">Entreprise</th>
                  <th className="px-5 py-4">Age</th>
                  <th className="px-5 py-4">Diagnostic Retraite</th>
                  <th className="px-5 py-4">Cadeau Gagné</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeads.map((lead) => {
                  const name = `${lead.first_name || lead.firstName || "Visiteur"} ${lead.last_name || lead.lastName || ""}`;
                  const score = lead.score || lead.percentageScore || 50;
                  const leadCity = lead.city || "Casablanca";
                  const dateStr = lead.created_at ? new Date(lead.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                  }) : "Récemment";

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50/50 transition duration-150 cursor-pointer ${
                        selectedLead?.id === lead.id ? "bg-blue-50/35" : ""
                      }`}
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* Name & Contact Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1F3566]">{name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{lead.email || "Non renseigné"}</div>
                      </td>
                      {/* City */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {leadCity}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 font-normal">{dateStr}</div>
                      </td>
                      {/* Enterprise */}
                      <td className="px-5 py-4 text-slate-600 truncate max-w-[120px]" title={lead.company}>
                        {lead.company || <span className="text-slate-300 italic">Non renseigné</span>}
                      </td>
                      {/* Age */}
                      <td className="px-5 py-4 font-bold text-slate-600 font-mono">{lead.age || "25"} ans</td>
                      {/* Diagnostic score */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1F3566] font-mono">{score}%</span>
                          {getCategoryBadge(lead.category)}
                        </div>
                      </td>
                      {/* Gift Won */}
                      <td className="px-5 py-4 text-slate-600 truncate max-w-[150px]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium" title={lead.gift_won || lead.giftWon}>
                          {lead.gift_won || lead.giftWon || "Aucun 🎁"}
                        </span>
                      </td>
                      {/* Action buttons */}
                      <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#163A8A] transition cursor-pointer"
                            title="Consulter"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(lead.id)}
                            disabled={isDeletingId === lead.id || user?.role === "consultation"}
                            className={`p-1.5 rounded-lg transition ${
                              user?.role === "consultation" 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            }`}
                            title={user?.role === "consultation" ? "Désactivé (Lecture Seule)" : "Supprimer"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun prospect trouvé correspondant aux filtres actifs.
          </div>
        )}
      </div>

      {/* Sliding Lead Detail Drawer Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col justify-between animate-in slide-in-from-right duration-250">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-100 text-[#1F3566] rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F3566]">Fiche Prospect Détallée</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Prospect ID N°{selectedLead.id}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Split Images Portrait Projection comparison */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-widest block">Simulation Portrait "+65 Ans"</span>
              <div className="flex gap-4 justify-center items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="text-center space-y-1">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img 
                      src={selectedLead.answers?.youngPhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"} 
                      alt="Young portrait" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Aujourd'hui</span>
                </div>
                <div className="text-center space-y-1">
                  <div className="w-28 h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img 
                      src={selectedLead.answers?.oldPhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80"} 
                      alt="Aged portrait" 
                      className="w-full h-full object-cover grayscale-[10%]"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Moi à 65 ans</span>
                </div>
              </div>
            </div>

            {/* Profile information */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-widest block border-b border-slate-100 pb-1">Coordonnées</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Nom complet</span>
                  <span className="font-bold text-[#1F3566]">{selectedLead.first_name || selectedLead.firstName || "Visiteur"} {selectedLead.last_name || selectedLead.lastName || ""}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Âge</span>
                  <span className="font-bold text-[#1F3566]">{selectedLead.age || "25"} ans</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Téléphone</span>
                  <span className="font-bold text-[#1F3566]">{selectedLead.phone || "Non renseigné"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">E-mail</span>
                  <span className="font-bold text-[#1F3566] truncate block">{selectedLead.email}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Ville d'enregistrement</span>
                  <span className="font-bold text-[#1F3566]">{selectedLead.city || "Casablanca"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Entreprise actuelle</span>
                  <span className="font-bold text-[#1F3566]">{selectedLead.company || "Non renseignée"}</span>
                </div>
              </div>
            </div>

            {/* Questionnaire answers details */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-widest block border-b border-slate-100 pb-1">Réponses au diagnostic</span>
              {selectedLead.answers ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">Tranche d'âge</span>
                    <span className="font-semibold text-[#1F3566]">{selectedLead.answers.ageRange || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">Situation Professionnelle</span>
                    <span className="font-semibold text-[#1F3566]">{selectedLead.answers.situationPro || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">Tranche de Salaire net</span>
                    <span className="font-semibold text-[#1F3566]">{selectedLead.answers.salaireRange || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">Connaissance du Système Retraite</span>
                    <span className="font-semibold text-[#1F3566]">{selectedLead.answers.connaissance || "Non renseigné"}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-slate-500 font-medium">Statut de l'Épargne retraite</span>
                    <span className="font-semibold text-[#1F3566]">{selectedLead.answers.epargneActuelle || "Non renseigné"}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic text-xs">Aucune réponse au questionnaire enregistrée.</div>
              )}
            </div>

            {/* Generated AI letter block */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-widest block border-b border-slate-100 pb-1">Lettre Conseils du "Futur Vous"</span>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-slate-700 italic leading-relaxed whitespace-pre-line font-mono select-all">
                {selectedLead.letter || "Aucune lettre générée."}
              </div>
            </div>

            {/* Actions Officielles CIMR (PDF & Email) */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-widest block border-b border-slate-100 pb-1">Communication & Exports Officiels</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowPDFModal(true)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center text-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-5 h-5 text-[#5D9B2F]" />
                  <span className="text-xs font-bold text-[#1F3566]">Générer l'export PDF</span>
                  <span className="text-[9px] text-slate-400">Bilan retraite certifié</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center text-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <MailCheck className="w-5 h-5 text-[#E7A11A]" />
                  <span className="text-xs font-bold text-[#1F3566]">Simuler l'Email auto</span>
                  <span className="text-[9px] text-slate-400">Envoi du rapport au prospect</span>
                </button>
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition cursor-pointer"
            >
              Fermer la fiche
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedLead.id)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl transition cursor-pointer"
            >
              Supprimer le prospect
            </button>
          </div>

        </div>
      )}

      {/* 1. SIMULATED EMAIL MODAL OVERLAY */}
      {showEmailModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Email Client Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 ml-2">Aperçu de l'Email Automatique</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Envelope Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 text-xs space-y-1.5 text-left">
              <div><span className="text-slate-400 font-medium">De :</span> <strong className="text-slate-700">no-reply@cimr.ma</strong> (CIMR Al Moustaqbal)</div>
              <div><span className="text-slate-400 font-medium">À :</span> <strong className="text-slate-700">{selectedLead.email}</strong></div>
              <div><span className="text-slate-400 font-medium">Sujet :</span> <strong className="text-[#1F3566]">Votre simulation interactive "Future Me by CIMR"</strong></div>
            </div>

            {/* Simulated Email Body */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto p-6 space-y-6 text-left">
                
                {/* Email Header - CIMR Official Logo inside email */}
                <div className="text-center pb-4 border-b border-slate-100">
                  <CIMRLogo showText={true} className="h-14 mx-auto" />
                  <span className="text-[10px] font-bold text-[#5D9B2F] tracking-widest block mt-2">AL MOUSTAQBAL RETRAITE</span>
                </div>

                {/* Email Content */}
                <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                  <p>Cher(e) <strong>{selectedLead.first_name || selectedLead.firstName || "Cher Partenaire"}</strong>,</p>
                  <p>
                    Merci d'avoir participé à l'expérience interactive <strong>"Future Me by CIMR"</strong> lors de notre Roadshow.
                  </p>
                  
                  {/* Results box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score d'Épargne Retraite</span>
                      <span className="text-sm font-black text-[#1F3566]">{selectedLead.score || 50}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Votre bilan montre que vous êtes dans la catégorie <strong className="text-[#E7A11A] font-semibold">À RENFORCER</strong>. Des solutions d'ajustements personnalisées s'offrent à vous.
                    </p>
                  </div>

                  {/* Letter excerpt */}
                  <div className="border-l-2 border-[#5D9B2F] pl-3 italic text-slate-500 text-[11px] leading-relaxed py-1 bg-slate-50/50 pr-2">
                    "{selectedLead.letter || "C'est fou de regarder en arrière..."}"
                  </div>

                  <p>
                    Nos conseillers CIMR restent à votre entière disposition pour vous guider et vous accompagner dans l'optimisation de vos cotisations Al Moustaqbal.
                  </p>
                </div>

                {/* Email Footer */}
                <div className="text-center pt-6 border-t border-slate-100 space-y-2">
                  <p className="text-[9px] text-slate-400 font-bold">
                    CIMR © 2026 - Tous droits réservés.
                  </p>
                  <p className="text-[8px] text-slate-400 leading-normal">
                    La Caisse Interprofessionnelle Marocaine de Retraite. Immeuble CIMR, Boulevard de l'Aéropostale, Casa Anfa, Casablanca.
                  </p>
                </div>

              </div>
            </div>

            {/* Modal actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => {
                  alert(`Simulation : L'email automatique officiel a été envoyé avec succès à : ${selectedLead.email}`);
                  setShowEmailModal(false);
                }}
                className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition active:scale-95"
              >
                Envoyer le message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIMULATED PDF EXPORT MODAL OVERLAY */}
      {showPDFModal && selectedLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Window title bar */}
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#5D9B2F]" />
                <span className="text-xs font-bold tracking-wide">Générateur d'Export de Synthèse PDF</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowPDFModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document sheet view */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex justify-center">
              {/* PDF Document Page Paper representation */}
              <div id="pdf-document-paper" className="bg-white shadow-lg border border-slate-200 max-w-lg w-full aspect-[1/1.4] p-10 flex flex-col justify-between text-slate-800 relative select-all text-left">
                
                {/* Official Stamp Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-emerald-500/10 rounded-full flex items-center justify-center pointer-events-none transform -rotate-12">
                  <div className="border-2 border-emerald-500/10 rounded-full w-44 h-44 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[10px] font-black text-emerald-500/10 tracking-widest uppercase">CIMR CERTIFIÉ</span>
                    <span className="text-[8px] font-bold text-emerald-500/10 mt-1">SÉCURISÉ & CONFORME</span>
                  </div>
                </div>

                {/* PDF Header - CIMR Official Logo and Details */}
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
                  <CIMRLogo showText={true} className="h-16" />
                  <div className="text-right text-[9px] text-slate-400 font-mono space-y-0.5">
                    <p className="font-bold text-slate-600">RÉF : CIMR-FM-2026-{selectedLead.id || 99}</p>
                    <p>DATE : {new Date().toLocaleDateString('fr-FR')}</p>
                    <p>SOURCE : BORNE INTERACTIVE ROADSHOW</p>
                    <p>STATUT : DOCUMENT CONFIDENTIEL</p>
                  </div>
                </div>

                {/* PDF Body */}
                <div className="space-y-6 flex-1 pt-6">
                  <div className="text-center space-y-1">
                    <h1 className="text-sm font-black tracking-tight text-[#1F3566] uppercase">BILAN INDIVIDUEL DE SIMULATION "FUTURE ME"</h1>
                    <p className="text-[9px] font-bold text-[#5D9B2F] tracking-widest uppercase">PRÉVISIONS DE PROTECTION ET CAPITALISATION RETRAITE</p>
                  </div>

                  {/* Informational grid */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="space-y-2">
                      <p className="text-slate-400 uppercase tracking-wider text-[8px] font-bold">Identité du Bénéficiaire</p>
                      <p><span className="text-slate-500">Nom :</span> <strong className="text-slate-800">{selectedLead.first_name || selectedLead.firstName || "Mehdi"} {selectedLead.last_name || selectedLead.lastName || "ALAMI"}</strong></p>
                      <p><span className="text-slate-500">Âge :</span> <strong className="text-slate-800">{selectedLead.age || 25} ans</strong></p>
                      <p><span className="text-slate-500">Ville :</span> <strong className="text-slate-800">{selectedLead.city || "Casablanca"}</strong></p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-400 uppercase tracking-wider text-[8px] font-bold">Métriques Clés Retraite</p>
                      <p><span className="text-slate-500">Profession :</span> <strong className="text-slate-800 truncate block">{selectedLead.answers?.situationPro || "Secteur Privé"}</strong></p>
                      <p><span className="text-slate-500">Score de préparation :</span> <strong className="text-slate-800">{selectedLead.score || 55}%</strong></p>
                      <p><span className="text-slate-500">Dotation Gagnée :</span> <strong className="text-[#E7A11A] font-bold">{selectedLead.gift_won || selectedLead.giftWon || "Cadeau de participation 🎁"}</strong></p>
                    </div>
                  </div>

                  {/* Diagnostic details */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-[#1F3566] uppercase tracking-wider">Lettre de Projection Interactive</span>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[9px] text-slate-600 leading-relaxed italic">
                      "{selectedLead.letter || "Bonjour Mehdi, Ici ton double de 65 ans..."}"
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="flex justify-between items-end pt-4 text-[9px]">
                    <div className="space-y-1 text-slate-400">
                      <p className="font-bold text-slate-500">CONSEIL RECOMMANDÉ</p>
                      <p>Adhésion CIMR Al Moustaqbal</p>
                      <p>Souscription simplifiée sur site</p>
                    </div>
                    <div className="text-center space-y-4">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">Cachet et Signature CIMR</p>
                      <div className="w-24 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center italic text-slate-400 text-[10px]">
                        [ Direction Retraite ]
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Footer */}
                <div className="border-t border-slate-100 pt-4 text-center space-y-1 text-[8px] text-slate-400">
                  <p className="font-bold text-slate-500">LA CAISSE INTERPROFESSIONNELLE MAROCAINE DE RETRAITE</p>
                  <p>Société Mutuelle de Retraite - Régie par la Loi 64-12 | Casa Anfa, Casablanca, Maroc</p>
                </div>

              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowPDFModal(false)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={() => {
                  alert(`Simulation : Le fichier de synthèse PDF certifié avec le logo officiel a été généré avec succès pour : ${selectedLead.first_name || selectedLead.firstName || "Mehdi"} ${selectedLead.last_name || selectedLead.lastName || "ALAMI"}`);
                  setShowPDFModal(false);
                }}
                className="bg-[#5D9B2F] hover:bg-[#4E8227] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                Télécharger le PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
