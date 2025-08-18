import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Loader2, Mail, Lock, Eye, EyeOff, LogIn,
  ShieldCheck, Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';

// Schema de validación
const loginSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  // Obtener redirect URL de diferentes fuentes
  const from = (location.state as any)?.from?.pathname || '/';
  const redirectTo = searchParams.get('redirectTo') || searchParams.get('redirect') || from;
  
  // Estados
  const [showPassword, setShowPassword] = useState(false);
  
  // Mensaje de éxito si viene de registro
  const registrationSuccess = searchParams.get('registered') === 'true';
  const verificationSuccess = searchParams.get('verified') === 'true';
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
    watch
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get('email') || '',
      rememberMe: false
    }
  });
  
  const emailValue = watch('email');
  
  // Auto-focus en el campo correcto
  useEffect(() => {
    if (emailValue) {
      setFocus('password');
    } else {
      setFocus('email');
    }
  }, [setFocus, emailValue]);
  
  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);
  
  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await signIn(values.email, values.password);
      
      if (response.error) {
        // Mensaje genérico de error para no revelar información
        setError('password', { 
          message: 'Email o contraseña incorrectos' 
        });
        
        // Manejar caso especial de email no confirmado
        if (response.error.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión.');
          setTimeout(() => {
            navigate(`/check-email?email=${encodeURIComponent(values.email)}`);
          }, 1500);
        } else {
          // Para todos los demás errores, mensaje genérico
          toast.error('Email o contraseña incorrectos');
        }
        
        return;
      }
      
      // Si marcó "Recordarme", guardar preferencia
      if (values.rememberMe) {
        localStorage.setItem('rememberEmail', values.email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      // Mostrar mensaje de éxito
      toast.success('¡Bienvenido de vuelta!');
      
      // Redirigir según el rol
      const userRole = response.data?.user?.user_metadata?.role || 'user';
      const finalRedirect = userRole === 'admin' && redirectTo === '/' ? '/admin' : redirectTo;
      
      // Pequeño delay para que se vea el mensaje
      setTimeout(() => {
        navigate(finalRedirect, { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <Card className="w-full max-w-md relative z-10 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl animate-pulse" />
              <div className="relative p-3 bg-primary/10 rounded-full">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-center">
            Iniciar Sesión
          </CardTitle>
          
          <CardDescription className="text-center">
            Ingresa a tu cuenta DeFi México Hub
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Mensajes de éxito */}
            {registrationSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ¡Registro exitoso! Revisa tu email para confirmar tu cuenta.
                </AlertDescription>
              </Alert>
            )}
            
            {verificationSuccess && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ¡Email verificado! Ya puedes iniciar sesión.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Campo de Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            {/* Campo de Contraseña */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                  tabIndex={-1}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-2.5 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            {/* Remember me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                {...register('rememberMe')}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                Recordarme
              </Label>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {/* Botón de Login */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
            
            {/* Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>
            
            {/* OAuth Options */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => toast.info('Login con Google próximamente')}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => toast.info('Login con GitHub próximamente')}
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
            
            {/* Link de registro */}
            <div className="text-sm text-center space-y-2">
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link
                  to={`/register?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="text-primary hover:underline font-medium inline-flex items-center"
                >
                  Crear cuenta
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}