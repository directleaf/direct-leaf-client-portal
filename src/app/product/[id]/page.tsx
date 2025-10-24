'use client';
export const dynamic = 'force-dynamic';

export default function ProductReset({ params }: { params: { id: string } }) {
  return (
    <div style={{padding:24}}>
      <h1>PRODUCT PAGE RESET v5</h1>
      <p>Route is: <code>/product/[id]</code></p>
      <p><b>id:</b> {params.id}</p>
      <p>If you see this, the app is using <code>src/app/product/[id]/page.tsx</code>.</p>
      <a className="button" href="/catalog" style={{display:'inline-block', marginTop:12}}>Back to catalog</a>
    </div>
  );
}

