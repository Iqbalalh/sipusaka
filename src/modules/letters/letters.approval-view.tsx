"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Flex, Tag, Table, Modal } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import Button from "@/components/ui/button/Button";
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

const statusLabels: Record<LetterStatus, string> = {
  draft: "Draft",
  pending1: "Menunggu Persetujuan 1",
  pending2: "Menunggu Persetujuan 2",
  pending3: "Menunggu Persetujuan 3",
  approved: "Disetujui",
  published: "Diterbitkan",
};

export default function LetterApprovalView() {
  const [data, setData] = useState<Letter | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

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

  const currentUserId = (session?.user as any)?.id;

  const isCurrentSigner = (() => {
    if (!data) return false;
    const userId = Number(currentUserId);
    if (data.status === "pending1") return data.signer1?.userId === userId;
    if (data.status === "pending2") return data.signer2?.userId === userId;
    if (data.status === "pending3") return data.signer3?.userId === userId;
    return false;
  })();

  const canAct = isAdmin || isCurrentSigner;

  const handleApprove = async () => {
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
    if (!rejectNote.trim()) return notify("warning", "Catatan revisi wajib diisi!");
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
      notify("success", "Surat berhasil dibatalkan.");
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

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">Persetujuan Surat</h4>
        <Button variant="outline" onClick={() => router.push("/letters/approvals")}>Kembali</Button>
      </div>

      {/* Detail Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Jenis Surat", value: data.letterType },
          { label: "Nomor Surat", value: data.letterNumber },
          { label: "Lampiran", value: data.attachment },
          { label: "Perihal", value: data.subject },
          { label: "Tanggal", value: data.letterDate ? formatDate(data.letterDate) : null },
          { label: "Tujuan Surat", value: data.destination },
          { label: "Tembusan", value: data.carbonCopy },
          { label: "Status", value: statusLabels[data.status] || data.status },
          { label: "Penandatangan 1", value: data.signer1?.staffName || data.signer1?.username },
          { label: "Penandatangan 2", value: data.signer2?.staffName || data.signer2?.username },
          { label: "Penandatangan 3", value: data.signer3?.staffName || data.signer3?.username },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white/90 break-words">{value || "-"}</span>
          </div>
        ))}
      </div>

      {/* Document */}
      <div className="mt-6">
        <h5 className="text-md font-semibold mb-3 text-gray-700 dark:text-gray-300">Dokumen</h5>
        {data.documentUrl ? (
          <DocumentViewerWithDownload url={data.documentUrl} fileName={data.documentPath} />
        ) : (
          <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500">
            Tidak ada dokumen.
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

      {/* Action buttons */}
      {canAct && (
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          {isCurrentSigner && (
            <Button
              onClick={() => setApproveModalOpen(true)}
              disabled={actionLoading}
              className="bg-blue-600 text-white min-w-[120px]"
            >
              Setujui
            </Button>
          )}
          <Button
            onClick={() => setRejectModalOpen(true)}
            disabled={actionLoading}
            variant="outline"
            className="min-w-[120px]"
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

      {/* Modals */}
      <Modal
        title="Setujui Surat"
        open={approveModalOpen}
        onOk={handleApprove}
        onCancel={() => setApproveModalOpen(false)}
        okText="Setujui"
        cancelText="Batal"
        confirmLoading={actionLoading}
      >
        <p>Apakah Anda yakin ingin menyetujui surat ini?</p>
      </Modal>

      <Modal
        title="Revisi Surat"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectNote(""); }}
        okText="Kirim Revisi"
        cancelText="Batal"
        confirmLoading={actionLoading}
      >
        <div className="py-4">
          <p className="mb-2 text-sm text-gray-600">Masukkan catatan revisi untuk pembuat surat:</p>
          <TextArea
            rows={4}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Tulis catatan revisi..."
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        title="Batalkan Surat"
        open={cancelModalOpen}
        onOk={handleCancel}
        onCancel={() => setCancelModalOpen(false)}
        okText="Batalkan Surat"
        cancelText="Kembali"
        okButtonProps={{ danger: true }}
        confirmLoading={actionLoading}
      >
        <p>Apakah Anda yakin ingin membatalkan surat ini? Surat akan dihapus secara permanen.</p>
      </Modal>
    </div>
  );
}
