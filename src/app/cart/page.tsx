'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';

type Tier = { min_kg: number; max_kg: number | null; price_per_kg: number };

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [tiersMap, setTiersMap] = useState<Record<string, Tier[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    (async () => {
      if (c.length === 0) return;
      const ids = c.map((i: any) => i.productId);
      const supabase = getSupabase();
      const { data } = await supabase.from('products').select('*').in('id', ids);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => (map[p.id] = p));
      setProducts(map);

      const tiersByProduct: Record<string, Tier[]> = {};
      for (const pid of ids) {
        const { data: t } = await supabase
          .from('product_price_tiers')
          .select('min_kg,max_kg,price_per_kg')
          .eq('product_id', pid)
          .order('min_kg', { ascending: true });
        tiersByProduct[pid] = (t as Tier[]) || [];
      }
      setTiersMap(tiersByProduct);
    })();
  }, []);

  const updateCart = (next: any[]) => {
    localStorage.setItem('cart', JSON.stringify(next));
    setCart(next);
  };

  const rows = useMemo(() => {
    return cart.map((i: any) => {
      const p = products[i.productId];
      const tiers = tiersMap[i.productId] || [];
      const kg = i.kg ?? 0;
      const tier = tiers.find(t => kg >= t.min_kg && (t.max_kg == null || kg <= t.max_kg));
      const pricePerKg = tier?.price_per_kg ?? 0;
      const lineTotal = +(pricePerKg * kg).toFixed(2);
      const min = p?.min_order_kg ?? 25;
      const step = p?.order_increment_kg ?? 25;
      return { ...i, name: p?.name || i.productId, kg, pricePerKg, lineTotal, min, step };
    });
  }, [cart, products, tiersMap]);

  const inc = (pid: string) => {
    const next = cart.map((i: any) =>
      i.productId === pid ? { ...i, kg: (i.kg ?? 0) + (products[pid]?.order_increment_kg ?? 25) } : i
    );
    updateCart(next);
  };

  const dec = (pid: string) => {
    const min = products[pid]?.min_order_kg ?? 25;
    const step = products[pid]?.order_increment_kg ?? 25;
    const next = cart.map((i: any) =>
      i.productId === pid ? { ...i, kg: Math.max(min, (i.kg ?? min) - step) } : i
    );
    updateCart(next);
  };

  const removeItem = (pid: string) => {
    const next = cart.filter((i: any) => i.productId !== pid);
    updateCart(next);
  };

  const total = rows.reduce((s, r) => s + r.lineTotal, 0);

  const placeOrder = async () => {
    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { alert('Please sign in first.'); setSubmitting(false); return; }

      const { data: order, error } = await supabase
        .from('orders')
        .insert([{ status: 'submitted', created_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;

      const items = rows.map(r => ({
        order_id: order.id,
        product_id: r.productId,
        qty: r.kg,
        unit_price: r.pricePerKg
      }));
      const { error: itemErr } = await supabase.from('order_items').insert(items);
      if (itemErr) throw itemErr;

      localStorage.removeItem('cart'); setCart([]);
      alert('Order placed!');
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>
      {rows.length === 0 ? <p className="small">Cart is empty.</p> : (
        <div className="card">
          <table className="small" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 6 }}>Product</th>
                <th style={{ textAlign: 'right', padding: 6 }}>KG</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Price/kg</th>
                <th style={{ textAlign: 'right', padding: 6 }}>Line total</th>
                <th style={{ textAlign: 'right', padding: 6 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: 6 }}>{r.name}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    <button className="button" onClick={() => dec(r.productId)}>- {r.step}</button>
                    <span className="badge" style={{ margin: '0 8px' }}>{r.kg} kg</span>
                    <button className="button" onClick={() => inc(r.productId)}>+ {r.step}</button>
                  </td>
                  <td style={{ padding: 6, textAlign: 'right' }}>{r.pricePerKg ? `$${r.pricePerKg.toFixed(2)}` : '—'}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>${r.lineTotal.toLocaleString()}</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>
                    <button className="button" onClick={() => removeItem(r.productId)}>Remove</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ padding: 6, textAlign: 'right' }}><b>Total</b></td>
                <td style={{ padding: 6, textAlign: 'right' }}><b>${total.toLocaleString()}</b></td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div style={{ height: 8 }} />
          <button className="button" onClick={placeOrder} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Place order'}
          </button>
        </div>
      )}
    </div>
  );
}
