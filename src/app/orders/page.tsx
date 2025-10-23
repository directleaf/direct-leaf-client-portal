'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h2>Orders</h2>
      {loading ? <p className="small">Loading…</p> : orders.length === 0 ? (
        <p className="small">No orders yet.</p>
      ) : (
        <div className="grid">
          {orders.map(o => (
            <div key={o.id} className="card">
              <div className="badge">{o.id.slice(0, 8)}</div>
              <p className="small">Status: {o.status}</p>
              <p className="small">Created: {o.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
