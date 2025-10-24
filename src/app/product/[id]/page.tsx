'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';

type Tier = { min_kg: number; max_kg: number | null; price_per_kg: number };

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [coas, setCoas] = useState<Record<string, any[]>>({});
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [kg, setKg] = useState<number>(25);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();

      // product
      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();
      setProduct(prod);

      // lots
      const { data: lotData } = await supabase
        .from('lots')
        .select('*')
        .eq('product_id', params.id)
        .order('received_date', { ascending: false });
      setLots(lotData || []);

      // coas (by lot)
      const map: Record<string, any[]> = {};
      for (const lot of lotData || []) {
        const { data: coaRows } = await supabase
          .from('lab_tests')
          .select('*')
          .eq('lot_id', lot.id);
        map[lot.id] = coaRows || [];
      }
      setCoas(map);

      // price tiers
      const { data: priceRows } = await supabase
        .from('product_price_tiers')
        .select('min_kg,max_kg,price_per_kg')
        .eq('product_id', params.id)
        .order('min_kg', { ascending: true });
      setTiers((priceRows as Tier[]) || []);
    })();
  }, [params.id]);

  useEffect(() => {
    if (!product) return;
    const min = product.min_order_kg || 25;
    const step = product.order_increment_kg || 25;
    setKg(min - (min % step || 0)); // start at minimum, aligned to step
  }, [product]);

  const activeTier = useMemo(() => {
    if (!tiers.length) return undefined;
    return tiers.find(t => kg >= t.min_kg && (t.max_kg == null || kg <= t.max_kg));
  }, [kg, tiers]);

  const pricePerKg = activeTier?.price_per_kg ?? 0;
  const lineTotal = +(kg * pricePerKg).toFixed(2);

  if (!product) return <p className="small">Loading…</p>;

  const min = product.min_order_kg || 25;
  const step = product.order_increment_kg || 25;

  const dec = () => setKg(v => Math.max(min, v - step));
  const inc = () => setKg(v => v + step);

  const addToCartKg = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex((c: any) => c.productId === product.id);
    if (idx === -1) cart.push({ productId: product.id, kg });
    else cart[idx].kg = cart[idx].kg + kg;
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Added ${kg} kg to cart`);
  };

  return (
    <div>
      <h2>{product.name}</h2>

      {/* Lots with photo + COA */}
      {lots.map(lot => (
        <div key={lot.id} className="card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            {lot.photo_url ? (
              <img
                src={lot.photo_url}
                alt={`${product.name} - ${lot.lot_code}`}
                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, border: '1px solid #1f2833' }}
              />
            ) : (
              <div style={{ width: '100%', height: 140, borderRadius: 12, border: '1px solid #1f2833', display:'flex', alignItems:'center', justifyContent:'center', color:'#9bb0c3' }}>
                No photo
              </div>
            )}
          </div>
          <div>
            <div className="badge">{lot.lot_code}</div>
            <p className="small">Status: {lot.status}</p>
            {'available_kg' in lot && (
              <p className="small">Available: {Number(lot.available_kg)?.toLocaleString()} kg</p>
            )}
            {(coas[lot.id] || []).length === 0 ? (
              <p className="small">No COAs attached.</p>
            ) : (
              (coas[lot.id] || []).map(coa => (
                <p key={coa.id}>
                  <a href={coa.pdf_url} target="_blank" rel="noreferrer">View COA</a>
                </p>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Pricing tiers */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Pricing</h3>
        {!tiers.length ? (
          <p className="small">No pricing tiers configured.</p>
        ) : (
          <table className="small" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 6 }}>From (kg)</th>
                <th style={{ textAlign: 'left', padding: 6 }}>To (kg)</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Price / kg</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, i) => {
                const isActive = activeTier && t.min_kg === activeTier.min_kg && (t.max_kg ?? null) === (activeTier.max_kg ?? null);
                return (
                  <tr key={i} style={isActive ? { background:'#0b1220' } : undefined}>
                    <td style={{ padding: 6 }}>{t.min_kg}</td>
                    <td style={{ padding: 6 }}>{t.max_kg ?? '∞'}</td>
                    <td style={{ padding: 6 }}>${t.price_per_kg.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order panel */}
      <div className="card" style={{ marginTop: 12 }}>
        <h3>Order</h3>
        <p className="small">Minimum order {min} kg. Increments of {step} kg.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="button" onClick={dec}>- {step}</button>
          <div className="badge">{kg} kg</div>
          <button className="button" onClick={inc}>+ {step}</button>
        </div>
        <p className="small" style={{ marginTop: 8 }}>
          Price: ${pricePerKg.toFixed(2)} / kg · Line total: <b>${lineTotal.toLocaleString()}</b>
        </p>
        <button className="button" onClick={addToCartKg}>Add to cart</button>
      </div>
    </div>
  );
}
