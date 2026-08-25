import type { APIRoute } from "astro";
import { siteConfig } from "@/data/site";

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site
    ? new URL("sitemap-index.xml", site).href
    : new URL("sitemap-index.xml", siteConfig.siteUrl).href;

  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};