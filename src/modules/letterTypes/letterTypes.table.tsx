"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input } from "antd";
import UIButton from "@/components/ui/button/Button";
import { Button as AntButton } from "antd";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { LetterType } from "@/types/models/letterType";
import { getLetterTypes, deleteLetterType } from "@/utils/services/letterType.service";
import { getLetterTypeColumns } from "./letterTypes.columns";

export default function LetterTypesTable() {
  const { data: session } = useSession();
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
      router.push(`/letters/types?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<LetterType[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLetterTypes();
      setAllData(result);
    } catch (err) {
      notifyFromResult(notify, { error: err });
      setAllData([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const data = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter(
      (lt) =>
        lt.jenisSurat.toLowerCase().includes(q) ||
        lt.kodeSurat1.toLowerCase().includes(q) ||
        (lt.kodeSurat2 ?? "").toLowerCase().includes(q) ||
        (lt.perihal ?? "").toLowerCase().includes(q),
    );
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

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
    [router, session?.user?.role, openDeleteModal],
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="lettertypes-search-wrap w-full max-w-[340px]">
          <style>{`
            .lettertypes-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .lettertypes-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .lettertypes-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari jenis surat, kode, tahun..."
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
        <AntButton type="primary" onClick={() => router.push("/letters/types/create")}>
          +
        </AntButton>
      </div>

      <Table
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data.length,
          showSizeChanger: false,
          showTotal: (t) => `Total ${t} data`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content" }}
        size="small"
      />
    </>
  );
}
