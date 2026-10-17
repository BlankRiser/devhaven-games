import { siteMetadata } from "@/config/site-metadata";
import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: [
      {
        allow: "/",
        userAgent: "*",
      },
      {
        allow: "/",
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "PerplexityBot",
          "Applebot",
          "Google-Extended",
          "cohere-ai",
        ],
      },
    ],
    sitemap: `${siteMetadata.url}/sitemap.xml`,
  };
};

export default robots;
