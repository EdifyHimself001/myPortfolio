import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, X, ArrowUpRight } from "lucide-react";

export interface PhotoItem {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  projectTitle?: string;
  projectHref?: string;
}

interface Props {
  photos: PhotoItem[];
}

export default function Lightbox({ photos }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const showPrev = useCallback(
    () => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
      else if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]")
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      lastFocused.current?.focus?.();
    };
  }, [open, close, showPrev, showNext]);

  const photo = index !== null ? photos[index] : null;

  return (
    <div>
      <div className="masonry-grid">
        {photos.map((item, i) => (
          <div key={`${item.src}-${i}`} className="masonry-item">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden bg-panel text-left ring-1 ring-white/5"
              aria-label={`Open photo: ${item.alt}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <Expand
                size={18}
                aria-hidden="true"
                className="absolute right-3 top-3 text-white/0 transition-colors duration-300 group-hover:text-white/90"
              />
              {item.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.caption}
                </span>
              )}
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {open && photo && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Photo ${(index ?? 0) + 1} of ${photos.length}`}
            ref={dialogRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-neutral-950/95 backdrop-blur-sm"
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
              if (Math.abs(dx) > 48) {
                if (dx > 0) showPrev();
                else showNext();
              }
              touchStartX.current = null;
            }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
                {(index ?? 0) + 1} / {photos.length}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close lightbox"
                className="grid h-11 w-11 place-items-center border border-white/15 text-neutral-300 transition-colors hover:border-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
              <motion.figure
                key={photo.src}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.3 }}
                className="max-h-full"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  className="mx-auto max-h-[72vh] w-auto max-w-full object-contain"
                />
              </motion.figure>

              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/10 bg-neutral-950/60 text-neutral-200 backdrop-blur transition-colors hover:border-accent hover:text-white sm:left-6"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center border border-white/10 bg-neutral-950/60 text-neutral-200 backdrop-blur transition-colors hover:border-accent hover:text-white sm:right-6"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-6 border-t border-line px-5 py-4">
              <p className="min-w-0 truncate text-sm text-neutral-400">
                {photo.caption ?? photo.alt}
              </p>
              {photo.projectHref && (
                <a
                  href={photo.projectHref}
                  onClick={close}
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-white"
                >
                  View project
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}