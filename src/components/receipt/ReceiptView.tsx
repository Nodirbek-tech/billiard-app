import { useRef } from 'react';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import type { SessionWithDetails } from '../../lib/types';
import { formatCurrency, formatDuration } from '../../lib/billing';
import { translations } from '../../lib/i18n';

interface Props {
  session: SessionWithDetails;
  businessName?: string;
  receiptFooter?: string;
  onBack?: () => void;
  onPrint?: () => void;
}

export function ReceiptView({ session, businessName = 'JOCKER', receiptFooter, onBack, onPrint }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (onPrint) { onPrint(); return; }
    window.print();
  }

  function handleSavePDF() {
    window.print();
  }

  const start = new Date(session.start_time);
  const end = session.end_time ? new Date(session.end_time) : new Date();
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      {onBack && (
        <div className="w-full max-w-md mb-4 flex gap-3 print:hidden">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {translations.actions.back}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Printer className="w-4 h-4" />
            {translations.actions.print} {translations.billing.receipt}
          </button>
          <button
            onClick={handleSavePDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Saqlash
          </button>
        </div>
      )}

      <div
        ref={printRef}
        className="bg-white w-full max-w-md rounded-2xl shadow-lg overflow-hidden print:shadow-none print:rounded-none"
      >
        <div className="bg-slate-900 text-white p-6 text-center">
          <h1 className="text-2xl font-bold">{businessName || 'JOCKER'}</h1>
          <p className="text-slate-400 text-sm mt-1">{translations.billing.receipt}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{translations.billing.receiptNumber}</span>
            <span className="font-mono font-semibold text-gray-900">{session.receipt_number ?? '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{translations.billing.date}</span>
            <span className="text-gray-900">{start.toLocaleDateString('uz-UZ')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{translations.billing.table}</span>
            <span className="text-gray-900">{session.billiard_tables?.name}</span>
          </div>
          {session.customer_name && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{translations.billing.customer}</span>
              <span className="text-gray-900">{session.customer_name}</span>
            </div>
          )}

          <hr className="border-dashed border-gray-200" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{translations.billing.startTime}</span>
              <span className="text-gray-900">{start.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{translations.billing.endTime}</span>
              <span className="text-gray-900">{end.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{translations.billing.duration}</span>
              <span className="font-medium text-gray-900">{formatDuration(totalMinutes)}</span>
            </div>
          </div>

          <hr className="border-dashed border-gray-200" />

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">{translations.billing.playCost}</p>
            {session.session_rounds && session.session_rounds.length > 0 ? (
              <div className="space-y-1">
                {[...session.session_rounds]
                  .sort((a, b) => a.round_number - b.round_number)
                  .map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        {translations.rounds.round} {r.round_number} ({formatDuration(r.duration_minutes)})
                      </span>
                      <span className="text-gray-900">{formatCurrency(r.calculated_cost)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                {session.day_minutes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{translations.rates.dayRate} ({formatDuration(session.day_minutes)})</span>
                    <span className="text-gray-900">{formatCurrency(session.day_cost)}</span>
                  </div>
                )}
                {session.night_minutes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{translations.rates.nightRate} ({formatDuration(session.night_minutes)})</span>
                    <span className="text-gray-900">{formatCurrency(session.night_cost)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm font-medium mt-2 pt-1.5 border-t border-dashed border-gray-100">
              <span className="text-gray-700">O'yin jamasi</span>
              <span className="text-gray-900">{formatCurrency(session.play_cost)}</span>
            </div>
          </div>

          {session.session_orders && session.session_orders.length > 0 && (
            <>
              <hr className="border-dashed border-gray-200" />
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">{translations.billing.barOrders}</p>
                <div className="space-y-1.5">
                  {session.session_orders.map((order) => (
                    <div key={order.id} className="flex justify-between text-sm">
                      <span className="text-gray-500">{order.product_name} x{order.quantity}</span>
                      <span className="text-gray-900">{formatCurrency(order.total_price)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-medium mt-1">
                  <span className="text-gray-700">Bar jamasi</span>
                  <span className="text-gray-900">{formatCurrency(session.products_cost)}</span>
                </div>
              </div>
            </>
          )}

          <hr className="border-gray-200" />

          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">{translations.billing.total}</span>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(session.total_cost)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{translations.billing.paymentMethod}</span>
            <span className="font-medium text-gray-900">{session.payment_method ? translations.payment[session.payment_method as keyof typeof translations.payment] : '—'}</span>
          </div>

          {session.profiles && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Operator</span>
              <span className="text-gray-900">{session.profiles.full_name || session.profiles.email}</span>
            </div>
          )}

          <hr className="border-dashed border-gray-200" />

          <div className="text-center text-sm font-semibold text-gray-700 pt-2">
            {translations.messages.thankYou}
          </div>

          {receiptFooter && (
            <div className="text-center text-xs text-gray-400 pt-2">
              {receiptFooter}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
