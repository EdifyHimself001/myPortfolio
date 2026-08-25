import type { APIRoute } from "astro";
import { getWork } from "@/lib/projects";

interface ProjectIndexEntry {
  title: string;
  slug: string;
  category: string;
  year: number;
  tags: string[];
  featured: boolean;
  url: string;
}

export const GET: APIRoute = async ({ site }) => {
  const entries = await getWork();
  const items: ProjectIndexEntry[] = entries.map((entry) => ({
    title: entry.data.title,
    slug: entry.id,
    category: entry.data.category,
    year: entry.data.year,
    tags: entry.data.tags,
    featured: entry.data.featured,
    url: new URL(`/work/${entry.id}/`, site).href,
  }));

  return new Response(JSON.stringify(items, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};