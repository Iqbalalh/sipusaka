"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Progress, Spin, Button } from "antd";
import { LoadingOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { ChildAssistance, deleteChildAssistance, getAllChildAssistanceOptimized } from "@/utils/services/childassistance.service";
import { getChildAssistanceColumns } from "./childassistance.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function ChildAssistanceTable() {
  const { data: session } = useSession();

  const { notify } = useNotify();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

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
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstSearchRender = useRef(true);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [exportLoading, setExportLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      const response = await getAllChildAssistanceOptimized(page, pageSize, search);
      const rawData = Array.isArray(response.data) ? response.data : [];
      const sortedData = [...rawData].sort((a, b) =>
        new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime()
      );
      setData(sortedData);
      setFilteredData(sortedData);
      setTotal(response.pagination?.total ?? 0);
      setCurrentPage(response.pagination?.page ?? page);
    } catch (err) {
      console.error("Error fetching child assistance data:", err);
      notifyFromResult(notifyRef.current, { error: err });
      setData([]);
      setFilteredData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // ==========================
  // INITIAL FETCH
  // ==========================
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const searchParam = searchParams.get("search") || "";
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(initialPage);
    setSearchQuery(searchParam);
    fetchData(initialPage, searchParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================
  // SEARCH WITH DEBOUNCE
  // ==========================
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const timer = setTimeout(() => fetchData(1, searchQuery), 500);
    searchTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [searchQuery, fetchData]);

  // ==========================
  // UPDATE URL
  // ==========================
  const updatePageUrl = (page: number, search: string = searchQuery) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (search.trim()) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // ==========================
  // DELETE
  // ==========================
  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteChildAssistance(deleteId);
      await fetchData(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      notifyFromResult(notifyRef.current, { successMessage: "Data bantuan anak berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // EXPORT
  // ==========================
  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportChildAssistanceToExcel(filteredData, setShowProgress, setProgress);
      notifyFromResult(notifyRef.current, {
        successMessage: `Export ${filteredData.length} data bantuan anak berhasil!`,
      });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setExportLoading(false);
    }
  };

  // ==========================
  // COLUMNS
  // ==========================
  const columns = useMemo(
    () => getChildAssistanceColumns(router, session?.user?.role, openDeleteModal),
    [router, session?.user?.role, openDeleteModal]
  );

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
        confirmLoading={deleteLoading}
        okText="Hapus"
        okButtonProps={{ danger: true }}
        cancelText="Batal"
        onOk={handleDelete}
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
            <span className="text-sm font-bold text-blue-600">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Data Bantuan Anak:{" "}
            {filteredData.length < data.length ? (
              <span className="text-blue-600 dark:text-blue-400">
                {filteredData.length}{" "}
                <span className="text-xs font-normal text-gray-500">(difilter dari {total})</span>
              </span>
            ) : (
              total
            )}
          </h3>
          <Input
            placeholder="Cari data..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exportLoading}
          disabled={filteredData.length === 0}
        >
          Export Excel ({filteredData.length})
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        bordered
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: "max-content", y: 500 }}
        pagination={{
          pageSize,
          current: currentPage,
          total,
          showSizeChanger: false,
          showTotal: (tot) => `Total ${tot} data`,
          onChange: (page) => {
            updatePageUrl(page, searchQuery);
            fetchData(page, searchQuery);
          },
        }}
        onChange={(_, __, ___, extra) => {
          setFilteredData(extra.currentDataSource as ChildAssistance[]);
        }}
        size="small"
      />
    </>
  );
}
