'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';

export default function Debug() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [probe, setProbe] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    // show env presence (values are public NEXT_PUBLIC_*)
    setEnvInfo({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '(missing)',
      anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    (async () => {
      try {
        const supabase = getSupabase();
        // small read probe (table name must exist)
        const { data, error } = await supabase.from('products').select('id, name').limit(3);
        if (error) throw error;
        setProbe({ ok: true, sample: data });
      } catch (e: any) {
        setErr(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h1>Debug</h1>
      <h3>Env</h3>
      <pre>{JSON.stringify(envInfo, null, 2)}</pre>
      <h3>Supabase probe</h3>
      {err ? <pre style={{ color: 'crimson' }}>{err}</pre> : <pre>{JSON.stringify(probe, null, 2)}</pre>}
    </div>
  );
}
