import { useEffect, useState } from 'react';
import { History, Search, Eye, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { ReceiptView } from '../components/receipt/ReceiptView';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDuration } from '../lib/billing';
import { useSettings } from '../hooks/useSettings';
import { translations, getStatusDisplay } from '../lib/i18n';
import type { SessionWithDetails } from '../lib/types';

export function SessionsPage() {
  const { settings } = useSettings();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [viewSession, setViewSession] = useState<SessionWithDetails | null>(null);

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*, billiard_tables(*), session_orders(*)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setSessions((data as SessionWithDetails[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = sessions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search &&
      !s.billiard_tables?.name.toLowerCase().includes(search.toLowerCase()) &&
      !s.receipt_number?.toLowerCase().includes(search.toLowerCase()) &&
      !s.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.sessions}</h1>
        <p className="text-gray-500 text-sm mt-1">{sessions.length} jami sessiya</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Stol, chek, mijoz bo'yicha qidiring..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['all', 'active', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Barchasi' : s === 'active' ? translations.status.active : translations.status.completed}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{translations.empty.noSessions}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.table}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.customer}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.actions.start}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.duration}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.labels.sessions}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{translations.billing.playCost}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Bar</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{translations.billing.total}</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">{translations.billing.receipt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const start = new Date(s.start_time);
                  const end = s.end_time ? new Date(s.end_time) : null;
                  const mins = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.billiard_tables?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{mins > 0 ? formatDuration(mins) : '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.status === 'completed' ? 'green' : s.status === 'active' ? 'red' : 'gray'}>
                          {getStatusDisplay(s.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.play_cost)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.products_cost)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(s.total_cost)}</td>
                      <td className="px-4 py-3 text-center">
                        {s.status === 'completed' && (
                          <button
                            onClick={() => setViewSession(s)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!viewSession} onClose={() => setViewSession(null)} title="Receipt" size="lg">
        {viewSession && (
          <ReceiptView
            session={viewSession}
            businessName={settings.business_name}
            receiptFooter={settings.receipt_footer}
            onBack={() => setViewSession(null)}
          />
        )}
      </Modal>
    </div>
  );
}
