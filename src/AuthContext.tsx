import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type UserRole = "admin_global" | "admin_regional" | "animateur" | "consultation";

export interface UserSession {
  userId: string;
  username: string;
  role: UserRole;
  name: string;
  region?: string;
  loginTime: string;
  expiresAt: string;
}

export interface UserAccount {
  username: string;
  password?: string; // used for verify
  role: UserRole;
  name: string;
  region?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  accounts: UserAccount[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (username: string, oldPass: string, newPass: string) => Promise<boolean>;
  refreshSession: () => void;
  updateAccountsList: (updatedAccounts: UserAccount[]) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_ACCOUNTS: UserAccount[] = [
  {
    username: "admin",
    password: "admin",
    role: "admin_global",
    name: "Administrateur Global",
  },
  {
    username: "regional_casa",
    password: "regional",
    role: "admin_regional",
    name: "Administrateur Régional (Casablanca)",
    region: "Casablanca",
  },
  {
    username: "animateur",
    password: "animateur",
    role: "animateur",
    name: "Animateur Casablanca Hub",
    region: "Casablanca",
  },
  {
    username: "invite",
    password: "visitor",
    role: "consultation",
    name: "Lecteur Invité",
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem("cimr_user_accounts");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ACCOUNTS;
      }
    }
    return DEFAULT_ACCOUNTS;
  });

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync accounts to localStorage
  const updateAccountsList = (updatedAccounts: UserAccount[]) => {
    setAccounts(updatedAccounts);
    localStorage.setItem("cimr_user_accounts", JSON.stringify(updatedAccounts));
  };

  // Recover session on startup
  useEffect(() => {
    const savedSession = localStorage.getItem("cimr_active_session");
    if (savedSession) {
      try {
        const parsedSession: UserSession = JSON.parse(savedSession);
        const expiresAt = new Date(parsedSession.expiresAt).getTime();
        const now = new Date().getTime();

        if (expiresAt > now) {
          setUser(parsedSession);
          setupSessionTimeout(expiresAt - now);
        } else {
          // Session expired
          localStorage.removeItem("cimr_active_session");
        }
      } catch (e) {
        localStorage.removeItem("cimr_active_session");
      }
    }
    
    // Slight simulation loading for high visual quality
    const timer = setTimeout(() => {
      setLoading(false);
    }, 850);

    return () => {
      clearTimeout(timer);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, []);

  // Setup actual countdown for session expiration
  const setupSessionTimeout = (msLeft: number) => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    
    sessionTimeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, msLeft);
  };

  const handleSessionExpired = () => {
    setUser(null);
    localStorage.removeItem("cimr_active_session");
    alert("Votre session CIMR a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter.");
  };

  // Login handler
  const login = async (username: string, password: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const found = accounts.find(
          (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
        );

        if (!found) {
          reject(new Error("Utilisateur introuvable. Veuillez vérifier vos identifiants."));
          return;
        }

        if (found.password !== password) {
          reject(new Error("Mot de passe incorrect."));
          return;
        }

        const now = new Date();
        const expires = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes duration

        const session: UserSession = {
          userId: `usr-${found.username}-${Math.floor(Math.random() * 10000)}`,
          username: found.username,
          role: found.role,
          name: found.name,
          region: found.region,
          loginTime: now.toISOString(),
          expiresAt: expires.toISOString(),
        };

        setUser(session);
        localStorage.setItem("cimr_active_session", JSON.stringify(session));
        setupSessionTimeout(30 * 60 * 1000);
        resolve(true);
      }, 600); // Realistic latency for feeling secure and real
    });
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    localStorage.removeItem("cimr_active_session");
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
  };

  // Change password handler
  const changePassword = async (
    username: string,
    oldPass: string,
    newPass: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const list = [...accounts];
        const idx = list.findIndex(
          (acc) => acc.username.toLowerCase() === username.trim().toLowerCase()
        );

        if (idx === -1) {
          reject(new Error("Compte introuvable."));
          return;
        }

        if (list[idx].password !== oldPass) {
          reject(new Error("L'ancien mot de passe est incorrect."));
          return;
        }

        list[idx].password = newPass;
        updateAccountsList(list);
        resolve(true);
      }, 500);
    });
  };

  // Manual & automatic refresh session helper
  const refreshSession = () => {
    if (!user) return;

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60 * 1000); // extend by another 30 mins

    const updatedSession: UserSession = {
      ...user,
      expiresAt: expires.toISOString(),
    };

    setUser(updatedSession);
    localStorage.setItem("cimr_active_session", JSON.stringify(updatedSession));
    setupSessionTimeout(30 * 60 * 1000);
  };

  // Set up event listeners for user activity auto-refresh
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      // Debounce the refresh call to prevent performance overhead
      if (activityTimerRef.current) return;

      activityTimerRef.current = setTimeout(() => {
        refreshSession();
        activityTimerRef.current = null;
      }, 10000); // refresh every 10 seconds of active interactions
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accounts,
        login,
        logout,
        changePassword,
        refreshSession,
        updateAccountsList,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
