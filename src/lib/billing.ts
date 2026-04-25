import type { BillingBreakdown, RateConfig } from './types';

const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

function isInDayRate(date: Date): boolean {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR;
}

export function calculateBilling(
  startTime: Date,
  endTime: Date,
  rates: RateConfig
): BillingBreakdown {
  const { dayRate, nightRate } = rates;
  let dayMinutes = 0;
  let nightMinutes = 0;

  let current = new Date(startTime);

  while (current < endTime) {
    const next = new Date(current);

    if (isInDayRate(current)) {
      const dayEnd = new Date(current);
      dayEnd.setHours(NIGHT_START_HOUR, 0, 0, 0);
      const segmentEnd = dayEnd < endTime ? dayEnd : endTime;
      const minutes = (segmentEnd.getTime() - current.getTime()) / 60000;
      dayMinutes += minutes;
      current = segmentEnd;
    } else {
      const nextDay = new Date(current);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(DAY_START_HOUR, 0, 0, 0);
      const segmentEnd = nextDay < endTime ? nextDay : endTime;
      const minutes = (segmentEnd.getTime() - current.getTime()) / 60000;
      nightMinutes += minutes;
      current = segmentEnd;
    }

    if (current.getTime() === next.getTime()) break;
  }

  const dayCost = Math.round((dayRate / 60) * dayMinutes);
  const nightCost = Math.round((nightRate / 60) * nightMinutes);

  return {
    dayMinutes: Math.round(dayMinutes),
    nightMinutes: Math.round(nightMinutes),
    dayCost,
    nightCost,
    totalPlayCost: dayCost + nightCost,
  };
}

export function calculateLiveBilling(
  startTime: Date,
  rates: RateConfig
): BillingBreakdown {
  return calculateBilling(startTime, new Date(), rates);
}

export function getCurrentRate(rates: RateConfig): { label: string; rate: number } {
  const now = new Date();
  if (isInDayRate(now)) {
    return { label: 'Kunduzgi tariff', rate: rates.dayRate };
  }
  return { label: 'Tungi tariff', rate: rates.nightRate };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP-${date}-${rand}`;
}

export function getElapsedMinutes(startTime: Date): number {
  return (new Date().getTime() - startTime.getTime()) / 60000;
}
