import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, UserRole, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  idToken: string | null;
  role: UserRole;
  hasRole: (required: UserRole | UserRole[]) => boolean;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('VIEWER');

  // Observer l'état d'authentification
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Récupérer le token JWT pour les appels API
        const token = await authService.getIdToken();
        setIdToken(token);
        const currentRole = await authService.getCurrentUserRole();
        setRole(currentRole);
      } else {
        setIdToken(null);
        setRole('VIEWER');
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // 🔗 POINT D'INTÉGRATION 4: Rafraîchir le token JWT
  const refreshToken = async (): Promise<string | null> => {
    if (user) {
      const token = await authService.getIdToken(); // Force refresh
      setIdToken(token);
      return token;
    }
    return null;
  };

  const hasRole = (required: UserRole | UserRole[]) => {
    const list = Array.isArray(required) ? required : [required];
    return list.includes(role);
  };

  const logout = async () => {
    await authService.logout();
    authService.clearStoredRole(); // Effacer le rôle stocké
    setUser(null);
    setIdToken(null);
    setRole('VIEWER');
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    idToken,
    role,
    hasRole,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
