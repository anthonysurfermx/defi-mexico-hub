// src/components/layout/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Building2, 
  FileText, 
  Calendar, 
  Users, 
  Home,
  Github,
  Mail,
  ChevronRight,
  Rocket,
  Settings,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Startups', href: '/startups', icon: Building2 },
    { name: 'Academia', href: '/academia', icon: BookOpen },
    { name: 'Análisis de APY', href: '/oportunidades', icon: TrendingUp },
    { name: 'Comunidades', href: '/comunidades', icon: Users },
    { name: 'Blog', href: '/blog', icon: FileText },
    { name: 'Eventos', href: '/eventos', icon: Calendar },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Rocket className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">DeFi México</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isActive(item.href) 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Espacio reservado para futuras funcionalidades */}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-accent"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isActive(item.href) 
                        ? 'bg-accent text-accent-foreground' 
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    {isActive(item.href) && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Rocket className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">DeFi México Hub</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Impulsando el ecosistema DeFi en México a través de la innovación y colaboración.
              </p>
              <div className="flex space-x-3">
                <a 
                  href="https://github.com/anthonysurfermx/defi-mexico-hub" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Enlaces Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/startups" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Startups
                  </Link>
                </li>
                <li>
                  <Link to="/academia" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Academia
                  </Link>
                </li>
                <li>
                  <Link to="/digital-art-defi" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    NFT Studio
                  </Link>
                </li>
                <li>
                  <Link to="/oportunidades" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Análisis de APY
                  </Link>
                </li>
                <li>
                  <Link to="/comunidades" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Comunidades
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/eventos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Eventos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="https://defillama.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    DefiLlama
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Guía DeFi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Glosario
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Whitepapers
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-semibold mb-4">Newsletter</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recibe las últimas noticias del ecosistema DeFi mexicano.
              </p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="submit" className="w-full">
                  Suscribirse
                </Button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-muted-foreground">
                © 2024 DeFi México Hub. Todos los derechos reservados.
              </p>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Términos
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacidad
                </a>
                <a href="mailto:hola@defimexico.com" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Contacto
                </a>
                
                {/* Botón Admin movido aquí - discreto */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="text-muted-foreground hover:text-primary opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Link to="/admin" className="inline-flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    <span className="text-xs">Admin</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}