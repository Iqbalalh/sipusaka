"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin, Modal, Input, Timeline, Button, Image } from "antd";
import { LoadingOutlined, EditOutlined, CheckOutlined, CloseOutlined, DownloadOutlined, QrcodeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import {
  Letter,
  getLetterById,
  approveLetter,
  rejectLetter,
} from "@/utils/services/letter.service";
import { getLetterTypeLabel, getLetterStatusInfo } from "./letters.constants";
import { formatDate } from "@/utils/formatter/formatDate";
import RichTextEditor from "@/components/editor/RichTextEditor";
import CustomButton from "@/components/ui/button/Button";

const { TextArea } = Input;

interface LetterViewProps {
  id: string;
}

export default function LetterView({ id }: LetterViewProps) {
  const { notify } = useNotify();
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<Letter | null>(null);
  
  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ==========================
  // FETCH DATA
  // ==========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLetterById(id);
        setLetter(data);
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, notify]);

  // ==========================
  // APPROVE HANDLER
  // ==========================
  const handleApprove = async () => {
    if (!letter) return;

    setActionLoading(true);
    try {
      await approveLetter(letter.id);
      notify("success", "Surat berhasil disetujui");
      setIsApproveModalOpen(false);
      router.refresh();
      // Refetch data
      const data = await getLetterById(id);
      setLetter(data);
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================
  // REJECT HANDLER
  // ==========================
  const handleReject = async () => {
    if (!letter) return;

    setActionLoading(true);
    try {
      await rejectLetter(letter.id, rejectionReason);
      notify("success", "Surat telah ditolak");
      setIsRejectModalOpen(false);
      router.refresh();
      // Refetch data
      const data = await getLetterById(id);
      setLetter(data);
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading) {
    return (
      <div className="flex justify-center items-center gap-4 h-40 text-gray-500">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
        Memuat data...
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Surat tidak ditemukan</p>
        <Button onClick={() => router.push("/letters")}>Kembali</Button>
      </div>
    );
  }

  const statusInfo = getLetterStatusInfo(letter.status);

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="space-y-6">
      {/* APPROVE MODAL */}
      <Modal
        title="Konfirmasi Persetujuan"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsApproveModalOpen(false)} disabled={actionLoading}>
            Batal
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={handleApprove}
            loading={actionLoading}
            style={{ backgroundColor: "#16a34a" }}
          >
            Setujui
          </Button>,
        ]}
      >
        <p>Apakah Anda yakin ingin menyetujui surat ini?</p>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        title="Alasan Penolakan"
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRejectModalOpen(false)} disabled={actionLoading}>
            Batal
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            onClick={handleReject}
            loading={actionLoading}
          >
            Tolak
          </Button>,
        ]}
      >
        <p className="mb-4">Berikan alasan penolakan:</p>
        <TextArea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Masukkan alasan penolakan..."
          rows={4}
        />
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detail Surat
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getLetterTypeLabel(letter.letterType)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(letter.status === "DRAFT" || letter.status === "REJECTED") && (
            <Link href={`/letters/edit/${letter.id}`}>
              <CustomButton variant="outline" size="sm">
                <EditOutlined className="mr-2" />
                Edit
              </CustomButton>
            </Link>
          )}
          {letter.status === "ARCHIVED" && (
            <CustomButton variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <DownloadOutlined className="mr-2" />
              Download
            </CustomButton>
          )}
        </div>
      </div>

      {/* STATUS BADGE */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-6">
          {/* LETTER INFO */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Informasi Surat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jenis Surat</label>
                <p className="text-sm font-medium">{getLetterTypeLabel(letter.letterType)}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nomor Surat</label>
                <p className="text-sm font-medium">{letter.letterNumber || "-"}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Perihal</label>
                <p className="text-sm font-medium">{letter.subject}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tanggal Pembuatan</label>
                <p className="text-sm font-medium">{formatDate(letter.createdAt)}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Tujuan Surat</label>
                <p className="text-sm font-medium">{letter.destination}</p>
              </div>
              {letter.tembusan && (
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Tembusan</label>
                  <p className="text-sm font-medium">{letter.tembusan}</p>
                </div>
              )}
            </div>
          </div>

          {/* LETTER CONTENT */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Konten Surat</h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <RichTextEditor
                value={letter.content || ""}
                onChange={() => {}}
                height="400px"
              />
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          {/* APPROVAL TIMELINE */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Riwayat Persetujuan</h3>
            <Timeline
              items={[
                {
                  color: letter.signer1 ? (letter.approved1At ? "green" : "blue") : "gray",
                  children: (
                    <div>
                      <p className="font-medium">
                        {letter.signer1?.staffs?.staffName || letter.signer1?.username || "Penandatangan 1"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {letter.approved1At
                          ? `Disetujui: ${formatDate(letter.approved1At)}`
                          : letter.status === "PENDING_1"
                          ? "Menunggu persetujuan"
                          : "Menunggu giliran"}
                      </p>
                    </div>
                  ),
                },
                ...(letter.signer2
                  ? [
                      {
                        color: letter.approved2At ? "green" : letter.status === "PENDING_2" ? "blue" : "gray",
                        children: (
                          <div>
                            <p className="font-medium">
                              {letter.signer2?.staffs?.staffName || letter.signer2?.username || "Penandatangan 2"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {letter.approved2At
                                ? `Disetujui: ${formatDate(letter.approved2At)}`
                                : letter.status === "PENDING_2"
                                ? "Menunggu persetujuan"
                                : "Menunggu giliran"}
                            </p>
                          </div>
                        ),
                      },
                    ]
                  : []),
                ...(letter.signer3
                  ? [
                      {
                        color: letter.approved3At ? "green" : letter.status === "PENDING_3" ? "blue" : "gray",
                        children: (
                          <div>
                            <p className="font-medium">
                              {letter.signer3?.staffs?.staffName || letter.signer3?.username || "Penandatangan 3"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {letter.approved3At
                                ? `Disetujui: ${formatDate(letter.approved3At)}`
                                : letter.status === "PENDING_3"
                                ? "Menunggu persetujuan"
                                : "Menunggu giliran"}
                            </p>
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          {/* QR SIGNATURES */}
          {(letter.signer1QrPath || letter.signer2QrPath || letter.signer3QrPath) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <QrcodeOutlined />
                Tanda Tangan Digital
              </h3>
              <div className="space-y-4">
                {letter.signer1QrPath && (
                  <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Image
                      src={`http://localhost:9000/api/picture?keyObject=${letter.signer1QrPath}`}
                      alt="QR Signature 1"
                      width={80}
                      height={80}
                      className="rounded"
                      placeholder={<Spin indicator={<LoadingOutlined spin />} />}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <p className="font-medium">
                          {letter.signer1?.staffs?.staffName || letter.signer1?.username || "Penandatangan 1"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Ditandatangani: {letter.approved1At ? formatDate(letter.approved1At) : "-"}
                      </p>
                    </div>
                  </div>
                )}
                {letter.signer2QrPath && (
                  <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Image
                      src={`http://localhost:9000/api/picture?keyObject=${letter.signer2QrPath}`}
                      alt="QR Signature 2"
                      width={80}
                      height={80}
                      className="rounded"
                      placeholder={<Spin indicator={<LoadingOutlined spin />} />}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <p className="font-medium">
                          {letter.signer2?.staffs?.staffName || letter.signer2?.username || "Penandatangan 2"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Ditandatangani: {letter.approved2At ? formatDate(letter.approved2At) : "-"}
                      </p>
                    </div>
                  </div>
                )}
                {letter.signer3QrPath && (
                  <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <Image
                      src={`http://localhost:9000/api/picture?keyObject=${letter.signer3QrPath}`}
                      alt="QR Signature 3"
                      width={80}
                      height={80}
                      className="rounded"
                      placeholder={<Spin indicator={<LoadingOutlined spin />} />}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <p className="font-medium">
                          {letter.signer3?.staffs?.staffName || letter.signer3?.username || "Penandatangan 3"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Ditandatangani: {letter.approved3At ? formatDate(letter.approved3At) : "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REJECTION INFO */}
          {letter.status === "REJECTED" && letter.rejectedBy && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                Surat Ditolak
              </h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-2">
                Ditolak oleh: {letter.rejectedBy?.staffs?.staffName || letter.rejectedBy?.username}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mb-2">
                Tanggal: {letter.rejectedAt ? formatDate(letter.rejectedAt) : "-"}
              </p>
              {letter.rejectionReason && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  Alasan: {letter.rejectionReason}
                </p>
              )}
            </div>
          )}

          {/* ACTION BUTTONS FOR SIGNERS */}
          {["PENDING_1", "PENDING_2", "PENDING_3"].includes(letter.status) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Aksi</h3>
              <div className="flex flex-col gap-2">
                <Button
                  type="primary"
                  className="bg-green-600 hover:bg-green-700 w-full"
                  icon={<CheckOutlined />}
                  onClick={() => setIsApproveModalOpen(true)}
                >
                  Setujui Surat
                </Button>
                <Button
                  type="default"
                  danger
                  className="w-full"
                  icon={<CloseOutlined />}
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  Tolak Surat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
