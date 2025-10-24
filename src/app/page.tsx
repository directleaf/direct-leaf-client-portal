'use client';
export const dynamic = 'force-dynamic';

import Link from "next/link";

export default function Home() {
  return (
    <div style={{padding:24}}>
      <h1>Direct Leaf Client Portal</h1>
      <p className="small">Public browsing is enabled. No login required.</p>
      <Link className="button" href="/catalog" style={{display:'inline-block', marginTop:12}}>
        Enter Catalog
      </Link>
    </div>
  );
}
