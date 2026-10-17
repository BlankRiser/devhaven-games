import { notFound } from "next/navigation";
import {
  gameSlugs,
  getGameMetadata,
  siteMetadata,
} from "@/config/site-metadata";
import { GameView } from "./game-view";
import type { Metadata } from "next";

interface GamePageProperties {
  readonly params: Promise<{ slug: string }>;
}

export const generateStaticParams = () =>
  gameSlugs.map((slug) => ({ slug }));

export const generateMetadata = async ({
  params,
}: GamePageProperties): Promise<Metadata> => {
  const { slug } = await params;
  const game = getGameMetadata(slug);

  if (!game) {
    return {
      description: "Requested game was not found in the DevHaven manifest.",
      title: "Game Not Found",
    };
  }

  const ogImageUrl = `/og?title=${encodeURIComponent(game.title)}&description=${encodeURIComponent(game.description)}&category=${encodeURIComponent(game.categoryLabel)}&players=${encodeURIComponent(game.players)}&spec=${encodeURIComponent(game.specId)}&multiplayer=${game.supportsMultiplayer ? "true" : "false"}`;

  return {
    alternates: {
      canonical: `${siteMetadata.url}/games/${slug}`,
    },
    category: game.category,
    description: game.description,
    keywords: [...game.keywords, ...siteMetadata.keywords],
    openGraph: {
      description: game.description,
      images: [
        {
          alt: `${game.title} - ${game.categoryLabel} on DevHaven Games`,
          height: 630,
          url: ogImageUrl,
          width: 1200,
        },
      ],
      locale: siteMetadata.locale,
      siteName: siteMetadata.name,
      title: `${game.title} | ${siteMetadata.name}`,
      type: "website",
      url: `${siteMetadata.url}/games/${slug}`,
    },
    title: game.metaTitle,
    twitter: {
      card: "summary_large_image",
      creator: siteMetadata.twitterHandle,
      description: game.description,
      images: [ogImageUrl],
      site: siteMetadata.twitterHandle,
      title: `${game.title} | ${siteMetadata.name}`,
    },
  };
};

const GameSlugPage = async ({ params }: GamePageProperties) => {
  const { slug } = await params;
  const game = getGameMetadata(slug);

  if (!game) {
    notFound();
  }

  const gameJsonLd = {
    "@context": "https://schema.org",
    "@type": ["VideoGame", "WebApplication"],
    applicationCategory: game.applicationCategory,
    author: {
      "@type": "Person",
      name: siteMetadata.author,
      url: siteMetadata.authorUrl,
    },
    description: game.description,
    genre: game.genre,
    image: `${siteMetadata.url}/og?title=${encodeURIComponent(game.title)}&category=${encodeURIComponent(game.categoryLabel)}&players=${encodeURIComponent(game.players)}&spec=${encodeURIComponent(game.specId)}`,
    name: game.title,
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      maxValue: game.numberOfPlayersMax,
      minValue: game.numberOfPlayersMin,
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: game.operatingSystem,
    playMode: game.supportsMultiplayer ? "MultiPlayer" : "SinglePlayer",
    publisher: {
      "@type": "Organization",
      name: siteMetadata.applicationName,
      url: siteMetadata.url,
    },
    url: `${siteMetadata.url}/games/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(gameJsonLd)}
      </script>
      <GameView slug={slug} />
    </>
  );
};

export default GameSlugPage;
