import { useEffect, useState } from 'react';
import { TrendingUp, Table2, Clock, ShoppingBag, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatDuration } from '../lib/billing';
import { useSettings } from '../hooks/useSettings';
import { translations } from '../lib/i18n';

interface DashboardStats {
  totalRevenueToday: number;
  playRevenueToday: number;
  barRevenueToday: number;
  activeTables: number;
  completedSessionsToday: number;
  avgDurationMinutes: number;
  topProducts: { name: string; sold: number; revenue: number }[];
  revenueByTable: { name: string; revenue: number }[];
  lowStockProducts: { name: string; stock: number }[];
  recentSessions: { id: string; table: string; total: number; duration: number; time: string; status: string }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    async function load() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [sessionsRes, productsRes, tablesRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*, billiard_tables(name), session_orders(*)')
          .gte('start_time', todayStart.toISOString())
          .order('start_time', { ascending: false }),
        supabase.from('products').select('*').order('sold_count', { ascending: false }),
        supabase.from('billiard_tables').select('*').eq('is_active', true),
      ]);

      const sessions = sessionsRes.data ?? [];
      const products = productsRes.data ?? [];
      const tables = tablesRes.data ?? [];

      const completed = sessions.filter((s) => s.status === 'completed');
      const activeTables = tables.filter((t) => t.status === 'occupied').length;

      const totalRevenue = completed.reduce((s, r) => s + r.total_cost, 0);
      const playRevenue = completed.reduce((s, r) => s + r.play_cost, 0);
      const barRevenue = completed.reduce((s, r) => s + r.products_cost, 0);

      const avgDuration = completed.length
        ? completed.reduce((sum, s) => {
            if (!s.end_time) return sum;
            return sum + (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000;
          }, 0) / completed.length
        : 0;

      const topProducts = products.slice(0, 5).map((p) => ({
        name: p.name,
        sold: p.sold_count,
        revenue: p.sold_count * p.price,
      }));

      const revenueByTable: Record<string, number> = {};
      completed.forEach((s) => {
        const name = s.billiard_tables?.name ?? 'Unknown';
        revenueByTable[name] = (revenueByTable[name] ?? 0) + s.total_cost;
      });

      const threshold = parseInt(String(settings.low_stock_threshold ?? 5));
      const lowStock = products.filter((p) => p.stock <= threshold);

      const recentSessions = sessions.slice(0, 8).map((s) => ({
        id: s.id,
        table: s.billiard_tables?.name ?? '—',
        total: s.total_cost,
        duration: s.end_time
          ? Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000)
          : Math.round((Date.now() - new Date(s.start_time).getTime()) / 60000),
        time: new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: s.status,
      }));

      setStats({
        totalRevenueToday: totalRevenue,
        playRevenueToday: playRevenue,
        barRevenueToday: barRevenue,
        activeTables,
        completedSessionsToday: completed.length,
        avgDurationMinutes: Math.round(avgDuration),
        topProducts,
        revenueByTable: Object.entries(revenueByTable).map(([name, revenue]) => ({ name, revenue })),
        lowStockProducts: lowStock.map((p) => ({ name: p.name, stock: p.stock })),
        recentSessions,
      });
      setLoading(false);
    }
    load();
  }, [settings.low_stock_threshold]);

  if (loading) return <PageLoader />;
  if (!stats) return null;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.dashboard}</h1>
        <p className="text-gray-500 text-sm mt-1">Bugun - {new Date().toLocaleDateString('uz-UZ')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={DollarSign} label="Bugun daromad" value={formatCurrency(stats.totalRevenueToday)} color="bg-blue-500" />
        <StatCard icon={Clock} label="O'yin daromad" value={formatCurrency(stats.playRevenueToday)} color="bg-teal-500" />
        <StatCard icon={ShoppingBag} label="Bar daromad" value={formatCurrency(stats.barRevenueToday)} color="bg-orange-500" />
        <StatCard icon={Table2} label="Faol stollar" value={String(stats.activeTables)} color="bg-red-500" />
        <StatCard icon={TrendingUp} label={translations.nav.sessions} value={String(stats.completedSessionsToday)} color="bg-emerald-500" />
        <StatCard icon={Clock} label="Oʻrt davom" value={formatDuration(stats.avgDurationMinutes)} color="bg-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Yaqinda yakunlangan</h2>
          {stats.recentSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">Bugun sessiya yo'q</p>
          ) : (
            <div className="space-y-2">
              {stats.recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{s.table}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        s.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.time} · {formatDuration(s.duration)}</p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Revenue by Table</h2>
            {stats.revenueByTable.length === 0 ? (
              <p className="text-gray-400 text-sm">No data today</p>
            ) : (
              <div className="space-y-3">
                {stats.revenueByTable.map((t) => (
                  <div key={t.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{t.name}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(t.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (t.revenue / (stats.totalRevenueToday || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.lowStockProducts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-amber-800 text-sm">Low Stock Alert</h2>
              </div>
              <div className="space-y-1">
                {stats.lowStockProducts.map((p) => (
                  <div key={p.name} className="flex justify-between text-sm">
                    <span className="text-amber-700">{p.name}</span>
                    <span className="font-bold text-amber-800">{p.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Top Selling Products</h2>
        {stats.topProducts.filter((p) => p.sold > 0).length === 0 ? (
          <p className="text-gray-400 text-sm">No sales yet today</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.topProducts.filter((p) => p.sold > 0).map((p) => (
              <div key={p.name} className="bg-gray-50 rounded-xl p-3">
                <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.sold} sold</p>
                <p className="text-sm font-semibold text-blue-600 mt-1">{formatCurrency(p.revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
