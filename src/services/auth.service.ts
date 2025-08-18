
// =====================================================
// 8. src/services/auth.service.ts
// =====================================================
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { ServiceResponse } from '../types';
import { platformService } from './platform.service';

export const authService = {
  // Registrar nuevo usuario
  async signUp(email: string, password: string, metadata?: any): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      // Log registro
      await platformService.logEvent(
        'user_signup',
        { user_id: data.user?.id, email },
        'info'
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Iniciar sesión
  async signIn(email: string, password: string): Promise<ServiceResponse<any>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Log inicio de sesión
      await platformService.logEvent(
        'user_signin',
        { user_id: data.user?.id, email },
        'info'
      );
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Cerrar sesión
  async signOut(): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error) };
    }
  },

  // Obtener usuario actual
  async getCurrentUser(): Promise<ServiceResponse<any>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return { data: user, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Obtener sesión actual
  async getSession(): Promise<ServiceResponse<any>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      return { data: session, error: null };
    } catch (error) {
      return { data: null, error: handleSupabaseError(error) };
    }
  },

  // Resetear contraseña
  async resetPassword(email: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      // Log solicitud de reset
      await platformService.logEvent(
        'password_reset_requested',
        { email },
        'info'
      );
      
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error) };
    }
  },

  // Actualizar contraseña
  async updatePassword(newPassword: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error) };
    }
  }
};
