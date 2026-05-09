"use client";

import { useMemo } from "react";

interface CollaboraEditorProps {
  /** Letter ID — the backend WOPI host will serve /wopi/files/:id */
  letterId: string | number;
  height?: string;
  className?: string;
}

const COLLABORA_URL = process.env.NEXT_PUBLIC_COLLABORA_URL;
const BACKEND_URL   = process.env.NEXT_PUBLIC_BACK_END_SERVICE ?? "http://localhost:9000";

/**
 * Embeds Collabora Online via WOPI iframe.
 * Requires:
 *   NEXT_PUBLIC_COLLABORA_URL  = http(s)://your-collabora-server
 *   NEXT_PUBLIC_BACK_END_SERVICE = http(s)://your-backend (must be reachable by Collabora)
 */
export default function CollaboraEditor({ letterId, height = "600px", className }: CollaboraEditorProps) {
  const src = useMemo(() => {
    if (!COLLABORA_URL) return null;
    const wopiSrc = `${BACKEND_URL}/wopi/files/${letterId}`;
    return `${COLLABORA_URL}/browser/dist/cool.html?WOPISrc=${encodeURIComponent(wopiSrc)}`;
  }, [letterId]);

  if (!src) {
    return (
      <div className="p-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
        NEXT_PUBLIC_COLLABORA_URL belum dikonfigurasi. Jalankan Collabora Online lalu set env var tersebut.
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className={className}
      style={{ width: "100%", height, border: "none" }}
      allow="fullscreen"
      title={`Collabora Editor — Surat ${letterId}`}
    />
  );
}
