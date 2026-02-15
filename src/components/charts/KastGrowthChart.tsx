import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CHART_COLORS } from './DefiChartTheme';

// On-chain verified data from Movement Network indexer
// Source: Kast distribution wallet 0x4500...7f01
// MOVE distributed / 0.04 cashback rate = estimated card spend
// USD estimated at MOVE price during each period
const KAST_DATA = [
  {
    month: 'Dec 2025',
    users: 32,
    volume: 47153,
    moveDistributed: 75446,
  },
  {
    month: 'Jan 2026',
    users: 6793,
    volume: 8311240,
    moveDistributed: 13297984,
  },
  {
    month: 'Feb 2026',
    users: 3645,
    volume: 5458427,
    moveDistributed: 8733484,
    partial: true,
  },
];

function formatUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatUsers(value: number): string {
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const entry = KAST_DATA.find((d) => d.month === label);

  return (
    <div
      className="rounded-lg border px-4 py-3 text-sm"
      style={{
        background: CHART_COLORS.darkSurface,
        borderColor: CHART_COLORS.neonGreen,
      }}
    >
      <p className="font-semibold mb-2" style={{ color: CHART_COLORS.textLight }}>
        {label}{entry?.partial ? ' (14 days)' : ''}
      </p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs mb-1">
          {p.name}: {p.dataKey === 'users' ? formatUsers(p.value) : formatUSD(p.value)}
        </p>
      ))}
      {entry && (
        <p className="text-xs mt-1" style={{ color: CHART_COLORS.textMuted }}>
          MOVE distributed: {(entry.moveDistributed / 1_000_000).toFixed(1)}M
        </p>
      )}
    </div>
  );
}

export function KastGrowthChart() {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 my-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Kast Card Growth. Users vs Card Spend Volume
          </h4>
          <p className="text-xs mt-1" style={{ color: CHART_COLORS.textMuted }}>
            On-chain data from Movement Network. 4% MOVE cashback program.
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={KAST_DATA} barGap={8}>
          <XAxis
            dataKey="month"
            tick={{ fill: CHART_COLORS.textLight, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="volume"
            orientation="left"
            tickFormatter={formatUSD}
            tick={{ fill: CHART_COLORS.electricBlue, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <YAxis
            yAxisId="users"
            orientation="right"
            tickFormatter={formatUsers}
            tick={{ fill: CHART_COLORS.neonGreen, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: CHART_COLORS.textMuted }}
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            name="Card Spend (USD)"
            fill={CHART_COLORS.electricBlue}
            radius={[4, 4, 0, 0]}
            animationDuration={800}
          />
          <Bar
            yAxisId="users"
            dataKey="users"
            name="Unique Users"
            fill={CHART_COLORS.neonGreen}
            radius={[4, 4, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      <p className="text-right text-[10px] mt-1" style={{ color: CHART_COLORS.textMuted }}>
        On-chain verified · Movement Network Indexer · DeFi México
      </p>
    </div>
  );
}
