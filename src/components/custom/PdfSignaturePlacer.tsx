"use client";

import { useState, useCallback, useRef } from "react";
import { Viewer, Worker, RenderPage, RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";

// Signature size in PDF points (must match backend constants)
const SIG_MAX_WIDTH = 150;
const SIG_MAX_HEIGHT = 60;

interface SignaturePlacement {
  page: number;
  x: number;
  y: number;
  // Display coordinates for preview (CSS pixels, top-left origin)
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
}

interface PdfSignaturePlacerProps {
  url: string;
  signatureImageUrl: string;
  onConfirm: (placement: { page: number; x: number; y: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function PdfSignaturePlacer({
  url,
  signatureImageUrl,
  onConfirm,
  onCancel,
  loading = false,
}: PdfSignaturePlacerProps) {
  const [placement, setPlacement] = useState<SignaturePlacement | null>(null);
  const sigAspectRef = useRef<number>(SIG_MAX_WIDTH / SIG_MAX_HEIGHT);

  // Load signature image to get aspect ratio
  const onSigLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      sigAspectRef.current = img.naturalWidth / img.naturalHeight;
    }
  }, []);

  // Calculate actual signature dimensions in PDF points
  const getSigDimensions = useCallback(() => {
    const aspect = sigAspectRef.current;
    let w = SIG_MAX_WIDTH;
    let h = SIG_MAX_WIDTH / aspect;
    if (h > SIG_MAX_HEIGHT) {
      h = SIG_MAX_HEIGHT;
      w = SIG_MAX_HEIGHT * aspect;
    }
    return { w, h };
  }, []);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageIndex: number, scale: number, pageWidthScaled: number, pageHeightScaled: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRelX = e.clientX - rect.left;
      const clickRelY = e.clientY - rect.top;

      const { w: sigW, h: sigH } = getSigDimensions();

      // RenderPageProps width/height are already scaled CSS pixels — convert to PDF points
      const pageWidthPts = pageWidthScaled / scale;
      const pageHeightPts = pageHeightScaled / scale;

      // Convert to PDF coordinates (bottom-left origin), centered on click
      let pdfX = (clickRelX / scale) - (sigW / 2);
      let pdfY = pageHeightPts - (clickRelY / scale) - (sigH / 2);

      // Clamp to page bounds
      pdfX = clamp(pdfX, 0, pageWidthPts - sigW);
      pdfY = clamp(pdfY, 0, pageHeightPts - sigH);

      // Convert back to display coordinates for preview
      const displayX = pdfX * scale;
      const displayY = (pageHeightPts - pdfY - sigH) * scale;
      const displayWidth = sigW * scale;
      const displayHeight = sigH * scale;

      setPlacement({
        page: pageIndex,
        x: pdfX,
        y: pdfY,
        displayX,
        displayY,
        displayWidth,
        displayHeight,
      });
    },
    [getSigDimensions]
  );

  const handleConfirm = useCallback(() => {
    if (!placement) return;
    onConfirm({ page: placement.page, x: placement.x, y: placement.y });
  }, [placement, onConfirm]);

  const renderPage: RenderPage = useCallback(
    (props: RenderPageProps) => (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            cursor: "crosshair",
            zIndex: 10,
          }}
          onClick={(e) =>
            handlePageClick(e, props.pageIndex, props.scale, props.width, props.height)
          }
        >
          {placement?.page === props.pageIndex && (
            <img
              src={signatureImageUrl}
              alt="TTD Preview"
              style={{
                position: "absolute",
                left: placement.displayX,
                top: placement.displayY,
                width: placement.displayWidth,
                height: placement.displayHeight,
                opacity: 0.8,
                pointerEvents: "none",
                border: "2px dashed #3b82f6",
                borderRadius: 4,
              }}
            />
          )}
        </div>
      </>
    ),
    [handlePageClick, placement, signatureImageUrl]
  );

  return (
    <div>
      {/* Instruction banner */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
        Klik pada dokumen untuk menempatkan tanda tangan Anda. Klik lagi untuk mengubah posisi.
      </div>

      {/* PDF Viewer */}
      <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 600 }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <Viewer
            fileUrl={url}
            renderPage={renderPage}
            renderLoader={(percentages: number) => (
              <Flex align="center" justify="center" className="min-h-[400px]">
                <Spin indicator={<LoadingOutlined spin />} size="large" />
                <span className="ml-3 text-gray-500">{Math.round(percentages)}%</span>
              </Flex>
            )}
            renderError={() => (
              <div className="p-6 text-center text-red-500">
                Gagal memuat dokumen PDF.
              </div>
            )}
          />
        </Worker>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mt-4">
        <Button onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!placement || loading}
          className="bg-green-600 text-white min-w-[180px]"
        >
          {loading ? "Memproses..." : "Konfirmasi Posisi TTD"}
        </Button>
      </div>

      {/* Hidden image to detect aspect ratio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signatureImageUrl}
        alt=""
        onLoad={onSigLoad}
        style={{ display: "none" }}
      />
    </div>
  );
}
