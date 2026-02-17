"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input, Progress } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { SocialAssistance } from "@/utils/services/socialassistance.service";

// Utils
import {
  deleteSocialAssistance,
  getAllSocialAssistanceOptimized,
} from "@/utils/services/socialassistance.service";
import { getSocialAssistanceColumns } from "./socialassistance.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { MEDICAL_EQUIPMENT_OPTIONS } from "./socialassistance.constants";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportSocialAssistanceToExcel = async (
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    // Fetch all data for export
    let exportData: SocialAssistance[] = [];
    try {
      const response = await getAllSocialAssistanceOptimized(1, 9999, "");
      exportData = response.data;
      setProgress(30);
    } catch (error) {
      console.error("Failed to fetch export data:", error);
      setShowProgress(false);
      return;
    }

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      return;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Bantuan Sosial", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "NIP/NIPP", key: "nipNipp", width: 20 },
      { header: "Nama Penerima", key: "recipientName", width: 25 },
      { header: "Alamat KTP", key: "ktpAddress", width: 40 },
      { header: "Wilayah (PD)", key: "region", width: 20 },
      { header: "Kondisi/Penyakit", key: "condition", width: 25 },
      { header: "Alat Kesehatan", key: "medicalEquipment", width: 30 },
      { header: "Uang", key: "cashAmount", width: 20 },
      { header: "Total", key: "totalAmount", width: 20 },
      { header: "Keterangan", key: "notes", width: 30 },
      { header: "Tanggal Dibuat", key: "createdAt", width: 20 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    setProgress(50);

    // Prepare data rows
    const dataRows: any[] = [];
    exportData.forEach((item, index) => {
      // Format medical equipment
      const medicalEquipmentStr = item.medicalEquipment && item.medicalEquipment.length > 0
        ? item.medicalEquipment.map(eq => {
            const typeLabel = MEDICAL_EQUIPMENT_OPTIONS.find(opt => opt.value === eq.type)?.label || eq.type;
            return `${typeLabel} (${eq.quantity}x Rp ${eq.nominal.toLocaleString("id-ID")})`;
          }).join("; ")
        : "-";
      
      dataRows.push({
        no: index + 1,
        nipNipp: item.nipNipp || "-",
        recipientName: item.recipientName || "-",
        ktpAddress: item.ktpAddress || "-",
        region: item.region || "-",
        condition: item.condition || "-",
        medicalEquipment: medicalEquipmentStr,
        cashAmount: item.cashAmount ? `Rp ${item.cashAmount.toLocaleString("id-ID")}` : "-",
        totalAmount: item.totalAmount ? `Rp ${item.totalAmount.toLocaleString("id-ID")}` : "-",
        notes: item.notes || "-",
        createdAt: item.createdAt ? formatDate(item.createdAt) : "-",
      });
    });

    // Add data to worksheet
    dataRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);

      // Style alternating rows
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        });
      }

      // Style all cells
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Update progress
      if (index % Math.floor(dataRows.length / 10) === 0) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

    // Auto-fit column widths
    worksheet.columns?.forEach((column: any) => {
      if (!column || typeof column.eachCell !== "function") return;

      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = Math.min(maxLength + 4, 50);
    });

    setProgress(90);

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "data-bantuan-sosial.xlsx");

    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
  }
};

interface SocialAssistanceTableWrapperProps {
  searchQuery: string;
  onTotalChange?: (total: number) => void;
}

export default function SocialAssistanceTableWrapper({ 
  searchQuery, 
  onTotalChange 
}: SocialAssistanceTableWrapperProps) {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<SocialAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      
      const response = await getAllSocialAssistanceOptimized(page, pageSize, search);
      
      setData(response.data);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.page);
      
      if (onTotalChange) {
        onTotalChange(response.pagination.total);
      }
    } catch (err) {
      console.error("Error fetching social assistance data:", err);
      notifyFromResult(notify, { error: err });
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [notify, pageSize, onTotalChange]);

  // ==========================
  // INITIAL FETCH FROM URL
  // ==========================
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(initialPage);
    fetchData(initialPage, searchQuery);
  }, [searchParams, fetchData, searchQuery]);

  // ==========================
  // UPDATE URL WITH PAGE PARAMETER
  // ==========================
  const updatePageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    if (searchQuery && searchQuery.trim()) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // ==========================
  // DELETE HANDLER
  // ==========================
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    try {
      await deleteSocialAssistance(deleteId);
      
      // Refresh current page
      await fetchData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Data bantuan sosial berhasil dihapus",
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // EXPORT HANDLER
  // ==========================
  const handleExportWithProgress = async () => {
    await exportSocialAssistanceToExcel(setShowProgress, setProgress);
  };

  // Generate columns
  const columns = getSocialAssistanceColumns();

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="flex flex-col h-full">
      {/* DELETE MODAL */}
      <Modal
        title="Konfirmasi Hapus"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading}>
            Batal
          </Button>,
          <Button
            key="delete"
            variant="primary"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteLoading ? "Menghapus..." : "Hapus"}
          </Button>,
        ]}
      >
        <p>Apakah Anda yakin ingin menghapus data bantuan sosial ini?</p>
      </Modal>

      {/* EXPORT PROGRESS */}
      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sedang mengekspor data...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      {/* TABLE */}
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns.map((col) => {
            if (col.key === "actions") {
              return {
                ...col,
                render: (_: any, record: SocialAssistance) => (
                  <div className="flex gap-2 text-xs">
                    <Link href={`socialassistance/view/${record.id}`}>
                      <Button size="xs">
                        <EyeOutlined />
                      </Button>
                    </Link>
                    <Link href={`socialassistance/edit/${record.id}`}>
                      <Button size="xs">
                        <EditOutlined />
                      </Button>
                    </Link>
                    <Button
                      size="xs"
                      onClick={() => {
                        setDeleteId(record.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <DeleteOutlined />
                    </Button>
                  </div>
                ),
              };
            }
            return col;
          })}
          dataSource={data}
          rowKey="id"
          bordered
          pagination={{
            pageSize,
            current: currentPage,
            total,
            showSizeChanger: false,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} dari ${total} data`,
            onChange: (page) => {
              updatePageUrl(page);
              fetchData(page, searchQuery);
            },
          }}
          scroll={{ x: "max-content", y: "calc(100vh - 400px)" }}
          loading={loading}
          size="middle"
        />
      </div>

      {/* EXPORT BUTTON - Fixed at bottom */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          size="sm"
          onClick={handleExportWithProgress}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <DownloadOutlined className="mr-2" />
          Export Excel
        </Button>
      </div>
    </div>
  );
}
