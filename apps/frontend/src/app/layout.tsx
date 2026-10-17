import { Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { siteMetadata } from "@/config/site-metadata";
import { cn } from "@/lib/utils";
import { GlobalProvider } from "@/providers/global-provider";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600"],
});

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { color: "#F0E6C8", media: "(prefers-color-scheme: light)" },
    { color: "#121212", media: "(prefers-color-scheme: dark)" },
  ],
  width: "device-width",
};

export const metadata: Metadata = {
  alternates: {
    canonical: siteMetadata.url,
  },
  applicationName: siteMetadata.applicationName,
  authors: [{ name: siteMetadata.author, url: siteMetadata.authorUrl }],
  category: siteMetadata.category,
  classification: siteMetadata.classification,
  creator: siteMetadata.author,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  metadataBase: new URL(siteMetadata.url),
  openGraph: {
    description: siteMetadata.description,
    images: [
      {
        alt: `${siteMetadata.name} - Free Web Games, Word Puzzles & Multiplayer Arcade`,
        height: 630,
        url: `/og?title=${encodeURIComponent(siteMetadata.name)}&description=${encodeURIComponent(siteMetadata.tagline)}&category=${encodeURIComponent("Arcade Library")}`,
        width: 1200,
      },
    ],
    locale: siteMetadata.locale,
    siteName: siteMetadata.name,
    title: siteMetadata.title,
    type: "website",
    url: siteMetadata.url,
  },
  publisher: siteMetadata.applicationName,
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.name}`,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteMetadata.twitterHandle,
    description: siteMetadata.description,
    images: [
      `/og?title=${encodeURIComponent(siteMetadata.name)}&description=${encodeURIComponent(siteMetadata.tagline)}&category=${encodeURIComponent("Arcade Library")}`,
    ],
    site: siteMetadata.twitterHandle,
    title: siteMetadata.title,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  author: {
    "@type": "Person",
    name: siteMetadata.author,
    url: siteMetadata.authorUrl,
  },
  description: siteMetadata.description,
  inLanguage: "en-US",
  name: siteMetadata.name,
  publisher: {
    "@type": "Organization",
    name: siteMetadata.applicationName,
    url: siteMetadata.url,
  },
  url: siteMetadata.url,
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans",
        barlowCondensed.variable,
        ibmPlexMono.variable
      )}
    >
      <head>
        <script type="application/ld+json">
          {JSON.stringify(websiteJsonLd)}
        </script>
      </head>
      <body className="bg-background text-foreground selection:bg-tertiary selection:text-tertiary-foreground min-h-svh font-sans antialiased">
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
};

export default RootLayout;
