"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spin, Modal, Input, Badge } from "antd";
import { LoadingOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { LetterTemplate } from "@/utils/services/letter-template.service";

// Utils
import {
  getAllLetterTemplates,
  deleteLetterTemplate,
  downloadTemplateBlob,
} from "@/utils/services/letter-template.service";
import { getLetterTypeLabel } from "../letters.constants";

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

export default function LetterTemplatesTable() {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data State
  const [data, setData] = useState<LetterTemplate[]>([]);
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

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number, search: string) => {
    try {
      setLoading(true);

      const response = await getAllLetterTemplates();

      // Client-side filtering since backend doesn't have pagination
      let filteredData = response;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = response.filter(
          (item) =>
            item.templateName.toLowerCase().includes(searchLower) ||
            item.letterType.toLowerCase().includes(searchLower)
        );
      }

      // Calculate pagination
      const totalItems = filteredData.length;
      const totalPagesCalc = Math.ceil(totalItems / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

      setData(paginatedData);
      setTotal(totalItems);
      setTotalPages(totalPagesCalc || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching letter templates data:", err);
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
    const pageParam = searchParams.get("page");
    const searchParam = searchParams.get("search") || "";
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setSearchQuery(searchParam);
    setCurrentPage(initialPage);
    fetchData(initialPage, searchParam);
  }, []); // Only run once on mount

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
  // UPDATE URL WITH PAGE PARAMETER
  // ==========================
  const updatePageUrl = (page: number, search: string = searchQuery) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (search && search.trim()) {
      params.set("search", search);
    } else {
      params.delete("search");
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
      await deleteLetterTemplate(deleteId);

      // Refresh current page
      await fetchData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Template surat berhasil dihapus",
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // DOWNLOAD HANDLER
  // ==========================
  const handleDownload = async (id: number, templateName: string) => {
    try {
      const blob = await downloadTemplateBlob(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${templateName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      notifyFromResult(notify, { successMessage: "Template berhasil diunduh" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    }
  };

  // ==========================
  // EDIT HANDLER
  // ==========================
  const handleEdit = (template: LetterTemplate) => {
    router.push(`/letters/templates/edit/${template.id}`);
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
          <Button
            key="cancel"
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={deleteLoading}
          >
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
        <p>Apakah Anda yakin ingin menghapus template surat ini?</p>
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Template: {total}
          </h3>
          <div className="w-full">
            <Input
              placeholder="Cari template..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/letters/templates/create">
            <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <PlusOutlined />
            </Button>
          </Link>
        </div>
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
          <table className="w-full text-sm text-left table-fixed" style={{ minWidth: '1240px' }}>
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '60px' }}>
                  ID
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '180px' }}>
                  Jenis Surat
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '200px' }}>
                  Nama Template
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '80px' }}>
                  Versi
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '100px' }}>
                  Status
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '200px' }}>
                  Variabel
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>
                  Dibuat Oleh
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '150px' }}>
                  Tanggal Dibuat
                </th>
                <th className="px-4 py-3 font-medium border-b border-gray-200 dark:border-gray-700" style={{ width: '120px' }}>
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
                      <span className="font-medium">#{record.id}</span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <Badge
                        color="blue"
                        text={getLetterTypeLabel(record.letterType as any)}
                      />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <span 
                        className="font-medium"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(record.templateName || "-", searchQuery)
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <Badge color="green" text={`v${record.version}`} />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      <Badge
                        color={record.isActive ? "green" : "red"}
                        text={record.isActive ? "Aktif" : "Nonaktif"}
                      />
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {!record.variables || record.variables.length === 0 ? (
                        <span className="text-gray-400">Tidak ada variabel</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {record.variables.slice(0, 3).map((v, i) => (
                            <Badge
                              key={i}
                              color="purple"
                              text={`{${v}}`}
                              className="text-xs"
                            />
                          ))}
                          {record.variables.length > 3 && (
                            <span className="text-gray-400 text-xs">
                              +{record.variables.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      User #{record.createdBy}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 truncate">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(record.id, record.templateName)}
                        >
                          <DownloadOutlined />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <EditOutlined />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
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
