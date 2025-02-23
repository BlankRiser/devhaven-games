import { siteMetadata } from '@/config/site-metadata';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: {
    slug: string[];
  };
}): Promise<Metadata> {
  const ogTitle = params.slug[0];
  const ogSlug = params.slug[0];
  const ogDescription = siteMetadata.description;
  const ogImage = siteMetadata.url + `/og/?title=${params.slug[0]}`;

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: {
      canonical: siteMetadata.url + '/games/r' + ogSlug,
      languages: {
        'en-US': siteMetadata.url + '/games/' + ogSlug,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'article',
      url: siteMetadata.url + '/games/' + ogSlug,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
