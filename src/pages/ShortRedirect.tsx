import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ShortRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) { navigate('/', { replace: true }); return; }

    const resolve = async () => {
      const db = supabase as any;
      const { data, error: err } = await db
        .from('short_urls')
        .select('target_path')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (err || !data) {
        setError(true);
        setTimeout(() => navigate('/', { replace: true }), 2000);
        return;
      }

      // Fire-and-forget click count increment
      db.rpc('increment_click', { url_code: code }).catch(() => {});

      // Redirect
      if (data.target_path.startsWith('http')) {
        window.location.replace(data.target_path);
      } else {
        navigate(data.target_path, { replace: true });
      }
    };

    resolve();
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-lg font-medium text-foreground">Link no encontrado</p>
            <p className="text-sm text-muted-foreground">Redirigiendo al inicio...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
          </>
        )}
      </div>
    </div>
  );
}
