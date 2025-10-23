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
      options: { emailRedirectTo: `${redirectBase}/catalog` }
    });
    if (error) setMessage('Error: ' + error.message);
    else setMessage('Check your email for a login link.');
  } catch (e: any) {
    setMessage('Error: ' + e.message);
  }
};
