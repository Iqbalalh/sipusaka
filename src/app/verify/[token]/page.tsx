"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spin, Flex, Tag, Table } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { DocumentViewerWithDownload } from "@/components/custom/DocumentViewer";
import { verifyLetterByToken } from "@/utils/services/letter.service";
import { formatDate } from "@/utils/formatter/formatDate";

interface VerifyData {
  verified: boolean;
  data: any;
}

export default function VerifyLetterPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerifyData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const res = await verifyLetterByToken(token);
        setResult({ verified: res.verified, data: res.data });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (token && token !== "preview") {
      verify();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (token === "preview") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SIPUSAKA</h1>
          <p className="text-gray-500 mb-6">Sistem Informasi Yayasan Pusaka Kai</p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              Ini adalah preview QR code. Setelah surat diterbitkan, QR code akan mengarah ke halaman verifikasi yang sesungguhnya.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Flex align="center" gap="middle">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
          <span className="text-gray-500">Memverifikasi surat...</span>
        </Flex>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SIPUSAKA</h1>
          <p className="text-gray-500 mb-6">Sistem Informasi Yayasan Pusaka Kai</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full mb-4">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-red-700 font-semibold">Tidak Terverifikasi</span>
          </div>
          <p className="text-gray-600">
            Surat dengan kode verifikasi ini tidak ditemukan. Pastikan QR code yang Anda scan benar.
          </p>
        </div>
      </div>
    );
  }

  const letter = result.data;

  const approvalColumns = [
    {
      title: "Penandatangan",
      dataIndex: "signerLevel",
      key: "signerLevel",
      render: (level: number) => `Penandatangan ${level}`,
    },
    {
      title: "Status",
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
      title: "Waktu",
      dataIndex: "actionAt",
      key: "actionAt",
      render: (text: string) => (text ? formatDate(text) : "-"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">SIPUSAKA</h1>
          <p className="text-gray-500 text-sm mb-4">Sistem Informasi Yayasan Pusaka Kai</p>

          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-50 border border-green-200 rounded-full">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-green-700 font-semibold text-lg">Surat Terverifikasi</span>
          </div>
        </div>

        {/* Letter Info */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Surat</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <InfoRow label="Jenis Surat" value={letter.letterType} />
            <InfoRow label="Nomor Surat" value={letter.letterNumber} />
            <InfoRow label="Perihal" value={letter.subject} />
            <InfoRow label="Tanggal" value={letter.letterDate ? formatDate(letter.letterDate) : "-"} />
            <InfoRow label="Tujuan" value={letter.destination} />
            <InfoRow label="Tembusan" value={letter.carbonCopy} />
            <InfoRow label="Status" value={letter.status === "published" ? "Diterbitkan" : letter.status} />
          </div>

          {/* Signers */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Penandatangan</h3>
            <div className="space-y-1">
              {letter.signer1 && (
                <p className="text-sm text-gray-600">
                  1. {letter.signer1.staffName || letter.signer1.username}
                  {letter.signer1.position && <span className="text-gray-400"> — {letter.signer1.position}</span>}
                </p>
              )}
              {letter.signer2 && (
                <p className="text-sm text-gray-600">
                  2. {letter.signer2.staffName || letter.signer2.username}
                  {letter.signer2.position && <span className="text-gray-400"> — {letter.signer2.position}</span>}
                </p>
              )}
              {letter.signer3 && (
                <p className="text-sm text-gray-600">
                  3. {letter.signer3.staffName || letter.signer3.username}
                  {letter.signer3.position && <span className="text-gray-400"> — {letter.signer3.position}</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Approval History */}
        {letter.letterApprovals && letter.letterApprovals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Riwayat Persetujuan</h2>
            <Table
              dataSource={letter.letterApprovals}
              columns={approvalColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}

        {/* Document Preview */}
        {(letter.documentUrl || letter.signedDocumentUrl) && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Preview Dokumen</h2>
            <DocumentViewerWithDownload
              url={letter.documentUrl || letter.signedDocumentUrl}
              fileName="surat-terverifikasi.pdf"
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Dokumen ini diverifikasi secara digital melalui SIPUSAKA.
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-gray-800 mt-0.5">{value || "-"}</p>
    </div>
  );
}
