// pdf.js, loaded only in the browser and only once. The legacy build runs
// on older iPads and Safari versions the modern build has dropped.

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfjs: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  pdfjs ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return lib;
  });
  return pdfjs;
}

/**
 * Character maps and the 14 standard fonts, for PDFs that do not embed
 * their own. Served from a CDN so they are not bundled with the app.
 */
export function pdfAssetOptions(version: string) {
  const base = `https://unpkg.com/pdfjs-dist@${version}`;
  return {
    cMapUrl: `${base}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}/standard_fonts/`,
  };
}
