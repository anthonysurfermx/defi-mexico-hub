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
  Settings,
  BookOpen,
  TrendingUp,
  ChevronDown,
  Sparkles,
  UserCircle2,
  Coins,
  GraduationCap,
  BarChart3,
  Newspaper,
  CalendarDays,
  Network,
  UserCheck,
  Layers,
  Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalSearch } from '@/components/GlobalSearch';

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Navegación principal simplificada
  const mainNavigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: 'APY Analysis', href: '/oportunidades', icon: BarChart3 },
  ];

  // Navegación "Aprende" (dropdown)
  const aprendeNavigation = [
    { name: 'Academy', href: '/academia', icon: GraduationCap, description: t('nav.academyDesc') || 'DeFi courses and resources' },
    { name: t('nav.blog'), href: '/blog', icon: Newspaper, description: t('nav.blogDesc') || 'Articles and news' },
  ];

  // Navegación del ecosistema (dropdown)
  const ecosistemaNavigation = [
    { name: t('nav.startups'), href: '/startups', icon: Layers, description: 'DeFi projects in Mexico' },
    { name: t('nav.communities'), href: '/comunidades', icon: Network, description: 'Groups and communities' },
    { name: t('nav.advocates'), href: '/referentes', icon: UserCheck, description: 'Ecosystem leaders' },
    { name: t('nav.events'), href: '/eventos', icon: CalendarDays, description: 'Events and conferences' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isEcosistemaActive = () => {
    return ecosistemaNavigation.some(item => location.pathname.startsWith(item.href));
  };

  const isAprendeActive = () => {
    return aprendeNavigation.some(item => location.pathname.startsWith(item.href));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global Search */}
      <GlobalSearch />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Coins className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">DeFi México</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
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

              {/* Dropdown Aprende */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isAprendeActive()
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <BookOpen className="h-4 w-4" />
                    Learn
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {aprendeNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-start gap-3 cursor-pointer"
                        >
                          <Icon className="h-4 w-4 mt-0.5 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dropdown Ecosistema */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isEcosistemaActive()
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <Network className="h-4 w-4" />
                    {t('nav.ecosystem')}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {ecosistemaNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-start gap-3 cursor-pointer"
                        >
                          <Icon className="h-4 w-4 mt-0.5 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => {
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    ctrlKey: true,
                  });
                  document.dispatchEvent(event);
                }}
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">{t('search.search')}</span>
                <kbd className="hidden lg:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <ThemeToggle />
              <LanguageSwitcher />
              <Button size="sm" asChild className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                <Link to="/startup-register">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('nav.contribute')}
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <LanguageSwitcher />
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
              {/* Main Navigation */}
              {mainNavigation.map((item) => {
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

              {/* Aprende Section */}
              <div className="pt-2 pb-1 px-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Learn
                </p>
              </div>
              {aprendeNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-start gap-3 px-4 py-3 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    {isActive(item.href) && (
                      <ChevronRight className="h-4 w-4 ml-auto mt-1" />
                    )}
                  </Link>
                );
              })}

              {/* Ecosistema Section */}
              <div className="pt-2 pb-1 px-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('nav.ecosystem')}
                </p>
              </div>
              {ecosistemaNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-start gap-3 px-4 py-3 text-sm font-medium rounded-lg
                      transition-colors hover:bg-accent hover:text-accent-foreground
                      ${isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    {isActive(item.href) && (
                      <ChevronRight className="h-4 w-4 ml-auto mt-1" />
                    )}
                  </Link>
                );
              })}

              {/* Mobile Actions */}
              <div className="pt-4">
                <Button size="sm" className="w-full justify-start bg-gradient-to-r from-primary to-purple-600" asChild>
                  <Link to="/startup-register">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t('nav.contribute')}
                  </Link>
                </Button>
              </div>
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
                <Coins className="h-6 w-6 text-primary" />
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