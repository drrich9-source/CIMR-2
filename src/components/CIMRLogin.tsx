import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { Lock, User, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { CIMRLogo } from "./CIMRLogo";

interface CIMRLoginProps {
  onSuccess?: (role: string) => void;
  onCancel?: () => void;
}

export const CIMRLogin: React.FC<CIMRLoginProps> = ({ onSuccess, onCancel }) => {
  const { login, accounts } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await login(username, password);
      if (onSuccess) {
        const found = accounts.find(
          (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
        );
        onSuccess(found ? found.role : "");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Échec de l'authentification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background aesthetic blobs with blur */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#1F3566]/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7CB342]/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-100 flex flex-col">
          {/* Logo Brand Header */}
          <div className="flex flex-col items-center text-center">
            <CIMRLogo 
              showText={true} 
              className="h-16 sm:h-20 mb-4 transition-all" 
            />
            <p className="text-[11px] font-bold text-[#5D9B2F] tracking-widest uppercase mb-1">
              Portail d'Administration CIMR
            </p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Veuillez vous authentifier pour accéder à la console de suivi du Roadshow et aux dossiers CRM.
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Username Input */}
              <div>
                <label htmlFor="username" className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block mb-1">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Ex: admin"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1F3566] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F3566] focus:border-[#1F3566] transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="text-[10px] font-bold text-[#1F3566] uppercase tracking-wider block">
                    Mot de passe
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="Saisissez votre mot de passe"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1F3566] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F3566] focus:border-[#1F3566] transition"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="flex items-center gap-2 pt-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/3 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer text-center"
                >
                  Retour
                </button>
              ) || null}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${onCancel ? "w-2/3" : "w-full"} py-2.5 px-4 bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authentification...</span>
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test accounts helper hidden as requested */}
        </div>

        {/* Info footer */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          Caisse Interprofessionnelle Marocaine de Retraite. Session sécurisée (SSL/TLS 256 bits)
        </p>
      </motion.div>
    </div>
  );
};
