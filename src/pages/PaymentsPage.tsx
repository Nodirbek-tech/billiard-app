import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatDuration } from '../lib/billing';
import { translations, getPaymentMethodDisplay } from '../lib/i18n';
import type { SessionWithDetails } from '../lib/types';

export function PaymentsPage() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cash' | 'card' | 'mixed'>('all');

  useEffect(() => {
    supabase
      .from('sessions')
      .select('*, billiard_tables(*)')
      .eq('status', 'completed')
      .order('end_time', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setSessions((data as SessionWithDetails[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? sessions : sessions.filter((s) => s.payment_method === filter);
  const totalRevenue = filtered.reduce((s, r) => s + r.total_cost, 0);
  const cashRevenue = sessions.filter((s) => s.payment_method === 'cash').reduce((s, r) => s + r.total_cost, 0);
  const cardRevenue = sessions.filter((s) => s.payment_method === 'card').reduce((s, r) => s + r.total_cost, 0);

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.payments}</h1>
        <p className="text-gray-500 text-sm mt-1">{sessions.length} yakunlangan tranzaksiyalar</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">{translations.billing.grandTotal}</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(sessions.reduce((s, r) => s + r.total_cost, 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">{translations.payment.cash}</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(cashRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">{translations.payment.card}</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(cardRevenue)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'cash', 'card', 'mixed'] as const).map((m) => (
          <button key={m} onClick={() => setFilter(m)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filter === m ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {m === 'all' ? 'Barchasi' : m === 'cash' ? translations.payment.cash : m === 'card' ? translations.payment.card : translations.payment.mixed}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{translations.empty.noPayments}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.receipt}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.table}</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Sana / Vaqt</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.duration}</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">{translations.billing.paymentMethod}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{translations.billing.playCost}</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Bar</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">{translations.billing.total}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const start = new Date(s.start_time);
                  const end = s.end_time ? new Date(s.end_time) : null;
                  const mins = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.receipt_number ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.billiard_tables?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{start.toLocaleDateString('uz-UZ')} {start.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-600">{mins > 0 ? formatDuration(mins) : '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={s.payment_method === 'cash' ? 'green' : s.payment_method === 'card' ? 'blue' : 'yellow'}>
                          {getPaymentMethodDisplay(s.payment_method ?? 'cash')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.play_cost)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(s.products_cost)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(s.total_cost)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right font-bold text-gray-900">{translations.billing.total} ({filtered.length} {translations.labels.sessions})</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700 text-base">{formatCurrency(totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
