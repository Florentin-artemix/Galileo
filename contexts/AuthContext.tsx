import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../src/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  idToken: string | null;
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

  // 🔗 POINT D'INTÉGRATION 3: Observer l'état d'authentification Firebase
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Récupérer le token JWT pour les appels API
        const token = await authService.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // 🔗 POINT D'INTÉGRATION 4: Rafraîchir le token JWT
  const refreshToken = async (): Promise<string | null> => {
    if (user) {
      const token = await authService.getIdToken(true); // Force refresh
      setIdToken(token);
      return token;
    }
    return null;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIdToken(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    idToken,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
