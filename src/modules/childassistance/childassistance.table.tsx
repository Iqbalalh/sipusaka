"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input, Progress } from "antd";
import { LoadingOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import { deleteChildAssistance, getAllChildAssistanceOptimized } from "@/utils/services/childassistance.service";
import { getChildAssistanceColumns } from "./childassistance.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Button from "@/components/ui/button/Button";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportChildAssistanceToExcel = async (
  data: ChildAssistance[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!data || data.length === 0) {
      setShowProgress(false);
      throw new Error("Tidak ada data untuk diekspor");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bantuan Anak", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(30);

    worksheet.columns = [
      { header: "Bantuan Ke-", key: "assistanceNumber", width: 15 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "Tanggal Bantuan", key: "assistanceDate", width: 20 },
      { header: "Jenis Bantuan", key: "assistanceType", width: 20 },
      { header: "Jumlah Bantuan", key: "assistanceAmount", width: 20 },
      { header: "Penyedia Bantuan", key: "assistanceProvider", width: 25 },
      { header: "Tingkat Pendidikan", key: "educationLevel", width: 20 },
      { header: "Kelas", key: "educationGrade", width: 15 },
      { header: "Nama Sekolah", key: "schoolName", width: 30 },
      { header: "Usia", key: "age", width: 10 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Catatan", key: "notes", width: 40 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });

    setProgress(50);

    const dataRows: any[] = [];
    data.forEach((item) => {
      dataRows.push({
        assistanceNumber: item.assistanceNumber || "-",
        childrenName: item.children?.childrenName || "-",
        assistanceDate: item.assistanceDate ? formatDate(item.assistanceDate) : "-",
        assistanceType: item.assistanceType || "-",
        assistanceAmount: item.assistanceAmount ? `Rp ${item.assistanceAmount.toLocaleString("id-ID")}` : "-",
        assistanceProvider: item.assistanceProvider || "-",
        educationLevel: item.educationLevel || "-",
        educationGrade: item.educationGrade || "-",
        schoolName: item.schoolName || "-",
        age: item.age ? `${item.age} tahun` : "-",
        regionName: item.regionName || item.children?.homes?.regions?.regionName || "-",
        notes: item.notes || "-",
      });
    });

    dataRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
      if (dataRows.length > 0 && index % Math.max(1, Math.floor(dataRows.length / 10)) === 0) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Bantuan_Anak_Export.xlsx`);

    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
    throw error;
  }
};

export default function ChildAssistanceTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data State
  const [data, setData] = useState<ChildAssistance[]>([]);
  const [filteredData, setFilteredData] = useState<ChildAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);

      const response = await getAllChildAssistanceOptimized(page, pageSize, search);

      const sortedData = response.data.sort((a, b) =>
        new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime()
      );

      setData(sortedData);
      setFilteredData(sortedData);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching child assistance data:", err);
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
    setCurrentPage(initialPage);
    setSearchQuery(searchParam);
    fetchData(initialPage, searchParam);
  }, [fetchData, searchParams]);

  // ==========================
  // SEARCH WITH DEBOUNCE
  // ==========================
  useEffect(() => {
    if (searchTimer) clearTimeout(searchTimer);

    const timer = setTimeout(() => {
      fetchData(1, searchQuery);
    }, 500);

    setSearchTimer(timer);

    return () => { if (timer) clearTimeout(timer); };
  }, [fetchData, searchQuery]);

  // ==========================
  // UPDATE URL WITH PAGE AND SEARCH PARAMETERS
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
      await deleteChildAssistance(deleteId);
      await fetchData(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      notifyFromResult(notify, { successMessage: "Data bantuan anak berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // EXPORT HANDLER
  // ==========================
  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportChildAssistanceToExcel(filteredData, setShowProgress, setProgress);
      notifyFromResult(notify, {
        successMessage: `Export ${filteredData.length} data bantuan anak berhasil!`,
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setExportLoading(false);
    }
  };

  // ==========================
  // OPEN DELETE MODAL
  // ==========================
  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  // ==========================
  // BUILD COLUMNS
  // ==========================
  const columns = useMemo(() => {
    const base = getChildAssistanceColumns(router, session?.user?.role);
    return base.map((col) => {
      if (col.key === "actions" && col.render) {
        const originalRender = col.render;
        return {
          ...col,
          render: (_: any, record: ChildAssistance, index: number) => {
            const recordWithHandler = { ...record, _openDeleteModal: openDeleteModal };
            return originalRender(_, recordWithHandler as ChildAssistance, index);
          },
        };
      }
      return col;
    });
  }, [router, session?.user?.role, openDeleteModal]);

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
        <p>Apakah Anda yakin ingin menghapus data bantuan anak ini?</p>
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Data Bantuan Anak:{" "}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="w-full"
            />
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={exportLoading || filteredData.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <DownloadOutlined className="mr-2" />
          Export Excel ({filteredData.length})
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
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
            fetchData(page, searchQuery);
          },
        }}
        scroll={{ x: "max-content", y: 500 }}
        loading={loading}
        onChange={(_, __, ___, extra) => {
          setFilteredData(extra.currentDataSource as ChildAssistance[]);
        }}
      />
    </>
  );
}
