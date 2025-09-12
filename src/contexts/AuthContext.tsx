// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  authService, 
  type AuthState, 
  type AuthUser, 
  type UserProfile,
  type SignUpParams,
  type SignInParams,
  type ResetPasswordParams,
  type UpdateProfileParams,
  type AuthSubscription
} from '../services/auth.service';
import { Session, Provider, AuthError } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Interfaces del contexto
interface AuthContextType extends AuthState {
  // Datos del usuario
  profile: UserProfile | null;
  
  // Estado de carga específica
  profileLoading: boolean;
  
  // Métodos de autenticación
  signUp: (params: SignUpParams) => Promise<void>;
  signIn: (params: SignInParams) => Promise<void>;
  signInWithOAuth: (provider: Provider, redirectTo?: string) => Promise<void>;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Gestión de perfil
  updateProfile: (updates: UpdateProfileParams) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Utilidades
  isAdmin: () => boolean;
  isModerator: () => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (routeRole?: string) => boolean;
  getAvatarUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props del proveedor
interface AuthProviderProps {
  children: ReactNode;
  redirectTo?: string;
  onAuthChange?: (user: AuthUser | null) => void;
  enableAutoRedirect?: boolean;
}

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  redirectTo = '/', 
  onAuthChange,
  enableAutoRedirect = true 
}) => {
  // Estado del contexto
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  
  // Efectos
  useEffect(() => {
    let subscription: AuthSubscription | null = null;

    // Suscribirse a cambios de auth
    subscription = authService.onAuthStateChange((state) => {
      setAuthState(state);
      
      // Cargar perfil cuando hay usuario
      if (state.user && state.initialized) {
        loadUserProfile();
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
      
      // Callback opcional
      onAuthChange?.(state.user);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [onAuthChange]);

  // Cargar perfil del usuario
  const loadUserProfile = async () => {
    if (!authState.user) return;
    
    try {
      setProfileLoading(true);
      const userProfile = await authService.getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Error cargando perfil de usuario');
    } finally {
      setProfileLoading(false);
    }
  };

  // Métodos de autenticación
  const signUp = async (params: SignUpParams): Promise<void> => {
    try {
      const response = await authService.signUp(params);
      
      if (response.error) {
        throw response.error;
      }

      if (response.data.user && !response.data.session) {
        toast.success('¡Registro exitoso! Verifica tu email para activar tu cuenta.');
      } else {
        toast.success('¡Cuenta creada exitosamente!');
        if (enableAutoRedirect) {
          navigate(redirectTo);
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error signing up:', authError);
      
      // Manejar errores específicos
      let errorMessage = 'Error al crear la cuenta';
      
      if (authError.message.includes('already registered')) {
        errorMessage = 'Este email ya está registrado';
      } else if (authError.message.includes('Password')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (authError.message.includes('email')) {
        errorMessage = 'El email no es válido';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signIn = async (params: SignInParams): Promise<void> => {
    try {
      const response = await authService.signIn(params);
      
      if (response.error) {
        throw response.error;
      }

      toast.success('¡Bienvenido de vuelta!');
      
      if (enableAutoRedirect) {
        navigate(redirectTo);
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error signing in:', authError);
      
      // Manejar errores específicos
      let errorMessage = 'Error al iniciar sesión';
      
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Debes verificar tu email antes de iniciar sesión';
      } else if (authError.message.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: Provider, redirectTo?: string): Promise<void> => {
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const response = await authService.signInWithOAuth(provider, {
        redirectTo: redirectTo || siteUrl,
      });
      
      if (response.error) {
        throw response.error;
      }

      // El redirect se maneja automáticamente por Supabase
    } catch (error) {
      const authError = error as AuthError;
      console.error(`Error signing in with ${provider}:`, authError);
      
      let errorMessage = `Error al iniciar sesión con ${provider}`;
      
      if (authError.message.includes('Unauthorized')) {
        errorMessage = `No tienes autorización para usar ${provider}`;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signInWithMagicLink = async (email: string, redirectTo?: string): Promise<void> => {
    try {
      const response = await authService.signInWithMagicLink({
        email,
        redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      });
      
      if (response.error) {
        throw response.error;
      }

      toast.success('¡Enlace enviado! Revisa tu email para iniciar sesión.');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error sending magic link:', authError);
      
      let errorMessage = 'Error enviando enlace mágico';
      
      if (authError.message.includes('rate limit')) {
        errorMessage = 'Demasiados intentos. Espera un momento antes de intentar nuevamente';
      } else if (authError.message.includes('invalid email')) {
        errorMessage = 'Email no válido';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        throw error;
      }

      toast.success('Sesión cerrada correctamente');
      
      // Limpiar estado local
      setProfile(null);
      
      if (enableAutoRedirect) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
      throw error;
    }
  };

  // Métodos de gestión de perfil
  const updateProfile = async (updates: UpdateProfileParams): Promise<void> => {
    try {
      const { error } = await authService.updateProfile(updates);
      
      if (error) {
        throw error;
      }

      // Recargar perfil
      await refreshProfile();
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error actualizando el perfil');
      throw error;
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    try {
      const { error } = await authService.updatePassword(newPassword);
      
      if (error) {
        throw error;
      }

      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error updating password:', authError);
      
      let errorMessage = 'Error actualizando la contraseña';
      
      if (authError.message.includes('Password should be')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateEmail = async (newEmail: string): Promise<void> => {
    try {
      const { error } = await authService.updateEmail(newEmail);
      
      if (error) {
        throw error;
      }

      toast.success('Email actualizado. Verifica tu nuevo email para confirmarlo.');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Error updating email:', authError);
      
      let errorMessage = 'Error actualizando el email';
      
      if (authError.message.includes('already registered')) {
        errorMessage = 'Este email ya está en uso';
      } else if (authError.message.includes('invalid email')) {
        errorMessage = 'Email no válido';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (params: ResetPasswordParams): Promise<void> => {
    try {
      const { error } = await authService.resetPassword(params);
      
      if (error) {
        throw error;
      }

      toast.success('Enlace de recuperación enviado. Revisa tu email.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error enviando enlace de recuperación');
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!authState.user) return;
    
    try {
      setProfileLoading(true);
      const userProfile = await authService.getUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Error recargando perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  // Métodos de utilidades
  const isAdmin = (): boolean => {
    return authService.isAdmin();
  };

  const isModerator = (): boolean => {
    return authService.isModerator();
  };

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const canAccessRoute = (routeRole?: string): boolean => {
    return authService.canAccessRoute(routeRole);
  };

  const getAvatarUrl = (): string => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    return authService.getDefaultAvatarUrl(authState.user);
  };

  // Valor del contexto
  const contextValue: AuthContextType = {
    // Estado de auth
    ...authState,
    profile,
    profileLoading,
    
    // Métodos de autenticación
    signUp,
    signIn,
    signInWithOAuth,
    signInWithMagicLink,
    signOut,
    
    // Gestión de perfil
    updateProfile,
    updatePassword,
    updateEmail,
    resetPassword,
    refreshProfile,
    
    // Utilidades
    isAdmin,
    isModerator,
    hasPermission,
    canAccessRoute,
    getAvatarUrl,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook para requerir autenticación
 * Redirige automáticamente al login si no está autenticado
 */
export const useRequireAuth = (redirectTo = '/auth/login'): AuthContextType => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.initialized && !auth.user) {
      navigate(redirectTo);
    }
  }, [auth.initialized, auth.user, navigate, redirectTo]);

  return auth;
};

/**
 * Hook para requerir rol específico
 */
export const useRequireRole = (
  role: 'admin' | 'moderator' | 'authenticated',
  redirectTo = '/'
): AuthContextType => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.initialized) {
      if (!auth.user) {
        navigate('/auth/login');
        return;
      }

      const hasAccess = auth.canAccessRoute(role);
      if (!hasAccess) {
        navigate(redirectTo);
        toast.error('No tienes permisos para acceder a esta página');
      }
    }
  }, [auth.initialized, auth.user, role, navigate, redirectTo, auth]);

  return auth;
};

/**
 * Hook para obtener el estado de carga general
 */
export const useAuthLoading = (): boolean => {
  const { loading, initialized, profileLoading } = useAuth();
  return loading || !initialized || profileLoading;
};

/**
 * Hook para verificar si está autenticado de forma reactiva
 */
export const useIsAuthenticated = (): boolean => {
  const { user, initialized } = useAuth();
  return initialized && !!user;
};

/**
 * Hook para obtener información del usuario actual
 */
export const useCurrentUser = (): {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
} => {
  const { user, profile, loading, initialized, profileLoading } = useAuth();
  
  return {
    user,
    profile,
    isLoading: loading || !initialized || profileLoading,
  };
};

/**
 * Hook para manejar redirects después de auth
 */
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  
  const redirectAfterAuth = (path = '/') => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo') || path;
    navigate(redirectTo);
  };

  return { redirectAfterAuth };
};

// Exportaciones adicionales
export default AuthContext;
export type { AuthContextType, AuthUser, UserProfile };