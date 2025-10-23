'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const c = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(c);
    (async () => {
      if (c.length === 0) return;
      const ids = c.map((i: any) => i.productId);
      const { data } = await supabase.from('products').select('*').in('id', ids);
      const map: Record<string, any> = {};
      (data || []).forEach((p: any) => (map[p.id] = p));
      setProducts(map);
    })();
  }, []);

  const total = cart.reduce((sum, i) => sum + i.qty * 1, 0); // placeholder

  const placeOrder = async () => {
    setSubmitting(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { alert('Please sign in first.'); setSubmitting(false); return; }

    const { data: order, error } = await supabase
      .from('orders')
      .insert([{ status: 'submitted', created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) { alert('Order error: ' + error.message); setSubmitting(false); return; }

    const items = cart.map((i: any) => ({ order_id: order.id, product_id: i.productId, qty: i.qty, unit_price: 0 }));
    const { error: itemErr } = await supabase.from('order_items').insert(items);
    if (itemErr) { alert('Item error: ' + itemErr.message); setSubmitting(false); return; }

    localStorage.removeItem('cart'); setCart([]);
    alert('Order placed!'); setSubmitting(false);
  };

  return (
    <div>
      <h2>Your Cart</h2>
      {cart.length === 0 ? <p className="small">Cart is empty.</p> : (
        <div className="card">
          <ul>
            {cart.map((i, idx) => (
              <li key={idx}>
                {(products[i.productId]?.name) || i.productId} — Qty {i.qty}
              </li>
            ))}
          </ul>
          <p className="small">Items: {total}</p>
          <button className="button" onClick={placeOrder} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Place order'}
          </button>
        </div>
      )}
    </div>
  );
}
