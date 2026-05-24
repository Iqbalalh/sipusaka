"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input } from "antd";
import { Button as AntButton } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";

import { Category } from "@/types/models/gallery";
import { getCategories, deleteCategory } from "@/utils/services/gallery.service";
import { getCategoryColumns } from "./categories.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function CategoriesTable() {
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
      router.push(`/categories?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setLoading(true);
    getCategories()
      .then((res) => setAllData(Array.isArray(res) ? res : []))
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setAllData([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q),
    );
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteCategory(deleteId);
      setIsDeleteModalOpen(false);
      getCategories()
        .then((res) => setAllData(Array.isArray(res) ? res : []))
        .catch(() => {});
      notifyFromResult(notify, { successMessage: "Kategori berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, notify]);

  const columns = useMemo(
    () =>
      getCategoryColumns(session?.user?.role, isAdmin ? (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
      } : undefined),
    [session?.user?.role, isAdmin],
  );

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      await exportTableToExcel({ data, columns: columns as any, filename: "data-kategori", sheetName: "Kategori" });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, data, columns]);

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
        <p>Apakah Anda yakin ingin menghapus kategori ini?</p>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="categories-search-wrap w-full max-w-[340px]">
          <style>{`
            .categories-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .categories-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .categories-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari nama kategori, slug..."
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
            <Link href="/categories/create">
              <AntButton type="primary">+</AntButton>
            </Link>
          )}
        </div>
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
          showTotal: (t) => `Jumlah Data: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content", y: 500 }}
        size="small"
      />
    </>
  );
}
