"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Progress } from "antd";
import { Button as AntButton } from "antd";
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

import { Gallery, Category } from "@/types/models/gallery";
import { Region } from "@/types/models/region";
import { getGalleries, deleteGallery, getCategories } from "@/utils/services/gallery.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getGalleryColumns } from "./galleries.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT
// ==============================================
const exportGalleryToExcel = async (
  galleries: Gallery[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void,
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!galleries || galleries.length === 0) {
      setShowProgress(false);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Galeri", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(20);

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

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    setProgress(40);

    galleries.forEach((gallery, index) => {
      const excelRow = worksheet.addRow({
        id: gallery.id,
        caption: gallery.caption || "-",
        categories: gallery.categories?.map((cat) => cat.name).join(", ") || "-",
        galleryDate: gallery.galleryDate ? formatDate(gallery.galleryDate) : "-",
        regionName: gallery.regionName || "-",
        createdAt: gallery.createdAt ? formatDate(gallery.createdAt) : "-",
        createdBy: (gallery as any).createdByStaffName || (gallery as any).createdBy || "-",
        editedBy: (gallery as any).editedByStaffName || (gallery as any).editedBy || "-",
      });

      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      if (index % Math.max(1, Math.floor(galleries.length / 10)) === 0) {
        setProgress(40 + Math.floor((index / galleries.length) * 40));
      }
    });

    setProgress(90);

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "data-galeri.xlsx",
    );

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

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function GalleriesTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";

  const pushParams = useCallback(
    (updates: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`/galleries?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Fetch lookup data once
  useEffect(() => {
    Promise.all([getRegionsList(), getCategories()])
      .then(([regionList, categoryList]) => {
        setRegions(regionList);
        setCategories(categoryList);
      })
      .catch((err) => console.error("Failed to fetch filters:", err));
  }, []);

  // Fetch all gallery data once on mount
  useEffect(() => {
    setLoading(true);
    getGalleries()
      .then((res) => setAllData(Array.isArray(res) ? res : []))
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setAllData([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter by URL search term
  const data = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter((item) => {
      const caption = item.caption?.toLowerCase() || "";
      const regionName = item.regionName?.toLowerCase() || "";
      const cats = item.categories?.map((c) => c.name.toLowerCase()).join(" ") || "";
      return caption.includes(q) || regionName.includes(q) || cats.includes(q);
    });
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteGallery(deleteId);
      setIsDeleteModalOpen(false);
      getGalleries()
        .then((res) => setAllData(Array.isArray(res) ? res : []))
        .catch(() => {});
      notifyFromResult(notify, { successMessage: "Galeri berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, notify]);

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      await exportGalleryToExcel(data, setShowProgress, setProgress);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, data]);

  const baseColumns = useMemo(
    () =>
      getGalleryColumns(regions, categories, session?.user?.role, isAdmin ? (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
      } : undefined),
    [regions, categories, session?.user?.role, isAdmin],
  );

  const columnsWithState = useMemo(
    () =>
      baseColumns.map((col) => ({
        ...col,
        ...(col.filters !== undefined ? { filteredValue: null } : {}),
      })),
    [baseColumns],
  );

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
        <p>Apakah Anda yakin ingin menghapus galeri ini?</p>
      </Modal>

      {/* EXPORT PROGRESS */}
      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sedang mengekspor data...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="galleries-search-wrap w-full max-w-[340px]">
          <style>{`
            .galleries-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .galleries-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .galleries-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari keterangan, kategori, wilayah..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val) handleSearch("");
            }}
            onSearch={handleSearch}
            enterButton="Cari"
            allowClear
            style={{ width: "100%" }}
          />
        </div>
        <div className="flex gap-2">
          <AntButton
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportLoading}
            disabled={data.length === 0}
          >
            Export ({data.length})
          </AntButton>
          {isAdmin && (
            <Link href="/galleries/create">
              <AntButton type="primary">+</AntButton>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columnsWithState}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 50,
          total: data.length,
          showSizeChanger: false,
          showTotal: (t) => `Jumlah Data: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content", y: 500 }}
      />
    </>
  );
}
