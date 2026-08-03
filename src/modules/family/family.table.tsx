"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Progress, Skeleton, Table, Modal, Input, Button as AntButton, Spin } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import {
  FaUsers,
  FaChild,
  FaDollarSign,
  FaHandHoldingHeart,
} from "react-icons/fa6";
import Link from "next/link";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Types
import { Home, HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteHome,
  getHomeDetail,
  getHomesForExport,
  getHomesOptimized,
  getHomeSummary,
  HomeSummary,
} from "@/utils/services/home.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getFamilyColumns } from "./family.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

// ==============================================
// FORMAT CURRENCY HELPER
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
function FamilyInsightPanel({
  summary,
  loading,
  totalRecords,
}: {
  summary: HomeSummary | null;
  loading: boolean;
  totalRecords: number;
}) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 mb-5">
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

  const {
    totalFamilies,
    activeFamilies,
    totalChildren,
    totalAssistanceAmount: totalDana,
  } = summary;

  const tiles = [
    {
      icon: <FaHandHoldingHeart />,
      label: "Keluarga Aktif",
      value: activeFamilies,
      sub: `${totalFamilies - activeFamilies} non-aktif`,
      color: "bg-emerald-500",
    },
    {
      icon: <FaUsers />,
      label: "Jumlah Data",
      value: totalFamilies,
      sub: `${totalRecords} Total`,
      color: "bg-blue-500",
    },
    {
      icon: <FaChild />,
      label: "Total Anak",
      value: totalChildren,
      sub: "Tertampil",
      color: "bg-indigo-500",
    },
    {
      icon: <FaDollarSign />,
      label: "Total Dana Bantuan Anak",
      value: fmt(totalDana),
      sub: "Tertampil",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 mb-5">
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
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
              {t.value}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================================
// TABLE SKELETON
// ==============================================
const SKEL_COLS = [160, 120, 100, 130, 90, 110];
const SKEL_ROWS = [
  [140, 100, 80, 110, 70, 90],
  [120, 90, 100, 100, 85, 105],
  [150, 110, 70, 120, 60, 95],
  [130, 95, 90, 105, 75, 100],
  [145, 105, 85, 115, 65, 85],
  [125, 85, 95, 125, 80, 110],
  [155, 115, 75, 95, 90, 80],
  [135, 100, 88, 108, 72, 92],
];

function TableSkeleton() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Skeleton.Input active size="default" style={{ width: 300 }} />
        <div className="flex gap-2">
          <Skeleton.Button active size="default" style={{ width: 110 }} />
          <Skeleton.Button active size="default" style={{ width: 40 }} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex gap-6 bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {SKEL_COLS.map((w, i) => (
            <Skeleton.Input key={i} active size="small" style={{ width: w, minWidth: w }} />
          ))}
        </div>
        {SKEL_ROWS.map((rowWidths, row) => (
          <div
            key={row}
            className={`flex gap-6 px-4 py-3 border-t border-gray-100 dark:border-gray-700 ${
              row % 2 === 1
                ? "bg-gray-50/60 dark:bg-gray-800/30"
                : "bg-white dark:bg-transparent"
            }`}
          >
            {rowWidths.map((w, col) => (
              <Skeleton.Input key={col} active size="small" style={{ width: w, minWidth: 40 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==============================================
// EXCEL EXPORT
// ==============================================
const exportFamilyToExcel = async (
  exportData: HomeTable[],
  setShowProgress: (v: boolean) => void,
  setProgress: (v: number) => void,
) => {
  try {
    setShowProgress(true);
    setProgress(10);
    if (!exportData || exportData.length === 0) { setShowProgress(false); return; }
    setProgress(30);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Keluarga", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    worksheet.columns = [
      { header: "ID Keluarga", key: "id", width: 15 },
      { header: "NIP/NIPP Pegawai", key: "nipNipp", width: 20 },
      { header: "Nama Pegawai", key: "employeeName", width: 25 },
      { header: "Jenis Kelamin Pegawai", key: "employeeGender", width: 20 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Nama Pasangan", key: "partnerName", width: 25 },
      { header: "Status Pasangan", key: "partnerStatus", width: 15 },
      { header: "Kunjungan", key: "isValidated", width: 15 },
      { header: "Foto Kunjungan", key: "hasFoto", width: 18 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "Jenis Kelamin Anak", key: "childrenGender", width: 20 },
      { header: "Tanggal Lahir Anak", key: "childrenBirthdate", width: 20 },
      { header: "Bantuan Per Anak", key: "childAssistanceAmount", width: 22 },
      { header: "Alamat", key: "address", width: 50 },
      { header: "Kode Pos", key: "postalCode", width: 15 },
      { header: "Nomor Telepon", key: "phoneNumber", width: 20 },
      { header: "Koordinat Rumah", key: "homeCoordinate", width: 30 },
      { header: "Jumlah Anak", key: "childrenCount", width: 15 },
      { header: "Anak Aktif", key: "activeChildrenCount", width: 15 },
      { header: "Anak Tidak Aktif", key: "inactiveChildrenCount", width: 18 },
      { header: "UMKM", key: "isUmkm", width: 15 },
      { header: "Total Dana Bantuan Anak", key: "totalChildAssistance", width: 25 },
      { header: "Tanggal Dibuat", key: "createdAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });
    setProgress(50);

    const dataRows: any[] = [];
    exportData.forEach((home) => {
      // allChildren from grouped export (all sibling homes); fallback to legacy .children
      const children = (home as any).allChildren || (home as any).children || [];

      const totalChildAssistance = children.reduce((sum: number, child: any) => {
        const childAmt = (child.childAssistance ?? []).reduce(
          (s: number, a: any) => s + (Number(a.assistanceAmount) || 0), 0
        );
        return sum + childAmt;
      }, 0);

      // allWaliNames from grouped export; fallback to single wali name
      const waliName = (home as any).allWaliNames || home.wali?.waliName || "-";

      const base = {
        id: home.id,
        nipNipp: home.employees?.nipNipp || "-",
        employeeName: home.employees?.employeeName || "-",
        employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
        regionName: home.regions?.regionName || (home.employees as any)?.regions?.regionName || "-",
        partnerName: home.partners?.partnerName || "-",
        partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
        isValidated: (home as any).isValidated ? "Sudah Dikunjungi" : "Belum Dikunjungi",
        hasFoto: (home as any).hasFoto ? "Ada Foto" : "Tidak Ada Foto",
        waliName,
        address: home.partners?.address || "-",
        postalCode: home.postalCode || home.partners?.postalCode || "-",
        phoneNumber: home.partners?.phoneNumber || "-",
        homeCoordinate: home.partners?.homeCoordinate || "-",
        childrenCount: children.length,
        activeChildrenCount: children.filter((c: any) => c.isActive).length,
        inactiveChildrenCount: children.filter((c: any) => !c.isActive).length,
        isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
        totalChildAssistance: totalChildAssistance > 0 ? totalChildAssistance : "-",
        createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
      };

      if (children.length === 0) {
        dataRows.push({ ...base, childrenName: "-", childrenGender: "-", childrenBirthdate: "-", childAssistanceAmount: "-" });
      } else {
        children.forEach((child: any) => {
          const childAmt = (child.childAssistance ?? []).reduce(
            (s: number, a: any) => s + (Number(a.assistanceAmount) || 0), 0
          );
          dataRows.push({
            ...base,
            childrenName: child.childrenName || "-",
            childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
            childrenBirthdate: child.childrenBirthdate ? formatDate(child.childrenBirthdate) : "-",
            childAssistanceAmount: childAmt > 0 ? childAmt : "-",
          });
        });
      }
    });

    dataRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
      if (dataRows.length > 10 && index % Math.floor(dataRows.length / 10) === 0) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

    const columnsToMerge = [
      "id", "nipNipp", "employeeName", "employeeGender", "regionName",
      "partnerName", "partnerStatus", "isValidated", "waliName",
      "address", "postalCode", "phoneNumber", "homeCoordinate",
      "childrenCount", "activeChildrenCount", "inactiveChildrenCount",
      "isUmkm", "totalChildAssistance", "createdAt",
    ];
    columnsToMerge.forEach((columnKey) => {
      const column = worksheet.getColumn(columnKey);
      if (!column) return;
      let currentFamilyId: number | null = null;
      let groupStartRow = 2;
      column.eachCell({ includeEmpty: false }, (_cell, rowNumber) => {
        if (rowNumber === 1) return;
        const row = worksheet.getRow(rowNumber);
        const familyId = row.getCell("id").value as number;
        if (familyId !== currentFamilyId) {
          if (currentFamilyId !== null && rowNumber - groupStartRow > 1) {
            worksheet.mergeCells(groupStartRow, column.number, rowNumber - 1, column.number);
            worksheet.getCell(groupStartRow, column.number).alignment = {
              vertical: "middle", horizontal: "left", wrapText: true,
            };
          }
          currentFamilyId = familyId;
          groupStartRow = rowNumber;
        }
      });
      const lastRow = worksheet.lastRow?.number ?? groupStartRow;
      if (currentFamilyId !== null && lastRow - groupStartRow >= 1) {
        worksheet.mergeCells(groupStartRow, column.number, lastRow, column.number);
        worksheet.getCell(groupStartRow, column.number).alignment = {
          vertical: "middle", horizontal: "left", wrapText: true,
        };
      }
    });

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
      "data-keluarga.xlsx",
    );
    setProgress(100);
    setTimeout(() => { setShowProgress(false); setProgress(0); }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
  }
};

// ==============================================
// SERVER-SIDE FILTER KEYS (sent to backend)
// ==============================================
const SERVER_FILTER_KEYS = ["regionId", "isValidated", "isActive", "familyVisits"];

// ==============================================
// EXPANDED ROW — full family across sibling home ids (same parents)
// ==============================================
function ExpandedFamily({ detail }: { detail: Home | "loading" | undefined }) {
  if (!detail || detail === "loading") {
    return (
      <div className="flex justify-center py-4">
        <Spin size="small" />
      </div>
    );
  }

  const walis = detail.walis ?? [];
  const children = (detail.childrens ?? []) as Array<{
    id: number;
    childrenName: string;
    isActive?: boolean | null;
    homeId?: number | null;
  }>;

  return (
    <div className="p-2">
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Keluarga ini terdiri dari {walis.length} rumah (id keluarga berbeda) dengan orang tua yang sama.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {walis.map((entry) => {
          const kids = children.filter((c) => c.homeId === entry.homeId);
          return (
            <div
              key={entry.homeId}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/40"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  {entry.wali?.waliName || "Tanpa Wali"}
                </span>
                <span className="text-[11px] text-gray-400">ID Keluarga #{entry.homeId}</span>
              </div>
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Anak ({kids.length})</div>
              {kids.length > 0 ? (
                <ul className="list-disc space-y-0.5 pl-4">
                  {kids.map((c) => (
                    <li key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                      {c.childrenName}
                      {c.isActive ? "" : " (Tidak Aktif)"}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs italic text-gray-400">Tidak ada anak di rumah ini.</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <Link href={`/family/view/${detail.id}`} className="text-xs text-blue-600 hover:underline">
          Lihat keluarga utuh →
        </Link>
      </div>
    </div>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function FamilyTable() {
  const { data: session } = useSession();
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";

  // ── URL state (single source of truth) ──────────────────────────────
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";
  const urlFilters = searchParams.get("filters") || "";

  const filters = useMemo<Record<string, any>>(() => {
    if (!urlFilters) return {};
    try { return JSON.parse(urlFilters); } catch { return {}; }
  }, [urlFilters]);

  const pushParams = useCallback(
    (updates: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`/family?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // ── Local state ──────────────────────────────────────────────────────
  const [data, setData] = useState<HomeTable[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Expanded rows: lazily-loaded full family (all sibling home ids) keyed by canonical home id
  const [expandedDetails, setExpandedDetails] = useState<Record<number, Home | "loading">>({});
  const loadedExpandRef = useRef<Set<number>>(new Set());
  const loadExpandDetail = useCallback(async (homeId: number) => {
    if (loadedExpandRef.current.has(homeId)) return;
    loadedExpandRef.current.add(homeId);
    setExpandedDetails((prev) => ({ ...prev, [homeId]: "loading" }));
    try {
      const detail = await getHomeDetail(homeId);
      setExpandedDetails((prev) => ({ ...prev, [homeId]: detail }));
    } catch (err) {
      console.error(err);
      loadedExpandRef.current.delete(homeId);
      setExpandedDetails((prev) => {
        const next = { ...prev };
        delete next[homeId];
        return next;
      });
    }
  }, []);

  // Search input decoupled from URL — only commits on Enter / Cari
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => { setSearchInput(urlSearch); }, [urlSearch]);

  // Responsive scrollY: lg+ → fixed 500px, smaller → viewport-based
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const check = () => setIsLg(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Load regions + unfiltered total once ────────────────────────────
  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
    getHomeSummary().then((s) => setTotalRecords(s.totalFamilies)).catch(console.error);
  }, []);

  // ── Fetch table + summary whenever URL params change ─────────────────
  useEffect(() => {
    setTableLoading(true);
    setSummaryLoading(true);
    Promise.all([
      getHomesOptimized(page, 20, urlSearch, filters),
      getHomeSummary(urlSearch, filters),
    ])
      .then(([tableResult, summaryResult]) => {
        setData(tableResult.data);
        setTotal(tableResult.pagination.total);
        setSummary(summaryResult);
      })
      .catch(console.error)
      .finally(() => {
        setTableLoading(false);
        setSummaryLoading(false);
      });
  // urlFilters (string) used instead of filters (object) to keep dep stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, urlSearch, urlFilters]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleTableChange = useCallback(
    (_: any, antdFilters: any) => {
      const cleaned: Record<string, any> = {};
      SERVER_FILTER_KEYS.forEach((k) => {
        const v = antdFilters[k];
        if (Array.isArray(v) && v.length > 0) cleaned[k] = v;
      });
      const newFiltersStr = Object.keys(cleaned).length ? JSON.stringify(cleaned) : "";
      if (newFiltersStr !== urlFilters) {
        pushParams({ filters: newFiltersStr, page: "1" });
      }
    },
    [pushParams, urlFilters],
  );

  const openDeleteModal = useCallback((id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteHome(deleteId);
      setIsDeleteModalOpen(false);
      // Re-fetch current view after delete
      Promise.all([
        getHomesOptimized(page, 20, urlSearch, filters),
        getHomeSummary(urlSearch, filters),
      ]).then(([tableResult, summaryResult]) => {
        setData(tableResult.data);
        setTotal(tableResult.pagination.total);
        setSummary(summaryResult);
      }).catch(console.error);
      notifyFromResult(notify, { successMessage: "Keluarga berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteId, page, urlSearch, urlFilters, notify]);

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const allExportData = await getHomesForExport(urlSearch, filters);
      await exportFamilyToExcel(allExportData, setShowProgress, setProgress);
    } finally {
      setExportLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportLoading, urlSearch, urlFilters]);

  // ── Columns ──────────────────────────────────────────────────────────
  const columns = useMemo(
    () => getFamilyColumns(regions, session?.user?.role, isAdmin ? openDeleteModal : undefined),
    [regions, session?.user?.role, isAdmin, openDeleteModal],
  );

  // ALL filterable columns must declare filteredValue (antd v6 requirement)
  const columnsWithState = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        filteredValue: col.key && SERVER_FILTER_KEYS.includes(col.key as string)
          ? (filters[col.key as string] as any) ?? null
          : null,
      })),
    [columns, filters],
  );

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div>
      <FamilyInsightPanel summary={summary} loading={summary === null || summaryLoading} totalRecords={totalRecords} />

      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sedang mengekspor data...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {progress}%
            </span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      <Modal
        title="Konfirmasi Hapus"
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        cancelText="Batal"
        okText={deleteLoading ? "Menghapus..." : "Hapus"}
        okButtonProps={{ danger: true, loading: deleteLoading }}
      >
        <p>Apakah Anda yakin ingin menghapus keluarga ini?</p>
      </Modal>

      {tableLoading && summary === null ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="family-search-wrap w-full max-w-[340px]">
              <style>{`
                .family-search-wrap .ant-input-search-button { box-shadow: none !important; }
                .family-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
                .family-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
              `}</style>
              <Input.Search
                placeholder="Cari nama pegawai, pasangan, atau wali..."
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
            <div className="flex items-center gap-2">
              <AntButton type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={exportLoading}>
                Export Excel
              </AntButton>
              {isAdmin && (
                <Link href="/family/create">
                  <AntButton type="primary">+</AntButton>
                </Link>
              )}
            </div>
          </div>

          <Table
            columns={columnsWithState}
            dataSource={data}
            rowKey="id"
            bordered
            loading={tableLoading}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              showSizeChanger: false,
              onChange: (p) => pushParams({ page: String(p) }),
            }}
            scroll={{ x: "max-content", y: isLg ? 500 : "calc(100vh - 430px)" }}
            onChange={handleTableChange}
            expandable={{
              rowExpandable: (record) => (record.walis?.length ?? 0) > 1,
              onExpand: (expanded, record) => {
                if (expanded) loadExpandDetail(record.id);
              },
              expandedRowRender: (record) => (
                <ExpandedFamily detail={expandedDetails[record.id]} />
              ),
            }}
          />
        </>
      )}
    </div>
  );
}
