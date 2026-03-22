"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input } from "antd";
import { LoadingOutlined, SearchOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { Letter } from "@/utils/services/letter.service";

// Utils
import {
  deleteLetter,
  getDraftLetters,
} from "@/utils/services/letter.service";
import { getDraftLetterColumns } from "./letters.columns";

export default function DraftLettersTable() {
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Data State
  const [data, setData] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
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
  const fetchData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      
      const response = await getDraftLetters(page, pageSize);
      
      setData(response.data);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching draft letters data:", err);
      notifyFromResult(notify, { error: err });
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [notify, pageSize]);

  // ==========================
  // INITIAL FETCH
  // ==========================
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    setCurrentPage(initialPage);
    fetchData(initialPage);
  }, []); // Only run once on mount

  // ==========================
  // FETCH ON PAGE CHANGE
  // ==========================
  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  // ==========================
  // UPDATE URL WITH PAGE PARAMETER
  // ==========================
  const updatePageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // ==========================
  // DELETE HANDLER
  // ==========================
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleteLoading(true);
    try {
      await deleteLetter(deleteId);
      
      // Refresh current page
      await fetchData(currentPage);

      setIsDeleteModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Surat berhasil dihapus",
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate columns
  const columns = getDraftLetterColumns();

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
        <p>Apakah Anda yakin ingin menghapus surat ini?</p>
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Draf: {total}
          </h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/letters/create">
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
              render: (_: any, record: Letter, index: number) => {
                // Inject delete modal function
                const recordWithModal = {
                  ...record,
                  _openDeleteModal: (id: number) => {
                    setDeleteId(id);
                    setIsDeleteModalOpen(true);
                  },
                };
                return col.render!(_, recordWithModal as any, index);
              },
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
            updatePageUrl(page);
            setCurrentPage(page);
          },
        }}
        scroll={{ x: "max-content", y: 500 }}
        loading={loading}
      />
    </>
  );
}
