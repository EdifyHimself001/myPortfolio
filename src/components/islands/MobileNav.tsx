import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

interface Props {
  links: NavLink[];
  cvUrl: string;
}

export default function MobileNav({ links, cvUrl }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = panel
      ? Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled])'
          )
        )
      : [];
    focusables[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables.length > 0 && panel) {
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
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid h-10 w-10 place-items-center border border-white/15 text-neutral-200"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-neutral-950 px-5 pb-10 pt-4"
        >
          <div className="flex h-12 items-center justify-between">
            <span className="text-sm font-bold tracking-wide text-white">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="grid h-10 w-10 place-items-center border border-white/15 text-neutral-200"
            >
              <X size={20} />
            </button>
          </div>

          <nav aria-label="Mobile" className="mt-10 flex flex-col">
            {links.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-t border-line py-5 text-3xl font-bold tracking-tight text-white"
              >
                <span className="mr-4 text-sm font-semibold text-accent">
                  0{i + 1}
                </span>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-10">
            <a
              href={cvUrl}
              download
              className="btn btn-primary w-full"
              data-track="cv_download"
            >
              Download CV
            </a>
            <p className="text-center text-xs text-neutral-500">
              Escape to close · Tab to navigate
            </p>
          </div>
        </div>
      )}
    </div>
  );
}