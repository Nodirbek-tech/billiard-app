import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ShoppingCart, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTables } from '../hooks/useTables';
import { useSettings } from '../hooks/useSettings';
import { TableCard } from '../components/tables/TableCard';
import { ReceiptView } from '../components/receipt/ReceiptView';
import { Modal } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import {
  calculateBilling, calculateLiveBilling, generateReceiptNumber, formatCurrency
} from '../lib/billing';
import { translations } from '../lib/i18n';
import type { TableWithSession, SessionWithDetails, PaymentMethod, SessionRound } from '../lib/types';

export function TablesPage() {
  const { tables, loading, error, reload } = useTables();
  const { rates, settings } = useSettings();

  const [stopModal, setStopModal] = useState<TableWithSession | null>(null);
  const [addOrderModal, setAddOrderModal] = useState<TableWithSession | null>(null);
  const [completedSession, setCompletedSession] = useState<SessionWithDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function closeActiveRound(sessionId: string, rounds: SessionRound[]): Promise<number> {
    const activeRound = rounds.find((r) => !r.end_time);
    if (!activeRound) return 0;

    const endTime = new Date();
    const billing = calculateBilling(new Date(activeRound.start_time), endTime, rates);
    const mins = Math.round(billing.dayMinutes + billing.nightMinutes);

    await supabase.from('session_rounds').update({
      end_time: endTime.toISOString(),
      duration_minutes: mins,
      day_minutes: billing.dayMinutes,
      night_minutes: billing.nightMinutes,
      day_cost: billing.dayCost,
      night_cost: billing.nightCost,
      calculated_cost: billing.totalPlayCost,
    }).eq('id', activeRound.id);

    return billing.totalPlayCost;
  }

  async function handleStart(tableId: string) {
    setSubmitting(true);
    
    // BUG FIX: Check for existing active sessions before starting
    const { data: existingSessions, error: checkErr } = await supabase
      .from('sessions')
      .select('id, status')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .maybeSingle();

    if (checkErr) {
      showToast('Xatolik: Sessiyani tekshira olmadi', 'error');
      setSubmitting(false);
      return;
    }

    if (existingSessions) {
      showToast('Ushbu stolda allaqachon faol sessiya bor. Avval yakunlang.', 'error');
      setSubmitting(false);
      reload();
      return;
    }

    // Create new session with current timestamp
    const startTime = new Date().toISOString();
    const { data: session, error: sessErr } = await supabase
      .from('sessions')
      .insert({
        table_id: tableId,
        operator_id: null,
        start_time: startTime,
        status: 'active',
        play_cost: 0,
        products_cost: 0,
        total_cost: 0,
      })
      .select()
      .maybeSingle();

    if (sessErr || !session) {
      showToast(sessErr?.message ?? 'Sessiya boshlab bolmadi', 'error');
      setSubmitting(false);
      return;
    }

    // Create first round
    const { error: roundErr } = await supabase.from('session_rounds').insert({
      session_id: session.id,
      round_number: 1,
      start_time: startTime,
    });

    if (roundErr) {
      showToast('O\'yin yaratib bolmadi', 'error');
      // Try to clean up the session
      await supabase.from('sessions').delete().eq('id', session.id);
      setSubmitting(false);
      return;
    }

    // Update table status ONLY after session and round created successfully
    const { error: tableErr } = await supabase.from('billiard_tables').update({ status: 'occupied' }).eq('id', tableId);
    
    if (tableErr) {
      showToast('Stol statusini yangilash xatoligi', 'error');
      setSubmitting(false);
      return;
    }

    reload();
    showToast(translations.messages.sessionStarted);
    setSubmitting(false);
  }

  async function handleNextRound(table: TableWithSession) {
    const session = table.active_session;
    if (!session) return;
    const rounds: SessionRound[] = session.session_rounds ?? [];
    const activeRound = rounds.find((r) => !r.end_time);
    if (!activeRound) return;

    setSubmitting(true);
    await closeActiveRound(session.id, rounds);

    const nextNum = (rounds.length) + 1;
    await supabase.from('session_rounds').insert({
      session_id: session.id,
      round_number: nextNum,
      start_time: new Date().toISOString(),
    });

    reload();
    showToast(`Round ${nextNum} started`);
    setSubmitting(false);
  }

  async function handleStopConfirm() {
    if (!stopModal) return;
    const table = stopModal;
    const session = table.active_session;
    if (!session) return;
    setSubmitting(true);

    try {
      const rounds: SessionRound[] = session.session_rounds ?? [];
      
      // Step 1: Close active round (MUST succeed before continuing)
      await closeActiveRound(session.id, rounds);

      // Step 2: Fetch updated rounds from database
      const { data: freshRounds, error: freshErr } = await supabase
        .from('session_rounds')
        .select('*')
        .eq('session_id', session.id);

      if (freshErr || !freshRounds) {
        showToast('O\'yinlarni qayta yuklash xatoligi', 'error');
        setSubmitting(false);
        return;
      }

      // Step 3: Calculate totals
      const allRounds = freshRounds;
      const totalPlayCost = allRounds.reduce((s, r) => s + (r.calculated_cost || 0), 0);
      const productsCost = session.session_orders?.reduce((s, o) => s + o.total_price, 0) ?? 0;
      const receiptNumber = generateReceiptNumber();
      const endTime = new Date().toISOString();

      // Step 4: Update session status to completed (CRITICAL - MUST succeed)
      const { data: updatedSession, error: sessionErr } = await supabase
        .from('sessions')
        .update({
          end_time: endTime,
          status: 'completed',
          play_cost: totalPlayCost,
          products_cost: productsCost,
          total_cost: totalPlayCost + productsCost,
          payment_method: paymentMethod,
          customer_name: customerName,
          receipt_number: receiptNumber,
          day_minutes: allRounds.reduce((s, r) => s + (r.day_minutes || 0), 0),
          night_minutes: allRounds.reduce((s, r) => s + (r.night_minutes || 0), 0),
          day_cost: allRounds.reduce((s, r) => s + (r.day_cost || 0), 0),
          night_cost: allRounds.reduce((s, r) => s + (r.night_cost || 0), 0),
        })
        .eq('id', session.id)
        .select(`*, billiard_tables(*), session_orders(*), session_rounds(*)`)
        .maybeSingle();

      if (sessionErr || !updatedSession) {
        showToast(sessionErr?.message || 'Sessiya yakunlash xatoligi', 'error');
        setSubmitting(false);
        return;
      }

      // Step 5: Update table status to available ONLY after session is confirmed completed
      const { error: tableErr } = await supabase.from('billiard_tables').update({ status: 'available' }).eq('id', table.id);
      
      if (tableErr) {
        showToast('Stol statusini "BO\'SH" ga o\'tkazib bolmadi', 'error');
        setSubmitting(false);
        return;
      }

      // Step 6: All operations succeeded - update UI
      setStopModal(null);
      setCompletedSession(updatedSession as SessionWithDetails);
      reload();
    } catch (err) {
      showToast('Noma\'lum xatolik yuz berdi', 'error');
      console.error(err);
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoader />;

  if (completedSession) {
    return (
      <ReceiptView
        session={completedSession}
        businessName={settings.business_name}
        receiptFooter={settings.receipt_footer}
        onBack={() => { setCompletedSession(null); setCustomerName(''); setPaymentMethod('cash'); }}
      />
    );
  }

  const stopSession = stopModal;
  const stopSessionData = stopSession?.active_session;
  const stopRounds = (stopSessionData?.session_rounds ?? []) as SessionRound[];
  const stopActiveRound = stopRounds.find((r) => !r.end_time);
  const stopCompletedCost = stopRounds.filter((r) => !!r.end_time).reduce((s, r) => s + r.calculated_cost, 0);
  const liveBilling = stopActiveRound
    ? calculateLiveBilling(new Date(stopActiveRound.start_time), rates)
    : null;
  const stopTotalPlay = stopCompletedCost + (liveBilling?.totalPlayCost ?? 0);
  const stopProductsCost = stopSessionData?.session_orders?.reduce((s, o) => s + o.total_price, 0) ?? 0;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.tables}</h1>
        <p className="text-gray-500 text-sm mt-1">{translations.labels.manageTableSessions}</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            rates={rates}
            onStart={handleStart}
            onNextRound={handleNextRound}
            onStop={(t) => { setStopModal(t); setPaymentMethod('cash'); setCustomerName(''); }}
            onAddOrder={setAddOrderModal}
          />
        ))}
      </div>

      {/* Stop Session Modal */}
      <Modal
        isOpen={!!stopModal}
        onClose={() => !submitting && setStopModal(null)}
        title={`${translations.actions.stop} - Sessiyani yakunlash`}
        size="md"
      >
        {stopModal && stopSessionData && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                <span>{translations.billing.table}</span>
                <span>{stopModal.name}</span>
              </div>

              {stopRounds.filter((r) => !!r.end_time).map((r) => (
                <div key={r.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{translations.rounds.round} {r.round_number} ({r.duration_minutes}m)</span>
                  <span className="text-gray-700">{formatCurrency(r.calculated_cost)}</span>
                </div>
              ))}

              {stopActiveRound && liveBilling && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{translations.rounds.round} {stopActiveRound.round_number} (joriy)</span>
                  <span className="text-gray-700">{formatCurrency(liveBilling.totalPlayCost)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm pt-1 border-t border-gray-200">
                <span className="text-gray-600 font-medium">{translations.billing.playCost}</span>
                <span className="font-semibold text-gray-900">{formatCurrency(stopTotalPlay)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{translations.billing.barOrders}</span>
                <span className="font-medium text-gray-900">{formatCurrency(stopProductsCost)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">{translations.billing.grandTotal}</span>
                <span className="font-bold text-blue-700 text-lg">{formatCurrency(stopTotalPlay + stopProductsCost)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{translations.billing.customer} (ixtiyoriy)</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`${translations.billing.customer} nomini kiriting...`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translations.billing.paymentMethod}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'card', 'mixed'] as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${
                      paymentMethod === m
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {translations.payment[m as keyof typeof translations.payment]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStopConfirm}
              disabled={submitting}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200 text-sm"
            >
              <CreditCard className="w-5 h-5" />
              {submitting ? translations.messages.processingStop : translations.messages.confirmGenerateReceipt}
            </button>
          </div>
        )}
      </Modal>

      {addOrderModal && (
        <AddOrderModal
          table={addOrderModal}
          onClose={() => setAddOrderModal(null)}
          onAdded={() => { reload(); showToast('Order added!'); }}
        />
      )}
    </div>
  );
}

function AddOrderModal({ table, onClose, onAdded }: {
  table: TableWithSession;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [products, setProducts] = useState<{ id: string; name: string; price: number; stock: number; sold_count: number; category: string }[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const session = table.active_session;

  useEffect(() => {
    supabase.from('products').select('id,name,price,stock,sold_count,category').eq('is_active', true).order('category').then(({ data }) => {
      setProducts(data ?? []);
      setLoadingProducts(false);
    });
  }, []);

  async function handleAdd() {
    if (!selectedProduct || !session) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    if (quantity > product.stock) { setError(`Only ${product.stock} in stock`); return; }
    setSubmitting(true);
    setError('');

    const { error: orderError } = await supabase.from('session_orders').insert({
      session_id: session.id,
      product_id: product.id,
      product_name: product.name,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity,
    });

    if (!orderError) {
      await supabase.from('products').update({
        stock: product.stock - quantity,
        sold_count: (product.sold_count ?? 0) + quantity,
      }).eq('id', product.id);

      await supabase.from('stock_movements').insert({
        product_id: product.id,
        quantity_change: -quantity,
        movement_type: 'sale',
        reference_id: session.id,
        note: `Sold to ${table.name}`,
      });

      onAdded();
      onClose();
    } else {
      setError(orderError.message);
    }
    setSubmitting(false);
  }

  const selected = products.find((p) => p.id === selectedProduct);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Add Order — ${table.name}`} size="md">
      <div className="space-y-4">
        {loadingProducts ? (
          <p className="text-center text-gray-400 py-4">Loading products...</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => { setSelectedProduct(e.target.value); setQuantity(1); setError(''); }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.name} — {new Intl.NumberFormat('uz-UZ').format(p.price)} UZS {p.stock === 0 ? '(Out of stock)' : `(${p.stock} left)`}
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg font-bold">−</button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(selected.stock, quantity + 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg font-bold">+</button>
                  <span className="text-sm text-gray-400 ml-2">Max: {selected.stock}</span>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-xl flex justify-between">
                  <span className="text-sm text-blue-600 font-medium">Subtotal</span>
                  <span className="text-sm font-bold text-blue-700">{new Intl.NumberFormat('uz-UZ').format(selected.price * quantity)} UZS</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!selectedProduct || submitting}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {submitting ? 'Adding...' : 'Add to Session'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
