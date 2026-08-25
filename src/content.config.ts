import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const work = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/work" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      category: z.enum(["webapps", "photography", "graphics", "videography"]),
      year: z.number().int().min(2000).max(2100),
      coverImage: image(),
      gallery: z.array(image()).optional(),
      tags: z.array(z.string()).default([]),
      liveUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
      videoUrl: z.string().url().optional(),
      description: z.string().min(1),
      featured: z.boolean().default(false),
      client: z.string().optional(),
      location: z.string().optional(),
      role: z.string().optional(),
      tools: z.array(z.string()).optional(),
      technologies: z.array(z.string()).optional(),
      process: z.array(z.string()).optional(),
      deliverables: z.array(z.string()).optional(),
      altText: z.string().optional(),
    }),
});

export const collections = { work };