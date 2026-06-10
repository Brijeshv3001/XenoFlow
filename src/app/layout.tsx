import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'XenoCRM — AI-Native CRM',
  description: 'AI-Native Mini CRM and marketing automation co-pilot for Lumé.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased select-none">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
