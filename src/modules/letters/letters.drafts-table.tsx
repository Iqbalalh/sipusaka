"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input } from "antd";
import { Button as AntButton } from "antd";
import Link from "next/link";
import { Letter } from "@/types/models/letter";
import { getDraftLetters, deleteLetter, submitLetter } from "@/utils/services/letter.service";
import { getDraftColumns } from "./letters.columns";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

export default function DraftsTable() {
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
      router.push(`/letters/drafts?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setLoading(true);
    getDraftLetters()
      .then((res) => setAllData(Array.isArray(res) ? res : []))
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setAllData([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  const data = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter(
      (l) =>
        l.letterType?.toLowerCase().includes(q) ||
        l.letterNumber?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q),
    );
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const openSubmitModal = useCallback((id: number) => {
    setSubmitId(id);
    setSubmitModalOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (submitId === null) return;
    setSubmitLoading(true);
    try {
      const res = await submitLetter(submitId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengajukan surat");
      }
      notify("success", "Surat berhasil diajukan untuk persetujuan!");
      setSubmitModalOpen(false);
      setRefreshCounter((c) => c + 1);
    } catch (err: any) {
      notify("error", err.message || "Gagal mengajukan surat");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteLetter(deleteId);
      setIsDeleteModalOpen(false);
      setRefreshCounter((c) => c + 1);
      notify("success", "Surat berhasil dihapus");
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () =>
      getDraftColumns(
        openSubmitModal,
        session?.user?.role,
        (id) => {
          setDeleteId(id);
          setIsDeleteModalOpen(true);
        },
      ),
    [openSubmitModal, session?.user?.role],
  );

  return (
    <>
      <Modal
        title="Ajukan Surat"
        open={submitModalOpen}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalOpen(false)}
        okText={submitLoading ? "Memproses..." : "Ajukan"}
        cancelText="Batal"
        confirmLoading={submitLoading}
      >
        <p>Apakah Anda yakin ingin mengajukan surat ini untuk persetujuan?</p>
      </Modal>

      <Modal
        title="Hapus Surat"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmLoading={deleteLoading}
        okText="Hapus"
        okButtonProps={{ danger: true }}
        cancelText="Batal"
        onOk={handleDelete}
      >
        <p>Apakah Anda yakin ingin menghapus surat ini?</p>
      </Modal>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="drafts-search-wrap w-full max-w-[340px]">
          <style>{`
            .drafts-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .drafts-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .drafts-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari jenis surat, nomor, perihal..."
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
        <Link href="/letters/drafts/create">
          <AntButton type="primary">+</AntButton>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data.length,
          showSizeChanger: false,
          showTotal: (t) => `Draft Surat: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
