"use client";

import { useEffect, useRef, useState } from "react";
import { Spin, Flex } from "antd";
import { LoadingOutlined, DownloadOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";

interface DocumentViewerProps {
  url: string;
  fileName?: string | null;
}

export default function DocumentViewer({ url, fileName }: DocumentViewerProps) {
  const cleanName = (fileName || url)?.split("?")[0].toLowerCase();
  const isPdf = cleanName?.endsWith(".pdf");

  if (isPdf) {
    return <PdfViewerLazy url={url} />;
  }

  return <DocxViewer url={url} />;
}

// ============================================
// PDF Viewer (dynamic import, no SSR)
// ============================================
const PdfViewerLazy = dynamic(
  () => import("./PdfViewer"),
  {
    ssr: false,
    loading: () => (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    ),
  }
);

// ============================================
// DOCX Viewer (docx-preview)
// ============================================
function DocxViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDocx = async () => {
      try {
        setLoading(true);
        setError(null);

        const { renderAsync } = await import("docx-preview");
        const res = await fetch(url);
        if (!res.ok) throw new Error("Gagal mengunduh dokumen");

        const blob = await res.blob();

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = "";
          await renderAsync(blob, containerRef.current, undefined, {
            className: "docx-preview",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Gagal memuat dokumen");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDocx();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">{error}</div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-auto max-h-[700px] bg-white relative">
      {loading && (
        <Flex align="center" justify="center" className="min-h-[400px]">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
      )}
      <div ref={containerRef} />
    </div>
  );
}

// ============================================
// Wrapper with download link
// ============================================
export function DocumentViewerWithDownload({
  url,
  fileName,
}: DocumentViewerProps) {
  return (
    <div>
      <DocumentViewer url={url} fileName={fileName} />
      <div className="mt-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <DownloadOutlined />
          Unduh Dokumen
        </a>
      </div>
    </div>
  );
}
