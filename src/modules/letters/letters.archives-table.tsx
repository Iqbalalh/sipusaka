"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Input } from "antd";
import { Button as AntButton } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import Link from "next/link";
import { Letter } from "@/types/models/letter";
import { getLetters } from "@/utils/services/letter.service";
import { getArchiveColumns } from "./letters.columns";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

const STATUS_FILTER_KEY = "status";

export default function ArchivesTable() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";
  const urlFilters: Record<string, string[]> = useMemo(() => {
    try {
      return JSON.parse(searchParams.get("filters") || "{}");
    } catch {
      return {};
    }
  }, [searchParams]);

  const pushParams = useCallback(
    (updates: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`/letters/archives?${params.toString()}`, { scroll: false });
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
    getLetters()
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
        l.subject?.toLowerCase().includes(q) ||
        l.destination?.toLowerCase().includes(q),
    );
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleTableChange: TableProps<Letter>["onChange"] = useCallback(
    (_pagination: any, filters: Record<string, any>) => {
      const statusVals = filters[STATUS_FILTER_KEY];
      const cleaned: Record<string, string[]> = {};
      if (statusVals && statusVals.length > 0) cleaned[STATUS_FILTER_KEY] = statusVals.map(String);
      const next = JSON.stringify(cleaned);
      const current = JSON.stringify(urlFilters);
      if (next !== current) {
        pushParams({ filters: Object.keys(cleaned).length > 0 ? next : "", page: "1" });
      }
    },
    [urlFilters, pushParams],
  );

  const baseColumns = useMemo(() => getArchiveColumns(), []);

  const columnsWithState = useMemo(
    () =>
      baseColumns.map((col) =>
        col.key === STATUS_FILTER_KEY
          ? { ...col, filteredValue: urlFilters[STATUS_FILTER_KEY] ?? null }
          : col,
      ),
    [baseColumns, urlFilters],
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="archives-search-wrap w-full max-w-[340px]">
          <style>{`
            .archives-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .archives-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .archives-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari jenis surat, nomor, perihal, tujuan..."
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
        {isAdmin && (
          <Link href="/letters/archives/upload">
            <AntButton icon={<UploadOutlined />}>Upload Arsip</AntButton>
          </Link>
        )}
      </div>

      <Table
        columns={columnsWithState}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total: data.length,
          showSizeChanger: false,
          showTotal: (t) => `Arsip Surat: ${t}`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content" }}
      />
    </>
  );
}
