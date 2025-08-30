// src/App.tsx - CON VERCEL ANALYTICS
import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react'; // ✅ PARA REACT (no Next.js)
import { AuthProvider } from './hooks/useAuth';
import Web3ContextProvider from '@/libs/components/Web3ContextProvider';
import ProtectedRoute, { GuestRoute } from '@/components/auth/ProtectedRoute';

// Layout components (no lazy loading para layouts)
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

// Lazy load todas las páginas para mejor performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const StartupsPage = lazy(() => import('@/pages/StartupsPage'));
const StartupDetailPage = lazy(() => import('@/pages/StartupDetailPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage')); // ✨ BLOG POST INDIVIDUAL
const CommunityDetailPage = lazy(() => import('@/pages/CommunityDetailPage'));
const ComunidadesPage = lazy(() => import('@/pages/ComunidadesPage'));
const EventosPage = lazy(() => import('@/pages/EventosPage'));
const ResourcesPage = lazy(() => import('@/pages/ResourcesPage'));
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'));
const InvestmentOpportunitiesPage = lazy(() => import('@/pages/InvestmentOpportunitiesPage'));

// Auth pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const CheckEmailPage = lazy(() => import('@/pages/CheckEmailPage'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const AdminStartups = lazy(() => import('@/pages/admin/AdminStartups'));
const AdminCommunities = lazy(() => import('@/pages/admin/AdminCommunities'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Admin Startup Forms
const AdminStartupForm = lazy(() => import('@/pages/admin/AdminStartupForm'));

// Admin Community Forms
const AdminCommunityForm = lazy(() => import('@/pages/admin/AdminCommunityForm'));

// Admin Blog Forms - RUTAS DE BLOG
const BlogNew = lazy(() => import('@/pages/admin/BlogNew'));
const BlogEditPage = lazy(() => import('@/pages/admin/BlogEditPage'));

// Error pages
const NotFound = lazy(() => import('@/pages/NotFound'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

// Componente de loading para Suspense
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
          <div className="relative">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Cargando</p>
          <p className="text-xs text-muted-foreground">DeFi México Hub</p>
        </div>
      </div>
    </div>
  );
}

// Root layout que envuelve todo con AuthProvider y Web3ContextProvider
function RootLayout() {
  return (
    <Web3ContextProvider>
      <AuthProvider>
        <Outlet />
        <ScrollRestoration />
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
        {/* ✨ VERCEL ANALYTICS COMPONENT */}
        <Analytics />
      </AuthProvider>
    </Web3ContextProvider>
  );
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <div className="text-red-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Algo salió mal</h2>
            <p className="text-muted-foreground">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ==========================================
// CONFIGURACIÓN DEL ROUTER
// ==========================================

// Crear el router con todas las rutas y future flags
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: (
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        </ErrorBoundary>
      ),
      children: [
        // ==========================================
        // RUTAS PÚBLICAS CON MAIN LAYOUT
        // ==========================================
        {
          element: (
            <Suspense fallback={<PageLoader />}>
              <MainLayout />
            </Suspense>
          ),
          children: [
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <HomePage />
                </Suspense>
              ),
            },
            {
              path: 'startups',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StartupsPage />
                </Suspense>
              ),
            },
            {
              path: 'startups/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <StartupDetailPage />
                </Suspense>
              ),
            },
            // ==========================================
            // RUTAS DEL BLOG
            // ==========================================
            {
              path: 'blog',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <BlogPage />
                </Suspense>
              ),
            },
            {
              path: 'blog/:slug', // ✅ RUTA PARA POSTS INDIVIDUALES
              element: (
                <Suspense fallback={<PageLoader />}>
                  <BlogPostPage />
                </Suspense>
              ),
            },
            // ==========================================
            // OTRAS RUTAS PÚBLICAS
            // ==========================================
            {
              path: 'comunidades',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <ComunidadesPage />
                </Suspense>
              ),
            },
            {
              path: 'comunidades/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <CommunityDetailPage />
                </Suspense>
              ),
            },
            {
              path: 'recursos',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <ResourcesPage />
                </Suspense>
              ),
            },
            {
              path: 'eventos',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <EventosPage />
                </Suspense>
              ),
            },
            {
              path: 'eventos/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <EventDetailPage />
                </Suspense>
              ),
            },
            {
              path: 'oportunidades',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <InvestmentOpportunitiesPage />
                </Suspense>
              ),
            },
          ],
        },

        // ==========================================
        // RUTAS DE AUTENTICACIÓN (SIN LAYOUT)
        // ==========================================
        {
          path: 'login',
          element: (
            <GuestRoute>
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            </GuestRoute>
          ),
        },
        {
          path: 'register',
          element: (
            <GuestRoute>
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            </GuestRoute>
          ),
        },
        {
          path: 'forgot-password',
          element: (
            <GuestRoute>
              <Suspense fallback={<PageLoader />}>
                <ForgotPasswordPage />
              </Suspense>
            </GuestRoute>
          ),
        },
        {
          path: 'reset-password',
          element: (
            <Suspense fallback={<PageLoader />}>
              <ResetPasswordPage />
            </Suspense>
          ),
        },
        {
          path: 'check-email',
          element: (
            <Suspense fallback={<PageLoader />}>
              <CheckEmailPage />
            </Suspense>
          ),
        },
        {
          path: 'auth/callback',
          element: (
            <Suspense fallback={<PageLoader />}>
              <AuthCallback />
            </Suspense>
          ),
        },
        {
          path: 'unauthorized',
          element: (
            <Suspense fallback={<PageLoader />}>
              <UnauthorizedPage />
            </Suspense>
          ),
        },

        // ==========================================
        // RUTAS ADMIN PROTEGIDAS
        // ==========================================
        {
          path: 'admin',
          element: (
            <ProtectedRoute requireAllRoles={['admin']}>
              <Suspense fallback={<PageLoader />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          ),
          errorElement: (
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            </ErrorBoundary>
          ),
          children: [
            // Dashboard admin
            {
              index: true,
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              ),
            },
            
            // ==========================================
            // RUTAS ADMIN - STARTUPS
            // ==========================================
            {
              path: 'startups',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminStartups />
                </Suspense>
              ),
            },
            {
              path: 'startups/new',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminStartupForm />
                </Suspense>
              ),
            },
            {
              path: 'startups/edit/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminStartupForm />
                </Suspense>
              ),
            },
            {
              path: 'startups/:id/edit',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminStartupForm />
                </Suspense>
              ),
            },

            // ==========================================
            // RUTAS ADMIN - BLOG
            // ==========================================
            {
              path: 'blog',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminBlog />
                </Suspense>
              ),
            },
            {
              path: 'blog/new',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <BlogNew />
                </Suspense>
              ),
            },
            {
              path: 'blog/edit/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <BlogEditPage />
                </Suspense>
              ),
            },

            // ==========================================
            // OTRAS RUTAS ADMIN
            // ==========================================
            {
              path: 'eventos',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminEvents />
                </Suspense>
              ),
            },
            {
              path: 'comunidades',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminCommunities />
                </Suspense>
              ),
            },
            {
              path: 'comunidades/new',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminCommunityForm />
                </Suspense>
              ),
            },
            {
              path: 'comunidades/edit/:id',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminCommunityForm />
                </Suspense>
              ),
            },
            {
              path: 'usuarios',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminUsers />
                </Suspense>
              ),
            },
            {
              path: 'settings',
              element: (
                <Suspense fallback={<PageLoader />}>
                  <AdminSettings />
                </Suspense>
              ),
            },
          ],
        },

        // ==========================================
        // 404 CATCH-ALL
        // ==========================================
        {
          path: '*',
          element: (
            <Suspense fallback={<PageLoader />}>
              <NotFound />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    basename: import.meta.env.VITE_BASE_PATH || '/',
  }
);

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}