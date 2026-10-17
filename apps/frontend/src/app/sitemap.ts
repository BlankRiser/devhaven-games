import { gameSlugs, siteMetadata } from "@/config/site-metadata";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  const currentDate = new Date();

  const gameRoutes: MetadataRoute.Sitemap = gameSlugs.map((slug) => {
    const isPrimaryGame = slug === "tic-tac-toe" || slug === "sudoku";
    return {
      changeFrequency: "weekly",
      lastModified: currentDate,
      priority: isPrimaryGame ? 0.9 : 0.8,
      url: `${siteMetadata.url}/games/${slug}`,
    };
  });

  return [
    {
      changeFrequency: "daily",
      lastModified: currentDate,
      priority: 1,
      url: siteMetadata.url,
    },
    ...gameRoutes,
  ];
};

export default sitemap;
