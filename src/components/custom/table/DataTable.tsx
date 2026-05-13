"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";

// Components
import { Table, Modal, Input, Skeleton } from "antd";
import Button from "@/components/ui/button/Button";

// Icons
import { SearchOutlined } from "@ant-design/icons";

// Types
import type { ColumnsType } from "antd/es/table";

// Utils
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

// ==============================================
// TYPES
// ==============================================
export interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedDataResponse<T> {
  data: T[];
  pagination: PaginationResponse;
}

export interface DataTableProps<T> {
  // Data fetching - can be either simple array or paginated response
  fetchData?: () => Promise<T[]>;
  fetchPaginatedData?: (page: number, pageSize: number, search?: string) => Promise<PaginatedDataResponse<T>>;
  deleteItem?: (id: number) => Promise<void>;

  // Table configuration
  columns: ColumnsType<T>;
  rowKey: keyof T | ((record: T) => string);

  // Export configuration
  exportConfig?: {
    filename: string;
    sheetName: string;
  };
  onExport?: (filteredData: T[]) => void | Promise<void>;

  // UI configuration
  title?: string;
  createPath?: string;
  pageSize?: number;
  scrollY?: number;
  showSearch?: boolean;

  // Server-side pagination
  serverSidePagination?: boolean;

  // Custom actions
  renderActions?: (
    record: T,
    openDeleteModal: (id: number) => void
  ) => React.ReactNode;

  // Extra header actions (rendered on the right side of the header)
  headerActions?: React.ReactNode;

  // Callback fired whenever the effectively-visible rows change (search + column filters)
  onFilteredDataChange?: (data: T[]) => void;

  // Delete configuration
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  deleteSuccessMessage?: string;
}

// ==============================================
// GENERIC DATA TABLE COMPONENT
// ==============================================
export default function DataTable<T extends Record<string, any>>({
  fetchData,
  fetchPaginatedData,
  deleteItem,
  columns,
  rowKey,
  exportConfig,
  onExport,
  onFilteredDataChange,
  title,
  createPath,
  pageSize = 50,
  scrollY = 500,
  showSearch = true,
  serverSidePagination = false,
  renderActions,
  headerActions,
  deleteConfirmTitle = "Konfirmasi Hapus",
  deleteConfirmMessage = "Apakah Anda yakin ingin menghapus data ini?",
  deleteSuccessMessage = "Data berhasil dihapus",
}: DataTableProps<T>) {
  // Data State
  const [data, setData] = useState<T[]>([]);
  const [currentData, setCurrentData] = useState<T[]>([]);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  
  // Page State
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs to store functions and values to avoid recreation
  const hasLoaded = useRef(false);
  const fetchDataRef = useRef(fetchData);
  const fetchPaginatedDataRef = useRef(fetchPaginatedData);
  const notifyRef = useRef(notify);
  const pageSizeRef = useRef(pageSize);
  const serverSidePaginationRef = useRef(serverSidePagination);
  const onFilteredDataChangeRef = useRef(onFilteredDataChange);

  // Update refs when props change
  useEffect(() => {
    fetchDataRef.current = fetchData;
    fetchPaginatedDataRef.current = fetchPaginatedData;
    notifyRef.current = notify;
    pageSizeRef.current = pageSize;
    serverSidePaginationRef.current = serverSidePagination;
    onFilteredDataChangeRef.current = onFilteredDataChange;
  }, [fetchData, fetchPaginatedData, notify, pageSize, serverSidePagination, onFilteredDataChange]);

  // ==========================
  // FETCH DATA FUNCTION
  // ==========================
  const loadData = useCallback(async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      
      if (serverSidePaginationRef.current && fetchPaginatedDataRef.current) {
        // Server-side pagination
        const response = await fetchPaginatedDataRef.current(page, pageSizeRef.current, search);
        setData(response.data);
        setFilteredData(response.data);
        setCount(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        setCurrentPage(response.pagination.page);
      } else if (fetchDataRef.current) {
        // Client-side pagination
        const result = await fetchDataRef.current();
        setData(result);
        setFilteredData(result);
        setCurrentData(result);
        setCount(result.length);
        setTotalPages(Math.ceil(result.length / pageSizeRef.current));
        onFilteredDataChangeRef.current?.(result);
      }
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
      setData([]);
      setFilteredData([]);
      setCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - uses refs internally

  // ==========================
  // INITIAL LOAD
  // ==========================
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadData(1, "");
    }
  }, []); // Only run once on mount

  // ==========================
  // SEARCH FILTER
  // ==========================
  useEffect(() => {
    if (serverSidePaginationRef.current) {
      // Server-side search with debounce
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
      
      const timer = setTimeout(() => {
        loadData(1, searchQuery);
      }, 500);
      
      setSearchTimer(timer);
      
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    } else {
      // Client-side search
      if (!searchQuery.trim()) {
        setFilteredData(data);
        setCurrentData(data);
        setCount(data.length);
        setTotalPages(Math.ceil(data.length / pageSizeRef.current));
        onFilteredDataChangeRef.current?.(data);
        return;
      }

      const query = searchQuery.toLowerCase();
      const SKIP_KEYS = new Set([
        // Audit fields
        "createdBy", "editedBy", "created_by", "edited_by",
        "createdByStaffName", "editedByStaffName", "createdAt", "updatedAt",
        // Region / wilayah
        "regionId", "regionName",
        // Status / boolean
        "isActive", "isAlive", "isUmkm",
        // Photos / media
        "staffPict", "staffPictKey", "signaturePath", "parafPath",
        "employeePict", "partnerPict",
        "umkmPict", "umkmPict2", "umkmPict3", "umkmPict4", "umkmPict5",
        // Numeric IDs
        "id", "userId", "staffId", "partnerId", "waliId", "childrenId",
        "employeeId", "roleId", "homeId", "regionId",
        // Category / gender / type
        "gender", "type", "role",
        // Dates
        "birthdate", "assistanceDate",
        // Location
        "address", "businessAddress", "postalCode", "homeCoordinate", "umkmCoordinate",
        // Numeric values
        "assistanceNumber", "assistanceAmount", "age",
      ]);
      const matchesQuery = (value: unknown, key?: string): boolean => {
        if (key && SKIP_KEYS.has(key)) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === "object")
          return Object.entries(value as Record<string, unknown>).some(([k, v]) =>
            matchesQuery(v, k)
          );
        if (typeof value === "boolean" || typeof value === "number") return false;
        return String(value).toLowerCase().includes(query);
      };
      const filtered = data.filter((record) => matchesQuery(record));

      setFilteredData(filtered);
      setCurrentData(filtered);
      setCount(filtered.length);
      setTotalPages(Math.ceil(filtered.length / pageSizeRef.current));
      onFilteredDataChangeRef.current?.(filtered);
    }
  }, [searchQuery, data, loadData]); // Removed searchTimer from deps

  // ==========================
  // DELETE HANDLER
  // ==========================
  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId || !deleteItem) return;

    setDeleteLoading(true);
    try {
      await deleteItem(deleteId);
      
      // Reload data
      await loadData(currentPage, searchQuery);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: deleteSuccessMessage,
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, deleteItem, loadData, currentPage, searchQuery, notify, deleteSuccessMessage]);

  // ==========================
  // EXPORT TO EXCEL
  // ==========================
  const handleExportExcel = useCallback(async () => {
    if (!exportConfig || isExporting) return;
    setIsExporting(true);
    try {
      const dataToExport = currentData.length ? currentData : filteredData;
      if (onExport) {
        await onExport(dataToExport);
      } else {
        exportTableToExcel<T>({
          data: dataToExport,
          columns,
          filename: exportConfig.filename,
          sheetName: exportConfig.sheetName,
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [currentData, filteredData, columns, exportConfig, onExport, isExporting]);

  // ==========================
  // ENHANCE COLUMNS WITH DELETE MODAL
  // ==========================
  const enhancedColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.key === "actions" && col.render) {
        const originalRender = col.render;
        return {
          ...col,
          render: (_: any, record: T, index: number) => {
            // Call the original render with openDeleteModal as a fourth parameter
            // We use a workaround by attaching it to the record temporarily
            const recordWithDeleteHandler = {
              ...record,
              _openDeleteModal: openDeleteModal,
            };
            return originalRender(_, recordWithDeleteHandler as T, index);
          },
        };
      }
      return col;
    });
  }, [columns, openDeleteModal]);

  // ==========================
  // SKELETON TABLE
  // ==========================
  const skeletonCols = [160, 120, 100, 130, 90, 110];
  const skeletonRowWidths = [
    [140, 100, 80, 110, 70, 90],
    [120, 90, 100, 100, 85, 105],
    [150, 110, 70, 120, 60, 95],
    [130, 95, 90, 105, 75, 100],
    [145, 105, 85, 115, 65, 85],
    [125, 85, 95, 125, 80, 110],
    [155, 115, 75, 95, 90, 80],
    [135, 100, 88, 108, 72, 92],
  ];
  if (loading && data.length === 0) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <Skeleton.Input active size="small" style={{ width: 180 }} />
            {showSearch && <Skeleton.Input active size="default" style={{ width: 260 }} />}
          </div>
          <div className="flex gap-2">
            {exportConfig && <Skeleton.Button active size="default" style={{ width: 110 }} />}
            {createPath && <Skeleton.Button active size="default" style={{ width: 40 }} />}
          </div>
        </div>
        {/* Table skeleton */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex gap-6 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {skeletonCols.map((w, i) => (
              <Skeleton.Input key={i} active size="small" style={{ width: w, minWidth: w }} />
            ))}
          </div>
          {skeletonRowWidths.map((rowWidths, row) => (
            <div
              key={row}
              className={`flex gap-6 px-4 py-3 border-t border-gray-100 dark:border-gray-700 ${
                row % 2 === 1 ? "bg-gray-50/60 dark:bg-gray-800/30" : "bg-white dark:bg-transparent"
              }`}
            >
              {rowWidths.map((w, col) => (
                <Skeleton.Input key={col} active size="small" style={{ width: w, minWidth: 40 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <div>
      {/* DELETE MODAL */}
      {deleteItem && (
        <Modal
          title={deleteConfirmTitle}
          open={isDeleteModalOpen}
          onOk={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          cancelText="Batal"
          okText={deleteLoading ? "Menghapus..." : "Hapus"}
          okButtonProps={{ danger: true, loading: deleteLoading }}
        >
          <p>{deleteConfirmMessage}</p>
        </Modal>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="block">
          {title && (
            <h3 className="text-base mb-2 font-medium text-gray-800 dark:text-white/90">
              {title}: {count}
            </h3>
          )}
          {showSearch && (
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
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}

          {exportConfig && (
            <Button size="sm" onClick={handleExportExcel} disabled={isExporting}>
              {isExporting ? "Mengekspor..." : "Export Excel"}
            </Button>
          )}

          {headerActions}

          {createPath && (
            <Link href={createPath}>
              <Button
                onClick={() => setLoading(true)}
                disabled={loading}
                size="sm"
              >
                +
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={enhancedColumns}
        dataSource={filteredData}
        rowKey={rowKey}
        bordered
        pagination={
          serverSidePagination
            ? {
                pageSize,
                current: currentPage,
                total: count,
                showSizeChanger: false,
                onChange: (page) => loadData(page, searchQuery),
              }
            : {
                pageSize,
                showSizeChanger: false,
              }
        }
        scroll={{ x: "max-content", y: scrollY }}
        onChange={(_, __, ___, extra) => {
          const current = extra.currentDataSource as T[];
          setCurrentData(current);
          onFilteredDataChangeRef.current?.(current);
          if (!serverSidePagination) {
            setCount(current.length);
          }
        }}
      />
    </div>
  );
}
