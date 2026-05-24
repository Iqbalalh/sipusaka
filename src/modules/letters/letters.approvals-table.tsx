"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Input } from "antd";
import { Button as AntButton } from "antd";
import { Letter } from "@/types/models/letter";
import { getPendingLetters } from "@/utils/services/letter.service";
import { getApprovalColumns } from "./letters.columns";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

export default function ApprovalsTable() {
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
      router.push(`/letters/approvals?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    setLoading(true);
    getPendingLetters()
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

  const columns = useMemo(() => getApprovalColumns(), []);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="approvals-search-wrap w-full max-w-[340px]">
          <style>{`
            .approvals-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .approvals-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .approvals-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
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
          showTotal: (t) => `Surat Menunggu Persetujuan: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
