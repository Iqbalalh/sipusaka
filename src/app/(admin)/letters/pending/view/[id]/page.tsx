"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Button, Descriptions, Tag, Card, Divider, message, Modal, Input, Image } from "antd";
import { LoadingOutlined, ArrowLeftOutlined, CheckOutlined, CloseOutlined, FileTextOutlined, QrcodeOutlined } from "@ant-design/icons";
import { renderAsync } from "docx-preview";
import {
  Letter,
  LetterType,
  LetterStatus,
  getLetterById,
  approveLetter,
  rejectLetter,
} from "@/utils/services/letter.service";
import { populateTemplate } from "@/utils/services/letter-template.service";

// Letter type labels
const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  BANTUAN_PENDIDIKAN: "Surat Keterangan Bantuan Pendidikan",
  BANTUAN_SOSIAL: "Surat Keterangan Bantuan Sosial",
  SURAT_UNDANGAN: "Surat Undangan",
  SURAT_PERMOHONAN: "Surat Permohonan",
  SURAT_KEPUTUSAN: "Surat Keputusan",
};

// Status color mapping
const STATUS_COLORS: Record<LetterStatus, string> = {
  DRAFT: "default",
  PENDING_1: "processing",
  PENDING_2: "processing",
  PENDING_3: "processing",
  APPROVED: "success",
  REJECTED: "error",
  ARCHIVED: "warning",
};

// Status labels
const STATUS_LABELS: Record<LetterStatus, string> = {
  DRAFT: "Draft",
  PENDING_1: "Menunggu Persetujuan 1",
  PENDING_2: "Menunggu Persetujuan 2",
  PENDING_3: "Menunggu Persetujuan 3",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

export default function PendingLetterViewPage() {
  const params = useParams();
  const router = useRouter();
  const letterId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Preview container ref
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Fetch letter data
  useEffect(() => {
    const fetchLetter = async () => {
      try {
        setLoading(true);
        const data = await getLetterById(letterId);
        setLetter(data);
      } catch (err) {
        console.error("Error fetching letter:", err);
        setError("Gagal memuat data surat");
        message.error("Gagal memuat data surat");
      } finally {
        setLoading(false);
      }
    };

    if (letterId) {
      fetchLetter();
    }
  }, [letterId]);

  // Generate preview when letter data is loaded
  useEffect(() => {
    const generatePreview = async () => {
      if (!letter || !previewContainerRef.current) return;

      setPreviewLoading(true);
      try {
        // Check if there's a generated document path (PDF with signatures)
        if (letter.generatedDocPath) {
          // For PDF documents, we'll show a link or embed
          if (previewContainerRef.current) {
            previewContainerRef.current.innerHTML = `
              <div style="padding: 20px; text-align: center;">
                <p>Dokumen telah ditandatangani</p>
                <a href="${letter.generatedDocPath}" target="_blank" style="color: #1890ff;">
                  Lihat Dokumen PDF
                </a>
              </div>
            `;
          }
          setPreviewLoading(false);
          return;
        }

        // Prepare form data for template population
        const formData = {
          letterNumber: letter.letterNumber || "........",
          subject: letter.subject,
          destination: letter.destination,
          tembusan: letter.tembusan || "",
          date: new Date(letter.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        };

        // Generate docx from template
        const docxBlob = await populateTemplate(letter.letterType, formData);

        // Clear previous content
        if (previewContainerRef.current) {
          previewContainerRef.current.innerHTML = "";
        }

        // Render the docx
        await renderAsync(docxBlob, previewContainerRef.current!, undefined, {
          className: "docx-preview-wrapper",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      } catch (err) {
        console.error("Error generating preview:", err);
        if (previewContainerRef.current) {
          previewContainerRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999;">
              <p>Preview tidak tersedia</p>
              <p style="font-size: 12px;">Template mungkin belum dikonfigurasi untuk jenis surat ini</p>
            </div>
          `;
        }
      } finally {
        setPreviewLoading(false);
      }
    };

    if (letter && !loading) {
      generatePreview();
    }
  }, [letter, loading]);

  // Handle approve
  const handleApprove = async () => {
    if (!letter) return;

    try {
      setActionLoading(true);
      await approveLetter(letterId);
      message.success("Surat berhasil disetujui dan QR signature telah ditambahkan");
      setApproveModalVisible(false);
      router.push("/letters/pending");
    } catch (err) {
      console.error("Error approving letter:", err);
      message.error("Gagal menyetujui surat");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!letter || !rejectionReason.trim()) {
      message.warning("Mohon isi alasan penolakan");
      return;
    }

    try {
      setActionLoading(true);
      await rejectLetter(letterId, rejectionReason);
      message.success("Surat telah ditolak");
      setRejectModalVisible(false);
      router.push("/letters/pending");
    } catch (err) {
      console.error("Error rejecting letter:", err);
      message.error("Gagal menolak surat");
    } finally {
      setActionLoading(false);
    }
  };

  // Determine if current user can approve
  const canApprove = letter && (
    (letter.status === "PENDING_1" && letter.signer1Id) ||
    (letter.status === "PENDING_2" && letter.signer2Id) ||
    (letter.status === "PENDING_3" && letter.signer3Id)
  );

  // Get QR signature URL for display
  const getQRSignatureUrl = (index: 1 | 2 | 3): string | null => {
    if (!letter) return null;
    const paths = {
      1: letter.signer1QrPath,
      2: letter.signer2QrPath,
      3: letter.signer3QrPath,
    };
    return paths[index] || null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
        <span className="ml-3 text-gray-500">Memuat data surat...</span>
      </div>
    );
  }

  // Error state
  if (error || !letter) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error || "Surat tidak ditemukan"}</p>
            <Button onClick={() => router.push("/letters/pending")}>
              Kembali ke Daftar Pending
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/letters/pending")}
          >
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review & Persetujuan Surat
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Tinjau surat dan berikan persetujuan
            </p>
          </div>
        </div>
        {canApprove && (
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setApproveModalVisible(true)}
            >
              Setujui & Tanda Tangan QR
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setRejectModalVisible(true)}
            >
              Tolak
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Letter Fields */}
        <div className="lg:col-span-1">
          <Card 
            title={
              <div className="flex items-center gap-2">
                <FileTextOutlined />
                <span>Informasi Surat</span>
              </div>
            }
            className="h-fit"
          >
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Jenis Surat">
                <span className="font-medium">
                  {LETTER_TYPE_LABELS[letter.letterType] || letter.letterType}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Nomor Surat">
                {letter.letterNumber || (
                  <span className="text-gray-400 italic">Belum ada nomor</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Perihal">
                <span className="font-medium">{letter.subject}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Tujuan">
                <span className="whitespace-pre-wrap">{letter.destination}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Tembusan">
                {letter.tembusan || (
                  <span className="text-gray-400 italic">-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={STATUS_COLORS[letter.status]}>
                  {STATUS_LABELS[letter.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {new Date(letter.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Descriptions.Item>
            </Descriptions>

            {/* Signers Section with QR Signatures */}
            <Divider plain>
              <span className="text-sm font-medium">Penandatangan & Status</span>
            </Divider>
            <div className="space-y-3">
              {letter.signer1 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">Penandatangan 1</span>
                      <p className="font-medium">{letter.signer1.staffs?.staffName}</p>
                      {letter.signer1.staffs?.position && (
                        <p className="text-xs text-gray-500">{letter.signer1.staffs.position}</p>
                      )}
                    </div>
                    {letter.approved1At ? (
                      <Tag color="success">Disetujui</Tag>
                    ) : letter.status === "PENDING_1" ? (
                      <Tag color="processing">Menunggu</Tag>
                    ) : null}
                  </div>
                  {letter.approved1At && getQRSignatureUrl(1) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <QrcodeOutlined />
                        <span>QR Signature</span>
                      </div>
                      <Image
                        src={getQRSignatureUrl(1)!}
                        alt="QR Signature 1"
                        width={80}
                        height={80}
                        className="rounded border"
                      />
                    </div>
                  )}
                </div>
              )}
              {letter.signer2 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">Penandatangan 2</span>
                      <p className="font-medium">{letter.signer2.staffs?.staffName}</p>
                      {letter.signer2.staffs?.position && (
                        <p className="text-xs text-gray-500">{letter.signer2.staffs.position}</p>
                      )}
                    </div>
                    {letter.approved2At ? (
                      <Tag color="success">Disetujui</Tag>
                    ) : letter.status === "PENDING_2" ? (
                      <Tag color="processing">Menunggu</Tag>
                    ) : null}
                  </div>
                  {letter.approved2At && getQRSignatureUrl(2) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <QrcodeOutlined />
                        <span>QR Signature</span>
                      </div>
                      <Image
                        src={getQRSignatureUrl(2)!}
                        alt="QR Signature 2"
                        width={80}
                        height={80}
                        className="rounded border"
                      />
                    </div>
                  )}
                </div>
              )}
              {letter.signer3 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-500">Penandatangan 3</span>
                      <p className="font-medium">{letter.signer3.staffs?.staffName}</p>
                      {letter.signer3.staffs?.position && (
                        <p className="text-xs text-gray-500">{letter.signer3.staffs.position}</p>
                      )}
                    </div>
                    {letter.approved3At ? (
                      <Tag color="success">Disetujui</Tag>
                    ) : letter.status === "PENDING_3" ? (
                      <Tag color="processing">Menunggu</Tag>
                    ) : null}
                  </div>
                  {letter.approved3At && getQRSignatureUrl(3) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <QrcodeOutlined />
                        <span>QR Signature</span>
                      </div>
                      <Image
                        src={getQRSignatureUrl(3)!}
                        alt="QR Signature 3"
                        width={80}
                        height={80}
                        className="rounded border"
                      />
                    </div>
                  )}
                </div>
              )}
              {!letter.signer1 && !letter.signer2 && !letter.signer3 && (
                <p className="text-gray-400 italic text-center py-4">
                  Belum ada penandatangan
                </p>
              )}
            </div>

            {/* Rejection Info */}
            {letter.status === "REJECTED" && letter.rejectedBy && (
              <>
                <Divider plain>
                  <span className="text-sm font-medium text-red-500">Alasan Penolakan</span>
                </Divider>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {letter.rejectionReason || "Tidak ada alasan"}
                  </p>
                  <p className="text-xs text-red-500 mt-2">
                    Ditolak oleh: {letter.rejectedBy.staffs?.staffName || letter.rejectedBy.username}
                  </p>
                </div>
              </>
            )}

            {/* Documents Section */}
            {letter.letterDocs && letter.letterDocs.length > 0 && (
              <>
                <Divider plain>
                  <span className="text-sm font-medium">Dokumen Terlampir</span>
                </Divider>
                <div className="space-y-2">
                  {letter.letterDocs.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.urlDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileTextOutlined className="text-blue-500" />
                      <span className="text-sm truncate">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right Side - Document Preview */}
        <div className="lg:col-span-2">
          <Card 
            title="Preview Dokumen"
            className="h-fit"
            extra={
              previewLoading && (
                <Spin indicator={<LoadingOutlined spin />} size="small" />
              )
            }
          >
            <div
              ref={previewContainerRef}
              className="docx-preview-container bg-white border border-gray-200 rounded-lg"
              style={{
                minHeight: "500px",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              {previewLoading && (
                <div className="flex justify-center items-center py-20">
                  <Spin indicator={<LoadingOutlined spin />} size="large" />
                  <span className="ml-3 text-gray-500">Memuat preview...</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        title="Konfirmasi Persetujuan"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        okText="Setujui & Tanda Tangan"
        cancelText="Batal"
        okButtonProps={{
          loading: actionLoading,
          className: "bg-green-600 hover:bg-green-700",
        }}
      >
        <div className="py-4">
          <p className="mb-4">
            Dengan menyetujui surat ini, QR Code signature Anda akan ditambahkan ke dalam dokumen.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Informasi:</strong> QR Code akan berisi data verifikasi termasuk:
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 list-disc list-inside">
              <li>Nomor surat</li>
              <li>Nama dan jabatan penandatangan</li>
              <li>Waktu penandatanganan</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        title="Alasan Penolakan"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason("");
        }}
        okText="Tolak Surat"
        cancelText="Batal"
        okButtonProps={{
          loading: actionLoading,
          danger: true,
        }}
      >
        <div className="py-4">
          <p className="mb-4">
            Mohon berikan alasan penolakan untuk surat ini:
          </p>
          <Input.TextArea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
            maxLength={500}
            showCount
          />
        </div>
      </Modal>
    </div>
  );
}
