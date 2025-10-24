'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Catalog() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("products")
          .select("id, sku, name, form, min_order_kg, order_increment_kg, is_active")
          .eq("is_active", true)            // << only show active products
          .order("name");
        if (!error) setItems(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Catalog</h2>
      {loading ? (
        <p className="small">Loading…</p>
      ) : (
        <div className="grid">
          {items.map((p) => (
            <div className="card" key={p.id}>
              <div className="badge">{p.sku}</div>
              <h3>{p.name}</h3>
              <p className="small">{p.form || "—"}</p>
              <p className="small">
                Min order: {p.min_order_kg ?? 25} kg · Step: {p.order_increment_kg ?? 25} kg
              </p>
              <Link className="button" href={`/product/${p.id}`}>
                View & choose kg
              </Link>
            </div>
          ))}
          {items.length === 0 && <p className="small">No active products.</p>}
        </div>
      )}
    </div>
  );
}
