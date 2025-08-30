// src/contexts/AuthContext.tsx - SIMPLIFICADO
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Interfaces básicas
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Crear contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider simplificado
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener sesión inicial
    const getSession = async () => {
      try {
        const { data } = await authService.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getSession();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true);
    try {
      const response = await authService.signUp(email, password, metadata);
      if (response.error) throw new Error(response.error);
      toast.success('Registro exitoso! Revisa tu email para confirmar tu cuenta.');
      navigate('/check-email?email=' + encodeURIComponent(email));
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.signIn(email, password);
      if (response.error) throw new Error(response.error);
      if (response.data?.session) {
        setSession(response.data.session);
        setUser(response.data.user);
        toast.success('Inicio de sesión exitoso');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setSession(null);
      setUser(null);
      toast.success('Sesión cerrada');
      navigate('/');
    } catch (error: any) {
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await authService.resetPassword(email);
      if (response.error) throw new Error(response.error);
      toast.success('Revisa tu email para resetear tu contraseña');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};