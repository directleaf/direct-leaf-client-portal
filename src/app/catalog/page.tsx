'use client';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Catalog() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      setItems(data || []);
    })();
  }, []);

  return (
    <div>
      <h2>Catalog</h2>
      <div className="grid">
        {items.map(p => (
          <div className="card" key={p.id}>
            <div className="badge">{p.sku}</div>
            <h3>{p.name}</h3>
            <p className="small">{p.form || '—'}</p>
            <Link className="button" href={`/product/${p.id}`}>View</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
