import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export type Role = 'admin' | 'editor' | 'moderator' | 'user' | 'startup_owner';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireVerified?: boolean;
  requireAllRoles?: Role[];
  requireAnyRole?: Role[];
  redirectTo?: string;
}

function sanitizeRedirect(input: unknown, fallback = '/'): string {
  const str = typeof input === 'string' ? input : '';
  try {
    const decoded = decodeURIComponent(str);
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : fallback;
  } catch {
    return fallback;
  }
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requireVerified = true,
  requireAllRoles,
  requireAnyRole,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading, isEmailVerified, getRoles } = useAuth();
  const location = useLocation();

  const fromPath = useMemo(() => {
    const path = location.pathname + location.search;
    return sanitizeRedirect(path, '/');
  }, [location.pathname, location.search]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background" 
        aria-busy="true"
        aria-label="Verificando acceso"
      >
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Verificando acceso</p>
            <p className="text-xs text-muted-foreground">Un momento por favor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    const safeRedirect = sanitizeRedirect(redirectTo, '/login');
    return (
      <Navigate
        to={`${safeRedirect}?redirectTo=${encodeURIComponent(fromPath)}`}
        replace
        state={{ from: fromPath }}
      />
    );
  }

  if (requireAuth && requireVerified && user && !isEmailVerified?.()) {
    return (
      <Navigate
        to={`/check-email?redirectTo=${encodeURIComponent(fromPath)}`}
        replace
        state={{ 
          email: user.email, 
          from: fromPath 
        }}
      />
    );
  }

  if (user && ((requireAllRoles?.length) || (requireAnyRole?.length))) {
    const userRoles = new Set(getRoles?.() || []);
    
    // Debug logs
    console.log('🔐 ProtectedRoute - User email:', user.email);
    console.log('🔐 ProtectedRoute - User roles:', Array.from(userRoles));
    console.log('🔐 ProtectedRoute - Required any role:', requireAnyRole);
    console.log('🔐 ProtectedRoute - Required all roles:', requireAllRoles);
    
    const hasAllRequiredRoles = !requireAllRoles?.length || 
      requireAllRoles.every(role => userRoles.has(role));
    
    const hasAnyRequiredRole = !requireAnyRole?.length || 
      requireAnyRole.some(role => userRoles.has(role));

    console.log('🔐 ProtectedRoute - Has required roles?', hasAllRequiredRoles && hasAnyRequiredRole);

    if (!hasAllRequiredRoles || !hasAnyRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

export function GuestRoute({
  children,
  redirectTo = '/',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-background" 
        aria-busy="true"
        aria-label="Cargando"
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    const fromState = (location.state as any)?.from as string | undefined;
    const fromQuery = new URLSearchParams(location.search).get('redirectTo');

    const target = 
      sanitizeRedirect(fromState) ||
      sanitizeRedirect(fromQuery) ||
      sanitizeRedirect(redirectTo, '/');

    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

export function useRequireAuth(options?: {
  requireVerified?: boolean;
  requireAllRoles?: Role[];
  requireAnyRole?: Role[];
  redirectTo?: string;
}) {
  const { user, loading, isEmailVerified, getRoles } = useAuth();

  return useMemo(() => {
    if (loading) {
      return { 
        authorized: false, 
        loading: true as const,
        reason: null
      };
    }

    if (!user) {
      return {
        authorized: false,
        loading: false as const,
        redirect: sanitizeRedirect(options?.redirectTo, '/login'),
        reason: 'unauthenticated' as const,
      };
    }

    if (options?.requireVerified && !isEmailVerified?.()) {
      return {
        authorized: false,
        loading: false as const,
        redirect: '/check-email',
        reason: 'unverified' as const,
      };
    }

    if (options?.requireAllRoles?.length || options?.requireAnyRole?.length) {
      const userRoles = new Set(getRoles?.() || []);
      
      const hasAllRequiredRoles = !options?.requireAllRoles?.length || 
        options.requireAllRoles.every(role => userRoles.has(role));
      
      const hasAnyRequiredRole = !options?.requireAnyRole?.length || 
        options.requireAnyRole.some(role => userRoles.has(role));

      if (!hasAllRequiredRoles || !hasAnyRequiredRole) {
        return {
          authorized: false,
          loading: false as const,
          redirect: '/unauthorized',
          reason: 'unauthorized' as const,
        };
      }
    }

    return { 
      authorized: true, 
      loading: false as const,
      reason: null
    };
  }, [
    user, 
    loading, 
    isEmailVerified, 
    getRoles, 
    options?.requireVerified, 
    options?.requireAllRoles, 
    options?.requireAnyRole, 
    options?.redirectTo
  ]);
}