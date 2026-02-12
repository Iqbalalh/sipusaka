"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input, Progress, Select, Form } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, EditOutlined, DownloadOutlined, FilterOutlined, PlusOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteChildren,
  getChildrenOptimized,
  getChildrenForExport,
  type ChildrenFilters,
} from "@/utils/services/children.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrenColumns } from "./children.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportChildrenToExcel = async (
  filters: ChildrenFilters | undefined,
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    // Fetch data from export API (includes all fields)
    let exportData: Children[] = [];
    try {
      exportData = await getChildrenForExport(filters);
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
    const worksheet = workbook.addWorksheet("Data Anak Asuh", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "ID Anak", key: "id", width: 15 },
      { header: "Foto", key: "childrenPict", width: 40 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Anak ke-", key: "index", width: 12 },
      { header: "Jenis Kelamin", key: "childrenGender", width: 15 },
      { header: "Tanggal Lahir", key: "childrenBirthdate", width: 20 },
      { header: "Usia", key: "age", width: 12 },
      { header: "Jenjang Pendidikan", key: "educationLevel", width: 20 },
      { header: "Tingkat Pendidikan", key: "educationGrade", width: 20 },
      { header: "Nama Sekolah", key: "schoolName", width: 30 },
      { header: "Pekerjaan", key: "childrenJob", width: 25 },
      { header: "Nama Orangtua", key: "parentName", width: 30 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Yatim/Piatu", key: "yatimStatus", width: 15 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Status", key: "isActive", width: 15 },
      { header: "Kondisi", key: "isCondition", width: 15 },
      { header: "Keterangan", key: "notes", width: 40 },
      { header: "Alamat Anak", key: "childrenAddress", width: 40 },
      { header: "Telepon Anak", key: "childrenPhone", width: 20 },
      { header: "Dibuat Pada", key: "createdAt", width: 20 },
      { header: "Diperbarui Pada", key: "updatedAt", width: 20 },
      { header: "Dibuat Oleh", key: "createdBy", width: 15 },
      { header: "Diedit Oleh", key: "editedBy", width: 15 },
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
    exportData.forEach((child) => {
      const father = child.isFatherAlive;
      const mother = child.isMotherAlive;
      let yatimStatus = "Tidak";
      if (!father && mother) yatimStatus = "Yatim";
      else if (father && !mother) yatimStatus = "Piatu";
      else if (!father && !mother) yatimStatus = "Yatim Piatu";

      dataRows.push({
        id: child.id,
        childrenPict: child.childrenPict || "-",
        childrenName: child.childrenName || "-",
        nik: child.nik || "-",
        index: child.index ? `${child.index}` : "-",
        childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
        childrenBirthdate: child.childrenBirthdate ? formatDate(child.childrenBirthdate) : "-",
        age: child.age ? `${child.age} Tahun` : "-",
        educationLevel: child.educationLevel || "-",
        educationGrade: child.educationGrade || "-",
        schoolName: child.schoolName || "-",
        childrenJob: child.childrenJob || "-",
        parentName: `${child.homes?.employees?.employeeName || "-"} - ${child.homes?.partners?.partnerName || "-"}`,
        waliName: child.homes?.wali?.waliName || "-",
        yatimStatus: yatimStatus,
        regionName: child.homes?.employees?.regions?.regionName || child.homes?.regions?.regionName || "-",
        isActive: child.isActive ? "Aktif" : "Tidak Aktif",
        isCondition: child.isCondition ? "Normal" : "ABK",
        notes: child.notes || "-",
        childrenAddress: child.childrenAddress || "-",
        childrenPhone: child.childrenPhone || "-",
        createdAt: child.createdAt ? formatDate(child.createdAt) : "-",
        updatedAt: child.updatedAt ? formatDate(child.updatedAt) : "-",
        createdBy: (child as any)?.createdByStaffName || child.createdBy || "-",
        editedBy: (child as any)?.editedByStaffName || child.editedBy || "-",
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

    saveAs(blob, "data-anak-asuh.xlsx");

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

export default function ChildrenTable() {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<Children[]>([]);
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
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

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
      
      const response = await getChildrenOptimized(page, pageSize, search);
      
      setData(response.data);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching children data:", err);
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
  // EXPORT FILTER HANDLERS
  // ==========================
  const handleExportWithFilters = async () => {
    try {
      const values = await exportForm.validateFields();
      const exportFilters: ChildrenFilters = {};
      
      if (values.educationLevel) exportFilters.educationLevel = values.educationLevel;
      if (values.yatimStatus) exportFilters.yatimStatus = values.yatimStatus;
      if (values.regionId) exportFilters.regionId = values.regionId;
      if (values.isActive !== undefined) exportFilters.isActive = values.isActive;
      if (values.isCondition !== undefined) exportFilters.isCondition = values.isCondition;
      if (values.ageSort) exportFilters.ageSort = values.ageSort;
      
      setExportModalVisible(false);
      await exportChildrenToExcel(exportFilters, setShowProgress, setProgress);
    } catch (error) {
      console.error("Export validation failed:", error);
    }
  };

  // ==========================
  // DELETE HANDLER
  // ==========================
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    try {
      await deleteChildren(deleteId);
      
      // Refresh current page
      await fetchData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Anak asuh berhasil dihapus",
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
  const handleExportClick = () => {
    exportForm.resetFields();
    setExportModalVisible(true);
  };

  // Generate columns with regions
  const columns = getChildrenColumns(regions);

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
        <p>Apakah Anda yakin ingin menghapus data anak asuh ini?</p>
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
            Jumlah Data Anak Asuh: {total}
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
            onClick={handleExportClick}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <DownloadOutlined className="mr-2" />
            Export Excel
          </Button>
          <Link href="/children/create">
            <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <PlusOutlined />
            </Button>
          </Link>
        </div>
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
      />

      {/* EXPORT FILTER MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FilterOutlined />
            <span>Filter Export Excel</span>
          </div>
        }
        open={exportModalVisible}
        onOk={handleExportWithFilters}
        onCancel={() => setExportModalVisible(false)}
        okText="Export"
        cancelText="Batal"
        width={600}
      >
        <Form form={exportForm} layout="vertical">
          <Form.Item name="educationLevel" label="Jenjang Pendidikan">
            <Select
              placeholder="Pilih Jenjang Pendidikan"
              allowClear
              options={[
                { label: 'TK', value: 'TK' },
                { label: 'SD/Sederajat', value: 'SD/Sederajat' },
                { label: 'SMP/Sederajat', value: 'SMP/Sederajat' },
                { label: 'SMA/Sederajat', value: 'SMA/Sederajat' },
                { label: 'Diploma', value: 'Diploma' },
                { label: 'Sarjana', value: 'Sarjana' },
                { label: 'Magister', value: 'Magister' },
                { label: 'Doktor', value: 'Doktor' },
              ]}
            />
          </Form.Item>

          <Form.Item name="yatimStatus" label="Yatim/Piatu">
            <Select
              placeholder="Pilih Status Yatim/Piatu"
              allowClear
              options={[
                { label: 'Yatim', value: 'yatim' },
                { label: 'Piatu', value: 'piatu' },
                { label: 'Yatim Piatu', value: 'yatim-piatu' },
              ]}
            />
          </Form.Item>

          <Form.Item name="regionId" label="Wilayah">
            <Select
              placeholder="Pilih Wilayah"
              allowClear
              options={regions.map(r => ({ label: r.regionName, value: r.regionId }))}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Status">
            <Select
              placeholder="Pilih Status"
              allowClear
              options={[
                { label: 'Aktif', value: true },
                { label: 'Tidak Aktif', value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="isCondition" label="Kondisi">
            <Select
              placeholder="Pilih Kondisi"
              allowClear
              options={[
                { label: 'Normal', value: true },
                { label: 'ABK', value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="ageSort" label="Urutkan Usia">
            <Select
              placeholder="Pilih Urutan"
              allowClear
              options={[
                { label: 'Termuda', value: 'asc' },
                { label: 'Tertua', value: 'desc' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
