import React, { useState } from "react";
import { 
  Search, Filter, FileSpreadsheet, Eye, Trash2, X, Calendar, User, Phone, Mail, Award, ArrowRight, RefreshCw, Briefcase, ChevronRight
} from "lucide-react";

interface CRMConsoleProps {
  leads: any[];
  onDeleteLead: (id: any) => Promise<void>;
  loading: boolean;
}

export default function CRMConsole({ leads, onDeleteLead, loading }: CRMConsoleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<any | null>(null);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
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
            className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Toutes les escales</option>
            <option value="Casablanca">Casablanca</option>
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
                            disabled={isDeletingId === lead.id}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="Supprimer"
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

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => setSelectedLead(null)}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-3 rounded-xl transition cursor-pointer"
            >
              Fermer la fiche
            </button>
            <button
              onClick={() => handleDelete(selectedLead.id)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-3 rounded-xl transition cursor-pointer"
            >
              Supprimer le prospect
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
