import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useLanguage } from '@/lib/i18n';

export default function BreakdownPanel({
  data,
  valueLabel = 'Revenue',
  formatValue,
  limit
}) {
  const { t } = useLanguage();
  const fmt = formatValue || ((v) => v);
  const storeLabels = { yt: 'YouTube' };
  const labelOf = (key) => storeLabels[String(key).toLowerCase()] || key;
  const items = limit ? data.slice(0, limit) : data;
  
  // Show clean, wide, solid bars for top 10 items to prevent dot-like crowded lines
  const chartItems = items.slice(0, 10);
  const chartData = chartItems.map((d) => ({ name: String(labelOf(d.key)).slice(0, 18), value: d.value }));
  const total = items.reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            {/* Clean subtle horizontal grid line without vertical dot-dot pattern */}
            <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={55}
              stroke="rgba(255, 255, 255, 0.15)"
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(255, 255, 255, 0.15)" width={65} />
            <Tooltip
              formatter={(v) => fmt(v)}
              contentStyle={{
                backgroundColor: '#191026',
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: '#f8f5fc',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
            />
            {/* Solid, thick, beautiful rounded bars like the track chart */}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('breakdown.breakdown')}</TableHead>
              <TableHead className="text-right">{valueLabel}</TableHead>
              <TableHead className="text-right">{t('breakdown.share')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
              return (
                <TableRow key={d.key}>
                  <TableCell className="font-medium text-foreground">{labelOf(d.key)}</TableCell>
                  <TableCell className="text-right text-foreground font-semibold">{fmt(d.value)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
