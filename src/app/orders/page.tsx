'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders(data || []);
    })();
  }, []);

  return (
    <div>
      <h2>Orders</h2>
      {orders.length === 0 ? <p className="small">No orders yet.</p> : (
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
