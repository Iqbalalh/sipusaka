"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Table, Modal, Input, Spin, Button } from "antd";
import { LoadingOutlined, SearchOutlined, PlusOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { LetterType } from "@/types/models/letterType";
import { getLetterTypes, deleteLetterType } from "@/utils/services/letterType.service";
import { getLetterTypeColumns } from "./letterTypes.columns";

export default function LetterTypesTable() {
  const { data: session } = useSession();
  const { notify } = useNotify();
  const router = useRouter();

  const [data, setData] = useState<LetterType[]>([]);
  const [filteredData, setFilteredData] = useState<LetterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLetterTypes();
      setData(result);
      setFilteredData(result);
    } catch (err) {
      notifyFromResult(notify, { error: err });
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredData(data);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredData(
      data.filter(
        (lt) =>
          lt.jenisSurat.toLowerCase().includes(q) ||
          lt.kodeSurat1.toLowerCase().includes(q) ||
          (lt.kodeSurat2 ?? "").toLowerCase().includes(q) ||
          (lt.perihal ?? "").toLowerCase().includes(q)
      )
    );
  }, [searchQuery, data]);

  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await deleteLetterType(deleteId);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Gagal menghapus Template Surat");
      }
      await fetchData();
      setIsDeleteModalOpen(false);
      notifyFromResult(notify, { successMessage: "Template Surat berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => getLetterTypeColumns(router, session?.user?.role, openDeleteModal),
    [router, session?.user?.role, openDeleteModal]
  );

  return (
    <>
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
        <p>Apakah Anda yakin ingin menghapus Template Surat ini?</p>
        <p className="text-sm text-gray-500 mt-1">
          Template Surat tidak dapat dihapus jika sudah digunakan oleh surat yang ada.
        </p>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            Total: {filteredData.length}
            {filteredData.length < data.length && (
              <span className="text-xs font-normal text-gray-500 ml-1">(difilter dari {data.length})</span>
            )}
          </h3>
          <Input
            placeholder="Cari jenis surat, kode, tahun..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 280 }}
          />
        </div>
        {session?.user?.role !== "staff" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/letters/types/create")}
          >
            Tambah Template Surat
          </Button>
        )}
      </div>

      <Table
        columns={columns as any}
        dataSource={filteredData}
        rowKey="id"
        bordered
        loading={{
          spinning: loading,
          indicator: <Spin indicator={<LoadingOutlined spin />} size="large" />,
        }}
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 20, showTotal: (tot) => `Total ${tot} data`, showSizeChanger: false }}
        size="small"
      />
    </>
  );
}
