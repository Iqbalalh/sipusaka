"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Progress, Skeleton } from "antd";
import { Button as AntButton } from "antd";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { FaStore, FaDollarSign, FaBoxOpen, FaLayerGroup } from "react-icons/fa6";
import type { TableProps } from "antd";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";

import { UmkmVisit } from "@/utils/services/umkmvisit.service";
import { getUmkmVisits, deleteUmkmVisit } from "@/utils/services/umkmvisit.service";
import { getUmkmVisitColumns } from "./umkmvisit.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// CLIENT-SIDE FILTER KEYS (kept in URL for bookmark/share)
// ==============================================
const CLIENT_FILTER_KEYS = ["assistanceType", "assistanceSource"] as const;

// ==============================================
// FORMAT CURRENCY
// ==============================================
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

// ==============================================
// INSIGHT PANEL
// ==============================================
function UmkmVisitInsightPanel({
  data,
  loading,
}: {
  data: UmkmVisit[];
  loading: boolean;
}) {
  if (loading && data.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/3"
          >
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  const totalNilai = data.reduce((s, r) => s + (r.value ?? 0), 0);
  const uniqueSumber = new Set(data.map((r) => r.assistanceSource).filter(Boolean)).size;
  const uniqueUmkm = new Set(data.map((r) => r.umkmId)).size;

  const tiles = [
    {
      icon: <FaStore />,
      label: "Total Kunjungan",
      value: data.length,
      sub: "kunjungan tampil",
      color: "bg-rose-500",
    },
    {
      icon: <FaDollarSign />,
      label: "Total Nilai",
      value: fmt(totalNilai),
      sub: "seluruh bantuan",
      color: "bg-emerald-500",
    },
    {
      icon: <FaLayerGroup />,
      label: "Sumber Dana",
      value: uniqueSumber,
      sub: "sumber unik",
      color: "bg-blue-500",
    },
    {
      icon: <FaBoxOpen />,
      label: "UMKM Unik",
      value: uniqueUmkm,
      sub: "UMKM penerima",
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/3"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm shadow ${t.color}`}
          >
            {t.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">
              {t.label}
            </p>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">{t.value}</p>
            <p className="text-[10px] text-gray-400 truncate">{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================================
// EXCEL EXPORT
// ==============================================
const exportUmkmVisitToExcel = async (
  filteredData: UmkmVisit[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void,
) => {
  try {
    setShowProgress(true);
    setProgress(10);
    if (!filteredData || filteredData.length === 0) {
      setShowProgress(false);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Bantuan UMKM", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Kunjungan ke-", key: "visitNumber", width: 15 },
      { header: "Nama UMKM", key: "businessName", width: 25 },
      { header: "Pemilik", key: "ownerName", width: 25 },
      { header: "Tanggal Bantuan", key: "assistanceDate", width: 20 },
      { header: "Jenis Bantuan", key: "assistanceType", width: 20 },
      { header: "Jenis Barang", key: "itemType", width: 20 },
      { header: "Jumlah Barang", key: "assistanceAmount", width: 15 },
      { header: "Sumber Dana", key: "assistanceSource", width: 20 },
      { header: "Nilai (Rp)", key: "value", width: 20 },
      { header: "Catatan", key: "notes", width: 30 },
      { header: "Jumlah Dokumen", key: "docCount", width: 15 },
      { header: "Dibuat Pada", key: "createdAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    setProgress(50);

    filteredData.forEach((record, index) => {
      const excelRow = worksheet.addRow({
        id: record.id,
        visitNumber: record.visitNumber || "-",
        businessName: record.umkm?.businessName || "-",
        ownerName: record.umkm?.ownerName || "-",
        assistanceDate: record.assistanceDate ? formatDate(record.assistanceDate) : "-",
        assistanceType: record.assistanceType || "-",
        itemType: record.itemType || "-",
        assistanceAmount: record.assistanceAmount
          ? record.assistanceAmount.toLocaleString("id-ID")
          : "-",
        assistanceSource: record.assistanceSource || "-",
        value: record.value ? `Rp ${record.value.toLocaleString("id-ID")}` : "-",
        notes: record.notes || "-",
        docCount: record.umkmVisitDocs?.length || 0,
        createdAt: record.createdAt ? formatDate(record.createdAt) : "-",
      });
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      if (filteredData.length > 10 && index % Math.floor(filteredData.length / 10) === 0) {
        setProgress(50 + Math.floor((index / filteredData.length) * 40));
      }
    });

    setProgress(90);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "data-bantuan-umkm.xlsx",
    );
    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
  }
};

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function UmkmVisitTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

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
      router.push(`/umkmvisit?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [allData, setAllData] = useState<UmkmVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
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
    getUmkmVisits()
      .then((res) => setAllData(Array.isArray(res) ? res : []))
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setAllData([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter by URL search term
  const searchedData = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter(
      (r) =>
        r.umkm?.businessName?.toLowerCase().includes(q) ||
        r.umkm?.ownerName?.toLowerCase().includes(q) ||
        r.assistanceType?.toLowerCase().includes(q) ||
        r.assistanceSource?.toLowerCase().includes(q),
    );
  }, [allData, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleTableChange: TableProps<UmkmVisit>["onChange"] = useCallback(
    (_pagination: any, filters: Record<string, any>) => {
      const cleaned: Record<string, string[]> = {};
      CLIENT_FILTER_KEYS.forEach((key) => {
        const vals = filters[key];
        if (vals && vals.length > 0) cleaned[key] = vals.map(String);
      });
      const next = JSON.stringify(cleaned);
      const current = JSON.stringify(urlFilters);
      if (next !== current) {
        pushParams({ filters: Object.keys(cleaned).length > 0 ? next : "", page: "1" });
      }
    },
    [urlFilters, pushParams],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteUmkmVisit(deleteId);
      setIsDeleteModalOpen(false);
      getUmkmVisits()
        .then((res) => setAllData(Array.isArray(res) ? res : []))
        .catch(() => {});
      notifyFromResult(notify, { successMessage: "Bantuan UMKM berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, notify]);

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      await exportUmkmVisitToExcel(searchedData, setShowProgress, setProgress);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, searchedData]);

  // Dynamic filter options derived from allData
  const assistanceSources = useMemo(
    () =>
      [...new Set(allData.map((r) => r.assistanceSource).filter(Boolean) as string[])].sort(),
    [allData],
  );
  const assistanceTypes = useMemo(
    () => [...new Set(allData.map((r) => r.assistanceType).filter(Boolean) as string[])].sort(),
    [allData],
  );
  const visitCountMap = useMemo(() => {
    const map = new Map<number, number>();
    allData.forEach((r) => {
      map.set(r.umkmId, (map.get(r.umkmId) ?? 0) + 1);
    });
    return map;
  }, [allData]);

  const baseColumns = useMemo(
    () =>
      getUmkmVisitColumns(
        session?.user?.role,
        assistanceSources,
        assistanceTypes,
        visitCountMap,
        isAdmin
          ? (id) => {
              setDeleteId(id);
              setIsDeleteModalOpen(true);
            }
          : undefined,
      ),
    [session?.user?.role, assistanceSources, assistanceTypes, visitCountMap, isAdmin],
  );

  const columnsWithState = useMemo(
    () =>
      baseColumns.map((col) => {
        const key = col.key as string;
        if (CLIENT_FILTER_KEYS.includes(key as any)) {
          return { ...col, filteredValue: urlFilters[key] ?? null };
        }
        if ((col as any).filters !== undefined || (col as any).filterDropdown !== undefined) {
          return { ...col, filteredValue: null };
        }
        return col;
      }),
    [baseColumns, urlFilters],
  );

  return (
    <>
      {/* INSIGHT PANEL */}
      <UmkmVisitInsightPanel data={searchedData} loading={loading} />

      {/* DELETE MODAL */}
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
        <p>Apakah Anda yakin ingin menghapus bantuan UMKM ini?</p>
      </Modal>

      {/* EXPORT PROGRESS */}
      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sedang mengekspor data...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="umkmvisit-search-wrap w-full max-w-[360px]">
          <style>{`
            .umkmvisit-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .umkmvisit-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .umkmvisit-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari nama UMKM, pemilik, jenis bantuan..."
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
            disabled={searchedData.length === 0}
          >
            Export ({searchedData.length})
          </AntButton>
          {isAdmin && (
            <Link href="/umkmvisit/create">
              <AntButton type="primary" icon={<PlusOutlined />} />
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columnsWithState}
        dataSource={searchedData}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 50,
          total: searchedData.length,
          showSizeChanger: false,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content", y: 500 }}
      />
    </>
  );
}
