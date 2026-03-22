"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Spin, Modal, Input } from "antd";
import { LoadingOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

// Types
import { Letter } from "@/utils/services/letter.service";

// Utils
import {
  getPendingLetters,
  approveLetter,
  rejectLetter,
} from "@/utils/services/letter.service";
import { getPendingLetterColumns } from "./letters.columns";

export default function PendingLettersTable() {
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

  // Modal States
  const [approveId, setApproveId] = useState<number | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ==========================
  // FETCH DATA WITH PAGINATION
  // ==========================
  const fetchData = useCallback(async (page: number) => {
    try {
      setLoading(true);
      
      const response = await getPendingLetters(page, pageSize);
      
      setData(response.data);
      setTotal(response.pagination.total);
      setCurrentPage(response.pagination.page);
    } catch (err) {
      console.error("Error fetching pending letters data:", err);
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
  // APPROVE HANDLER
  // ==========================
  const handleApprove = async () => {
    if (!approveId) return;

    setActionLoading(true);
    try {
      await approveLetter(approveId);
      
      // Refresh current page
      await fetchData(currentPage);

      setIsApproveModalOpen(false);
      notifyFromResult(notify, {
        successMessage: "Surat berhasil disetujui",
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================
  // REJECT HANDLER
  // ==========================
  const handleReject = async () => {
    if (!rejectId) return;

    setActionLoading(true);
    try {
      await rejectLetter(rejectId, rejectionReason);
      
      // Refresh current page
      await fetchData(currentPage);

      setIsRejectModalOpen(false);
      setRejectionReason("");
      notifyFromResult(notify, {
        successMessage: "Surat telah ditolak",
      });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate columns
  const columns = getPendingLetterColumns();

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
      {/* APPROVE MODAL */}
      <Modal
        title="Konfirmasi Persetujuan"
        open={isApproveModalOpen}
        onCancel={() => setIsApproveModalOpen(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setIsApproveModalOpen(false)} disabled={actionLoading}>
            Batal
          </Button>,
          <Button
            key="approve"
            variant="primary"
            onClick={handleApprove}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {actionLoading ? "Memproses..." : "Setujui"}
          </Button>,
        ]}
      >
        <p>Apakah Anda yakin ingin menyetujui surat ini?</p>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        title="Alasan Penolakan"
        open={isRejectModalOpen}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectionReason("");
        }}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => {
            setIsRejectModalOpen(false);
            setRejectionReason("");
          }} disabled={actionLoading}>
            Batal
          </Button>,
          <Button
            key="reject"
            variant="primary"
            onClick={handleReject}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {actionLoading ? "Memproses..." : "Tolak"}
          </Button>,
        ]}
      >
        <p className="mb-4">Berikan alasan penolakan:</p>
        <Input.TextArea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Masukkan alasan penolakan..."
          rows={4}
        />
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Surat Menunggu: {total}
          </h3>
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columns.map((col) => {
          if (col.key === "actions") {
            return {
              ...col,
              render: (_: any, record: Letter, index: number) => {
                // Inject modal functions
                const recordWithModal = {
                  ...record,
                  _openApproveModal: (id: number) => {
                    setApproveId(id);
                    setIsApproveModalOpen(true);
                  },
                  _openRejectModal: (id: number) => {
                    setRejectId(id);
                    setIsRejectModalOpen(true);
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
