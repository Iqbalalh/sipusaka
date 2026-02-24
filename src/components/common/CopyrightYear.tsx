"use client";

/**
 * Client component for displaying the current year.
 * Uses suppressHydrationWarning to prevent hydration mismatch warnings
 * since the year may differ between server and client render times.
 */
export default function CopyrightYear() {
  const year = new Date().getFullYear();
  return <span suppressHydrationWarning>{year}</span>;
}
