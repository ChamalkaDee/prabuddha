"use client";

/**
 * Last resort when the layout itself fails (for example the database is
 * unreachable while the header checks who is signed in). Translations and
 * styles are unavailable here, so it is plain bilingual HTML.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="si">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#f6f0e4",
          color: "#2b1714",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
            border: "1px solid #6e2b2629",
            borderRadius: 18,
            background: "#fbf8f1",
            padding: "40px 24px",
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            The library could not load right now
          </p>
          <p style={{ fontSize: 15, margin: "8px 0 0" }}>
            පුස්තකාලය මේ මොහොතේ පූරණය කළ නොහැක
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#7a645c", margin: "16px 0 0" }}>
            The server could not reach its database. This is usually brief.
            Wait a few seconds and try again.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              minHeight: 48,
              padding: "0 28px",
              border: 0,
              borderRadius: 999,
              background: "#6e2b26",
              color: "#fbf8f1",
              fontSize: 15,
            }}
          >
            Try again · නැවත උත්සාහ කරන්න
          </button>
          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 11, color: "#7a645c", fontFamily: "monospace" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
