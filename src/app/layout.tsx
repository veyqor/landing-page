import type { Metadata } from 'next';
import { Inter, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif-4',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VEYQOR — Hiring intelligence. Human judgment.',
  description: 'VEYQOR gives recruiting teams structured AI intelligence to evaluate candidates faster — while keeping every consequential hiring decision firmly in human hands.',
  keywords: ['AI recruiting', 'Hiring intelligence', 'Human-in-the-loop AI', 'Recruiting governance', 'Applicant tracking'],
  authors: [{ name: 'VEYQOR' }],
  icons: {
    icon: '/Untitled design - 2026-08-10T155643.189.png',
    shortcut: '/Untitled design - 2026-08-10T155643.189.png',
    apple: '/Untitled design - 2026-08-10T155643.189.png',
  },
  openGraph: {
    title: 'VEYQOR — Hiring intelligence. Human judgment.',
    description: 'Structured AI intelligence for modern hiring teams.',
    type: 'website',
    images: ['/Untitled design - 2026-08-10T155643.189.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
