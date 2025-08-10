import { useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { Trophy, TrendingUp, Users, Briefcase } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';

// Animated number using framer-motion springs
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  spring.set(value);
  const rounded = useTransform(spring, latest => Math.floor(latest));
  return <motion.span>{rounded}</motion.span>;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: number;
  icon: any;
  trend?: { value: string; isPositive: boolean };
}) {
  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
      <Card className="glass-card overflow-hidden">
        <div className="h-1 gradient-purple" aria-hidden="true" />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-neon-green' : 'text-destructive'}`} aria-label={`Tendencia ${trend.isPositive ? 'positiva' : 'negativa'} ${trend.value}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">
              <AnimatedNumber value={value} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const growthData = [
  { month: 'Ene', startups: 6, usuarios: 120 },
  { month: 'Feb', startups: 9, usuarios: 200 },
  { month: 'Mar', startups: 12, usuarios: 320 },
  { month: 'Abr', startups: 18, usuarios: 450 },
  { month: 'May', startups: 26, usuarios: 610 },
  { month: 'Jun', startups: 34, usuarios: 790 },
];

const leaderboard = [
  { name: 'Kubo Finance', metric: 'TVL', value: '$12.5M' },
  { name: 'Bitso Yield', metric: 'Usuarios', value: '85k' },
  { name: 'Minka MX', metric: 'Volumen', value: '$4.1M' },
  { name: 'DeFi Latam', metric: 'Comunidad', value: '25k' },
];

export default function DashboardWeb3() {
  // SEO basics for SPA
  useMemo(() => {
    document.title = 'DeFi México - Dashboard Web3';
  }, []);

  return (
    <main>
      {/* Hero background */}
      <section className="relative py-12 md:py-16 gradient-purple">
        <div className="absolute inset-0 opacity-20 gradient-glow" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">
              Dashboard Web3 del Hub DeFi México
            </h1>
            <p className="text-white/80 mt-2">
              Métricas en tiempo real, actividad reciente y líderes del ecosistema
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="-mt-10 pb-16">
        <div className="container mx-auto px-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Startups listadas" value={128} icon={Briefcase} trend={{ value: '12% MoM', isPositive: true }} />
            <StatsCard title="Usuarios activos" value={8200} icon={Users} trend={{ value: '5% WoW', isPositive: true }} />
            <StatsCard title="Crecimiento" value={26} icon={TrendingUp} trend={{ value: '2.1% d/d', isPositive: true }} />
            <StatsCard title="Líderes" value={10} icon={Trophy} trend={{ value: '-1.2% w/w', isPositive: false }} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <Card className="glass-card col-span-2">
              <CardHeader>
                <CardTitle>Crecimiento del ecosistema</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="usuarios" stroke="hsl(var(--primary))" fill="url(#colorA)" />
                    <Line type="monotone" dataKey="startups" stroke="hsl(var(--electric-blue))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Actividad por mes</CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="startups" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity + Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <ActivityTimeline />
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Top performers</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {leaderboard.map((item) => (
                    <li key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.metric}</p>
                      </div>
                      <span className="text-sm text-foreground font-semibold">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
