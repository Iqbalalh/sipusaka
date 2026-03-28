"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin, Descriptions, Tag, Divider, Button, Image, message } from "antd";
import { LoadingOutlined, EditOutlined, ArrowLeftOutlined, PrinterOutlined, DeleteOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  SocialAssistance,
  SocialAssistanceDoc,
  getSocialAssistanceById,
  deleteSocialAssistanceDocument,
} from "@/utils/services/socialassistance.service";
import { MEDICAL_EQUIPMENT_OPTIONS } from "./socialassistance.constants";
import { formatDate } from "@/utils/formatter/formatDate";

interface SocialAssistanceViewProps {
  id: string;
}

export default function SocialAssistanceView({ id }: SocialAssistanceViewProps) {
  const { notify } = useNotify();
  const router = useRouter();
  
  // State
  const [data, setData] = useState<SocialAssistance | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getSocialAssistanceById(id);
      setData(result);
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, notify]);

  // ==========================
  // DELETE DOCUMENT
  // ==========================
  const handleDeleteDocument = async (docId: number) => {
    try {
      await deleteSocialAssistanceDocument(Number(id), docId);
      messageApi.success({
        content: "Dokumen berhasil dihapus",
        key: "delete-doc",
        duration: 2,
      });
      fetchData();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  // ==========================
  // FORMAT MEDICAL EQUIPMENT (SINGLE ITEM)
  // ==========================
  const formatMedicalEquipment = (record: SocialAssistance) => {
    if (!record.medicalEquipment) return "-";
    
    const typeLabel = MEDICAL_EQUIPMENT_OPTIONS.find(opt => opt.value === record.medicalEquipment)?.label || record.medicalEquipment;
    const quantity = record.equipmentQuantity || 1;
    const nominal = record.equipmentNominal || 0;
    const subtotal = quantity * nominal;
    
    return (
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium">{typeLabel}</span>
          <Tag color="blue">{quantity} unit</Tag>
        </div>
        {nominal > 0 && (
          <>
            <div className="text-sm text-gray-500 mt-1">
              Nominal: Rp {nominal.toLocaleString("id-ID")}
            </div>
            <div className="text-sm font-medium text-blue-600 mt-1">
              Subtotal: Rp {subtotal.toLocaleString("id-ID")}
            </div>
          </>
        )}
      </div>
    );
  };

  // Calculate totals
  const equipmentTotal = (data?.equipmentQuantity || 0) * (data?.equipmentNominal || 0);
  const cashAmount = data?.cashAmount || 0;
  const totalAmount = equipmentTotal + cashAmount;

  // ==========================
  // PRINT FUNCTION
  // ==========================
  const handlePrint = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Format medical equipment for print
    const typeLabel = data.medicalEquipment 
      ? MEDICAL_EQUIPMENT_OPTIONS.find(opt => opt.value === data.medicalEquipment)?.label || data.medicalEquipment 
      : "-";
    const quantity = data.equipmentQuantity || 0;
    const nominal = data.equipmentNominal || 0;
    const subtotal = quantity * nominal;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detail Bantuan Sosial - ${data.recipientName || "N/A"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; margin-bottom: 20px; color: #2563EB; }
          h2 { margin-top: 20px; border-bottom: 2px solid #2563EB; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 10px; text-align: left; }
          th { background-color: #2563EB; color: white; width: 200px; }
          .total-row { background-color: #EFF6FF; font-weight: bold; }
          .equipment-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .text-right { text-align: right; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Detail Bantuan Sosial</h1>
        
        <h2>Informasi Penerima</h2>
        <table>
          <tr><th>NIP/NIPP</th><td>${data.nipNipp || "-"}</td></tr>
          <tr><th>Nama Penerima</th><td>${data.recipientName || "-"}</td></tr>
          <tr><th>Alamat KTP</th><td>${data.ktpAddress || "-"}</td></tr>
          <tr><th>Wilayah (PD)</th><td>${data.region || "-"}</td></tr>
          <tr><th>Kondisi/Penyakit</th><td>${data.condition || "-"}</td></tr>
        </table>

        <h2>Alat Kesehatan</h2>
        ${data.medicalEquipment 
          ? `<div class="equipment-item">
              <strong>${typeLabel}</strong><br>
              Jumlah: ${quantity} unit<br>
              ${nominal > 0 ? `
                Nominal: Rp ${nominal.toLocaleString("id-ID")}<br>
                Subtotal: Rp ${subtotal.toLocaleString("id-ID")}
              ` : ""}
            </div>`
          : "<p>-</p>"
        }

        <h2>Ringkasan Keuangan</h2>
        <table>
          <tr><th>Total Alat Kesehatan</th><td class="text-right">Rp ${equipmentTotal.toLocaleString("id-ID")}</td></tr>
          <tr><th>Uang</th><td class="text-right">Rp ${cashAmount.toLocaleString("id-ID")}</td></tr>
          <tr class="total-row"><th>Total</th><td class="text-right">Rp ${totalAmount.toLocaleString("id-ID")}</td></tr>
        </table>

        <h2>Keterangan</h2>
        <p>${data.notes || "-"}</p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Dicetak pada: ${new Date().toLocaleString("id-ID")}
        </p>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  // ==========================
  // NOT FOUND STATE
  // ==========================
  if (!data) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Data tidak ditemukan</p>
        <Button onClick={() => router.push("/socialassistance")} className="mt-4">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="space-y-6">
      {contextHolder}
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/socialassistance")}
        >
          Kembali
        </Button>
        <Button
          icon={<PrinterOutlined />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={() => router.push(`/socialassistance/edit/${id}`)}
          className="bg-blue-600"
        >
          Edit
        </Button>
      </div>

      <Divider />

      {/* Main Info */}
      <Descriptions
        title="Informasi Penerima"
        bordered
        column={2}
        styles={{ label: { fontWeight: 500, width: 200 } }}
      >
        <Descriptions.Item label="NIP/NIPP">{data.nipNipp || "-"}</Descriptions.Item>
        <Descriptions.Item label="Nama Penerima">{data.recipientName || "-"}</Descriptions.Item>
        <Descriptions.Item label="Alamat KTP" span={2}>{data.ktpAddress || "-"}</Descriptions.Item>
        <Descriptions.Item label="Wilayah (PD)">
          <Tag color="purple">{data.region || "-"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Kondisi/Penyakit">{data.condition || "-"}</Descriptions.Item>
      </Descriptions>

      {/* Medical Equipment */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Alat Kesehatan</h3>
        {formatMedicalEquipment(data)}
      </div>

      {/* Financial Summary */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Ringkasan Keuangan</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Total Alat Kesehatan</span>
            <span className="font-medium">Rp {equipmentTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400">Uang</span>
            <span className="font-medium">Rp {cashAmount.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Total</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <Descriptions
        title="Keterangan"
        bordered
        column={1}
        styles={{ label: { fontWeight: 500, width: 200 } }}
      >
        <Descriptions.Item label="Keterangan">{data.notes || "-"}</Descriptions.Item>
      </Descriptions>

      {/* Documents */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Dokumen Pendukung</h3>
        {data.documents && data.documents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {data.documents.map((doc: SocialAssistanceDoc) => {
              const isImage = doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              return (
                <div key={doc.id} className="relative group">
                  <div className="relative w-full h-32 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    {isImage ? (
                      <Image.PreviewGroup>
                        <Image
                          src={doc.urlDoc}
                          alt={doc.name}
                          className="object-cover w-full h-full cursor-pointer"
                          preview={{
                            cover: <div className="text-white">Lihat</div>,
                          }}
                        />
                      </Image.PreviewGroup>
                    ) : (
                      <a
                        href={doc.urlDoc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center w-full h-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FileTextOutlined className="text-2xl text-gray-400 mb-2" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">Unduh</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus dokumen"
                    >
                      <DeleteOutlined className="text-xs" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {doc.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Belum ada dokumen yang diunggah.
          </p>
        )}
      </div>

      {/* Metadata */}
      <Descriptions
        title="Informasi Sistem"
        bordered
        column={2}
        styles={{ label: { fontWeight: 500, width: 200 } }}
      >
        <Descriptions.Item label="Dibuat">{data.createdAt ? formatDate(data.createdAt) : "-"}</Descriptions.Item>
        <Descriptions.Item label="Diperbarui">{data.updatedAt ? formatDate(data.updatedAt) : "-"}</Descriptions.Item>
      </Descriptions>
    </div>
  );
}
