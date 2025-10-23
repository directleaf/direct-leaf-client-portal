'use client';
export const dynamic = 'force-dynamic';

import { getSupabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Page() {
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    setMessage('Sending magic link...');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/catalog'
        }
      });
      if (error) setMessage('Error: ' + error.message);
      else setMessage('Check your email for a login link.');
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  };

  if (session) {
    return (
      <div className="card">
        <h2>Signed in</h2>
        <p className="small">
          You can browse the <a href="/catalog">Catalog</a> and place orders.
        </p>
        <button className="button" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h2>Sign in to Direct Leaf Portal</h2>
      <input
        className="input"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <div style={{ height: 8 }} />
      <button className="button" onClick={signIn}>Send magic link</button>
      <div style={{ height: 8 }} />
      <p className="small">We use passwordless login. You’ll get an email with a link.</p>
      {message && <p className="small">{message}</p>}
    </div>
  );
}
