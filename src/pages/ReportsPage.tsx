import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDuration } from '../lib/billing';
import { translations } from '../lib/i18n';
import type { SessionWithDetails } from '../lib/types';

type Period = '7d' | '30d' | '90d';

export function ReportsPage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');

  useEffect(() => {
    setLoading(true);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const since = new Date();
    since.setDate(since.getDate() - days);
    supabase
      .from('sessions')
      .select('*, billiard_tables(*), session_orders(*)')
      .eq('status', 'completed')
      .gte('start_time', since.toISOString())
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        setSessions((data as SessionWithDetails[]) ?? []);
        setLoading(false);
      });
  }, [period]);

  const totalRevenue = sessions.reduce((s, r) => s + r.total_cost, 0);
  const playRevenue = sessions.reduce((s, r) => s + r.play_cost, 0);
  const barRevenue = sessions.reduce((s, r) => s + r.products_cost, 0);

  const avgDuration = sessions.length > 0
    ? sessions.reduce((sum, s) => {
        if (!s.end_time) return sum;
        return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
      }, 0) / sessions.length
    : 0;

  const tableStats: Record<string, { revenue: number; sessions: number }> = {};
  sessions.forEach((s) => {
    const name = s.billiard_tables?.name ?? 'Unknown';
    if (!tableStats[name]) tableStats[name] = { revenue: 0, sessions: 0 };
    tableStats[name].revenue += s.total_cost;
    tableStats[name].sessions += 1;
  });

  const productStats: Record<string, { sold: number; revenue: number }> = {};
  sessions.forEach((s) => {
    s.session_orders?.forEach((o) => {
      if (!productStats[o.product_name]) productStats[o.product_name] = { sold: 0, revenue: 0 };
      productStats[o.product_name].sold += o.quantity;
      productStats[o.product_name].revenue += o.total_price;
    });
  });
  const topProducts = Object.entries(productStats).sort((a, b) => b[1].sold - a[1].sold).slice(0, 10);

  const dailyRevenue: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = new Date(s.start_time).toLocaleDateString();
    dailyRevenue[day] = (dailyRevenue[day] ?? 0) + s.total_cost;
  });
  const maxDaily = Math.max(...Object.values(dailyRevenue), 1);

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{translations.nav.reports}</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} sessiya davr ichida</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p === '7d' ? '7 kun' : p === '30d' ? '30 kun' : '90 kun'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jami daromad', value: formatCurrency(totalRevenue), sub: `${sessions.length} ${translations.labels.sessions}` },
          { label: "O'yin daromadi", value: formatCurrency(playRevenue), sub: `${Math.round(playRevenue / Math.max(totalRevenue, 1) * 100)}% umumiy` },
          { label: 'Bar daromadi', value: formatCurrency(barRevenue), sub: `${Math.round(barRevenue / Math.max(totalRevenue, 1) * 100)}% umumiy` },
          { label: translations.billing.duration, value: formatDuration(Math.round(avgDuration)), sub: `har ${translations.labels.sessions}` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            Daily Revenue
          </h2>
          {Object.keys(dailyRevenue).length === 0 ? (
            <p className="text-gray-400 text-sm">No data in this period</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(dailyRevenue).slice(-14).map(([day, rev]) => (
                <div key={day}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{day}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(rev)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(rev / maxDaily) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Revenue by Table
          </h2>
          {Object.keys(tableStats).length === 0 ? (
            <p className="text-gray-400 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(tableStats).map(([name, stat]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{name}</span>
                    <div className="flex gap-4">
                      <span className="text-gray-400">{stat.sessions} sessions</span>
                      <span className="font-medium text-gray-900">{formatCurrency(stat.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(stat.revenue / Math.max(totalRevenue, 1)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-400 text-sm">No product sales in this period</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topProducts.map(([name, stat]) => (
              <div key={name} className="bg-gray-50 rounded-xl p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.sold} sold</p>
                <p className="text-sm font-semibold text-blue-600 mt-1">{formatCurrency(stat.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
