"use client";

import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

interface PdfViewerProps {
  url: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 700 }}>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={url}
          plugins={[defaultLayoutPluginInstance]}
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
  );
}
