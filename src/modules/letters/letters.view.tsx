"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Spin, Flex, Tag, Table, Modal, Image } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { DocumentViewerWithDownload } from "@/components/custom/DocumentViewer";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { getLetter, publishLetter } from "@/utils/services/letter.service";
import { Letter, LetterStatus } from "@/types/models/letter";
import { formatDate } from "@/utils/formatter/formatDate";

const PdfQrPlacer = dynamic(
  () => import("@/components/custom/PdfQrPlacer"),
  { ssr: false }
);

const statusLabels: Record<LetterStatus, string> = {
  draft: "Draft",
  pending1: "Menunggu TTD 1",
  pending2: "Menunggu TTD 2",
  pending3: "Menunggu TTD 3",
  approved: "Disetujui",
  published: "Diterbitkan",
};

/** Check if document URL points to a PDF */
const isPdfDocument = (url?: string | null, path?: string | null): boolean => {
  const name = (path || url || "").split("?")[0].toLowerCase();
  return name.endsWith(".pdf");
};

export default function LetterView() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const [data, setData] = useState<Letter | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // QR placement mode
  const [qrMode, setQrMode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const { notify } = useNotify();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const letter = await getLetter(id);
        setData(letter);
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, notify]);

  const handlePublishClick = useCallback(async () => {
    if (
      data?.documentUrl &&
      isPdfDocument(data.documentUrl, data.documentPath)
    ) {
      // Generate QR preview with logo overlay for placement mode
      try {
        const previewUrl = `${window.location.origin}/verify/preview`;
        const qrDataUrl = await QRCode.toDataURL(previewUrl, {
          width: 400,
          margin: 1,
          errorCorrectionLevel: "H", // High correction to survive logo overlay
        });

        // Overlay YPKAI logo in center
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d")!;

        const qrImg = new window.Image();
        qrImg.src = qrDataUrl;
        await new Promise<void>((resolve) => { qrImg.onload = () => resolve(); });
        ctx.drawImage(qrImg, 0, 0, 400, 400);

        // Load logo
        const logoImg = new window.Image();
        logoImg.src = "/images/logo/logo-ypkai.png";
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
        });

        const logoSize = 100; // 25% of 400
        const logoPad = 10;
        const logoOffset = (400 - logoSize) / 2;

        // White background behind logo
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(logoOffset, logoOffset, logoSize, logoSize);

        // Draw logo
        ctx.drawImage(
          logoImg,
          logoOffset + logoPad,
          logoOffset + logoPad,
          logoSize - logoPad * 2,
          logoSize - logoPad * 2
        );

        setQrDataUrl(canvas.toDataURL("image/png"));
        setQrMode(true);
      } catch {
        // Fallback: simple publish without QR placement
        setPublishModalOpen(true);
      }
    } else {
      // Non-PDF document: simple publish
      setPublishModalOpen(true);
    }
  }, [data]);

  const handlePublishWithQr = async (placement: {
    page: number;
    x: number;
    y: number;
  }) => {
    try {
      setPublishLoading(true);
      const res = await publishLetter(Number(id), {
        qrPage: placement.page,
        qrX: placement.x,
        qrY: placement.y,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Gagal menerbitkan surat");
      }
      notify("success", "Surat berhasil diterbitkan dengan QR code verifikasi!");
      router.push("/letters/archives");
    } catch (err: any) {
      notify("error", err.message || "Gagal menerbitkan surat");
    } finally {
      setPublishLoading(false);
    }
  };

  const handlePublishSimple = async () => {
    try {
      setPublishLoading(true);
      const res = await publishLetter(Number(id));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menerbitkan surat");
      }
      notify("success", "Surat berhasil diterbitkan!");
      setPublishModalOpen(false);
      router.push("/letters/archives");
    } catch (err: any) {
      notify("error", err.message || "Gagal menerbitkan surat");
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  if (!data) {
    return <p className="text-center text-gray-500">Surat tidak ditemukan.</p>;
  }

  // QR placement mode: show full-screen placer
  if (qrMode && data.documentUrl && qrDataUrl) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Tempatkan QR Code Verifikasi — {data.subject}
        </h4>
        <PdfQrPlacer
          url={data.documentUrl}
          qrDataUrl={qrDataUrl}
          onConfirm={handlePublishWithQr}
          onCancel={() => setQrMode(false)}
          loading={publishLoading}
        />
      </div>
    );
  }

  const approvalColumns = [
    {
      title: "Level",
      dataIndex: "signerLevel",
      key: "signerLevel",
      render: (level: number) => `Penandatangan ${level}`,
    },
    {
      title: "Aksi",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        const colors: Record<string, string> = {
          approve: "success",
          reject: "warning",
          cancel: "error",
        };
        const labels: Record<string, string> = {
          approve: "Disetujui",
          reject: "Direvisi",
          cancel: "Dibatalkan",
        };
        return <Tag color={colors[action] || "default"}>{labels[action] || action}</Tag>;
      },
    },
    {
      title: "Tanda Tangan",
      dataIndex: "signatureUrl",
      key: "signatureUrl",
      render: (url: string | null, record: any) => {
        if (record.action !== "approve" || !url) return "-";
        return (
          <Image
            src={url}
            alt="TTD"
            width={120}
            height={48}
            style={{ objectFit: "contain" }}
            preview={{ mask: "Lihat TTD" }}
          />
        );
      },
    },
    {
      title: "Catatan",
      dataIndex: "actionNote",
      key: "actionNote",
      render: (text: string) => text || "-",
    },
    {
      title: "Waktu",
      dataIndex: "actionAt",
      key: "actionAt",
      render: (text: string) => (text ? formatDate(text) : "-"),
    },
  ];

  const verifyUrl = data.verificationToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${data.verificationToken}`
    : null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Detail Surat
        </h4>
        <div className="flex gap-2">
          {isAdmin && data.status === "approved" && (
            <Button
              onClick={handlePublishClick}
              disabled={publishLoading}
              className="bg-purple-600 text-white"
            >
              {publishLoading ? "Menerbitkan..." : "Terbitkan"}
            </Button>
          )}
          <Link href="/letters/archives">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </div>

      {/* Detail Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Jenis Surat
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.letterType || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Nomor Surat
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.letterNumber || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Lampiran
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.attachment || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Perihal
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.subject || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Tanggal Pembuatan
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.letterDate ? formatDate(data.letterDate) : "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Tujuan Surat
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.destination || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Tembusan
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.carbonCopy || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Status
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {statusLabels[data.status] || data.status}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Penandatangan 1
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.signer1?.staffName || data.signer1?.username || "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Penandatangan 2
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.signer2
              ? data.signer2.staffName || data.signer2.username
              : "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Penandatangan 3
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.signer3
              ? data.signer3.staffName || data.signer3.username
              : "-"}
          </span>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
            Dibuat Pada
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">
            {data.createdAt ? formatDate(data.createdAt) : "-"}
          </span>
        </div>
      </div>

      {/* Verification Link (for published letters) */}
      {verifyUrl && data.status === "published" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-md font-semibold mb-2 text-green-800">
            Link Verifikasi Surat
          </h5>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm text-gray-700"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(verifyUrl);
                notify("success", "Link verifikasi disalin!");
              }}
            >
              Salin
            </Button>
          </div>
        </div>
      )}

      {/* Document Preview */}
      <div className="mt-6">
        <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
          Dokumen
        </h5>
        {data.documentUrl ? (
          <DocumentViewerWithDownload
            url={data.documentUrl}
            fileName={data.documentPath}
          />
        ) : (
          <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
            Tidak ada dokumen yang diunggah.
          </div>
        )}
      </div>

      {/* Approval History */}
      {data.letterApprovals && data.letterApprovals.length > 0 && (
        <div className="mt-6">
          <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Riwayat Persetujuan
          </h5>
          <Table
            dataSource={data.letterApprovals}
            columns={approvalColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>
      )}

      {/* Publish Confirmation Modal (for non-PDF documents) */}
      <Modal
        title="Terbitkan Surat"
        open={publishModalOpen}
        onOk={handlePublishSimple}
        onCancel={() => setPublishModalOpen(false)}
        okText={publishLoading ? "Memproses..." : "Terbitkan"}
        cancelText="Batal"
        confirmLoading={publishLoading}
      >
        <p>Apakah Anda yakin ingin menerbitkan surat ini?</p>
      </Modal>
    </div>
  );
}
