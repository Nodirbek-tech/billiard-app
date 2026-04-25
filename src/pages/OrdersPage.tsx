import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { formatCurrency } from '../lib/billing';
import { translations } from '../lib/i18n';
import type { SessionOrder } from '../lib/types';

interface OrderWithSession extends SessionOrder {
  sessions?: { id: string; billiard_tables?: { name: string } };
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('session_orders')
      .select('*, sessions(id, billiard_tables(name))')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setOrders((data as OrderWithSession[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.orders}</h1>
        <p className="text-gray-500 text-sm mt-1">{translations.labels.productOrders}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{translations.empty.noOrders}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Mahsulot</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">{translations.billing.table}</th>
                <th className="text-center px-4 py-3 text-gray-500 font-medium">Miqdor</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Bitta narxi</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">{translations.billing.total}</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.product_name}</td>
                  <td className="px-4 py-3 text-gray-500">{o.sessions?.billiard_tables?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{o.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(o.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(o.total_price)}</td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
