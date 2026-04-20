"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input, Progress } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, PlusOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
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
import ImportModal from "./components/ImportModal";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportSocialAssistanceToExcel = async (
  exportData: SocialAssistance[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      return;
    }

    setProgress(30);

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
      // Format medical equipment (single item)
      let medicalEquipmentStr = "-";
      if (item.medicalEquipment) {
        const typeLabel = MEDICAL_EQUIPMENT_OPTIONS.find(opt => opt.value === item.medicalEquipment)?.label || item.medicalEquipment;
        const quantity = item.equipmentQuantity || 1;
        const nominal = item.equipmentNominal || 0;
        if (nominal > 0) {
          medicalEquipmentStr = `${typeLabel} (${quantity}x Rp ${nominal.toLocaleString("id-ID")})`;
        } else {
          medicalEquipmentStr = typeLabel;
        }
      }
      
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

export default function SocialAssistanceTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<SocialAssistance[]>([]);
  const [filteredData, setFilteredData] = useState<SocialAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      
      const response = await getAllSocialAssistanceOptimized(page, pageSize, search);
      
      setData(response.data);
      setFilteredData(response.data);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching social assistance data:", err);
      notifyFromResult(notify, { error: err });
      setData([]);
      setFilteredData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [notify, pageSize]);

  // ==========================
  // INITIAL FETCH FROM URL
  // ==========================
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const searchParam = searchParams.get('search') || '';
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setSearchQuery(searchParam);
    setCurrentPage(initialPage);
    fetchData(initialPage, searchParam);
  }, []); // Only run once on mount

  // ==========================
  // FETCH ON SEARCH/PAGE CHANGE
  // ==========================
  useEffect(() => {
    fetchData(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchData]);

  // ==========================
  // SEARCH WITH DEBOUNCE
  // ==========================
  const handleSearchChange = (value: string) => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    setSearchTimer(timer);
  };

  // ==========================
  // UPDATE URL WITH PAGE PARAMETER
  // ==========================
  const updatePageUrl = (page: number, search: string = searchQuery) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    if (search && search.trim()) {
      params.set('search', search);
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
    await exportSocialAssistanceToExcel(filteredData, setShowProgress, setProgress);
  };

  // Generate columns
  const columns = getSocialAssistanceColumns(session?.user?.role);

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center gap-4 h-40 text-gray-500">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
        Memuat data...
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <>
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

      {/* IMPORT MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchData(currentPage, searchQuery)}
      />

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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Data Bantuan Sosial:{" "}
            {filteredData.length < data.length ? (
              <span className="text-blue-600 dark:text-blue-400">
                {filteredData.length} <span className="text-xs font-normal text-gray-500">(difilter dari {total})</span>
              </span>
            ) : (
              total
            )}
          </h3>
          <div className="w-full">
            <Input
              placeholder="Cari data..."
              prefix={<SearchOutlined />}
              defaultValue={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              allowClear
              className="w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <UploadOutlined className="mr-2" />
            Import Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportWithProgress}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <DownloadOutlined className="mr-2" />
            Export Excel ({filteredData.length})
          </Button>
          {isAdmin && (
            <Link href="/socialassistance/create">
              <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
                <PlusOutlined />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
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
                  {isAdmin && (
                    <Button
                      size="xs"
                      onClick={() => {
                        if (record.id) {
                          setDeleteId(record.id);
                          setIsDeleteModalOpen(true);
                        }
                      }}
                    >
                      <DeleteOutlined />
                    </Button>
                  )}
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
          onChange: (page) => {
            updatePageUrl(page, searchQuery);
            setCurrentPage(page);
          },
        }}
        scroll={{ x: "max-content", y: 500 }}
        loading={loading}
        onChange={(_, __, ___, extra) => {
          setFilteredData(extra.currentDataSource as SocialAssistance[]);
        }}
      />
    </>
  );
}
