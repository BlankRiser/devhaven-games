import type { Metadata } from 'next';
import { Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import { siteMetadata } from '@/config/site-metadata';
import { cn } from '@/lib/utils';
import { GlobalProvider } from '@/providers/global-provider';
import './globals.css';

const barlowCondensed = Barlow_Condensed({
  variable: '--font-heading',
  subsets: [ 'latin' ],
  weight: [ '400', '500', '600', '700' ],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-sans',
  subsets: [ 'latin' ],
  weight: [ '300', '400', '500', '600' ],
});

export const metadata: Metadata = {
  title: siteMetadata.title,
  description: siteMetadata.description,
  openGraph: {
    siteName: siteMetadata.title,
    type: 'website',
    locale: 'en_US',
    url: siteMetadata.url,
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [
      {
        url: siteMetadata.url + '/og?title=Games',
        width: 1200,
        height: 630,
        alt: 'games.ram.codes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [ siteMetadata.url + '/og?title=Games' ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('font-sans', barlowCondensed.variable, ibmPlexMono.variable)}>
      <body className="min-h-svh bg-background font-sans text-foreground antialiased selection:bg-tertiary selection:text-tertiary-foreground">
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
