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
import { HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteHome,
  getHomesOptimized,
  getHomesForExport,
} from "@/utils/services/home.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getFamilyColumns } from "./family.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportFamilyToExcel = async (
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    // Fetch data from export API (includes children and regions)
    let exportData: HomeTable[] = [];
    try {
      exportData = await getHomesForExport();
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
    const worksheet = workbook.addWorksheet("Data Keluarga", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "ID Keluarga", key: "id", width: 15 },
      { header: "NIP/NIPP Pegawai", key: "nipNipp", width: 20 },
      { header: "Nama Pegawai", key: "employeeName", width: 25 },
      { header: "Jenis Kelamin Pegawai", key: "employeeGender", width: 20 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Nama Pasangan", key: "partnerName", width: 25 },
      { header: "Status Pasangan", key: "partnerStatus", width: 15 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "Jenis Kelamin Anak", key: "childrenGender", width: 20 },
      { header: "Tanggal Lahir Anak", key: "childrenBirthdate", width: 20 },
      { header: "Alamat", key: "address", width: 200 },
      { header: "Kode Pos", key: "postalCode", width: 15 },
      { header: "Nomor Telepon", key: "phoneNumber", width: 20 },
      { header: "Koordinat Rumah", key: "homeCoordinate", width: 30 },
      { header: "Jumlah Anak", key: "childrenCount", width: 15 },
      { header: "UMKM", key: "isUmkm", width: 15 },
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

    // Prepare data rows - expand each family with their children
    const dataRows: any[] = [];
    exportData.forEach((home) => {
      // Get children for this home (already included in exportData)
      const children = (home as any).children || [];

      if (children.length === 0) {
        // Add row without children
        dataRows.push({
          id: home.id,
          nipNipp: home.employees?.nipNipp || "-",
          employeeName: home.employees?.employeeName || "-",
          employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
          regionName: home.regions?.regionName || home.employees?.regions?.regionName || "-",
          partnerName: home.partners?.partnerName || "-",
          partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
          waliName: home.wali?.waliName || "-",
          childrenName: "-",
          childrenGender: "-",
          childrenBirthdate: "-",
          address: home.partners?.address || "-",
          postalCode: home.postalCode || home.partners?.postalCode || "-",
          phoneNumber: home.partners?.phoneNumber || "-",
          homeCoordinate: home.partners?.homeCoordinate || "-",
          childrenCount: home._count?.children || 0,
          isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
          createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
        });
      } else {
        // Add rows for each child
        children.forEach((child: any) => {
          dataRows.push({
            id: home.id,
            nipNipp: home.employees?.nipNipp || "-",
            employeeName: home.employees?.employeeName || "-",
            employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
            regionName: home.regions?.regionName || home.employees?.regions?.regionName || "-",
            partnerName: home.partners?.partnerName || "-",
            partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
            waliName: home.wali?.waliName || "-",
            childrenName: child.childrenName || "-",
            childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
            childrenBirthdate: child.childrenBirthdate
              ? formatDate(child.childrenBirthdate)
              : "-",
            address: home.partners?.address || child.childrenAddress || "-",
            postalCode: home.postalCode || home.partners?.postalCode || child.childrenAddress || "-",
            phoneNumber: home.partners?.phoneNumber || child.childrenPhone || "-",
            homeCoordinate: home.partners?.homeCoordinate || "-",
            childrenCount: home._count?.children || 0,
            isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
            createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
          });
        });
      }
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

    // Merge columns for parent info (same values across children rows)
    const columnsToMerge = [
      "id",
      "nipNipp",
      "employeeName",
      "employeeGender",
      "regionName",
      "partnerName",
      "partnerStatus",
      "waliName",
      "address",
      "postalCode",
      "phoneNumber",
      "homeCoordinate",
      "childrenCount",
      "isUmkm",
      "createdAt",
    ];

    // Merge columns for parent info - group by family ID
    columnsToMerge.forEach((columnKey) => {
      const column = worksheet.getColumn(columnKey);
      if (!column) return;

      let currentFamilyId: number | null = null;
      let groupStartRow = 2;

      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber === 1) return;

        const row = worksheet.getRow(rowNumber);
        const idCell = row.getCell("id");
        const familyId = idCell.value as number;

        // Check if this is a new family
        if (familyId !== currentFamilyId) {
          // Merge previous group if it has more than 1 row
          if (currentFamilyId !== null && rowNumber - groupStartRow > 1) {
            worksheet.mergeCells(groupStartRow, column.number, rowNumber - 1, column.number);
            worksheet.getCell(groupStartRow, column.number).alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };
          }
          
          // Start new group
          currentFamilyId = familyId;
          groupStartRow = rowNumber;
        }
      });

      // Merge last group
      const lastRow = worksheet.lastRow?.number ?? groupStartRow;
      if (currentFamilyId !== null && lastRow - groupStartRow >= 1) {
        worksheet.mergeCells(groupStartRow, column.number, lastRow, column.number);
        worksheet.getCell(groupStartRow, column.number).alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
      }
    });

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

    saveAs(blob, "data-keluarga.xlsx");

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

export default function FamilyTable() {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<HomeTable[]>([]);
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
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = async (page: number, search: string) => {
    try {
      setLoading(true);
      
      const response = await getHomesOptimized(page, pageSize, search);
      
      setData(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching family data:", err);
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
    const pageParam = searchParams.get('page');
    const searchParam = searchParams.get('search') || '';
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(initialPage);
    setSearchQuery(searchParam);
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
  }, [searchQuery]);

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
      await deleteHome(deleteId);
      
      // Refresh current page
      await fetchData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Keluarga berhasil dihapus",
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
    await exportFamilyToExcel(setShowProgress, setProgress);
  };

  // Generate columns with regions
  const columns = getFamilyColumns(regions);

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
        <p>Apakah Anda yakin ingin menghapus keluarga ini?</p>
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
            Jumlah Data Keluarga: {total}
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
          <Link href="/family/create">
            <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <PlusOutlined />
            </Button>
          </Link>
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columns.map((col) => {
          if (col.key === "actions") {
            return {
              ...col,
              render: (_: any, home: HomeTable) => (
                <div className="flex gap-2 text-xs">
                  <Link href={`family/view/${home.id}`}>
                    <Button size="xs">
                      <EyeOutlined />
                    </Button>
                  </Link>
                  <Link href={`family/edit/${home.id}`}>
                    <Button size="xs">
                      <EditOutlined />
                    </Button>
                  </Link>
                  <Button
                    size="xs"
                    onClick={() => {
                      setDeleteId(home.id);
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
          onChange: (page) => {
            updatePageUrl(page, searchQuery);
            fetchData(page, searchQuery);
          },
        }}
        scroll={{ x: "max-content", y: 500 }}
        loading={loading}
      />
    </div>
  );
}
