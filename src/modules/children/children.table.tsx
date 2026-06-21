"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Progress, Skeleton } from "antd";
import { Button as AntButton } from "antd";
import { DownloadOutlined, PlusOutlined } from "@ant-design/icons";
import { FaChild } from "react-icons/fa6";
import type { TableProps } from "antd";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";

import { Children, ChildrenFilters, ChildrenStats } from "@/utils/services/children.service";
import {
  deleteChildren,
  getChildrenForExport,
  getChildrenOptimized,
  getChildrenStats,
} from "@/utils/services/children.service";
import { Region } from "@/types/models/region";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrenColumns } from "./children.columns";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_DASHBOARD } from "@/constants/endpoint";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// SERVER FILTER KEYS
// These column keys map to ChildrenFilters fields
// ==============================================
const SERVER_FILTER_KEYS = ["lastEducationLevel", "yatimStatus", "regionId", "isActive", "isCondition", "childrenGender"] as const;

const toChildrenFilters = (raw: Record<string, string[]>): ChildrenFilters => ({
  educationLevel: raw["lastEducationLevel"]?.[0],
  yatimStatus: raw["yatimStatus"]?.[0],
  regionId: raw["regionId"]?.[0] ? Number(raw["regionId"][0]) : undefined,
  isActive: raw["isActive"]?.[0] !== undefined ? raw["isActive"][0] === "true" : undefined,
  isCondition: raw["isCondition"]?.[0] !== undefined ? raw["isCondition"][0] === "true" : undefined,
  gender: raw["childrenGender"]?.[0],
});

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
function ChildrenInsightPanel({
  stats,
  loading,
}: {
  stats: ChildrenStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="space-y-4 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-white/3 overflow-hidden">
              <div className="h-9 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4 space-y-3">
                {[0, 1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} active paragraph={false} title={{ width: "100%" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-white/3 overflow-hidden">
          <div className="h-9 bg-gray-200 dark:bg-gray-700" />
          <div className="p-4"><Skeleton active paragraph={false} title={{ width: "40%" }} /></div>
        </div>
      </div>
    );
  }

  type ClusterItem = { label: string; value: number | string; accent: string };
  const clusters: { title: string; headerColor: string; accentBg: string; accent: string; items: ClusterItem[]; dana: number; bantuanCount: number }[] = [
    {
      title: "Aktif",
      headerColor: "bg-emerald-500",
      accentBg: "bg-emerald-50 dark:bg-emerald-900/20",
      accent: "text-emerald-700 dark:text-emerald-400",
      dana: stats.totalDanaActive,
      bantuanCount: stats.totalBantuanActive,
      items: [
        { label: "Jumlah Data", value: stats.active, accent: "text-emerald-600 dark:text-emerald-400" },
        { label: "Yatim", value: stats.yatimActive, accent: "text-amber-600 dark:text-amber-400" },
        { label: "Piatu", value: stats.piatuActive, accent: "text-orange-600 dark:text-orange-400" },
        { label: "Yatim Piatu", value: stats.yatimPiatuActive, accent: "text-red-600 dark:text-red-400" },
        { label: "ABK", value: stats.abkActive, accent: "text-purple-600 dark:text-purple-400" },
      ],
    },
    {
      title: "Tidak Aktif",
      headerColor: "bg-gray-400",
      accentBg: "bg-gray-50 dark:bg-gray-800/50",
      accent: "text-gray-600 dark:text-gray-400",
      dana: stats.totalDanaInactive,
      bantuanCount: stats.totalBantuanInactive,
      items: [
        { label: "Jumlah Data", value: stats.inactive, accent: "text-gray-600 dark:text-gray-400" },
        { label: "Yatim", value: stats.yatimInactive, accent: "text-amber-600 dark:text-amber-400" },
        { label: "Piatu", value: stats.piatuInactive, accent: "text-orange-600 dark:text-orange-400" },
        { label: "Yatim Piatu", value: stats.yatimPiatuInactive, accent: "text-red-600 dark:text-red-400" },
        { label: "ABK", value: stats.abkInactive, accent: "text-purple-600 dark:text-purple-400" },
      ],
    },
    {
      title: "Total Keseluruhan",
      headerColor: "bg-blue-500",
      accentBg: "bg-blue-50 dark:bg-blue-900/20",
      accent: "text-blue-700 dark:text-blue-400",
      dana: stats.totalDana,
      bantuanCount: stats.totalBantuan,
      items: [
        { label: "Jumlah Data", value: stats.total, accent: "text-blue-600 dark:text-blue-400" },
        { label: "Yatim", value: stats.yatim, accent: "text-amber-600 dark:text-amber-400" },
        { label: "Piatu", value: stats.piatu, accent: "text-orange-600 dark:text-orange-400" },
        { label: "Yatim Piatu", value: stats.yatimPiatu, accent: "text-red-600 dark:text-red-400" },
        { label: "ABK", value: stats.abk, accent: "text-purple-600 dark:text-purple-400" },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {clusters.map((cluster) => (
          <div key={cluster.title} className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-white/3 overflow-hidden">
            <div className={`px-4 py-2 ${cluster.headerColor}`}>
              <p className="text-white font-semibold text-sm">{cluster.title}</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cluster.items.map((item) => (
                <div key={item.label} className={`flex items-center justify-between px-4 py-2.5 ${cluster.accentBg}`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                  <p className={`text-sm font-bold ${item.accent}`}>{item.value}</p>
                </div>
              ))}
              <div className={`flex items-center justify-between px-4 py-2.5 ${cluster.accentBg} border-t-2 border-gray-200 dark:border-gray-700`}>
                <div>
                  <p className={`text-xs font-semibold ${cluster.accent}`}>Dana Bantuan</p>
                  <p className="text-[10px] text-gray-400">{cluster.bantuanCount} rekam</p>
                </div>
                <p className={`text-sm font-bold ${cluster.accent}`}>{fmt(cluster.dana)}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ==============================================
// EXCEL EXPORT
// ==============================================
const exportChildrenToExcel = async (
  exportData: Children[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void,
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Anak Asuh", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    worksheet.columns = [
      { header: "ID Anak", key: "id", width: 15 },
      { header: "Foto", key: "childrenPict", width: 40 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Anak ke-", key: "index", width: 12 },
      { header: "Jenis Kelamin", key: "childrenGender", width: 15 },
      { header: "Tanggal Lahir", key: "childrenBirthdate", width: 20 },
      { header: "Usia", key: "age", width: 12 },
      { header: "Jenjang Pendidikan", key: "educationLevel", width: 20 },
      { header: "Tingkat Pendidikan", key: "educationGrade", width: 20 },
      { header: "Nama Sekolah", key: "schoolName", width: 30 },
      { header: "Pekerjaan", key: "childrenJob", width: 25 },
      { header: "Nama Orangtua", key: "parentName", width: 30 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Yatim/Piatu", key: "yatimStatus", width: 15 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Jumlah Bantuan", key: "jumlahBantuan", width: 16 },
      { header: "Total Dana Bantuan", key: "totalAssistanceAmount", width: 22 },
      { header: "Status", key: "isActive", width: 15 },
      { header: "Kondisi", key: "isCondition", width: 15 },
      { header: "Keterangan", key: "notes", width: 40 },
      { header: "Alamat Anak", key: "childrenAddress", width: 40 },
      { header: "Telepon Anak", key: "childrenPhone", width: 20 },
      { header: "Dibuat Pada", key: "createdAt", width: 20 },
      { header: "Diperbarui Pada", key: "updatedAt", width: 20 },
      { header: "Dibuat Oleh", key: "createdBy", width: 15 },
      { header: "Diedit Oleh", key: "editedBy", width: 15 },
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

    exportData.forEach((child, index) => {
      const father = child.isFatherAlive;
      const mother = child.isMotherAlive;
      let yatimStatus = "Tidak";
      if (!father && mother) yatimStatus = "Yatim";
      else if (father && !mother) yatimStatus = "Piatu";
      else if (!father && !mother) yatimStatus = "Yatim Piatu";

      const excelRow = worksheet.addRow({
        id: child.id,
        childrenPict: child.childrenPict || "-",
        childrenName: child.childrenName || "-",
        nik: child.nik || "-",
        index: child.index ? `${child.index}` : "-",
        childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
        childrenBirthdate: child.childrenBirthdate ? formatDate(child.childrenBirthdate) : "-",
        age: child.age ? `${child.age} Tahun` : "-",
        educationLevel: child.educationLevel || "-",
        educationGrade: child.educationGrade || "-",
        schoolName: child.schoolName || "-",
        childrenJob: child.childrenJob || "-",
        parentName: `${(child as any).homes?.employees?.employeeName || "-"} - ${(child as any).homes?.partners?.partnerName || "-"}`,
        waliName: (child as any).homes?.wali?.waliName || "-",
        yatimStatus,
        regionName:
          (child as any).homes?.employees?.regions?.regionName ||
          (child as any).homes?.regions?.regionName ||
          "-",
        jumlahBantuan: (child as any)?._count?.childAssistance ?? 0,
        totalAssistanceAmount: fmt(Number((child as any).totalAssistanceAmount) || 0),
        isActive: child.isActive ? "Aktif" : "Tidak Aktif",
        isCondition: child.isCondition ? "Normal" : "ABK",
        notes: child.notes || "-",
        childrenAddress: child.childrenAddress || "-",
        childrenPhone: child.childrenPhone || "-",
        createdAt: child.createdAt ? formatDate(child.createdAt) : "-",
        updatedAt: child.updatedAt ? formatDate(child.updatedAt) : "-",
        createdBy: (child as any)?.createdByStaffName || child.createdBy || "-",
        editedBy: (child as any)?.editedByStaffName || child.editedBy || "-",
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

      if (exportData.length > 10 && index % Math.floor(exportData.length / 10) === 0) {
        setProgress(50 + Math.floor((index / exportData.length) * 30));
      }
    });

    setProgress(80);

    worksheet.columns?.forEach((column: any) => {
      if (!column || typeof column.eachCell !== "function") return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = Math.min(maxLength + 4, 50);
    });

    setProgress(90);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "data-anak-asuh.xlsx",
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
export default function ChildrenTable() {
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
      router.push(`/children?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [data, setData] = useState<Children[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [regions, setRegions] = useState<Region[]>([]);
  const [eduFilters, setEduFilters] = useState<{ text: string; value: string }[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  const [stats, setStats] = useState<ChildrenStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Fetch lookup data + grand total once
  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
    fetchWithAuth(`${API_DASHBOARD}/education-levels`)
      .then((res) => res.json())
      .then((json) => {
        const levels = Object.keys(json.data ?? {}).sort();
        setEduFilters(levels.map((l) => ({ text: l, value: l })));
      })
      .catch(console.error);
  }, []);

  // Fetch table data + stats on URL change
  useEffect(() => {
    setLoading(true);
    setStatsLoading(true);
    const filters = toChildrenFilters(urlFilters);
    Promise.all([
      getChildrenOptimized(page, 50, urlSearch, filters),
      getChildrenStats(urlSearch, filters),
    ])
      .then(([tableRes, statsRes]) => {
        setData(Array.isArray(tableRes.data) ? tableRes.data : []);
        setTotal(tableRes.pagination?.total ?? 0);
        setStats(statsRes);
      })
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setData([]);
        setTotal(0);
      })
      .finally(() => { setLoading(false); setStatsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, urlSearch, searchParams.get("filters")]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleTableChange: TableProps<Children>["onChange"] = useCallback(
    (_pagination: any, filters: Record<string, any>) => {
      const cleaned: Record<string, string[]> = {};
      SERVER_FILTER_KEYS.forEach((key) => {
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
      await deleteChildren(deleteId);
      setIsDeleteModalOpen(false);
      const filters = toChildrenFilters(urlFilters);
      getChildrenOptimized(page, 50, urlSearch, filters).then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(res.pagination?.total ?? 0);
      });
      notifyFromResult(notify, { successMessage: "Anak asuh berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, page, urlSearch, urlFilters, notify]);

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const filters = toChildrenFilters(urlFilters);
      const exportData = await getChildrenForExport(filters);
      await exportChildrenToExcel(exportData, setShowProgress, setProgress);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, urlFilters]);

  const baseColumns = useMemo(
    () =>
      getChildrenColumns(
        regions,
        session?.user?.role,
        eduFilters,
        isAdmin
          ? (id) => {
              setDeleteId(id);
              setIsDeleteModalOpen(true);
            }
          : undefined,
      ),
    [regions, session?.user?.role, eduFilters, isAdmin],
  );

  const columnsWithState = useMemo(
    () =>
      baseColumns.map((col) => {
        const key = col.key as string;
        if (SERVER_FILTER_KEYS.includes(key as any)) {
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
      <ChildrenInsightPanel stats={stats} loading={statsLoading} />

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
        <p>Apakah Anda yakin ingin menghapus data anak asuh ini?</p>
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
        <div className="children-search-wrap w-full max-w-[340px]">
          <style>{`
            .children-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .children-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .children-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari nama anak, NIK, sekolah..."
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
            Export ({total})
          </AntButton>
          {isAdmin && (
            <Link href="/children/create">
              <AntButton type="primary">+</AntButton>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columnsWithState}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 50,
          total,
          showSizeChanger: false,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content", y: 500 }}
      />
    </>
  );
}
