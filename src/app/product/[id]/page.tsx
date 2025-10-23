'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [coas, setCoas] = useState<Record<string, any[]>>({});

useEffect(() => {
    (async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('id', params.id).single();
      setProduct(prod);
      const { data: lotData } = await supabase.from('lots').select('*').eq('product_id', params.id);
      setLots(lotData || []);
      const map: Record<string, any[]> = {};
      for (const lot of lotData || []) {
        const { data: coaRows } = await supabase.from('lab_tests').select('*').eq('lot_id', lot.id);
        map[lot.id] = coaRows || [];
      }
      setCoas(map);
    })();
  }, [params.id]);

  if (!product) return <p>Loading…</p>;

  return (
    <div>
      <h2>{product.name}</h2>
      {lots.map(lot => (
        <div key={lot.id} className="card">
          <div className="badge">{lot.lot_code}</div>
          <p className="small">Status: {lot.status}</p>
          {(coas[lot.id] || []).map(coa => (
            <p key={coa.id}><a href={coa.pdf_url} target="_blank">View COA</a></p>
          ))}
        </div>
      ))}
    </div>
  );
}
