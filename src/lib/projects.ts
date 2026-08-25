import { getCollection, type CollectionEntry } from "astro:content";
import { isCategoryKey, type CategoryKey } from "./utils";

export interface DisciplineInfo {
  key: CategoryKey;
  number: string;
  word: string;
  label: string;
  blurb: string;
  href: string;
}

export const disciplines: DisciplineInfo[] = [
  {
    key: "webapps",
    number: "01",
    word: "BUILD",
    label: "Web Apps",
    blurb:
      "Product engineering for the web — fast, accessible applications designed and developed end to end.",
    href: "/work/webapps/",
  },
  {
    key: "photography",
    number: "02",
    word: "CAPTURE",
    label: "Photography",
    blurb:
      "Documentary, portrait and event photography with an editorial eye for light and moment.",
    href: "/work/photography/",
  },
  {
    key: "graphics",
    number: "03",
    word: "DESIGN",
    label: "Graphic Design",
    blurb:
      "Brand identities, campaigns and visual systems built on strong typography and clear ideas.",
    href: "/work/graphics/",
  },
  {
    key: "videography",
    number: "04",
    word: "TELL",
    label: "Films & Video",
    blurb:
      "Brand films, event highlights and documentary shorts that give stories room to breathe.",
    href: "/work/videography/",
  },
];

export function disciplineFor(key: string): DisciplineInfo {
  return (
    disciplines.find((d) => d.key === key) ?? {
      key: "webapps",
      number: "00",
      word: "WORK",
      label: key,
      blurb: "",
      href: `/work/${key}/`,
    }
  );
}

export interface WorkCardData {
  title: string;
  href: string;
  category: CategoryKey;
  categoryLabel: string;
  year: number;
  tags: string[];
  description: string;
  featured: boolean;
  cover: { src: string; width: number; height: number };
  alt: string;
}

export function toCardData(entry: CollectionEntry<"work">): WorkCardData {
  const d = disciplineFor(entry.data.category);
  return {
    title: entry.data.title,
    href: `/work/${entry.id}/`,
    category: entry.data.category,
    categoryLabel: d.label,
    year: entry.data.year,
    tags: entry.data.tags,
    description: entry.data.description,
    featured: entry.data.featured,
    cover: {
      src: entry.data.coverImage.src,
      width: entry.data.coverImage.width,
      height: entry.data.coverImage.height,
    },
    alt: entry.data.altText ?? entry.data.title,
  };
}

function byYearDesc(a: CollectionEntry<"work">, b: CollectionEntry<"work">) {
  return b.data.year - a.data.year || a.data.title.localeCompare(b.data.title);
}

export async function getWork(): Promise<CollectionEntry<"work">[]> {
  const entries = await getCollection("work");
  return entries.sort(byYearDesc);
}

export async function getByCategory(
  key: CategoryKey
): Promise<CollectionEntry<"work">[]> {
  const entries = await getWork();
  return entries.filter((e) => e.data.category === key);
}

export async function getRelated(
  current: CollectionEntry<"work">,
  limit = 3
): Promise<CollectionEntry<"work">[]> {
  const entries = await getWork();
  return relatedFromList(current, entries, limit);
}

export function relatedFromList(
  current: CollectionEntry<"work">,
  entries: CollectionEntry<"work">[],
  limit = 3
): CollectionEntry<"work">[] {
  const currentTags = new Set(current.data.tags.map((t) => t.toLowerCase()));
  const scored = entries
    .filter((e) => e.id !== current.id)
    .map((e) => {
      let score = e.data.featured ? 1 : 0;
      if (e.data.category === current.data.category) score += 10;
      const shared = e.data.tags.filter((t) =>
        currentTags.has(t.toLowerCase())
      ).length;
      score += shared * 2;
      score += Math.max(0, 5 - Math.abs(e.data.year - current.data.year)) / 10;
      return { entry: e, score };
    })
    .sort((a, b) => b.score - a.score || b.entry.data.year - a.entry.data.year);
  return scored.slice(0, limit).map((s) => s.entry);
}

export function neighborsInCategory(
  current: CollectionEntry<"work">,
  categoryEntries: CollectionEntry<"work">[]
): { prev: CollectionEntry<"work"> | null; next: CollectionEntry<"work"> | null } {
  const sorted = [...categoryEntries].sort(byYearDesc);
  const index = sorted.findIndex((e) => e.id === current.id);
  if (index === -1) return { prev: null, next: null };
  const prev = index > 0 ? sorted[index - 1] : sorted[sorted.length - 1];
  const next =
    index < sorted.length - 1 ? sorted[index + 1] : sorted[0];
  return {
    prev: prev?.id !== current.id ? prev : null,
    next: next?.id !== current.id ? next : null,
  };
}

export function assertCategory(key: string): asserts key is CategoryKey {
  if (!isCategoryKey(key)) {
    throw new Error(`Unknown work category: ${key}`);
  }
}
