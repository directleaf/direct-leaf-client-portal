'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';

type Lot = {
  id: string;
  product_id: string;
  lot_code: string;
  status: string;
  available_kg: number | null;
  photo_url: string | null;
};

export default function LotsAdmin() {
  const supabase = getSupabase();
  const [session, setSession] = useState<any>(null);
  const [rows, setRows] = useState<Lot[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: lotData, error } = await supabase
        .from('lots').select('id,product_id,lot_code,status,available_kg,photo_url')
        .order('lot_code', { ascending: true });
      if (!error) setRows(lotData || []);

      const pids = Array.from(new Set((lotData || []).map(l => l.product_id)));
      if (pids.length) {
        const { data: prod } = await supabase
          .from('products').select('id,name').in('id', pids);
        const map: Record<string, any> = {};
        (prod || []).forEach(p => map[p.id] = p);
        setProducts(map);
      }
    })();
  }, []);

  const canEdit = useMemo(() => !!session, [session]); // RLS enforces staff

  const updateRow = (id: string, patch: Partial<Lot>) =>
    setRows(rows => rows.map(r => r.id === id ? ({ ...r, ...patch }) : r));

  const saveRow = async (r: Lot) => {
    setSavingId(r.id); setMsg(null);
    const { error } = await supabase
      .from('lots')
      .update({ available_kg: r.available_kg, status: r.status })
      .eq('id', r.id);
    setSavingId(null);
    setMsg(error ? 'Error: ' + error.message : 'Saved.');
    if (!error) setTimeout(()=>setMsg(null), 1500);
  };

  if (!session) {
    return (
      <div style={{padding:24}}>
        <h2>Lots (Admin)</h2>
        <p className="small">You must sign in as staff to edit. Go to <a href="/admin">/admin</a> and request a login link.</p>
      </div>
    );
  }

  return (
    <div style={{padding:24}}>
      <h2>Lots (Admin)</h2>
      {msg && <p className="small">{msg}</p>}
      <div className="card">
        <table className="small" style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{textAlign:'left', padding:6}}>Product</th>
              <th style={{textAlign:'left', padding:6}}>Lot</th>
              <th style={{textAlign:'left', padding:6}}>Status</th>
              <th style={{textAlign:'left', padding:6}}>Available (kg)</th>
              <th style={{textAlign:'left', padding:6}}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{padding:6}}>{products[r.product_id]?.name ?? r.product_id}</td>
                <td style={{padding:6}}>{r.lot_code}</td>
                <td style={{padding:6}}>
                  <select
                    value={r.status ?? 'available'}
                    onChange={e => updateRow(r.id, { status: e.target.value })}
                    disabled={!canEdit}
                    style={{ padding:6, borderRadius:8, background:'#0b1220', color:'#dce3ea', border:'1px solid #1f2833' }}
                  >
                    <option value="available">available</option>
                    <option value="reserved">reserved</option>
                    <option value="sold_out">sold_out</option>
                  </select>
                </td>
                <td style={{padding:6}}>
                  <input
                    type="number"
                    step={25}
                    min={0}
                    value={r.available_kg ?? 0}
                    onChange={e => updateRow(r.id, { available_kg: Number(e.target.value) })}
                    disabled={!canEdit}
                    style={{ width:140, padding:6, borderRadius:8, background:'#0b1220', color:'#dce3ea', border:'1px solid #1f2833' }}
                  />
                </td>
                <td style={{padding:6}}>
                  <button className="button" disabled={savingId===r.id} onClick={()=>saveRow(r)}>
                    {savingId===r.id ? 'Saving…' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length===0 && (
              <tr><td colSpan={5} className="small" style={{padding:6}}>No lots found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
