"use client";

import { useState, useCallback, useEffect } from "react";
import { Table, Modal, message } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { FilterValue, SorterResult } from "antd/es/table/interface";
import { Letter } from "@/types/models/letter";
import { deleteLetter } from "@/utils/services/letter.service";

interface DataTableProps {
  columns: ColumnsType<Letter>;
  data: Letter[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Letter> | SorterResult<Letter>[]
  ) => void;
  onRefresh?: () => void;
}

export default function LettersTable({
  columns,
  data,
  loading = false,
  pagination,
  onChange,
  onRefresh,
}: DataTableProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inject delete modal function into data
  const enhancedData = data.map((item) => ({
    ...item,
    _openDeleteModal: (id: number) => {
      setSelectedId(id);
      setDeleteModalVisible(true);
    },
  }));

  const handleDelete = useCallback(async () => {
    if (!selectedId) return;

    setDeleting(true);
    try {
      await deleteLetter(selectedId);
      message.success("Surat berhasil dihapus");
      setDeleteModalVisible(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      message.error(error.message || "Gagal menghapus surat");
    } finally {
      setDeleting(false);
    }
  }, [selectedId, onRefresh]);

  return (
    <>
      <Table<Letter>
        columns={columns}
        dataSource={enhancedData}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={onChange}
        scroll={{ x: "max-content" }}
        bordered
        size="middle"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-red-500" />
            <span>Konfirmasi Hapus</span>
          </div>
        }
        open={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Hapus"
        cancelText="Batal"
        okButtonProps={{ loading: deleting, danger: true }}
      >
        <p>Apakah Anda yakin ingin menghapus surat ini?</p>
        <p className="text-gray-500 text-sm">Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </>
  );
}
