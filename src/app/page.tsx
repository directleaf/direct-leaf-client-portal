'use client';
import { useState } from 'react';
import { getSupabase } from '@/lib/supabaseClient';

export default function Home() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const signIn = async () => {
    setMessage('Sending magic link...');
    try {
      const supabase = getSupabase();
      const redirectBase =
        typeof window !== 'undefined'
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL || '');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${redirectBase}/catalog` }, // <-- backticks here
      });
      if (error) setMessage('Error: ' + error.message);
      else setMessage('Check your email for a login link.');
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Sign in to Direct Leaf Portal</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ padding: 8, width: '100%', marginBottom: 12 }}
      />
      <button className="button" onClick={signIn}>
        Send Magic Link
      </button>
      {message && <p className="small">{message}</p>}
    </div>
  );
}
