'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminHome() {
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const supabase = getSupabase();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${base}/admin/lots` },
    });
    alert(error ? 'Error: ' + error.message : 'Check your email for a login link');
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div style={{padding:24}}>
      <h1>Admin</h1>
      {!session ? (
        <div className="card" style={{maxWidth:420}}>
          <h3>Staff sign-in</h3>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="you@directleaf.com"
            style={{ width:"100%", padding:8, borderRadius:10, border:'1px solid #1f2833', background:'#0b1220', color:'#dce3ea' }}
          />
          <button className="button" style={{marginTop:8}} onClick={signIn}>Send login link</button>
        </div>
      ) : (
        <div className="card" style={{maxWidth:520}}>
          <p className="small">Signed in.</p>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Link className="button" href="/admin/lots">Edit Lots</Link>
            <button className="button" onClick={signOut}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}
