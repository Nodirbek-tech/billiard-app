import { useEffect, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { translations } from '../lib/i18n';
import type { Setting } from '../lib/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('settings').select('*').order('key').then(({ data }) => {
      setSettings(data ?? []);
      const vals: Record<string, string> = {};
      (data ?? []).forEach((s) => { vals[s.key] = s.value; });
      setValues(vals);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    for (const s of settings) {
      await supabase.from('settings').update({ value: values[s.key] ?? s.value }).eq('id', s.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <PageLoader />;

  const orderedKeys = ['business_name', 'day_rate', 'night_rate', 'currency', 'receipt_footer', 'low_stock_threshold', 'tax_rate'];

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translations.nav.settings}</h1>
        <p className="text-gray-500 text-sm mt-1">Biznes konfiguratsiyasi</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <Settings className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">{translations.labels.businessSettings}</h2>
        </div>

        <div className="p-5 space-y-5">
          {orderedKeys.map((key) => {
            const setting = settings.find((s) => s.key === key);
            if (!setting) return null;
            const isMonetary = key.includes('rate');
            const isTextArea = key === 'receipt_footer';
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {setting.label}
                  {isMonetary && <span className="ml-1 text-xs text-blue-500 font-normal">(UZS/hour)</span>}
                </label>
                {setting.description && (
                  <p className="text-xs text-gray-400 mb-1.5">{setting.description}</p>
                )}
                {isTextArea ? (
                  <textarea
                    value={values[key] ?? ''}
                    onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    type={isMonetary || key.includes('threshold') || key.includes('tax') ? 'number' : 'text'}
                    value={values[key] ?? ''}
                    onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saqlash...' : saved ? 'Saqlandi!' : translations.actions.save + ' ' + translations.labels.businessSettings}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700 font-medium mb-1">Pricing Info</p>
        <p className="text-xs text-blue-600">
          Day Rate applies from 06:00 to 18:00. Night Rate applies from 18:00 to 06:00.
          If a session spans both periods, billing is split proportionally by minute.
        </p>
      </div>
    </div>
  );
}
