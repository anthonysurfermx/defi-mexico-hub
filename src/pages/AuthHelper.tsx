// src/pages/AuthHelper.tsx - Helper temporal para procesar tokens OAuth
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function AuthHelper() {
  const navigate = useNavigate();
  const { handleAuthCallback, refreshUser } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Si tenemos tokens en la URL (hash fragment), procesarlos
        if (window.location.hash.includes('access_token')) {
          console.log('🔐 Processing OAuth callback from hash...');
          
          // Procesar el callback
          const result = await handleAuthCallback();
          
          if (!result.error) {
            // Refrescar datos del usuario
            await refreshUser();
            console.log('✅ OAuth login successful');
            navigate('/', { replace: true });
          } else {
            console.error('❌ OAuth callback error:', result.error);
            navigate('/login?error=oauth_failed', { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ Auth processing error:', error);
        navigate('/login?error=auth_processing_failed', { replace: true });
      }
    };

    processAuth();
  }, [handleAuthCallback, refreshUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Procesando autenticación...</p>
      </div>
    </div>
  );
}