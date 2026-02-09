"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, Modal, Input, Button, Select, Progress } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined, DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import { deleteChildAssistance, getAllChildAssistanceOptimized, getAllChildAssistanceByYear } from "@/utils/services/childassistance.service";
import { formatDate } from "@/utils/formatter/formatDate";
import { exportChildAssistanceToExcel, ExportProgress } from "@/utils/export/excelExport";

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
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number = currentPage, search: string = searchQuery) => {
    try {
      setLoading(true);
      
      const response = await getAllChildAssistanceOptimized(page, pageSize, search);
      
      setData(response.data);
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
  }, [notify, currentPage, searchQuery, pageSize]);

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
  }, [fetchData, searchQuery, searchTimer]);

  // ==========================
  // UPDATE URL WITH PAGE AND SEARCH PARAMETERS
  // ==========================
  const updatePageUrl = (page: number, search: string = searchQuery) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    if (search.trim()) {
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
    setExportProgress(null);

    try {
      // Update progress: Fetching data
      setExportProgress({
        current: 0,
        total: 0,
        percentage: 0,
        status: 'Mengambil data dari server...'
      });

      // Fetch data for the selected year
      const data = await getAllChildAssistanceByYear(exportYear);

      if (data.length === 0) {
        notifyFromResult(notify, {
          error: new Error(`Tidak ada data bantuan anak untuk tahun ${exportYear}`),
        });
        setExportLoading(false);
        return;
      }

      // Export to Excel with progress tracking
      await exportChildAssistanceToExcel(data, exportYear, (progress) => {
        setExportProgress(progress);
      });

      setIsExportModalOpen(false);
      notifyFromResult(notify, {
        successMessage: `Export ${data.length} data bantuan anak tahun ${exportYear} berhasil!`,
      });
    } catch (err) {
      console.error("Error exporting child assistance data:", err);
      notifyFromResult(notify, { error: err });
    } finally {
      setExportLoading(false);
      setExportProgress(null);
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
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        cancelText="Batal"
        okText={deleteLoading ? "Menghapus..." : "Hapus"}
        okButtonProps={{ danger: true, loading: deleteLoading }}
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
          setExportProgress(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsExportModalOpen(false)} disabled={exportLoading}>
            Batal
          </Button>,
          <Button
            key="export"
            type="primary"
            onClick={handleExport}
            loading={exportLoading}
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
            <Select
              placeholder="Pilih tahun untuk export"
              value={exportYear}
              onChange={setExportYear}
              disabled={exportLoading}
              className="w-full"
              size="large"
            >
              <Select.Option value={2025}>2025</Select.Option>
              <Select.Option value={2024}>2024</Select.Option>
            </Select>
          </div>

          {exportProgress && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exportProgress.status}
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {exportProgress.percentage}%
                </span>
              </div>
              <Progress
                percent={exportProgress.percentage}
                status={exportProgress.percentage === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              {exportProgress.total > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {exportProgress.current} dari {exportProgress.total} data
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="block">
          <h3 className="text-base mb-2 font-medium text-gray-800 dark:text-white/90">
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
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => setIsExportModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
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
          <table className="w-full text-sm text-left table-fixed" style={{ minWidth: '1200px' }}>
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
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
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
                          type="default"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log("Edit record:", record.id);
                          }}
                        />
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            if (!record.id) return;
                            setDeleteId(record.id);
                            setIsDeleteModalOpen(true);
                          }}
                        />
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
                size="small"
                icon={<DoubleLeftOutlined />}
                disabled={currentPage === 1}
                onClick={() => {
                  updatePageUrl(1, searchQuery);
                  fetchData(1, searchQuery);
                }}
              />
              
              {/* Previous Page */}
              <Button
                size="small"
                icon={<LeftOutlined />}
                disabled={currentPage === 1}
                onClick={() => {
                  const newPage = currentPage - 1;
                  updatePageUrl(newPage, searchQuery);
                  fetchData(newPage, searchQuery);
                }}
              />
              
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
                      size="small"
                      type={currentPage === pageNum ? "primary" : "default"}
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
                size="small"
                icon={<RightOutlined />}
                disabled={currentPage === totalPages}
                onClick={() => {
                  const newPage = currentPage + 1;
                  updatePageUrl(newPage, searchQuery);
                  fetchData(newPage, searchQuery);
                }}
              />
              
              {/* Last Page */}
              <Button
                size="small"
                icon={<DoubleRightOutlined />}
                disabled={currentPage === totalPages}
                onClick={() => {
                  updatePageUrl(totalPages, searchQuery);
                  fetchData(totalPages, searchQuery);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
