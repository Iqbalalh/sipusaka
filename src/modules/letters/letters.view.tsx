"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Spin, Flex, Tag, Table } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { DocumentViewerWithDownload } from "@/components/custom/DocumentViewer";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { getLetter, publishLetter, convertLetterPdf } from "@/utils/services/letter.service";
import { Letter, LetterStatus } from "@/types/models/letter";
import { formatDate } from "@/utils/formatter/formatDate";

const PdfQrPlacer = dynamic(() => import("@/components/custom/PdfQrPlacer"), { ssr: false });

type PublishStep = "idle" | "converting" | "placing" | "publishing";

const statusLabels: Record<LetterStatus, string> = {
  draft: "Draft",
  pending1: "Menunggu Persetujuan 1",
  pending2: "Menunggu Persetujuan 2",
  pending3: "Menunggu Persetujuan 3",
  approved: "Disetujui",
  published: "Diterbitkan",
};

export default function LetterView() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const [data, setData] = useState<Letter | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [publishStep, setPublishStep] = useState<PublishStep>("idle");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

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

  // Step 1: convert to PDF and open the QR placer
  const handleStartPublish = useCallback(async () => {
    try {
      setPublishStep("converting");
      const { url } = await convertLetterPdf(Number(id));
      setPdfPreviewUrl(url);
      setPublishStep("placing");
    } catch (err: any) {
      notify("error", err.message || "Gagal memproses dokumen");
      setPublishStep("idle");
    }
  }, [id, notify]);

  // Step 2: user confirmed QR position → publish
  const handleConfirmQr = useCallback(
    async (placement: { page: number; x: number; y: number; qrSize?: number }) => {
      try {
        setPublishStep("publishing");
        const res = await publishLetter(Number(id), {
          qrPage: placement.page,
          qrX: placement.x,
          qrY: placement.y,
          qrSize: placement.qrSize,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).message || "Gagal menerbitkan surat");
        }
        notify("success", "Surat berhasil diterbitkan!");
        router.push("/letters/archives");
      } catch (err: any) {
        notify("error", err.message || "Gagal menerbitkan surat");
        setPublishStep("placing");
      }
    },
    [id, notify, router]
  );

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
        const colors: Record<string, string> = { approve: "success", reject: "warning", cancel: "error" };
        const labels: Record<string, string> = { approve: "Disetujui", reject: "Direvisi", cancel: "Dibatalkan" };
        return <Tag color={colors[action] || "default"}>{labels[action] || action}</Tag>;
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

  const isConverting = publishStep === "converting";
  const isPublishing = publishStep === "publishing";

  // QR placement screen — replaces normal view
  if (publishStep === "placing" && pdfPreviewUrl) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tempatkan QR Verifikasi
          </h4>
          <Button variant="outline" onClick={() => setPublishStep("idle")} disabled={isPublishing}>
            Batal
          </Button>
        </div>
        <PdfQrPlacer
          url={pdfPreviewUrl}
          onConfirm={handleConfirmQr}
          onCancel={() => setPublishStep("idle")}
          loading={isPublishing}
        />
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Detail Surat</h4>
        <div className="flex gap-2">
          {isAdmin && data.status === "approved" && (
            <Button
              onClick={handleStartPublish}
              disabled={isConverting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isConverting ? (
                <span className="flex items-center gap-2">
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                  Memproses PDF...
                </span>
              ) : "Terbitkan"}
            </Button>
          )}
          <Link href="/letters/archives">
            <Button variant="outline">Kembali</Button>
          </Link>
        </div>
      </div>

      {/* Detail Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Jenis Surat", value: data.letterType },
          { label: "Nomor Surat", value: data.letterNumber },
          { label: "Lampiran", value: data.attachment },
          { label: "Perihal", value: data.subject },
          { label: "Tanggal Pembuatan", value: data.letterDate ? formatDate(data.letterDate) : null },
          { label: "Tujuan Surat", value: data.destination },
          { label: "Tembusan", value: data.carbonCopy },
          { label: "Status", value: statusLabels[data.status] || data.status },
          { label: "Penandatangan 1", value: data.signer1?.staffName || data.signer1?.username },
          { label: "Penandatangan 2", value: data.signer2?.staffName || data.signer2?.username },
          { label: "Penandatangan 3", value: data.signer3?.staffName || data.signer3?.username },
          { label: "Dibuat Pada", value: data.createdAt ? formatDate(data.createdAt) : null },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white/90 wrap-break-word">{value || "-"}</span>
          </div>
        ))}
      </div>

      {/* Verification link */}
      {verifyUrl && data.status === "published" && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="text-md font-semibold mb-2 text-green-800">Link Verifikasi Surat</h5>
          <div className="flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={verifyUrl}
              className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm text-gray-700"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button size="sm" onClick={() => { navigator.clipboard.writeText(verifyUrl); notify("success", "Link disalin!"); }}>
              Salin
            </Button>
          </div>
        </div>
      )}

      {/* Template field data */}
      {data.letterTypeId && data.templateFieldData && Object.keys(data.templateFieldData).length > 0 && (
        <div className="mt-6">
          <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Data Template Surat</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.templateFieldData).map(([key, value]) => (
              <div key={key} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/40">
                <span className="text-xs text-blue-500 dark:text-blue-400 block mb-1 font-mono">{`{${key}}`}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white/90 wrap-break-word">{value || "-"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document */}
      <div className="mt-6">
        <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Dokumen</h5>
        {data.documentUrl ? (
          <DocumentViewerWithDownload url={data.documentUrl} fileName={data.documentPath} />
        ) : (
          <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
            Tidak ada dokumen yang diunggah.
          </div>
        )}
      </div>

      {/* Approval history */}
      {data.letterApprovals && data.letterApprovals.length > 0 && (
        <div className="mt-6">
          <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Riwayat Persetujuan</h5>
          <Table dataSource={data.letterApprovals} columns={approvalColumns} rowKey="id" pagination={false} size="small" />
        </div>
      )}
    </div>
  );
}
