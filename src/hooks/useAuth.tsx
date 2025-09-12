// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

// Configuración
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

// Tipos
export type Role = 'admin' | 'editor' | 'moderator' | 'user';

interface ExtendedUser extends User {
  app_metadata?: {
    roles?: Role[] | Role;
    [key: string]: any;
  };
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    role?: Role;
    roles?: Role[];
    [key: string]: any;
  };
}

interface AuthContextType {
  // Estado
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Métodos de autenticación
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signOut: () => Promise<void>;
  
  // Métodos de recuperación (nombres compatibles con componentes)
  resetPassword: (email: string) => Promise<any>;
  resetPasswordForEmail: (email: string) => Promise<any>; // Alias para compatibilidad
  updatePassword: (password: string, token?: string) => Promise<any>;
  verifyOtp: (token: string, type: string) => Promise<any>;
  
  // Métodos de verificación
  resendVerification: (email: string) => Promise<void>;
  handleAuthCallback: () => Promise<{ error: any }>;
  refreshUser: () => Promise<ExtendedUser | null>;
  
  // Helpers
  isEmailVerified: () => boolean;
  getRoles: () => Role[];
  hasRole: (role: Role) => boolean;
  isAdmin: () => boolean;
}

// Función helper para sanitizar redirects
function sanitizeRedirect(input?: string | null, fallback = '/'): string {
  if (!input) return fallback;
  try {
    const decoded = decodeURIComponent(input);
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : fallback;
  } catch {
    return fallback;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle Auth Callback mejorado
  const handleAuthCallback = useCallback(async () => {
    try {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(
        url.hash.startsWith('#') ? url.hash.slice(1) : ''
      );
      
      const code = url.searchParams.get('code') || hashParams.get('code');
      const errorParam = url.searchParams.get('error') || hashParams.get('error');
      
      if (errorParam) {
        return { error: errorParam };
      }
      
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          return { error: exchangeError.message };
        }
      }
      
      // Limpiar URL de parámetros sensibles
      const paramsToRemove = [
        'code', 'token', 'error', 'error_description',
        'access_token', 'refresh_token', 'expires_in', 'type'
      ];
      
      paramsToRemove.forEach(param => {
        url.searchParams.delete(param);
      });
      
      // También limpiar hash
      window.history.replaceState({}, document.title, url.pathname + url.search);
      
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Error al procesar callback' };
    }
  }, []);

  // Inicializar auth
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Verificar si tenemos tokens OAuth en la URL actual
        const hasOAuthTokens = window.location.hash.includes('access_token');
        
        if (hasOAuthTokens) {
          console.log('🔐 OAuth tokens detected in URL, processing...');
          // Procesar callback OAuth automáticamente
          const result = await handleAuthCallback();
          if (!result.error) {
            console.log('✅ OAuth tokens processed successfully');
            
            // Verificar después del procesamiento si tenemos un usuario autenticado
            const { data: session } = await authService.getSession();
            if (session?.user) {
              const userEmail = session.user.email;
              
              // Lista de usuarios autorizados
              const authorizedUsers: Record<string, string> = {
                'anthochavez.ra@gmail.com': 'admin',
                'guillermos22@gmail.com': 'editor', 
                'fabiancepeda102@gmail.com': 'editor',
              };
              
              const userRole = authorizedUsers[userEmail || ''];
              
              if (userRole) {
                console.log(`🎯 OAuth: Redirecting ${userRole} to admin panel`);
                // Pequeño delay para asegurar que todo se procese
                setTimeout(() => {
                  window.location.href = '/admin';
                }, 500);
                return; // Exit early para evitar continuar con la inicialización
              }
            }
          }
        }

        // Obtener sesión inicial usando authService
        const response = await authService.getSession();
        
        if (response.data && mounted) {
          setSession(response.data);
          setUser(response.data.user as ExtendedUser);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        console.log('Auth event:', event);
        
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user as ExtendedUser);
        } else {
          setSession(null);
          setUser(null);
        }

        // Manejar eventos específicos
        switch (event) {
          case 'SIGNED_IN':
            // Redirigir a admin si el usuario tiene permisos
            if (currentSession?.user) {
              const userAsExtended = currentSession.user as ExtendedUser;
              const userEmail = userAsExtended.email;
              
              // Lista de usuarios autorizados (misma que en getRoles)
              const authorizedUsers: Record<string, string> = {
                'anthochavez.ra@gmail.com': 'admin',
                'guillermos22@gmail.com': 'editor', 
                'fabiancepeda102@gmail.com': 'editor',
              };
              
              const userRole = authorizedUsers[userEmail || ''];
              
              if (userRole) {
                console.log(`🎯 Redirecting ${userRole} to admin panel`);
                // Usar setTimeout para asegurar que el estado se actualice primero
                setTimeout(() => {
                  window.location.href = '/admin';
                }, 100);
              }
            }
            break;
          case 'SIGNED_OUT':
            // Limpiar datos locales
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('resetCooldownUntil');
            break;
          case 'USER_UPDATED':
            if (currentSession?.user) {
              setUser(currentSession.user as ExtendedUser);
            }
            break;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign In
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    
    try {
      const response = await authService.signIn(
        email.trim().toLowerCase(), 
        password
      );
      
      if (response.error) {
        setError(response.error);
        return response;
      }
      
      setUser(response.data?.user as ExtendedUser);
      setSession(response.data?.session);
      
      return response;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al iniciar sesión';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  }, []);

  // Sign Up con mejoras
  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    setError(null);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { 
            ...metadata, 
            role: 'user' // Siempre asignar rol user por defecto
          },
          emailRedirectTo: `${SITE_URL}/auth/callback?type=signup`,
        },
      });
      
      if (signUpError) {
        setError(signUpError.message);
        return { data: null, error: signUpError.message };
      }
      
      return { data, error: null };
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al crear cuenta';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  }, []);

  // Sign Out
  const signOut = useCallback(async () => {
    try {
      const response = await authService.signOut();
      
      if (!response.error) {
        setUser(null);
        setSession(null);
        navigate('/');
        toast.success('Sesión cerrada');
      }
    } catch (err) {
      console.error('SignOut error:', err);
      toast.error('Error al cerrar sesión');
    }
  }, [navigate]);

  // Reset Password (con nombre original para compatibilidad)
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { 
          redirectTo: `${SITE_URL}/auth/callback?type=recovery` 
        }
      );
      
      if (resetError) {
        return { error: resetError.message };
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Error al enviar email' };
    }
  }, []);

  // Alias para compatibilidad con componentes
  const resetPasswordForEmail = resetPassword;

  // Update Password mejorado
  const updatePassword = useCallback(async (password: string, token?: string) => {
    try {
      // Si hay token, verificarlo primero
      if (token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery',
        });
        
        if (verifyError) {
          return { error: verifyError.message };
        }
      }
      
      // Actualizar password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password 
      });
      
      if (updateError) {
        return { error: updateError.message };
      }
      
      // Refrescar usuario
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        setUser(refreshedUser as ExtendedUser);
      }
      
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Error al actualizar contraseña' };
    }
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (token: string, type: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any,
      });
      
      return { error: error?.message || null };
    } catch (err: any) {
      return { error: err?.message || 'Error al verificar token' };
    }
  }, []);

  // Resend Verification
  const resendVerification = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: { 
          emailRedirectTo: `${SITE_URL}/auth/callback?type=signup` 
        },
      });
      
      if (error) {
        if (error.message.includes('rate limit')) {
          throw { code: 'RATE_LIMIT', message: error.message };
        }
        if (error.message.includes('already confirmed')) {
          throw { code: 'USER_ALREADY_VERIFIED', message: error.message };
        }
        throw error;
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  }, []);


  // Refresh User
  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (refreshedUser) {
        setUser(refreshedUser as ExtendedUser);
        return refreshedUser as ExtendedUser;
      }
      
      return null;
    } catch (err) {
      console.error('Refresh user error:', err);
      return null;
    }
  }, []);

  // Check if email is verified
  const isEmailVerified = useCallback(() => {
    if (!user) return false;
    
    return !!(
      user.email_confirmed_at ||
      user.confirmed_at ||
      (user as any).emailVerified ||
      (user as any).email_verified
    );
  }, [user]);

  // Get user roles - SOLO usuarios autorizados tienen acceso
  const getRoles = useCallback((): Role[] => {
    if (!user) return [];
    
    // Lista de usuarios autorizados con sus roles
    const authorizedUsers: Record<string, Role> = {
      'anthochavez.ra@gmail.com': 'admin',
      'guillermos22@gmail.com': 'editor', 
      'fabiancepeda102@gmail.com': 'editor',
      // Agregar más usuarios autorizados aquí cuando sea necesario
    };
    
    // Verificar si el usuario está autorizado
    const userRole = authorizedUsers[user.email || ''];
    
    // Si está autorizado, devolver su rol
    if (userRole) {
      return [userRole];
    }
    
    // Si NO está autorizado, NO tiene ningún rol (no puede acceder al admin)
    return [];
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role: Role): boolean => {
    const roles = getRoles();
    return roles.includes(role);
  }, [getRoles]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  // Valor del contexto memoizado
  const value = useMemo(
    () => ({
      // Estado
      user,
      session,
      loading,
      error,
      isAuthenticated: !!user,
      
      // Métodos
      signIn,
      signUp,
      signOut,
      resetPassword,
      resetPasswordForEmail,
      updatePassword,
      verifyOtp,
      resendVerification,
      handleAuthCallback,
      refreshUser,
      isEmailVerified,
      getRoles,
      hasRole,
      isAdmin,
    }),
    [
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      verifyOtp,
      resendVerification,
      handleAuthCallback,
      refreshUser,
      isEmailVerified,
      getRoles,
      hasRole,
      isAdmin,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Export types
export type { AuthContextType, ExtendedUser };  