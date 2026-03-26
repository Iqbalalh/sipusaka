"use client";

import { useState, useCallback, useRef } from "react";
import { Viewer, Worker, RenderPage, RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";

// QR code size in PDF points (must match backend QR_SIZE)
const QR_SIZE = 80;

interface QrPlacement {
  page: number;
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  displaySize: number;
}

interface PdfQrPlacerProps {
  url: string;
  qrDataUrl: string; // QR code as data URL for preview
  onConfirm: (placement: { page: number; x: number; y: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function PdfQrPlacer({
  url,
  qrDataUrl,
  onConfirm,
  onCancel,
  loading = false,
}: PdfQrPlacerProps) {
  const [placement, setPlacement] = useState<QrPlacement | null>(null);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageIndex: number, scale: number, pageWidthScaled: number, pageHeightScaled: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRelX = e.clientX - rect.left;
      const clickRelY = e.clientY - rect.top;

      // RenderPageProps width/height are scaled CSS pixels — convert to PDF points
      const pageWidthPts = pageWidthScaled / scale;
      const pageHeightPts = pageHeightScaled / scale;

      // Convert to PDF coordinates (bottom-left origin), centered on click
      let pdfX = (clickRelX / scale) - (QR_SIZE / 2);
      let pdfY = pageHeightPts - (clickRelY / scale) - (QR_SIZE / 2);

      // Clamp to page bounds
      pdfX = clamp(pdfX, 0, pageWidthPts - QR_SIZE);
      pdfY = clamp(pdfY, 0, pageHeightPts - QR_SIZE);

      // Convert back to display coordinates for preview
      const displayX = pdfX * scale;
      const displayY = (pageHeightPts - pdfY - QR_SIZE) * scale;
      const displaySize = QR_SIZE * scale;

      setPlacement({
        page: pageIndex,
        x: pdfX,
        y: pdfY,
        displayX,
        displayY,
        displaySize,
      });
    },
    []
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
              src={qrDataUrl}
              alt="QR Preview"
              style={{
                position: "absolute",
                left: placement.displayX,
                top: placement.displayY,
                width: placement.displaySize,
                height: placement.displaySize,
                opacity: 0.85,
                pointerEvents: "none",
                border: "2px dashed #8b5cf6",
                borderRadius: 4,
              }}
            />
          )}
        </div>
      </>
    ),
    [handlePageClick, placement, qrDataUrl]
  );

  return (
    <div>
      {/* Instruction banner */}
      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm">
        Klik pada dokumen untuk menempatkan QR code verifikasi. Klik lagi untuk mengubah posisi.
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
          className="bg-purple-600 text-white min-w-[200px]"
        >
          {loading ? "Memproses..." : "Konfirmasi & Terbitkan"}
        </Button>
      </div>
    </div>
  );
}
