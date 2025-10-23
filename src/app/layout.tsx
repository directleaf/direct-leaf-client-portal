import './globals.css';
import Link from 'next/link';

export const metadata = { title: 'Direct Leaf Portal', description: 'B2B ordering with COAs' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="nav">
            <Link href="/catalog">Catalog</Link>
            <Link href="/orders">Orders</Link>
            <Link href="/cart">Cart</Link>
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/">Account</Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
