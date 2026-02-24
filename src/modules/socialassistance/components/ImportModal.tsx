"use client";

import { useState } from "react";
import { Modal, Upload, message, Spin } from "antd";
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, InboxOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";
import {
  importSocialAssistanceFromExcel,
  downloadSocialAssistanceTemplate,
  ImportResult,
} from "@/utils/services/socialassistance.service";
import { useNotify } from "@/context/NotificationContext";

const { Dragger } = Upload;

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { notify } = useNotify();

  const handleBeforeUpload = (file: File) => {
    // Validate file type
    const isValidType = file.name.match(/\.(xlsx|xls)$/i);
    if (!isValidType) {
      message.error("Hanya file Excel (.xlsx atau .xls) yang diperbolehkan!");
      return false;
    }

    setFile(file);
    setImportResult(null);
    return false; // Prevent auto upload
  };

  const handleRemove = () => {
    setFile(null);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!file) {
      message.warning("Pilih file Excel terlebih dahulu!");
      return;
    }

    setLoading(true);
    setImportResult(null);
    
    try {
      const result: ImportResult = await importSocialAssistanceFromExcel(file);
      setImportResult(result);

      if (result.success) {
        notify("success", result.message);
        onSuccess();
      } else {
        notify("error", result.message);
        if (result.errors && result.errors.length > 0) {
          console.error("Import errors:", result.errors);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Gagal mengimpor data";
      notify("error", errorMessage);
      setImportResult({
        success: false,
        message: errorMessage,
        errors: [errorMessage],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadLoading(true);
    try {
      await downloadSocialAssistanceTemplate();
      notify("success", "Template berhasil diunduh");
    } catch (error: any) {
      notify("error", "Gagal mengunduh template");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileExcelOutlined className="text-green-600" />
          <span>Import Data Bantuan Sosial</span>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" variant="outline" onClick={handleClose} disabled={loading}>
          Tutup
        </Button>,
        <Button
          key="import"
          variant="primary"
          onClick={handleImport}
          disabled={loading || !file}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <LoadingOutlined className="mr-2" spin />
              Mengimpor...
            </>
          ) : (
            "Import"
          )}
        </Button>,
      ]}
      width={650}
    >
      <div className="space-y-4">
        {/* Download Template Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Unduh template Excel untuk memastikan format data yang benar:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            disabled={downloadLoading}
            className="flex items-center gap-2"
          >
            {downloadLoading ? <LoadingOutlined spin /> : <DownloadOutlined />}
            {downloadLoading ? "Mengunduh..." : "Unduh Template"}
          </Button>
        </div>

        {/* Upload Section */}
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Upload file Excel (.xlsx atau .xls) dengan data bantuan sosial:
          </p>
          <Dragger
            accept=".xlsx,.xls"
            beforeUpload={handleBeforeUpload}
            onRemove={handleRemove}
            showUploadList={file ? true : false}
            fileList={file ? [{
              uid: '-1',
              name: file.name,
              size: file.size,
              type: file.type,
            }] : []}
            disabled={loading}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-blue-500" style={{ fontSize: 48 }} />
            </p>
            <p className="ant-upload-text text-gray-700 dark:text-gray-300">
              Klik atau seret file ke area ini
            </p>
            <p className="ant-upload-hint text-gray-500 dark:text-gray-400">
              Hanya file Excel (.xlsx atau .xls) yang diperbolehkan
            </p>
          </Dragger>
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <CheckCircleOutlined className="text-green-600 text-xl" />
              ) : (
                <CloseCircleOutlined className="text-red-600 text-xl" />
              )}
              <span className={`font-medium ${importResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {importResult.message}
              </span>
            </div>
            
            {importResult.data && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>Total baris: <strong>{importResult.data.totalRows}</strong></p>
                <p>Berhasil diimpor: <strong className="text-green-600">{importResult.data.insertedRows}</strong></p>
                <p>Dilewati: <strong className="text-yellow-600">{importResult.data.skippedRows}</strong></p>
              </div>
            )}
            
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc list-inside">
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li>...dan {importResult.errors.length - 5} error lainnya</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Spin indicator={<LoadingOutlined spin />} />
            <span className="text-blue-600 dark:text-blue-400">Sedang memproses import...</span>
          </div>
        )}

        {/* Format Instructions */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Format Kolom Excel:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li><strong>NIP/NIPP</strong> - Nomor identitas penerima</li>
            <li><strong>Nama Penerima</strong> - Nama lengkap penerima</li>
            <li><strong>Alamat KTP</strong> - Alamat sesuai KTP</li>
            <li><strong>Wilayah (PD)</strong> - Wilayah/PD penerima</li>
            <li><strong>Kondisi/Penyakit</strong> - Kondisi atau penyakit penerima</li>
            <li><strong>Alat Kesehatan</strong> - Nama alat kesehatan (hanya 1)</li>
            <li><strong>Jumlah Alat</strong> - Jumlah alat kesehatan</li>
            <li><strong>Nominal Alat</strong> - Nominal harga alat</li>
            <li><strong>Jumlah Uang</strong> - Nominal uang tunai</li>
            <li><strong>Total</strong> - Total bantuan</li>
            <li><strong>Keterangan</strong> - Catatan tambahan</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
