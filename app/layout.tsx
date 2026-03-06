import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Quicksand } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-wish',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Wish — Make It Real',
  description: 'Turn your wishes into daily reality. Track productivity, health, and happiness.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${quicksand.variable}`}>
      <body className="font-sans bg-surface min-h-screen pb-20">{children}</body>
    </html>
  );
}
