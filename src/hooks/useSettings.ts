import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { RateConfig } from '../lib/types';

interface AppSettings {
  business_name: string;
  day_rate: number;
  night_rate: number;
  currency: string;
  receipt_footer: string;
  low_stock_threshold: number;
}

const DEFAULTS: AppSettings = {
  business_name: 'JOCKER',
  day_rate: 40000,
  night_rate: 50000,
  currency: 'UZS',
  receipt_footer: 'Rahmat! Yana keling!',
  low_stock_threshold: 5,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const map: Partial<AppSettings> = {};
      data.forEach((s) => {
        if (s.key === 'business_name') map.business_name = s.value;
        if (s.key === 'day_rate') map.day_rate = parseInt(s.value);
        if (s.key === 'night_rate') map.night_rate = parseInt(s.value);
        if (s.key === 'currency') map.currency = s.value;
        if (s.key === 'receipt_footer') map.receipt_footer = s.value;
        if (s.key === 'low_stock_threshold') map.low_stock_threshold = parseInt(s.value);
      });
      setSettings({ ...DEFAULTS, ...map });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const rates: RateConfig = { dayRate: settings.day_rate, nightRate: settings.night_rate };

  return { settings, rates, loading, reload: load };
}
