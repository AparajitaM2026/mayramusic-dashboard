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
  // Display labels for store/DSP abbreviations that appear in raw CSV data.
  const storeLabels = { yt: 'YouTube' };
  const labelOf = (key) => storeLabels[String(key).toLowerCase()] || key;
  const items = limit ? data.slice(0, limit) : data;
  const chartData = items.map((d) => ({ name: String(labelOf(d.key)).slice(0, 18), value: d.value }));
  const total = items.reduce((acc, d) => acc + (d.value || 0), 0);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} width={70} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('breakdown.breakdown')}</TableHead>
              <TableHead className="text-right">{valueLabel}</TableHead>
              <TableHead className="text-right">{t('breakdown.share')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{labelOf(d.key)}</TableCell>
                <TableCell className="text-right">{fmt(d.value)}</TableCell>
                <TableCell className="text-right text-slate-500">
                  {total ? ((d.value / total) * 100).toFixed(1) : 0}%
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-slate-400 py-8">
                  {t('breakdown.no_data')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}