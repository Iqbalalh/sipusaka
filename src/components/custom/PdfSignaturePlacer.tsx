"use client";

import { useState, useCallback, useRef } from "react";
import { Viewer, Worker, RenderPage, RenderPageProps } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";

// Default signature size in PDF points (must match backend constants)
const SIG_DEFAULT_WIDTH = 150;
const SIG_DEFAULT_HEIGHT = 60;

type SignatureType = "ttd" | "paraf";

interface SignaturePlacement {
  page: number;
  x: number;
  y: number;
  displayX: number;
  displayY: number;
  displayWidth: number;
  displayHeight: number;
  pdfWidth: number;
  pdfHeight: number;
}

interface PdfSignaturePlacerProps {
  url: string;
  signatureImageUrl: string;
  parafImageUrl?: string | null;
  onConfirm: (placement: {
    page: number;
    x: number;
    y: number;
    signatureType: SignatureType;
    signatureWidth: number;
    signatureHeight: number;
  }) => void;
  onCancel: () => void;
  onApproveWithoutSign?: () => void;
  loading?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export default function PdfSignaturePlacer({
  url,
  signatureImageUrl,
  parafImageUrl,
  onConfirm,
  onCancel,
  onApproveWithoutSign,
  loading = false,
}: PdfSignaturePlacerProps) {
  const [placement, setPlacement] = useState<SignaturePlacement | null>(null);
  const [sigType, setSigType] = useState<SignatureType>("ttd");
  // Size scale 50–150% relative to default
  const [sizePercent, setSizePercent] = useState(100);

  const sigAspectRef = useRef<number>(SIG_DEFAULT_WIDTH / SIG_DEFAULT_HEIGHT);
  const parafAspectRef = useRef<number>(1);

  const activeImageUrl = sigType === "paraf" && parafImageUrl ? parafImageUrl : signatureImageUrl;

  const onSigLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>, type: SignatureType) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const aspect = img.naturalWidth / img.naturalHeight;
      if (type === "ttd") sigAspectRef.current = aspect;
      else parafAspectRef.current = aspect;
    }
  }, []);

  const getSigDimensions = useCallback(() => {
    const aspect = sigType === "paraf" && parafImageUrl
      ? parafAspectRef.current
      : sigAspectRef.current;
    const scale = sizePercent / 100;
    const maxW = SIG_DEFAULT_WIDTH * scale;
    const maxH = SIG_DEFAULT_HEIGHT * scale;
    let w = maxW;
    let h = maxW / aspect;
    if (h > maxH) {
      h = maxH;
      w = maxH * aspect;
    }
    return { w, h };
  }, [sigType, parafImageUrl, sizePercent]);

  const recalcPlacement = useCallback(
    (
      clickRelX: number,
      clickRelY: number,
      pageIndex: number,
      scale: number,
      pageWidthScaled: number,
      pageHeightScaled: number,
    ) => {
      const { w: sigW, h: sigH } = getSigDimensions();
      const pageWidthPts = pageWidthScaled / scale;
      const pageHeightPts = pageHeightScaled / scale;

      let pdfX = clickRelX / scale - sigW / 2;
      let pdfY = pageHeightPts - clickRelY / scale - sigH / 2;

      pdfX = clamp(pdfX, 0, pageWidthPts - sigW);
      pdfY = clamp(pdfY, 0, pageHeightPts - sigH);

      const displayX = pdfX * scale;
      const displayY = (pageHeightPts - pdfY - sigH) * scale;
      const displayWidth = sigW * scale;
      const displayHeight = sigH * scale;

      return { page: pageIndex, x: pdfX, y: pdfY, displayX, displayY, displayWidth, displayHeight, pdfWidth: sigW, pdfHeight: sigH };
    },
    [getSigDimensions]
  );

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageIndex: number, scale: number, pageWidthScaled: number, pageHeightScaled: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickRelX = e.clientX - rect.left;
      const clickRelY = e.clientY - rect.top;
      const p = recalcPlacement(clickRelX, clickRelY, pageIndex, scale, pageWidthScaled, pageHeightScaled);
      setPlacement(p);
    },
    [recalcPlacement]
  );

  const handleConfirm = useCallback(() => {
    if (!placement) return;
    onConfirm({
      page: placement.page,
      x: placement.x,
      y: placement.y,
      signatureType: sigType,
      signatureWidth: placement.pdfWidth,
      signatureHeight: placement.pdfHeight,
    });
  }, [placement, onConfirm, sigType]);

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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImageUrl}
              alt="Preview TTD"
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
    [handlePageClick, placement, activeImageUrl]
  );

  const hasParaf = !!parafImageUrl;

  return (
    <div>
      {/* Signature type selector */}
      {hasParaf && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Jenis tanda tangan:</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="sigType"
              value="ttd"
              checked={sigType === "ttd"}
              onChange={() => { setSigType("ttd"); setPlacement(null); }}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Tanda Tangan (TTD)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="sigType"
              value="paraf"
              checked={sigType === "paraf"}
              onChange={() => { setSigType("paraf"); setPlacement(null); }}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">Paraf</span>
          </label>
          {/* Signature previews */}
          <div className="ml-auto flex items-center gap-3">
            {signatureImageUrl && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signatureImageUrl} alt="TTD" className="h-8 object-contain border border-gray-200 rounded px-1" />
                <span className="text-xs text-gray-400 block">TTD</span>
              </div>
            )}
            {parafImageUrl && (
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={parafImageUrl} alt="Paraf" className="h-8 object-contain border border-gray-200 rounded px-1" />
                <span className="text-xs text-gray-400 block">Paraf</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Size slider */}
      <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-700 shrink-0">Ukuran:</span>
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
        Klik pada dokumen untuk menempatkan {sigType === "paraf" ? "paraf" : "tanda tangan"} Anda. Klik lagi untuk mengubah posisi.
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
      <div className="flex justify-between items-center mt-4 gap-3">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          {onApproveWithoutSign && (
            <Button
              variant="outline"
              onClick={onApproveWithoutSign}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Setujui tanpa TTD"}
            </Button>
          )}
        </div>
        <Button
          onClick={handleConfirm}
          disabled={!placement || loading}
          className="bg-green-600 text-white min-w-[200px]"
        >
          {loading ? "Memproses..." : `Konfirmasi Posisi ${sigType === "paraf" ? "Paraf" : "TTD"}`}
        </Button>
      </div>

      {/* Hidden images to detect aspect ratios */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={signatureImageUrl} alt="" onLoad={(e) => onSigLoad(e, "ttd")} style={{ display: "none" }} />
      {parafImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={parafImageUrl} alt="" onLoad={(e) => onSigLoad(e, "paraf")} style={{ display: "none" }} />
      )}
    </div>
  );
}
