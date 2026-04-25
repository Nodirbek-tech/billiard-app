import { useEffect, useState } from 'react';
import { formatDuration, calculateLiveBilling } from '../../lib/billing';
import type { RateConfig } from '../../lib/types';

interface Props {
  startTime: string;
  rates: RateConfig;
}

export function SessionTimer({ startTime, rates }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [playCost, setPlayCost] = useState(0);

  useEffect(() => {
    function tick() {
      const start = new Date(startTime);
      const mins = (Date.now() - start.getTime()) / 60000;
      setElapsed(mins);
      const billing = calculateLiveBilling(start, rates);
      setPlayCost(billing.totalPlayCost);
    }
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [startTime, rates]);

  return { elapsed, playCost };
}

export function LiveTimer({ startTime, rates }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [playCost, setPlayCost] = useState(0);

  useEffect(() => {
    function tick() {
      const start = new Date(startTime);
      const mins = (Date.now() - start.getTime()) / 60000;
      setElapsed(mins);
      const billing = calculateLiveBilling(start, rates);
      setPlayCost(billing.totalPlayCost);
    }
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [startTime, rates]);

  return (
    <div>
      <span className="font-mono font-bold">{formatDuration(Math.round(elapsed))}</span>
      <span className="ml-2 text-sm text-gray-500">
        {new Intl.NumberFormat('uz-UZ').format(playCost)} UZS
      </span>
    </div>
  );
}
