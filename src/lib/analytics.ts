declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: string,
  data?: Record<string, string>
): void {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined") return;
  window.va?.("event", data ? { name, data } : { name });
}

export function trackClickFromElement(el: HTMLElement): void {
  const name = el.dataset.track;
  if (!name) return;
  let data: Record<string, string> | undefined;
  const raw = el.dataset.trackMeta;
  if (raw) {
    try {
      data = JSON.parse(raw) as Record<string, string>;
    } catch {
      data = undefined;
    }
  }
  trackEvent(name, data);
}