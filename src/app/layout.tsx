import type { ReactNode } from "react";

/**
 * Everything real happens in [locale]/layout.tsx — this exists only so the
 * app router has a root. It must not render <html>, or the locale layout
 * would nest a second one.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
