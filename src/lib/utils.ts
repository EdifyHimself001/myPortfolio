export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export const CATEGORY_KEYS = [
  "webapps",
  "photography",
  "graphics",
  "videography",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

type VideoProvider = "youtube" | "vimeo" | "native";

function parseYouTubeId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }
  if (url.hostname.includes("youtube.com")) {
    if (url.searchParams.has("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    const marker = parts.findIndex((p) => p === "embed" || p === "shorts");
    if (marker !== -1 && parts[marker + 1]) return parts[marker + 1];
  }
  return null;
}

export function detectVideoProvider(url: string): VideoProvider {
  try {
    const parsed = new URL(url);
    if (parseYouTubeId(parsed)) return "youtube";
    if (parsed.hostname.includes("vimeo.com")) return "vimeo";
  } catch {
    return "native";
  }
  return "native";
}

export function getEmbedUrl(videoUrl: string): { provider: VideoProvider; src: string } | null {
  try {
    const parsed = new URL(videoUrl);
    const ytId = parseYouTubeId(parsed);
    if (ytId) {
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`,
      };
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) {
        return {
          provider: "vimeo",
          src: `https://player.vimeo.com/video/${id}?autoplay=1`,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function formatDateYear(year: number): string {
  return String(year);
}