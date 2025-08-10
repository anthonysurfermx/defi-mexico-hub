import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

// Layout components (no lazy loading for layouts)
import MainLayout from '@/components/layout/MainLayout';
import AdminLayout from '@/pages/admin/AdminLayout';

// Lazy load all pages for better performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const StartupsPage = lazy(() => import('@/pages/StartupsPage'));
const StartupDetailPage = lazy(() => import('@/pages/StartupDetailPage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const CommunityDetailPage = lazy(() => import('@/pages/CommunityDetailPage'));
const ComunidadesPage = lazy(() => import('@/pages/ComunidadesPage'));
const EventosPage = lazy(() => import('@/pages/EventosPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));

// Routes configuration
const ROUTES = {
  public: [
    { path: '/', element: <HomePage /> },
    { path: '/startups', element: <StartupsPage /> },
    { path: '/startups/:id', element: <StartupDetailPage /> },
    { path: '/blog', element: <BlogPage /> },
    { path: '/comunidades', element: <ComunidadesPage /> },
    { path: '/comunidades/:id', element: <CommunityDetailPage /> },
    { path: '/eventos', element: <EventosPage /> }
  ],
  admin: [
    { path: '', element: <AdminDashboard />, index: true },
    { path: 'startups', element: <StartupsPage /> },
    { path: 'blog', element: <AdminBlog /> },
    { path: 'eventos', element: <AdminEvents /> },
    { path: 'usuarios', element: <ComingSoon title="Gestión de Usuarios" /> },
    { path: 'settings', element: <ComingSoon title="Configuración" /> }
  ]
};

// Page loader component for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 blur-xl animate-pulse" />
          
          {/* Spinner */}
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

// Coming Soon Component (temporary for unimplemented sections)
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-muted rounded-full mb-2">
          <Loader2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Estamos trabajando en esta sección. Estará disponible pronto con nuevas funcionalidades.
        </p>
        <div className="flex justify-center gap-2 pt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use instant for route changes
      });
    }, 0);
    
    return () => clearTimeout(timer);
  }, [pathname]);
  
  return null;
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

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <Router>
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
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              {ROUTES.public.map(({ path, element }) => (
                <Route 
                  key={path} 
                  path={path} 
                  element={element}
                />
              ))}
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              {ROUTES.admin.map(({ path, element, index }) => (
                <Route 
                  key={path || 'admin-index'} 
                  path={path} 
                  element={element} 
                  index={index}
                />
              ))}
            </Route>

            {/* 404 - Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;