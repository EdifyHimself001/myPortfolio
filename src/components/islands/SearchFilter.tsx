import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";

export interface WorkItem {
  title: string;
  href: string;
  category: string;
  categoryLabel: string;
  year: number;
  tags: string[];
  description: string;
  cover: { src: string; width: number; height: number };
  alt: string;
}

interface CategoryOption {
  key: string;
  label: string;
}

interface Props {
  items: WorkItem[];
  categories: CategoryOption[];
}

const aspectMap: Record<string, string> = {
  webapps: "aspect-[16/10]",
  photography: "aspect-[4/3]",
  graphics: "aspect-[4/3]",
  videography: "aspect-video",
};

export default function SearchFilter({ items, categories }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const item of items) {
      for (const tag of item.tags) {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
      .map(([tag]) => tag);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (
        activeTags.length > 0 &&
        !activeTags.every((t) =>
          item.tags.some((it) => it.toLowerCase() === t.toLowerCase())
        )
      )
        return false;
      if (q) {
        const haystack =
          `${item.title} ${item.description} ${item.categoryLabel} ${item.year} ${item.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, category, activeTags]);

  const hasFilters =
    query.trim() !== "" || category !== "all" || activeTags.length > 0;

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearAll() {
    setQuery("");
    setCategory("all");
    setActiveTags([]);
  }

  return (
    <div>
      <div className="space-y-6 border-y border-line py-6">
        <div className="relative max-w-xl">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
          <label htmlFor="work-search" className="sr-only">
            Search projects
          </label>
          <input
            id="work-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tags, years…"
            className="w-full rounded-sm border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-accent focus:outline-none"
          />
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by category"
        >
          {[{ key: "all", label: "All" }, ...categories].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setCategory(opt.key)}
              aria-pressed={category === opt.key}
              className={
                category === opt.key
                  ? "rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-white/40 hover:text-neutral-200"
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by tag"
          >
            {allTags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full border border-accent bg-accent/15 px-3 py-1 text-xs font-semibold text-accent"
                      : "rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-500 transition-colors hover:border-white/30 hover:text-neutral-300"
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-neutral-200">
              {filtered.length}
            </span>{" "}
            of {items.length} projects
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold uppercase tracking-widest text-accent transition-colors hover:text-white"
            >
              Clear filters ×
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:gap-x-12">
          {filtered.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="group block">
                <div
                  className={`relative overflow-hidden bg-panel ring-1 ring-white/5 ${aspectMap[item.category] ?? "aspect-[16/10]"}`}
                >
                  <img
                    src={item.cover.src}
                    alt={item.alt}
                    width={item.cover.width}
                    height={item.cover.height}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
                  />
                </div>
                <p className="eyebrow mt-5">
                  {item.categoryLabel} — {item.year}
                </p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-100 transition-colors group-hover:text-accent sm:text-xl">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-400">
                  {item.description}
                </p>
                {item.tags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
                    {item.tags.slice(0, 4).map((tag) => (
                      <li
                        key={tag}
                        className="inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-neutral-400"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-20 flex flex-col items-center border border-dashed border-white/10 px-8 py-20 text-center">
          <SearchX size={36} className="text-neutral-600" aria-hidden="true" />
          <h2 className="mt-6 text-lg font-semibold text-neutral-200">
            No projects match your filters
          </h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            Try a different search term or clear the filters to see everything.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-outline mt-8">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}