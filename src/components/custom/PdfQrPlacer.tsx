"use client";

import { useState, useCallback } from "react";
import { Viewer, Worker, RenderPage, RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";

// Default QR code size in PDF points (must match backend QR_SIZE)
const QR_DEFAULT_SIZE = 80;

interface QrPlacement {
  page: number;
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  displaySize: number;
  pdfSize: number;
}

interface PdfQrPlacerProps {
  url: string;
  qrDataUrl?: string;
  onConfirm: (placement: { page: number; x: number; y: number; qrSize?: number }) => void;
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
  const [sizePercent, setSizePercent] = useState(100);

  const getQrSize = useCallback(() => {
    return QR_DEFAULT_SIZE * (sizePercent / 100);
  }, [sizePercent]);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageIndex: number, scale: number, pageWidthScaled: number, pageHeightScaled: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRelX = e.clientX - rect.left;
      const clickRelY = e.clientY - rect.top;

      const qrSize = getQrSize();
      const pageWidthPts = pageWidthScaled / scale;
      const pageHeightPts = pageHeightScaled / scale;

      let pdfX = clickRelX / scale - qrSize / 2;
      let pdfY = pageHeightPts - clickRelY / scale - qrSize / 2;

      pdfX = clamp(pdfX, 0, pageWidthPts - qrSize);
      pdfY = clamp(pdfY, 0, pageHeightPts - qrSize);

      const displayX = pdfX * scale;
      const displayY = (pageHeightPts - pdfY - qrSize) * scale;
      const displaySize = qrSize * scale;

      setPlacement({ page: pageIndex, x: pdfX, y: pdfY, displayX, displayY, displaySize, pdfSize: qrSize });
    },
    [getQrSize]
  );

  const handleConfirm = useCallback(() => {
    if (!placement) return;
    onConfirm({ page: placement.page, x: placement.x, y: placement.y, qrSize: placement.pdfSize });
  }, [placement, onConfirm]);

  const renderPage: RenderPage = useCallback(
    (props: RenderPageProps) => (
      <>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}
        <div
          style={{ position: "absolute", inset: 0, cursor: "crosshair", zIndex: 10 }}
          onClick={(e) => handlePageClick(e, props.pageIndex, props.scale, props.width, props.height)}
        >
          {placement?.page === props.pageIndex && (
            qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
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
                  border: "2px dashed #2563eb",
                  borderRadius: 4,
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  left: placement.displayX,
                  top: placement.displayY,
                  width: placement.displaySize,
                  height: placement.displaySize,
                  opacity: 0.85,
                  pointerEvents: "none",
                  border: "2px dashed #2563eb",
                  borderRadius: 4,
                  background: "rgba(37,99,235,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2563eb",
                }}
              >
                QR
              </div>
            )
          )}
        </div>
      </>
    ),
    [handlePageClick, placement, qrDataUrl]
  );

  return (
    <div>
      {/* Size slider */}
      <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-700 shrink-0">Ukuran QR:</span>
        <input
          type="range"
          min={40}
          max={200}
          value={sizePercent}
          onChange={(e) => { setSizePercent(Number(e.target.value)); setPlacement(null); }}
          className="flex-1 accent-blue-600"
        />
        <span className="text-sm text-gray-600 w-12 text-right">{sizePercent}%</span>
      </div>

      {/* Instruction banner */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
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
              <div className="p-6 text-center text-red-500">Gagal memuat dokumen PDF.</div>
            )}
          />
        </Worker>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!placement || loading}
          className="bg-blue-600 text-white hover:bg-blue-700 min-w-[200px]"
        >
          {loading ? "Memproses..." : "Konfirmasi & Terbitkan"}
        </Button>
      </div>
    </div>
  );
}
