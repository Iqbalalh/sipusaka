"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Flex, Tag, Table, Modal, Image } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dynamic from "next/dynamic";
import Button from "@/components/ui/button/Button";
import { InfoItem } from "@/components/ui/field/InfoItem";
import { DocumentViewerWithDownload } from "@/components/custom/DocumentViewer";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  getLetter,
  approveLetter,
  rejectLetter,
  cancelLetter,
} from "@/utils/services/letter.service";
import { Letter, LetterStatus } from "@/types/models/letter";
import { formatDate } from "@/utils/formatter/formatDate";
import { useSession } from "next-auth/react";

const PdfSignaturePlacer = dynamic(
  () => import("@/components/custom/PdfSignaturePlacer"),
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

export default function LetterApprovalView() {
  const [data, setData] = useState<Letter | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // Signature placement mode
  const [signatureMode, setSignatureMode] = useState(false);

  const { notify } = useNotify();
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

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

  // Find the current signer's signature URL
  const currentUserId = (session?.user as any)?.id;
  const currentSignerSignatureUrl =
    data
      ? [data.signer1, data.signer2, data.signer3].find(
          (s) => s && s.userId === Number(currentUserId)
        )?.signatureUrl
      : null;

  const handleApproveClick = () => {
    // If document is PDF and signer has a signature, enter placement mode
    if (
      data?.documentUrl &&
      isPdfDocument(data.documentUrl, data.documentPath) &&
      currentSignerSignatureUrl
    ) {
      setSignatureMode(true);
    } else {
      // Non-PDF or no signature: show simple approve modal
      setApproveModalOpen(true);
    }
  };

  const handleApproveWithPlacement = async (placement: {
    page: number;
    x: number;
    y: number;
  }) => {
    try {
      setActionLoading(true);
      const res = await approveLetter(Number(id), {
        signaturePage: placement.page,
        signatureX: placement.x,
        signatureY: placement.y,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Gagal menyetujui surat");
      }
      notify("success", "Surat berhasil disetujui dengan tanda tangan!");
      router.push("/letters/approvals");
    } catch (err: any) {
      notify("error", err.message || "Gagal menyetujui surat");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSimple = async () => {
    try {
      setActionLoading(true);
      const res = await approveLetter(Number(id));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menyetujui surat");
      }
      notify("success", "Surat berhasil disetujui!");
      setApproveModalOpen(false);
      router.push("/letters/approvals");
    } catch (err: any) {
      notify("error", err.message || "Gagal menyetujui surat");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      return notify("warning", "Catatan revisi wajib diisi!");
    }
    try {
      setActionLoading(true);
      const res = await rejectLetter(Number(id), rejectNote);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengembalikan surat");
      }
      notify("success", "Surat dikembalikan untuk revisi.");
      setRejectModalOpen(false);
      router.push("/letters/approvals");
    } catch (err: any) {
      notify("error", err.message || "Gagal mengembalikan surat");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const res = await cancelLetter(Number(id));
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membatalkan surat");
      }
      notify("success", "Surat berhasil dibatalkan dan dihapus.");
      setCancelModalOpen(false);
      router.push("/letters/approvals");
    } catch (err: any) {
      notify("error", err.message || "Gagal membatalkan surat");
    } finally {
      setActionLoading(false);
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

  // Signature placement mode: show full-screen placer
  if (signatureMode && data.documentUrl && currentSignerSignatureUrl) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Tempatkan Tanda Tangan — {data.subject}
        </h4>
        <PdfSignaturePlacer
          url={data.documentUrl}
          signatureImageUrl={currentSignerSignatureUrl}
          onConfirm={handleApproveWithPlacement}
          onCancel={() => setSignatureMode(false)}
          loading={actionLoading}
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
        return (
          <Tag color={colors[action] || "default"}>
            {labels[action] || action}
          </Tag>
        );
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

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Persetujuan Surat
        </h4>
        <Button variant="outline" onClick={() => router.push("/letters/approvals")}>
          Kembali
        </Button>
      </div>

      {/* Detail Info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <InfoItem label="Jenis Surat" value={data.letterType || "-"} />
        <InfoItem label="Nomor Surat" value={data.letterNumber || "-"} />
        <InfoItem label="Lampiran" value={data.attachment || "-"} />
        <InfoItem label="Perihal" value={data.subject || "-"} />
        <InfoItem
          label="Tanggal Pembuatan"
          value={data.letterDate ? formatDate(data.letterDate) : "-"}
        />
        <InfoItem label="Tujuan Surat" value={data.destination || "-"} />
        <InfoItem label="Tembusan" value={data.carbonCopy || "-"} />
        <InfoItem
          label="Status"
          value={statusLabels[data.status] || data.status}
        />
        <InfoItem
          label="Penandatangan 1"
          value={data.signer1?.staffName || data.signer1?.username || "-"}
        />
        <InfoItem
          label="Penandatangan 2"
          value={
            data.signer2
              ? data.signer2.staffName || data.signer2.username
              : "-"
          }
        />
        <InfoItem
          label="Penandatangan 3"
          value={
            data.signer3
              ? data.signer3.staffName || data.signer3.username
              : "-"
          }
        />
      </div>

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

      {/* Action Buttons */}
      {isAdmin && (
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            onClick={handleApproveClick}
            disabled={actionLoading}
            className="bg-green-600 text-white min-w-[120px]"
          >
            Setujui
          </Button>
          <Button
            onClick={() => setRejectModalOpen(true)}
            disabled={actionLoading}
            className="bg-yellow-500 text-white min-w-[120px]"
          >
            Revisi
          </Button>
          <Button
            onClick={() => setCancelModalOpen(true)}
            disabled={actionLoading}
            className="bg-red-600 text-white min-w-[120px]"
          >
            Batalkan
          </Button>
        </div>
      )}

      {/* Approve Confirmation Modal (for non-PDF documents) */}
      <Modal
        title="Setujui Surat"
        open={approveModalOpen}
        onOk={handleApproveSimple}
        onCancel={() => setApproveModalOpen(false)}
        okText={actionLoading ? "Memproses..." : "Setujui"}
        cancelText="Batal"
        confirmLoading={actionLoading}
      >
        <p>Apakah Anda yakin ingin menyetujui surat ini?</p>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Revisi Surat"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectNote("");
        }}
        okText="Kirim Revisi"
        cancelText="Batal"
        confirmLoading={actionLoading}
      >
        <div className="py-4">
          <p className="mb-2 text-sm text-gray-600">
            Masukkan catatan revisi untuk pembuat surat:
          </p>
          <TextArea
            rows={4}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Tulis catatan revisi..."
            autoFocus
          />
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        title="Batalkan Surat"
        open={cancelModalOpen}
        onOk={handleCancel}
        onCancel={() => setCancelModalOpen(false)}
        okText={actionLoading ? "Memproses..." : "Batalkan Surat"}
        cancelText="Kembali"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading}
      >
        <p>
          Apakah Anda yakin ingin membatalkan surat ini? Surat akan dihapus
          secara permanen.
        </p>
      </Modal>
    </div>
  );
}
