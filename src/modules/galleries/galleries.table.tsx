"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input, Progress } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { Gallery } from "@/types/models/gallery";
import { Region } from "@/types/models/region";

// Utils
import { getGalleries, deleteGallery } from "@/utils/services/gallery.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getGalleryColumns } from "./galleries.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportGalleryToExcel = async (
  galleries: Gallery[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!galleries || galleries.length === 0) {
      setShowProgress(false);
      return;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Galeri", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(20);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Keterangan", key: "caption", width: 40 },
      { header: "Kategori", key: "categories", width: 25 },
      { header: "Tanggal Galeri", key: "galleryDate", width: 20 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Dibuat Pada", key: "createdAt", width: 20 },
      { header: "Dibuat Oleh", key: "createdBy", width: 20 },
      { header: "Diedit Oleh", key: "editedBy", width: 20 },
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

    setProgress(40);

    // Add data to worksheet
    galleries.forEach((gallery, index) => {
      const row = {
        id: gallery.id,
        caption: gallery.caption || "-",
        categories: gallery.categories?.map((cat) => cat.name).join(", ") || "-",
        galleryDate: gallery.galleryDate ? formatDate(gallery.galleryDate) : "-",
        regionName: gallery.regionName || "-",
        createdAt: gallery.createdAt ? formatDate(gallery.createdAt) : "-",
        createdBy: (gallery as any).createdByStaffName || (gallery as any).createdBy || "-",
        editedBy: (gallery as any).editedByStaffName || (gallery as any).editedBy || "-",
      };

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
      if (index % Math.floor(galleries.length / 10) === 0) {
        setProgress(40 + Math.floor((index / galleries.length) * 40));
      }
    });

    setProgress(90);

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "data-galeri.xlsx");

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

export default function GalleriesTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data State
  const [data, setData] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

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

  // Regions State
  const [regions, setRegions] = useState<Region[]>([]);

  // Fetch regions for column filters
  useEffect(() => {
    const init = async () => {
      try {
        const regionList = await getRegionsList();
        setRegions(regionList);
      } catch (err) {
        console.error("Failed to fetch regions:", err);
      }
    };

    init();
  }, []);

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await getGalleries();

      // Filter data based on search query
      let filteredData = response;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = response.filter((item: Gallery) => {
          const caption = item.caption?.toLowerCase() || "";
          const regionName = item.regionName?.toLowerCase() || "";
          const categories = item.categories?.map((c) => c.name.toLowerCase()).join(", ") || "";
          return caption.includes(query) || regionName.includes(query) || categories.includes(query);
        });
      }

      // Calculate pagination
      const totalItems = filteredData.length;
      const totalPagesCalc = Math.ceil(totalItems / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

      setData(paginatedData);
      setTotal(totalItems);
      setTotalPages(totalPagesCalc);
    } catch (err) {
      console.error("Error fetching gallery data:", err);
      notifyFromResult(notify, { error: err });
      setData([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // INITIAL FETCH FROM URL
  // ==========================
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const searchParam = searchParams.get("search") || "";
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(initialPage);
    setSearchQuery(searchParam);
  }, []); // Only run once on mount

  // ==========================
  // FETCH ON SEARCH/PAGE CHANGE
  // ==========================
  useEffect(() => {
    fetchData();
  }, [currentPage, searchQuery]);

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
  // UPDATE URL WITH PAGE AND SEARCH PARAMETERS
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
      await deleteGallery(deleteId);

      // Refresh current page
      await fetchData();

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Galeri berhasil dihapus",
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
    // Fetch all data for export
    try {
      const allData = await getGalleries();
      await exportGalleryToExcel(allData, setShowProgress, setProgress);
    } catch (error) {
      console.error("Export failed:", error);
      setShowProgress(false);
    }
  };

  // Generate columns with regions
  const columns = getGalleryColumns(regions, session?.user?.role);

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
        <p>Apakah Anda yakin ingin menghapus galeri ini?</p>
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
            Jumlah Data Galeri: {total}
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
            onClick={handleExportWithProgress}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <DownloadOutlined className="mr-2" />
            Export Excel
          </Button>
          {isAdmin && (
            <Link href="/galleries/create">
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
              render: (_: any, gallery: Gallery) => (
                <div className="flex gap-2 text-xs">
                  <Link href={`galleries/view/${gallery.id}`}>
                    <Button size="xs">
                      <EyeOutlined />
                    </Button>
                  </Link>
                  <Link href={`galleries/edit/${gallery.id}`}>
                    <Button size="xs">
                      <EditOutlined />
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button
                      size="xs"
                      onClick={() => {
                        if (gallery.id) {
                          setDeleteId(gallery.id);
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
      />
    </>
  );
}
