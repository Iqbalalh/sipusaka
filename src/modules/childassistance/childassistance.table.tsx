"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, Modal, Input, Select, Progress, Space } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined, DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import { deleteChildAssistance, getAllChildAssistanceOptimized, getAllChildAssistanceByYear } from "@/utils/services/childassistance.service";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Button from "@/components/ui/button/Button";

// ==========================
// HIGHLIGHT TEXT FUNCTION
// ==========================
const highlightText = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 dark:text-white px-0.5 rounded">$1</mark>');
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportChildAssistanceToExcel = async (
  data: ChildAssistance[],
  year: number,
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    console.log("exportChildAssistanceToExcel called with:", { year, dataLength: data.length });
    setShowProgress(true);
    setProgress(10);

    const exportData = data;

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      throw new Error("Tidak ada data untuk diekspor");
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Bantuan Anak ${year}`, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(30);

    // Define columns with Indonesian names
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
    exportData.forEach((item) => {
      const regionName = item.regionName || item.children?.homes?.regions?.regionName || "-";
      
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
        regionName: regionName,
        notes: item.notes || "-",
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
    console.log("Writing workbook to buffer...");
    const buffer = await workbook.xlsx.writeBuffer();
    console.log("Buffer created, size:", buffer.byteLength);
    
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    console.log("Blob created, size:", blob.size);

    const fileName = `Bantuan_Anak_${year}.xlsx`;
    console.log("Saving file as:", fileName);
    
    saveAs(blob, fileName);
    console.log("File saved successfully");

    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
    throw error; // Re-throw to let the caller handle it
  }
};

export default function ChildAssistanceTable() {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<ChildAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [exportYear, setExportYear] = useState<number | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);
      
      const response = await getAllChildAssistanceOptimized(page, pageSize, search);
      
      // Sort by assistance date (newest first)
      const sortedData = response.data.sort((a, b) => 
        new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime()
      );
      
      setData(sortedData);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching child assistance data:", err);
      notifyFromResult(notify, { error: err });
      setData([]);
      setTotal(0);
      setTotalPages(1);
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
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const timer = setTimeout(() => {
      fetchData(1, searchQuery);
    }, 500);
    
    setSearchTimer(timer);
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
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
      
      // Refresh current page
      await fetchData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Data bantuan anak berhasil dihapus",
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
  const handleExport = async () => {
    if (!exportYear) return;

    setExportLoading(true);

    try {
      console.log("Starting export for year:", exportYear);
      
      // Fetch data for the selected year
      const data = await getAllChildAssistanceByYear(exportYear);
      console.log("Fetched data:", data.length, "records");

      if (data.length === 0) {
        notifyFromResult(notify, {
          error: new Error(`Tidak ada data bantuan anak untuk tahun ${exportYear}`),
        });
        setExportLoading(false);
        return;
      }

      // Export to Excel with progress tracking
      await exportChildAssistanceToExcel(data, exportYear, setShowProgress, setProgress);

      setIsExportModalOpen(false);
      notifyFromResult(notify, {
        successMessage: `Export ${data.length} data bantuan anak tahun ${exportYear} berhasil!`,
      });
    } catch (err) {
      console.error("Error exporting child assistance data:", err);
      notifyFromResult(notify, { error: err });
    } finally {
      setExportLoading(false);
    }
  };

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
    <div className="overflow-x-auto">
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

      {/* EXPORT MODAL */}
      <Modal
        title="Export Excel Bantuan Anak"
        open={isExportModalOpen}
        onCancel={() => {
          setIsExportModalOpen(false);
          setExportYear(null);
        }}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsExportModalOpen(false)} disabled={exportLoading}>
            Batal
          </Button>,
          <Button
            key="export"
            variant="primary"
            onClick={handleExport}
            disabled={!exportYear || exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export'}
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Tahun
            </label>
            <Space.Compact className="w-full" vertical>
              {[2025, 2024].map((year) => (
                <Button
                  key={year}
                  variant={exportYear === year ? "primary" : "outline"}
                  onClick={() => setExportYear(year)}
                  disabled={exportLoading}
                >
                  {year}
                </Button>
              ))}
            </Space.Compact>
          </div>
        </div>
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
            Jumlah Data Bantuan Anak: {total}
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
          onClick={() => setIsExportModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <DownloadOutlined className="mr-2" />
          Export Excel
        </Button>
      </div>

      {/* CUSTOM TABLE WITH FIXED SIZE */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <style jsx global>{`
          /* Dark mode scrollbar styling */
          .dark ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .dark ::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 4px;
          }
          
          .dark ::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
          }
          
          .dark ::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
          
          /* Light mode scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>
        <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full text-sm text-left table-fixed" style={{ minWidth: '1350px' }}>
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '200px' }}>
                  Nama Anak
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '120px' }}>
                  Bantuan Ke-
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>
                  Tanggal Bantuan
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>
                  Jumlah Bantuan
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>
                  Penyedia Bantuan
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '120px' }}>
                  Tingkat Pendidikan
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '120px' }}>
                  Wilayah
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '80px' }}>
                  Usia
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '100px' }}>
                  Dokumen
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '130px' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <span dangerouslySetInnerHTML={{
                        __html: highlightText(record.children?.childrenName || "-", searchQuery)
                      }} />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {record.assistanceNumber || "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {record.assistanceDate ? formatDate(record.assistanceDate) : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {record.assistanceAmount ? `Rp ${record.assistanceAmount.toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300">
                        <span dangerouslySetInnerHTML={{
                          __html: highlightText(record.assistanceProvider || "-", searchQuery)
                        }} />
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">
                        <span dangerouslySetInnerHTML={{
                          __html: highlightText(record.educationLevel || "-", searchQuery)
                        }} />
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-300">
                        {record.children?.homes?.regions?.regionName || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {record.age ? `${record.age} tahun` : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {(record.childAssistanceDocs?.length ?? 0) > 0
                        ? `${record.childAssistanceDocs?.length ?? 0} dokumen`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (record.childrenId) {
                              router.push(`/children/view/${record.childrenId}`);
                            }
                          }}
                        >
                          <EditOutlined />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!record.id) return;
                            setDeleteId(record.id);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <DeleteOutlined />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} dari {total} data
            </div>
            <div className="flex items-center gap-1">
              {/* First Page */}
              <Button
                size="xs"
                onClick={() => {
                  updatePageUrl(1, searchQuery);
                  fetchData(1, searchQuery);
                }}
                disabled={currentPage === 1}
              >
                <DoubleLeftOutlined />
              </Button>
              
              {/* Previous Page */}
              <Button
                size="xs"
                onClick={() => {
                  const newPage = currentPage - 1;
                  updatePageUrl(newPage, searchQuery);
                  fetchData(newPage, searchQuery);
                }}
                disabled={currentPage === 1}
              >
                <LeftOutlined />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  
                  // Calculate which page numbers to show
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      size="xs"
                      variant={currentPage === pageNum ? "primary" : "outline"}
                      onClick={() => {
                        updatePageUrl(pageNum, searchQuery);
                        fetchData(pageNum, searchQuery);
                      }}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              {/* Next Page */}
              <Button
                size="xs"
                onClick={() => {
                  const newPage = currentPage + 1;
                  updatePageUrl(newPage, searchQuery);
                  fetchData(newPage, searchQuery);
                }}
                disabled={currentPage === totalPages}
              >
                <RightOutlined />
              </Button>
              
              {/* Last Page */}
              <Button
                size="xs"
                onClick={() => {
                  updatePageUrl(totalPages, searchQuery);
                  fetchData(totalPages, searchQuery);
                }}
                disabled={currentPage === totalPages}
              >
                <DoubleRightOutlined />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
