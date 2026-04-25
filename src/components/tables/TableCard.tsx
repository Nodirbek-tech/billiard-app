import { useEffect, useState } from 'react';
import { Play, Square, ShoppingCart, SkipForward, Sun, Moon, Clock, ChevronRight } from 'lucide-react';
import type { TableWithSession, RateConfig, SessionRound } from '../../lib/types';
import { calculateLiveBilling, formatCurrency, formatDuration, getCurrentRate } from '../../lib/billing';
import { translations, getStatusDisplay } from '../../lib/i18n';

interface Props {
  table: TableWithSession;
  rates: RateConfig;
  onStart: (tableId: string) => void;
  onNextRound: (table: TableWithSession) => void;
  onStop: (table: TableWithSession) => void;
  onAddOrder: (table: TableWithSession) => void;
}

function useRoundTicker(roundStartTime: string | null, rates: RateConfig) {
  const [roundMinutes, setRoundMinutes] = useState(0);
  const [roundCost, setRoundCost] = useState(0);

  useEffect(() => {
    if (!roundStartTime) return;
    function tick() {
      const billing = calculateLiveBilling(new Date(roundStartTime!), rates);
      setRoundMinutes(billing.dayMinutes + billing.nightMinutes);
      setRoundCost(billing.totalPlayCost);
    }
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [roundStartTime, rates]);

  return { roundMinutes, roundCost };
}

export function TableCard({ table, rates, onStart, onNextRound, onStop, onAddOrder }: Props) {
  const isOccupied = table.status === 'occupied';
  const session = table.active_session;

  const rounds: SessionRound[] = session?.session_rounds
    ? [...session.session_rounds].sort((a, b) => a.round_number - b.round_number)
    : [];

  const activeRound = rounds.find((r) => !r.end_time) ?? null;
  const completedRounds = rounds.filter((r) => !!r.end_time);

  const { roundMinutes, roundCost } = useRoundTicker(activeRound?.start_time ?? null, rates);

  const completedPlayCost = completedRounds.reduce((s, r) => s + r.calculated_cost, 0);
  const totalPlayCost = completedPlayCost + roundCost;
  const completedPlayMinutes = completedRounds.reduce((s, r) => s + r.duration_minutes, 0);
  const totalPlayMinutes = completedPlayMinutes + roundMinutes;
  const productsCost = session?.session_orders?.reduce((s, o) => s + o.total_price, 0) ?? 0;
  const grandTotal = totalPlayCost + productsCost;
  const currentRate = getCurrentRate(rates);

  return (
    <div className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
      isOccupied
        ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg shadow-red-100'
        : 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md'
    }`}>
      <div className={`px-5 py-4 flex items-center justify-between ${isOccupied ? 'bg-red-600' : 'bg-emerald-600'}`}>
        <div>
          <h3 className="text-white font-bold text-lg">{table.name}</h3>
          <p className="text-white/70 text-xs">Table #{table.number}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOccupied && activeRound && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
              {translations.rounds.round} {activeRound.round_number}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isOccupied ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-white animate-pulse' : 'bg-white'}`} />
            {getStatusDisplay(table.status)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isOccupied && session && activeRound ? (
          <>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {currentRate.label === 'Day Rate'
                  ? <Sun className="w-3.5 h-3.5 text-amber-500" />
                  : <Moon className="w-3.5 h-3.5 text-blue-500" />}
                {currentRate.label} — {new Intl.NumberFormat('uz-UZ').format(currentRate.rate)}/hr
              </span>
              <span className="text-gray-400">
                Started {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/80 rounded-xl p-3">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{translations.rounds.round} {activeRound.round_number}</span>
                </div>
                <p className="font-bold text-gray-900 text-base tabular-nums">{formatDuration(Math.round(roundMinutes))}</p>
                <p className="text-xs text-blue-600 font-medium">{formatCurrency(roundCost)}</p>
              </div>
              <div className="bg-white/80 rounded-xl p-3">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{translations.billing.total} {translations.actions.start.toLowerCase()}</span>
                </div>
                <p className="font-bold text-gray-900 text-base tabular-nums">{formatDuration(Math.round(totalPlayMinutes))}</p>
                <p className="text-xs text-blue-600 font-medium">{formatCurrency(totalPlayCost)}</p>
              </div>
            </div>

            <div className="bg-white/80 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{translations.billing.playCost}</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalPlayCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{translations.billing.barOrders}</span>
                <span className="font-medium text-gray-900">{formatCurrency(productsCost)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-gray-200">
                <span className="font-semibold text-gray-800">{translations.billing.grandTotal}</span>
                <span className="font-bold text-blue-700 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {completedRounds.length > 0 && (
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium mb-1.5">{translations.rounds.rounds}</p>
                <div className="space-y-1">
                  {completedRounds.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <ChevronRight className="w-3 h-3" />
                        {translations.rounds.round} {r.round_number}
                      </span>
                      <span className="text-gray-400">{formatDuration(r.duration_minutes)}</span>
                      <span className="font-medium text-gray-700">{formatCurrency(r.calculated_cost)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                    <span className="flex items-center gap-1 text-red-500 font-medium">
                      <ChevronRight className="w-3 h-3" />
                      {translations.rounds.round} {activeRound.round_number} ●
                    </span>
                    <span className="text-gray-400">{formatDuration(Math.round(roundMinutes))}</span>
                    <span className="font-medium text-blue-600">{formatCurrency(roundCost)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAddOrder(table)}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {translations.actions.addProduct}
              </button>
              <button
                onClick={() => onNextRound(table)}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                <SkipForward className="w-4 h-4" />
                {translations.actions.nextRound}
              </button>
            </div>

            <button
              onClick={() => onStop(table)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-100"
            >
              <Square className="w-4 h-4" />
              {translations.actions.stop.toUpperCase()}
            </button>
          </>
        ) : (
          <div className="py-4">
            <p className="text-gray-400 text-center text-sm mb-4">{translations.labels.tables} boshlashga tayyor</p>
            <button
              onClick={() => onStart(table.id)}
              className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-200"
            >
              <Play className="w-6 h-6" />
              {translations.actions.start.toUpperCase()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
