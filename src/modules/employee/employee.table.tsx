"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton, Table, Modal, Input, Button as AntButton } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { FaUsers, FaUserCheck, FaUserXmark } from "react-icons/fa6";
import Link from "next/link";

import { Employee } from "@/types/models/employee";
import { Region } from "@/types/models/region";

import {
  deleteEmployee,
  getEmployeesOptimized,
  getEmployeeSummary,
  EmployeeSummary,
} from "@/utils/services/employee.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployeeColumns } from "./employee.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";

// ==============================================
// INSIGHT PANEL
// ==============================================
function EmployeeInsightPanel({
  summary,
  loading,
  totalRecords,
}: {
  summary: EmployeeSummary | null;
  loading: boolean;
  totalRecords: number;
}) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  const { total, active, inactive } = summary;
  const tiles = [
    { icon: <FaUserCheck />, label: "Aktif", value: active, sub: null, color: "bg-emerald-500" },
    { icon: <FaUserXmark />, label: "Tidak Aktif", value: inactive, sub: null, color: "bg-gray-400" },
    { icon: <FaUsers />, label: "Jumlah Data", value: total, sub: `${totalRecords} Total`, color: "bg-blue-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {tiles.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm shadow ${t.color}`}>
            {t.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">{t.label}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">{t.value}</p>
            {t.sub && <p className="text-[10px] text-gray-400 truncate">{t.sub}</p>}
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
              row % 2 === 1 ? "bg-gray-50/60 dark:bg-gray-800/30" : "bg-white dark:bg-transparent"
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
// SERVER-SIDE FILTER KEYS
// ==============================================
const SERVER_FILTER_KEYS = ["regionId", "employeeGender", "isAccident", "isActive"];

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function EmployeeTable() {
  const { data: session } = useSession();
  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  // URL state
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
      router.push(`/employee?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // Local state
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => { setSearchInput(urlSearch); }, [urlSearch]);

  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const check = () => setIsLg(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load regions + unfiltered total once
  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
    getEmployeeSummary().then((s) => setTotalRecords(s.total)).catch(console.error);
  }, []);

  // Fetch table + summary on URL change
  useEffect(() => {
    setTableLoading(true);
    setSummaryLoading(true);
    Promise.all([
      getEmployeesOptimized(page, 50, urlSearch, filters),
      getEmployeeSummary(urlSearch, filters),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, urlSearch, urlFilters]);

  // Handlers
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
      await deleteEmployee(deleteId);
      setIsDeleteModalOpen(false);
      Promise.all([
        getEmployeesOptimized(page, 50, urlSearch, filters),
        getEmployeeSummary(urlSearch, filters),
      ]).then(([tableResult, summaryResult]) => {
        setData(tableResult.data);
        setTotal(tableResult.pagination.total);
        setSummary(summaryResult);
      }).catch(console.error);
      notifyFromResult(notify, { successMessage: "Pegawai berhasil dihapus" });
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
      const allData = await getEmployeesOptimized(1, 99999, urlSearch, filters);
      await exportTableToExcel({
        data: allData.data,
        columns,
        filename: "data-pegawai",
        sheetName: "Pegawai",
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportLoading, urlSearch, urlFilters]);

  // Columns
  const columns = useMemo(
    () => getEmployeeColumns(regions, session?.user?.role, isAdmin ? openDeleteModal : undefined),
    [regions, session?.user?.role, isAdmin, openDeleteModal],
  );

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

  return (
    <div>
      <EmployeeInsightPanel summary={summary} loading={summary === null || summaryLoading} totalRecords={totalRecords} />

      <Modal
        title="Konfirmasi Hapus"
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        cancelText="Batal"
        okText={deleteLoading ? "Menghapus..." : "Hapus"}
        okButtonProps={{ danger: true, loading: deleteLoading }}
      >
        <p>Apakah Anda yakin ingin menghapus pegawai ini?</p>
      </Modal>

      {tableLoading && summary === null ? (
        <TableSkeleton />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="employee-search-wrap w-full max-w-[340px]">
              <style>{`
                .employee-search-wrap .ant-input-search-button { box-shadow: none !important; }
                .employee-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
                .employee-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
              `}</style>
              <Input.Search
                placeholder="Cari nama pegawai atau NIP/NIPP..."
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
                <Link href="/employee/create">
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
              pageSize: 50,
              total,
              showSizeChanger: false,
              onChange: (p) => pushParams({ page: String(p) }),
            }}
            scroll={{ x: "max-content", y: isLg ? 500 : "calc(100vh - 430px)" }}
            onChange={handleTableChange}
          />
        </>
      )}
    </div>
  );
}
