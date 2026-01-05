"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";

// Components
import { Table, Flex, Spin, Modal, Input } from "antd";
import Button from "@/components/ui/button/Button";

// Icons
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";

// Types
import type { ColumnsType } from "antd/es/table";

// Utils
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

// ==============================================
// TYPES
// ==============================================
export interface DataTableProps<T> {
  // Data fetching
  fetchData: () => Promise<T[]>;
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

  // Custom actions
  renderActions?: (
    record: T,
    openDeleteModal: (id: number) => void
  ) => React.ReactNode;

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
  deleteItem,
  columns,
  rowKey,
  exportConfig,
  onExport,
  title,
  createPath,
  pageSize = 50,
  scrollY = 500,
  renderActions,
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

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const result = await fetchData();
        setData(result);
        setFilteredData(result);
        setCount(result.length);
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchData, notify]);

  // ==========================
  // SEARCH FILTER
  // ==========================
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      setCount(data.length);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = data.filter((record) => {
      return Object.entries(record).some(([key, value]) => {
        // Skip non-string values and null/undefined
        if (value === null || value === undefined) return false;

        // Check if value is a string or can be converted to string
        const strValue = String(value).toLowerCase();
        return strValue.includes(query);
      });
    });

    setFilteredData(filtered);
    setCount(filtered.length);
  }, [searchQuery, data]);

  // ==========================
  // DELETE HANDLER
  // ==========================
  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  // ==========================
  // EXPORT TO EXCEL
  // ==========================
  const handleExportExcel = useCallback(async () => {
    if (!exportConfig) return;

    // Use custom export function if provided
    if (onExport) {
      const dataToExport = currentData.length ? currentData : filteredData;
      await onExport(dataToExport);
      return;
    }

    // Use default export function
    exportTableToExcel<T>({
      data: currentData.length ? currentData : filteredData,
      columns,
      filename: exportConfig.filename,
      sheetName: exportConfig.sheetName,
    });
  }, [currentData, filteredData, columns, exportConfig, onExport]);

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

  const handleDelete = useCallback(async () => {
    if (!deleteId || !deleteItem) return;

    setDeleteLoading(true);
    try {
      await deleteItem(deleteId);
      const refreshed = await fetchData();
      setData(refreshed);
      setFilteredData(refreshed);
      setCount(refreshed.length);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: deleteSuccessMessage,
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, deleteItem, fetchData, notify, deleteSuccessMessage]);

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading) {
    return (
      <div className="flex justify-center items-center gap-4 h-40 text-gray-500">
        <Flex align="center" gap="middle">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
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
          {/* Search Input */}

          {exportConfig && (
            <Button size="sm" onClick={handleExportExcel}>
              Export Excel
            </Button>
          )}

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
        pagination={{ pageSize, showSizeChanger: false }}
        scroll={{ x: "max-content", y: scrollY }}
        onChange={(_, __, ___, extra) => {
          const current = extra.currentDataSource as T[];
          setCurrentData(current);
          setCount(current.length);
        }}
      />
    </div>
  );
}
