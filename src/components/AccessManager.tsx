import React, { useState } from "react";
import { useAuth, UserAccount, UserRole } from "../AuthContext";
import { 
  Shield, Users, Plus, CheckCircle2, Check, Lock, Eye, ArrowRight, UserPlus, Trash2, Key, Info, MapPin, ShieldAlert, EyeOff, Sparkles, Edit
} from "lucide-react";

export default function AccessManager() {
  const { accounts, updateAccountsList, user } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("animateur");
  const [region, setRegion] = useState("Casablanca");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  // Editing states
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("animateur");
  const [editRegion, setEditRegion] = useState("Casablanca");
  const [editPassword, setEditPassword] = useState("");
  const [editErrorMessage, setEditErrorMessage] = useState("");

  // Guard access: Only "admin_global" is allowed to view or edit accounts configuration
  if (!user || user.role !== "admin_global") {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[#1F3566]">Accès Strictement Restreint</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
          La configuration des rôles, l'attribution des droits et la visualisation des identifiants sont réservées exclusivement aux administrateurs généraux du système CIMR.
        </p>
      </div>
    );
  }

  const toggleShowPassword = (userKey: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userKey]: !prev[userKey]
    }));
  };

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === "admin_global" || selectedRole === "consultation") {
      setRegion("");
    } else {
      setRegion("Casablanca");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Veuillez saisir le nom complet.");
      return;
    }

    if (!username.trim()) {
      setErrorMessage("Veuillez saisir un nom d'utilisateur unique.");
      return;
    }

    if (username.trim().includes(" ")) {
      setErrorMessage("Le nom d'utilisateur ne doit pas contenir d'espaces.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Veuillez définir un mot de passe d'accès.");
      return;
    }

    // Check duplicate username
    const isDuplicate = accounts.some(
      (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage("Ce nom d'utilisateur est déjà utilisé par un autre profil.");
      return;
    }

    const newAccount: UserAccount = {
      username: username.trim().toLowerCase(),
      password: password.trim(),
      role,
      name: name.trim(),
      region: (role === "admin_regional" || role === "animateur") ? region : undefined,
    };

    updateAccountsList([...accounts, newAccount]);

    // Reset form
    setName("");
    setUsername("");
    setRole("animateur");
    setRegion("Casablanca");
    setPassword("");
    setShowAddForm(false);
  };

  const handleEditRoleChange = (selectedRole: UserRole) => {
    setEditRole(selectedRole);
    if (selectedRole === "admin_global" || selectedRole === "consultation") {
      setEditRegion("");
    } else {
      setEditRegion("Casablanca");
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMessage("");

    if (!editName.trim()) {
      setEditErrorMessage("Veuillez saisir le nom complet.");
      return;
    }

    if (!editPassword.trim()) {
      setEditErrorMessage("Veuillez définir un mot de passe d'accès.");
      return;
    }

    if (!editingAccount) return;

    // Check if we are demoting the main admin
    if (editingAccount.username.toLowerCase() === "admin" && editRole !== "admin_global") {
      setEditErrorMessage("Le rôle de l'administrateur principal 'admin' doit rester 'Admin Global'.");
      return;
    }

    const updated = accounts.map((acc) => {
      if (acc.username.toLowerCase() === editingAccount.username.toLowerCase()) {
        return {
          ...acc,
          name: editName.trim(),
          role: editRole,
          region: (editRole === "admin_regional" || editRole === "animateur") ? editRegion : undefined,
          password: editPassword.trim(),
        };
      }
      return acc;
    });

    updateAccountsList(updated);
    
    // Show feedback if editing oneself
    if (editingAccount.username.toLowerCase() === user.username.toLowerCase()) {
      alert("Modifications enregistrées ! Note : S'agissant de votre propre compte actif, reconnectez-vous pour que les changements soient visibles sur l'interface.");
    }
    
    setEditingAccount(null);
  };

  const handleDeleteAccount = (userToDelete: string) => {
    if (userToDelete.toLowerCase() === "admin") {
      alert("Erreur: Impossible de supprimer le compte d'administrateur global principal.");
      return;
    }
    
    if (userToDelete.toLowerCase() === user.username.toLowerCase()) {
      alert("Erreur: Vous ne pouvez pas supprimer le compte avec lequel vous êtes connecté.");
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le compte d'accès '${userToDelete}' ?`)) {
      const filtered = accounts.filter(acc => acc.username.toLowerCase() !== userToDelete.toLowerCase());
      updateAccountsList(filtered);
    }
  };

  const getRoleBadge = (accountRole: UserRole) => {
    switch (accountRole) {
      case "admin_global":
        return (
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] tracking-wide border border-blue-100 uppercase">
            Admin Global
          </span>
        );
      case "admin_regional":
        return (
          <span className="px-2.5 py-0.5 bg-[#7CB342]/10 text-[#7CB342] rounded-full font-bold text-[10px] tracking-wide border border-[#7CB342]/20 uppercase">
            Admin Régional
          </span>
        );
      case "animateur":
        return (
          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] tracking-wide border border-amber-100 uppercase">
            Animateur Borne
          </span>
        );
      case "consultation":
        return (
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px] tracking-wide border border-slate-200 uppercase">
            Lecture Seule
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="access-manager-section">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#1F3566]">Gestion des Rôles & Accès</h2>
        <p className="text-sm text-slate-500 mt-1">
          Attribuez des accès sécurisés individuels pour le personnel sur le terrain et à la direction générale.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Accounts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1F3566] uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7CB342]" />
              Profils Comptes Sécurisés ({accounts.length})
            </h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Nouveau Compte
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {accounts.map((acc) => {
              const isCurrentUser = acc.username.toLowerCase() === user.username.toLowerCase();
              return (
                <div 
                  key={acc.username}
                  className={`bg-white rounded-2xl border p-5 transition-all shadow-xs duration-200 ${
                    isCurrentUser ? "border-[#1F3566]/40 bg-[#1F3566]/5" : "border-slate-100"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                        <Users className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#1F3566]">{acc.name}</h4>
                          {isCurrentUser && (
                            <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-wider">
                              Moi
                            </span>
                          )}
                          {getRoleBadge(acc.role)}
                        </div>
                        <p className="text-xs text-slate-400 font-medium font-mono mt-0.5">
                          Username: <strong className="text-slate-600">{acc.username}</strong>
                        </p>
                        
                        {(acc.region) && (
                          <div className="flex items-center gap-1 text-[10px] text-[#7CB342] font-semibold mt-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Escale Affectée : {acc.region}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                      {/* Password Viewer */}
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 self-start sm:self-auto">
                        <Key className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs text-slate-600">
                          {showPasswords[acc.username] ? acc.password : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(acc.username)}
                          className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showPasswords[acc.username] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Account Actions (Edit / Delete) */}
                      <div className="flex items-center gap-3 mt-1 self-start sm:self-auto">
                        <button
                          onClick={() => {
                            setEditingAccount(acc);
                            setEditName(acc.name);
                            setEditRole(acc.role);
                            setEditRegion(acc.region || "Casablanca");
                            setEditPassword(acc.password || "");
                            setShowAddForm(false);
                            // Scroll to form if needed
                            const elem = document.getElementById("access-form-container");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-[#1F3566] hover:text-[#163A8A] text-[11px] font-bold flex items-center gap-1 hover:underline transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-[#1F3566]" />
                          <span>Modifier</span>
                        </button>

                        {!isCurrentUser && acc.username !== "admin" && (
                          <button
                            onClick={() => handleDeleteAccount(acc.username)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 hover:underline transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Add/Edit Account Form (Drawer or panel) */}
        <div id="access-form-container">
          {editingAccount ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-[#1F3566] text-sm flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-[#7CB342]" />
                  Modifier le Compte
                </h4>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom d'utilisateur</span>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-600">
                    {editingAccount.username}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Omar Alami"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#1F3566]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Rôle d'Accès</label>
                  <select
                    value={editRole}
                    disabled={editingAccount.username.toLowerCase() === "admin"}
                    onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="admin_global">Administrateur Global (Tout)</option>
                    <option value="admin_regional">Administrateur Régional (Région unique)</option>
                    <option value="animateur">Animateur Borne (Borne unique)</option>
                    <option value="consultation">Lecteur (Lecture seule)</option>
                  </select>
                  {editingAccount.username.toLowerCase() === "admin" && (
                    <span className="text-[9px] text-slate-400 mt-1 block">Le rôle du compte 'admin' principal ne peut pas être modifié.</span>
                  )}
                </div>

                {(editRole === "admin_regional" || editRole === "animateur") && (
                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Escale / Région Affectée</label>
                    <select
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer"
                    >
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Tanger">Tanger</option>
                      <option value="Agadir">Agadir</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Mot de Passe d'accès</label>
                  <input
                    type="password"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Saisissez un mot de passe solide"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#1F3566]"
                  />
                </div>

                {editErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{editErrorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="w-1/2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Enregistrer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : showAddForm ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-[#1F3566] text-sm flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#7CB342]" />
                  Ajouter un Compte Accès
                </h4>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Omar Alami"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#1F3566]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Nom d'utilisateur (Username)</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: omar_alami (sans espace)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#1F3566]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Rôle d'Accès</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer"
                  >
                    <option value="admin_global">Administrateur Global (Tout)</option>
                    <option value="admin_regional">Administrateur Régional (Région unique)</option>
                    <option value="animateur">Animateur Borne (Borne unique)</option>
                    <option value="consultation">Lecteur (Lecture seule)</option>
                  </select>
                </div>

                {(role === "admin_regional" || role === "animateur") && (
                  <div>
                    <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Escale / Région Affectée</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none cursor-pointer"
                    >
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Tanger">Tanger</option>
                      <option value="Agadir">Agadir</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">Mot de Passe d'accès</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez un mot de passe solide"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1F3566] focus:outline-none focus:ring-2 focus:ring-[#1F3566]"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-1/2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Enregistrer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-[#1F3566]/5 border border-[#1F3566]/10 p-5 rounded-3xl space-y-3.5">
              <span className="w-10 h-10 bg-[#1F3566] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                🛡️
              </span>
              <h4 className="font-extrabold text-[#1F3566] text-sm">Politique de Sécurité CIMR</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Le modèle d'habilitation applique un cloisonnement strict par rôle. Les accès "Animateur" sont verrouillés sur le simulateur de borne physique de leur agence locale, tandis que les "Admin Régionaux" accèdent uniquement aux indicateurs de leur ville d'affectation.
              </p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                <Info className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Tous les mots de passe sont encodés et stockés dans la session d'infrastructure.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
