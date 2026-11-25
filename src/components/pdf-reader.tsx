"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Link } from "@/i18n/navigation";
import { loadPdfJs, pdfAssetOptions } from "@/lib/pdfjs";
import { cn } from "@/lib/utils";

type Mode = "scroll" | "swipe";

/** Multiples of "fit to width". */
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const MODE_KEY = "prabuddha.pdfMode";
/** Gap around and between pages, in CSS pixels. */
const GUTTER = 12;
/** Pages either side of the current one that stay rendered while scrolling. */
const KEEP_BEHIND = 2;
const KEEP_AHEAD = 3;
/** iOS refuses to draw canvases much bigger than this. */
const MAX_CANVAS_PIXELS = 5_000_000;

/**
 * Full-screen PDF reader. Readers choose between scrolling down through
 * the pages and swiping left and right one page at a time; the page
 * number, previous/next and zoom controls are always on screen.
 */
export function PdfReader({
  url,
  downloadUrl,
  title,
}: {
  url: string;
  downloadUrl: string;
  title: string;
}) {
  const t = useTranslations("pdfs");
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setModeState] = useState<Mode>("scroll");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  /** Height ÷ width per page, learnt as pages load; page 1's stands in for the rest. */
  const [aspects, setAspects] = useState<Record<number, number>>({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  /** Where to put the reader back after a zoom or mode change. */
  const anchor = useRef<{ page: number; offset: number } | null>(null);
  const numPages = doc?.numPages ?? 0;

  // Remember the reader's preferred mode on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === "scroll" || saved === "swipe") setModeState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    setDoc(null);
    setFailed(false);

    loadPdfJs()
      .then((pdfjs) => {
        if (cancelled) return null;
        const task = pdfjs.getDocument({
          url,
          isEvalSupported: false,
          ...pdfAssetOptions(pdfjs.version),
        });
        destroy = () => void task.destroy();
        task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (total) setProgress(Math.min(1, loaded / total));
        };
        return task.promise;
      })
      .then(async (loaded) => {
        if (!loaded || cancelled) return;
        const first = await loaded.getPage(1);
        const view = first.getViewport({ scale: 1 });
        setAspects({ 1: view.height / view.width });
        setDoc(loaded);
      })
      .catch((cause) => {
        if (cancelled) return;
        console.error("[pdf] could not open", cause);
        setFailed(true);
      });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url]);

  // Track the space available for a page.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const fitWidth = Math.max(160, Math.min(width - GUTTER * 2, 1000));
  const pageWidth = Math.round(fitWidth * zoom);
  const defaultAspect = aspects[1] ?? 1.414;

  const onAspect = useCallback((n: number, aspect: number) => {
    setAspects((prev) => (Math.abs((prev[n] ?? 0) - aspect) < 0.001 ? prev : { ...prev, [n]: aspect }));
  }, []);

  /** Remembers how far into the current page the reader is, as a fraction. */
  const captureAnchor = useCallback(() => {
    const el = viewportRef.current;
    const pageEl = pageRefs.current[page - 1];
    if (mode === "scroll" && el && pageEl) {
      anchor.current = {
        page,
        offset: (el.scrollTop - pageEl.offsetTop) / Math.max(1, pageEl.offsetHeight),
      };
    } else {
      anchor.current = { page, offset: 0 };
    }
  }, [mode, page]);

  // After a zoom, resize or mode change, scroll back to the same spot.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    const target = anchor.current;
    if (!el || !target) return;
    anchor.current = null;
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
    if (mode === "scroll") {
      const pageEl = pageRefs.current[target.page - 1];
      if (pageEl) el.scrollTop = pageEl.offsetTop + target.offset * pageEl.offsetHeight;
    } else {
      el.scrollTop = 0;
    }
  }, [mode, pageWidth, doc]);

  const goTo = useCallback(
    (n: number) => {
      if (!numPages) return;
      const next = Math.min(numPages, Math.max(1, Math.round(n)));
      const el = viewportRef.current;
      if (mode === "scroll") {
        const pageEl = pageRefs.current[next - 1];
        if (el && pageEl) el.scrollTo({ top: pageEl.offsetTop - GUTTER });
      } else if (el) {
        el.scrollTop = 0;
        el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
      }
      setPage(next);
    },
    [mode, numPages],
  );

  const zoomBy = useCallback(
    (direction: 1 | -1) => {
      const index = ZOOMS.findIndex((z) => z >= zoom - 0.001);
      const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, index + direction))];
      if (next === zoom) return;
      captureAnchor();
      setZoom(next);
    },
    [zoom, captureAnchor],
  );

  function setMode(next: Mode) {
    if (next === mode) return;
    anchor.current = { page, offset: 0 };
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {}
  }

  // In scroll mode the page number follows the scroll position.
  const frame = useRef(0);
  function onScroll() {
    if (mode !== "scroll") return;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = viewportRef.current;
      if (!el) return;
      const line = el.scrollTop + el.clientHeight * 0.35;
      let current = 1;
      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl && pageEl.offsetTop <= line) current = i + 1;
        else break;
      }
      setPage(current);
    });
  }

  // Swipe left or right to turn the page, unless the reader is panning
  // across a zoomed-in page that still has more to show in that direction.
  const touch = useRef<{ x: number; y: number; left: number; time: number } | null>(null);
  function onTouchStart(event: React.TouchEvent) {
    if (mode !== "swipe" || event.touches.length !== 1) {
      touch.current = null;
      return;
    }
    const point = event.touches[0];
    touch.current = {
      x: point.clientX,
      y: point.clientY,
      left: viewportRef.current?.scrollLeft ?? 0,
      time: Date.now(),
    };
  }
  function onTouchEnd(event: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    const el = viewportRef.current;
    if (!start || !el || event.changedTouches.length !== 1) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - start.time > 800) {
      return;
    }
    const maxLeft = el.scrollWidth - el.clientWidth;
    if (dx < 0 && start.left >= maxLeft - 2) goTo(page + 1);
    if (dx > 0 && start.left <= 2) goTo(page - 1);
  }

  // Keyboard: arrows turn pages, + and - zoom.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
      if (event.key === "ArrowRight" || (mode === "swipe" && event.key === "PageDown")) {
        event.preventDefault();
        goTo(page + 1);
      } else if (event.key === "ArrowLeft" || (mode === "swipe" && event.key === "PageUp")) {
        event.preventDefault();
        goTo(page - 1);
      } else if (event.key === "+" || event.key === "=") {
        zoomBy(1);
      } else if (event.key === "-") {
        zoomBy(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, zoomBy, page, mode]);

  // The reader covers the whole screen; stop the page behind it scrolling.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-high">
      {/* Top bar: back, title, reading mode, download */}
      <div
        className="flex items-center gap-2 border-b border-border bg-surface px-2 py-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.5rem)" }}
      >
        <Link href="/pdfs" aria-label={t("back")} className={iconButton}>
          <Icon d="M15 5l-7 7 7 7" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
        <div
          role="group"
          aria-label={t("readingMode")}
          className="flex shrink-0 rounded-full border border-border p-0.5"
        >
          <ModeButton active={mode === "scroll"} onClick={() => setMode("scroll")} label={t("modeScroll")}>
            <Icon d="M7 3h10v6H7zM7 15h10v6H7zM12 10.5v3" />
          </ModeButton>
          <ModeButton active={mode === "swipe"} onClick={() => setMode("swipe")} label={t("modeSwipe")}>
            <Icon d="M8 5h8v14H8zM4 9l-2 3 2 3M20 9l2 3-2 3" />
          </ModeButton>
        </div>
        <a href={downloadUrl} download aria-label={t("download")} className={iconButton}>
          <Icon d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />
        </a>
      </div>

      {/* Pages */}
      <div
        ref={viewportRef}
        onScroll={onScroll}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        {failed ? (
          <div className="mx-auto max-w-sm px-6 py-20 text-center">
            <p className="font-display text-lg">{t("openFailed")}</p>
            <a href={downloadUrl} download className="mt-4 inline-block text-sm text-accent underline">
              {t("downloadInstead")}
            </a>
          </div>
        ) : !doc ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
            <span className="h-1 w-40 overflow-hidden rounded-full bg-border">
              <span
                className={cn(
                  "block h-full rounded-full bg-accent transition-[width]",
                  progress === null && "w-1/3 animate-pulse",
                )}
                style={progress === null ? undefined : { width: `${progress * 100}%` }}
              />
            </span>
            {t("loading")}
          </div>
        ) : mode === "scroll" ? (
          <div className="w-max min-w-full" style={{ padding: GUTTER }}>
            {pages.map((n) => (
              <div
                key={n}
                ref={(el) => {
                  pageRefs.current[n - 1] = el;
                }}
                className="mx-auto"
                style={{ width: pageWidth, marginBottom: GUTTER }}
              >
                <PdfPage
                  doc={doc}
                  number={n}
                  width={pageWidth}
                  aspect={aspects[n] ?? defaultAspect}
                  active={n >= page - KEEP_BEHIND && n <= page + KEEP_AHEAD}
                  onAspect={onAspect}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-full w-max min-w-full items-center" style={{ padding: GUTTER }}>
            <div key={page} className="pdf-page-in mx-auto" style={{ width: pageWidth }}>
              <PdfPage
                doc={doc}
                number={page}
                width={pageWidth}
                aspect={aspects[page] ?? defaultAspect}
                active
                onAspect={onAspect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar: previous, page number, next, zoom — always visible */}
      <div
        className="flex items-center justify-between gap-1 border-t border-border bg-surface px-2 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={!doc || page <= 1}
            aria-label={t("previousPage")}
            className={iconButton}
          >
            <Icon d="M15 5l-7 7 7 7" />
          </button>
          <PageInput page={page} numPages={numPages} onGo={goTo} label={t("pageNumber")} />
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={!doc || page >= numPages}
            aria-label={t("nextPage")}
            className={iconButton}
          >
            <Icon d="M9 5l7 7-7 7" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoomBy(-1)}
            disabled={!doc || zoom <= ZOOMS[0]}
            aria-label={t("zoomOut")}
            className={iconButton}
          >
            <Icon d="M5 12h14" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (zoom === 1) return;
              captureAnchor();
              setZoom(1);
            }}
            disabled={!doc}
            aria-label={t("fitWidth")}
            className="min-h-11 w-14 rounded-full font-mono text-xs text-muted tabular-nums transition-colors hover:text-foreground"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1)}
            disabled={!doc || zoom >= ZOOMS[ZOOMS.length - 1]}
            aria-label={t("zoomIn")}
            className={iconButton}
          >
            <Icon d="M12 5v14M5 12h14" />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-high disabled:opacity-30";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-10 w-11 items-center justify-center rounded-full transition-colors",
        active ? "bg-accent text-accent-contrast" : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** "12 / 240", where the 12 can be typed over to jump to a page. */
function PageInput({
  page,
  numPages,
  onGo,
  label,
}: {
  page: number;
  numPages: number;
  onGo: (n: number) => void;
  label: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  function commit() {
    if (draft !== null) {
      const n = parseInt(draft, 10);
      if (Number.isFinite(n)) onGo(n);
    }
    setDraft(null);
  }

  return (
    <label className="flex items-center gap-1 font-mono text-xs text-muted tabular-nums">
      <span className="sr-only">{label}</span>
      <input
        value={draft ?? (numPages ? String(page) : "–")}
        onFocus={(event) => {
          setDraft(String(page));
          event.target.select();
        }}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 5))}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
        inputMode="numeric"
        disabled={!numPages}
        className="h-9 w-12 rounded-lg border border-border bg-background text-center text-sm text-foreground"
      />
      <span>/ {numPages || "–"}</span>
    </label>
  );
}

/**
 * One page. It draws into a fresh canvas and swaps it in when finished, so
 * zooming never flashes a blank page, and lets go of the canvas when the
 * page scrolls out of range so long books do not exhaust a phone's memory.
 */
function PdfPage({
  doc,
  number,
  width,
  aspect,
  active,
  onAspect,
}: {
  doc: PDFDocumentProxy;
  number: number;
  width: number;
  aspect: number;
  active: boolean;
  onAspect: (n: number, aspect: number) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    if (!active) {
      release(holder);
      return;
    }

    let cancelled = false;
    let task: RenderTask | null = null;

    doc
      .getPage(number)
      .then((pdfPage) => {
        if (cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        onAspect(number, base.height / base.width);

        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        let scale = (width / base.width) * ratio;
        const pixels = base.width * base.height * scale * scale;
        if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
        const viewport = pdfPage.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = "block h-full w-full";

        task = pdfPage.render({ canvas, viewport });
        return task.promise.then(() => {
          if (cancelled) return;
          release(holder);
          holder.appendChild(canvas);
        });
      })
      .catch((cause) => {
        if (cause?.name !== "RenderingCancelledException") console.error("[pdf] page", number, cause);
      });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, number, width, active, onAspect]);

  return (
    <div
      ref={holderRef}
      className="overflow-hidden rounded-[3px] bg-white shadow-[0_1px_3px_rgba(43,23,20,0.18)]"
      style={{ width, height: Math.round(width * aspect) }}
    />
  );
}

function release(holder: HTMLDivElement) {
  for (const canvas of Array.from(holder.querySelectorAll("canvas"))) {
    // Shrinking first frees the pixel memory straight away on Safari.
    canvas.width = 0;
    canvas.height = 0;
  }
  holder.replaceChildren();
}
