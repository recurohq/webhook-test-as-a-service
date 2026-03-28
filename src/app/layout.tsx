import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'webhook-as-a-service',
  description: 'Receive, inspect, debug, and forward webhooks',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-950">{children}</body>
    </html>
  );
}
