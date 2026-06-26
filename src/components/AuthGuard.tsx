import React from "react";
import { useAuth } from "../AuthContext";
import { CIMRLogin } from "./CIMRLogin";
import { motion } from "motion/react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackToLoginScreen?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallbackToLoginScreen = true }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Show premium CIMR loading screen during session check
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 relative">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-[#1F3566]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7CB342]/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-16 h-16 bg-[#1F3566] text-white rounded-3xl font-black text-2xl flex items-center justify-center shadow-2xl shadow-[#1F3566]/40 mb-5"
          >
            C
          </motion.div>
          
          <h2 className="text-[#1F3566] dark:text-slate-100 font-sans font-black text-xl tracking-wider flex items-center mb-1">
            CIMR<span className="text-[#7CB342] font-semibold text-sm ml-1">CRM</span>
          </h2>
          
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#7CB342] animate-pulse" />
            <span>Vérification de la session sécurisée...</span>
          </div>

          {/* Symmetrical modern loader line */}
          <div className="w-40 h-1 bg-slate-800 rounded-full overflow-hidden mt-6 relative">
            <motion.div
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-[#7CB342]"
            />
          </div>
        </div>
      </div>
    );
  }

  // If no user is authenticated, intercept access and display the custom CIMR login card
  if (!user) {
    if (fallbackToLoginScreen) {
      return <CIMRLogin />;
    }
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center flex flex-col items-center max-w-md mx-auto my-12">
        <h3 className="text-rose-800 font-bold text-lg mb-2">Accès refusé</h3>
        <p className="text-xs text-rose-600 mb-4">
          Vous devez être connecté avec un profil d'administrateur ou d'animateur pour consulter ces données CRM.
        </p>
      </div>
    );
  }

  // If the logged-in user is an animator, restrict access to the CRM and suggest going to the Future Me simulator
  if (user.role === "animateur") {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center flex flex-col items-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-rose-50 text-[#1F3566] rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-[#1F3566]">Accès Direction CRM Restreint</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
          Votre compte d'animateur est exclusivement dédié à l'usage de la borne interactive <strong>"Future Me by CIMR"</strong>.
          Les outils de pilotage CRM, rapports de performance, et suivi de campagnes sont réservés à la Direction.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#1F3566] hover:bg-[#163A8A] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition cursor-pointer"
        >
          Retourner au Simulateur de Borne
        </button>
      </div>
    );
  }

  // If authenticated and not restricted, allow mounting child layouts/views safely
  return <>{children}</>;
};
