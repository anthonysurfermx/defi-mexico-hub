// src/hooks/useAuth.tsx
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

// Tipo para el perfil de Supabase
interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'moderator' | 'user';
  is_active: boolean;
}

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
  profileLoading: boolean;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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

          // Esperar un poco para que Supabase procese completamente el OAuth
          await new Promise(resolve => setTimeout(resolve, 500));

          // Obtener la sesión directamente - Supabase ya procesó los tokens del hash
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('❌ Error getting session after OAuth:', sessionError);
          } else if (currentSession?.user) {
            const currentUser = currentSession.user;
            console.log('✅ OAuth session established');
            console.log('📧 OAuth User email:', currentUser.email);

            // Establecer el usuario y sesión en el estado primero
            setUser(currentUser as ExtendedUser);
            setSession(currentSession);

            // Cargar perfil desde la base de datos
            console.log('🔍 Loading profile from database for OAuth user:', currentUser.id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, email, role, is_active')
              .eq('id', currentUser.id)
              .single();

            if (profileError) {
              console.error('❌ Error loading profile after OAuth:', profileError);
            } else if (profileData) {
              console.log('✅ Profile loaded:', { email: profileData.email, role: profileData.role });
              setProfile(profileData as UserProfile);

              // Limpiar URL de tokens OAuth
              const url = new URL(window.location.href);
              url.hash = '';
              window.history.replaceState({}, document.title, url.pathname + url.search);

              // Solo redirigir si NO estamos ya en las páginas protegidas para evitar loops
              const isOnProtectedPage = window.location.pathname.startsWith('/admin') ||
                                       window.location.pathname.startsWith('/user') ||
                                       window.location.pathname.startsWith('/startup-register');

              if (!isOnProtectedPage) {
                // Redirigir según el rol del perfil
                if (profileData.role === 'admin' || profileData.role === 'editor') {
                  console.log(`🎯 OAuth: Redirecting ${profileData.role} to admin panel`);
                  setTimeout(() => {
                    window.location.href = '/admin';
                  }, 300);
                  return;
                } else if (currentUser.email_confirmed_at || currentUser.confirmed_at) {
                  console.log(`🎯 OAuth: Redirecting verified user to user dashboard`);
                  setTimeout(() => {
                    window.location.href = '/user';
                  }, 300);
                  return;
                }
              } else {
                console.log(`ℹ️ Already on protected page (${window.location.pathname}), skipping redirect`);
              }
            }
          } else {
            console.warn('⚠️ No user found after OAuth processing');
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
            // Redirigir según el rol del usuario cargado desde la base de datos
            if (currentSession?.user) {
              const userAsExtended = currentSession.user as ExtendedUser;
              console.log(`📧 SIGNED_IN event - User email: ${userAsExtended.email}`);

              // Cargar perfil desde la base de datos
              const loadProfileAndRedirect = async () => {
                try {
                  const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, role, is_active')
                    .eq('id', userAsExtended.id)
                    .single();

                  if (profileError) {
                    console.error('❌ Error loading profile on SIGNED_IN:', profileError);
                    return;
                  }

                  if (profileData) {
                    console.log(`✅ Profile loaded on SIGNED_IN:`, { email: profileData.email, role: profileData.role });
                    setProfile(profileData as UserProfile);

                    // Redirigir según el rol SOLO desde login/register/OAuth
                    const currentPath = window.location.pathname;
                    const currentHash = window.location.hash;
                    const isAlreadyInProtectedArea = currentPath.startsWith('/admin') ||
                                                     currentPath.startsWith('/user') ||
                                                     currentPath.startsWith('/startup-register');

                    console.log(`🔍 SIGNED_IN - Path: ${currentPath}, Hash: ${currentHash.substring(0, 50)}...`);
                    console.log(`🔍 SIGNED_IN - Already in protected area: ${isAlreadyInProtectedArea}`);

                    if (!isAlreadyInProtectedArea) {
                      const isOnLogin = currentPath === '/login' || currentPath === '/register';
                      const isOAuthCallback = currentHash.includes('access_token') || currentHash.includes('refresh_token');

                      console.log(`🔍 SIGNED_IN - isOnLogin: ${isOnLogin}, isOAuthCallback: ${isOAuthCallback}`);
                      console.log(`🔍 SIGNED_IN - role: ${profileData.role}, email_confirmed: ${userAsExtended.email_confirmed_at || userAsExtended.confirmed_at}`);

                      // Solo redirigir automáticamente desde páginas de login/register o OAuth callback
                      if (isOnLogin || isOAuthCallback) {
                        if (profileData.role === 'admin' || profileData.role === 'editor') {
                          console.log(`🎯 Redirecting ${profileData.role} to admin panel from ${currentPath}`);
                          setTimeout(() => {
                            window.location.href = '/admin';
                          }, 100);
                        } else if (userAsExtended.email_confirmed_at || userAsExtended.confirmed_at) {
                          console.log(`🎯 Redirecting user to user dashboard from ${currentPath}`);
                          setTimeout(() => {
                            window.location.href = '/user';
                          }, 100);
                        } else {
                          console.log(`⚠️ User not verified yet, not redirecting`);
                        }
                      } else {
                        console.log(`⚠️ Not on login/register and no OAuth callback detected, not redirecting`);
                      }
                    }
                  }
                } catch (err) {
                  console.error('❌ Exception loading profile on SIGNED_IN:', err);
                }
              };

              loadProfileAndRedirect();
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

      if (response.error) {
        toast.error('Error al cerrar sesión');
        throw new Error(response.error);
      }

      // Limpiar estado local primero
      setUser(null);
      setSession(null);

      // Limpiar localStorage
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutUntil');
      localStorage.removeItem('rememberEmail');

      // Mostrar feedback
      toast.success('Sesión cerrada correctamente');

      // Redirigir a home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('SignOut error:', err);
      toast.error('Error al cerrar sesión');
      throw err; // Re-throw para que AdminSettings lo maneje
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

  // Función para cargar perfil desde Supabase
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setProfileLoading(true);
      console.log('🔍 Loading profile for user:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, is_active')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('❌ Error loading profile:', error);
        setProfileLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded:', { email: data.email, role: data.role });
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('❌ Exception loading profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id]);

  // Cargar perfil cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [user?.id, loadProfile]);

  // Get user roles - Sistema de roles desde Supabase profiles
  const getRoles = useCallback((): Role[] => {
    if (!user) {
      return [];
    }

    // Usar rol del perfil de Supabase si está disponible
    if (profile?.role) {
      return [profile.role as Role];
    }

    // Fallback: si no hay perfil cargado aún, retornar rol user por defecto
    return ['user'];
  }, [user, profile]);

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
      profileLoading,
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
      profileLoading,
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