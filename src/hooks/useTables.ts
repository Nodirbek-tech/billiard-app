import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TableWithSession } from '../lib/types';

export function useTables() {
  const [tables, setTables] = useState<TableWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('billiard_tables')
      .select(`
        *,
        active_session:sessions(
          *,
          session_orders(*),
          session_rounds(*)
        )
      `)
      .eq('is_active', true)
      .order('number');

    if (error) { setError(error.message); setLoading(false); return; }

    const mapped = (data ?? []).map((t) => {
      const sessions = Array.isArray(t.active_session) ? t.active_session : [];
      const activeSession = sessions.find((s: { status: string }) => s.status === 'active') ?? null;
      return { ...t, active_session: activeSession };
    });

    setTables(mapped as TableWithSession[]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('tables-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_rounds' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billiard_tables' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { tables, loading, error, reload: load };
}
