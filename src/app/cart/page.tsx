'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from "@/lib/supabaseClient";
import { useEffect, useMemo, useState } from "react";

type Tier = { min_kg: number; max_kg: number | null; price_per_kg: number };

type CartLine = { productId: string; kg: number };

export default function CartPage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, any>>({});
  const [tiersMap, setTiersMap] = useState<Record<string, Tier[]>>({});
  const [lotsMap, setLotsMap] = useState<Record<string, any[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c: CartLine[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(c);

    (async () => {
      if (c.length === 0) return;
      const ids = [...new Set(c.map(x => x.productId))];

      const supabase = getSupabase();

      // products
      const { data: prodRows } = await supabase.from("products").select("*").in("id", ids);
      const pMap: Record<string, any> = {};
      (prodRows || []).forEach(p => (pMap[p.id] = p));
      setProducts(pMap);

      // tiers
      const tMap: Record<string, Tier[]> = {};
      for (const pid of ids) {
        const { data: t } = await supabase
          .from("product_price_tiers")
          .select("min_kg,max_kg,price_per_kg")
          .eq("product_id", pid)
          .order("min_kg", { ascending: true });
        tMap[pid] = (t as Tier[]) || [];
      }
      setTiersMap(tMap);

      // lots (for available cap)
      const lMap: Record<string, any[]> = {};
      for (const pid of ids) {
        const { data: l } = await supabase
          .from("lots")
          .select("id,lot_code,available_kg")
          .eq("product_id", pid);
        lMap[pid] = l || [];
      }
      setLotsMap(lMap);
    })();
  }, []);

  const totalAvailable = (pid: string) =>
    (lotsMap[pid] || []).reduce((s, l) => {
      const v = Number(l?.available_kg);
      return s + (Number.isFinite(v) ? v : 0);
    }, 0);

  const normalizeKg = (pid: string, raw: number) => {
    const p = products[pid] || {};
    const min: number = p.min_order_kg || 25;
    const step: number = p.order_increment_kg || 25;
    if (!Number.isFinite(raw)) return min;
    let v = Math.max(raw, min);
    // snap to nearest step; change Math.round -> Math.ceil to always round up
    v = Math.round(v / step) * step;
    const avail = totalAvailable(pid);
    if (avail > 0) v = Math.min(v, avail);
    return v;
  };

  const activeTier = (pid: string, kg: number) => {
    const tiers = tiersMap[pid] || [];
    return tiers.find(t => kg >= t.min_kg && (t.max_kg == null || kg <= t.max_kg));
  };

  const pricePerKg = (pid: string, kg: number) => activeTier(pid, kg)?.price_per_kg ?? 0;

  const setCartAndPersist = (next: CartLine[]) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const updateQty = (idx: number, nextKg: number) => {
    setCartAndPersist(
      cart.map((line, i) => (i === idx ? { ...line, kg: nextKg } : line))
    );
  };

  const onChangeInput = (idx: number, val: string) => {
    const raw = Number(val.replace(/,/g, ""));
    if (!Number.isFinite(raw)) return;
    setCart(
      cart.map((line, i) => (i === idx ? { ...line, kg: raw } : line))
    ); // don't snap yet, feels nicer
  };

  const onBlurInput = (idx: number) => {
    const line = cart[idx];
    const snapped = normalizeKg(line.productId, line.kg);
    updateQty(idx, snapped);
  };

  const onEnterInput = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  const inc = (idx: number) => {
    const line = cart[idx];
    const p = products[line.productId] || {};
    const step = p.order_increment_kg || 25;
    updateQty(idx, normalizeKg(line.productId, line.kg + step));
  };

  const dec = (idx: number) => {
    const line = cart[idx];
    const p = products[line.productId] || {};
    const step = p.order_increment_kg || 25;
    updateQty(idx, normalizeKg(line.productId, line.kg - step));
  };

  const removeLine = (idx: number) => {
    const next = cart.filter((_, i) => i !== idx);
    setCartAndPersist(next);
  };

  const grandTotal = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const ppk = pricePerKg(line.productId, line.kg);
        return sum + line.kg * ppk;
      }, 0),
    [cart, tiersMap]
  );

  const submitOrder = async () => {
    setSaving(true);
    try {
      alert("Order submission placeholder (not wired yet).");
    } finally {
      setSaving(false);
    }
  };

  if (cart.length === 0) {
    return <p className="small">Your cart is empty.</p>;
  }

  return (
    <div>
      <h2>Cart</h2>
      {cart.map((line, idx) => {
        const p = products[line.productId];
        const tiers = tiersMap[line.productId] || [];
        const min = p?.min_order_kg || 25;
        const step = p?.order_increment_kg || 25;
        const ppk = pricePerKg(line.productId, line.kg);
        const lineTotal = +(line.kg * ppk).toFixed(2);
        const avail = totalAvailable(line.productId);

        return (
          <div key={idx} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>{p?.name || "Product"}</h3>
                <p className="small" style={{ marginTop: 4 }}>
                  Min {min} kg · Step {step} kg
                  {avail > 0 ? <> · Max {avail.toLocaleString()} kg</> : null}
                </p>

                {/* Pricing tiers table */}
                {tiers.length > 0 && (
                  <table className="small" style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: 6 }}>From</th>
                        <th style={{ textAlign: "left", padding: 6 }}>To</th>
                        <th style={{ textAlign: "left", padding: 6 }}>$/kg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t, i) => {
                        const active =
                          line.kg >= t.min_kg && (t.max_kg == null || line.kg <= t.max_kg);
                        return (
                          <tr key={i} style={active ? { background: "#0b1220" } : undefined}>
                            <td style={{ padding: 6 }}>{t.min_kg}</td>
                            <td style={{ padding: 6 }}>{t.max_kg ?? "∞"}</td>
                            <td style={{ padding: 6 }}>${t.price_per_kg.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Qty controls */}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <button className="button" onClick={() => dec(idx)}>
                    - {step}
                  </button>

                  <input
                    inputMode="numeric"
                    type="number"
                    step={step}
                    min={min}
                    value={line.kg}
                    onChange={(e) => onChangeInput(idx, e.target.value)}
                    onBlur={() => onBlurInput(idx)}
                    onKeyDown={(e) => onEnterInput(e, idx)}
                    style={{ width: 140, padding: 8, borderRadius: 10, border: '1px solid #1f2833', background:'#0b1220', color:'#dce3ea' }}
                    aria-label="Order quantity (kg)"
                  />

                  <button className="button" onClick={() => inc(idx)}>
                    + {step}
                  </button>
                </div>

                <p className="small" style={{ marginTop: 8 }}>
                  Price: ${ppk.toFixed(2)} / kg<br />
                  Line total: <b>${lineTotal.toLocaleString()}</b>
                </p>

                <button className="button" onClick={() => removeLine(idx)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        );
      })}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Grand total</h3>
          <div style={{ fontWeight: 700 }}>${grandTotal.toLocaleString()}</div>
        </div>
        <button className="button" style={{ marginTop: 12 }} disabled={saving} onClick={submitOrder}>
          {saving ? "Submitting…" : "Submit order"}
        </button>
      </div>
    </div>
  );
}
