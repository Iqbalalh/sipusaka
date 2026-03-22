"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Button, Descriptions, Tag, Card, Divider, message } from "antd";
import { LoadingOutlined, ArrowLeftOutlined, EditOutlined, FileTextOutlined } from "@ant-design/icons";
import { renderAsync } from "docx-preview";
import {
  Letter,
  LetterType,
  LetterStatus,
  getLetterById,
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

export default function LetterDraftViewPage() {
  const params = useParams();
  const router = useRouter();
  const letterId = params.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            <Button onClick={() => router.push("/letters/drafts")}>
              Kembali ke Daftar Draft
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
            onClick={() => router.push("/letters/drafts")}
          >
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detail Surat
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Lihat detail dan preview surat
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => router.push(`/letters/edit/${letterId}`)}
          >
            Edit Surat
          </Button>
        </div>
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
              <Descriptions.Item label="Terakhir Diubah">
                {new Date(letter.updatedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Descriptions.Item>
            </Descriptions>

            {/* Signers Section */}
            <Divider plain>
              <span className="text-sm font-medium">Penandatangan</span>
            </Divider>
            <div className="space-y-3">
              {letter.signer1 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-xs text-gray-500">Penandatangan 1</span>
                    <p className="font-medium">{letter.signer1.staffs?.staffName}</p>
                    {letter.signer1.staffs?.position && (
                      <p className="text-xs text-gray-500">{letter.signer1.staffs.position}</p>
                    )}
                  </div>
                  {letter.approved1At && (
                    <Tag color="success">Disetujui</Tag>
                  )}
                </div>
              )}
              {letter.signer2 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-xs text-gray-500">Penandatangan 2</span>
                    <p className="font-medium">{letter.signer2.staffs?.staffName}</p>
                    {letter.signer2.staffs?.position && (
                      <p className="text-xs text-gray-500">{letter.signer2.staffs.position}</p>
                    )}
                  </div>
                  {letter.approved2At && (
                    <Tag color="success">Disetujui</Tag>
                  )}
                </div>
              )}
              {letter.signer3 && (
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <span className="text-xs text-gray-500">Penandatangan 3</span>
                    <p className="font-medium">{letter.signer3.staffs?.staffName}</p>
                    {letter.signer3.staffs?.position && (
                      <p className="text-xs text-gray-500">{letter.signer3.staffs.position}</p>
                    )}
                  </div>
                  {letter.approved3At && (
                    <Tag color="success">Disetujui</Tag>
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
    </div>
  );
}
