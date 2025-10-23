'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('Client error boundary caught:', error);
  return (
    <html>
      <body style={{ padding: 20, fontFamily: 'system-ui' }}>
        <h2>Something went wrong</h2>
        <p style={{ color: '#888' }}>{String(error?.message || error)}</p>
        {error?.stack && (
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{error.stack}</pre>
        )}
        <button onClick={() => reset()} style={{ marginTop: 12, padding: '8px 12px' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
