"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input } from "antd";
import { Button as AntButton } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";

import { User } from "@/utils/services/user.service";
import { deleteUser, getUsers } from "@/utils/services/user.service";
import { getUserColumns } from "./user.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function UserTable() {
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
      router.push(`/users?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<User[]>([]);
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
    getUsers()
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
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.staffName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q),
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
      await deleteUser(deleteId);
      setIsDeleteModalOpen(false);
      getUsers()
        .then((res) => setAllData(Array.isArray(res) ? res : []))
        .catch(() => {});
      notifyFromResult(notify, { successMessage: "User berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, notify]);

  const columns = useMemo(
    () =>
      getUserColumns((id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
      }),
    [],
  );

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      await exportTableToExcel({
        data,
        columns: columns as any,
        filename: "data-user",
        sheetName: "User",
      });
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
        <p>Apakah Anda yakin ingin menghapus user ini?</p>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="user-search-wrap w-full max-w-[340px]">
          <style>{`
            .user-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .user-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .user-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari username, nama, email, role..."
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
          <Link href="/users/create">
            <AntButton type="primary">+</AntButton>
          </Link>
        </div>
      </div>

      <Table
        columns={columns as any}
        dataSource={data}
        rowKey="userId"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 50,
          total: data.length,
          showSizeChanger: false,
          showTotal: (t) => `Jumlah Data: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content", y: 500 }}
      />
    </>
  );
}
