"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress, Skeleton } from "antd";
import { FaUsers, FaUserCheck, FaUserXmark } from "react-icons/fa6";

// Types
import { Wali } from "@/types/models/wali";

// Utils
import {
  deleteWali,
  getWalis,
} from "@/utils/services/wali.service";
import { getWaliColumns } from "./wali.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

// ==============================================
// INSIGHT PANEL
// ==============================================
function WaliInsightPanel({ data }: { data: Wali[] | null }) {
  if (!data) {
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

  const total = data.length;
  const aktif = data.filter((w) => (w as any).isActive === true).length;
  const tidakAktif = data.filter((w) => (w as any).isActive === false).length;

  const tiles = [
    { icon: <FaUserCheck />, label: "Aktif", value: aktif, color: "bg-emerald-500" },
    { icon: <FaUserXmark />, label: "Tidak Aktif", value: tidakAktif, color: "bg-gray-400" },
    { icon: <FaUsers />, label: "Total Data", value: total, color: "bg-blue-500" },
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
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WaliTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleData, setVisibleData] = useState<Wali[] | null>(null);

  // Generate columns
  const columns = getWaliColumns(session?.user?.role);

  // Custom export function with progress
  const handleExportWithProgress = async (filteredData: Wali[]) => {
    try {
      setShowProgress(true);
      setProgress(10);

      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(30);

      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(50);

      await exportTableToExcel({
        data: filteredData,
        columns,
        filename: "data-wali",
        sheetName: "Wali",
      });

      setProgress(80);

      await new Promise(resolve => setTimeout(resolve, 300));
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

  return (
    <div>

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

      <WaliInsightPanel data={visibleData} />

      <DataTable<Wali>
        fetchData={getWalis}
        deleteItem={isAdmin ? deleteWali : undefined}
        columns={columns}
        rowKey="id"
        exportConfig={{
          filename: "data-wali",
          sheetName: "Wali",
        }}
        onExport={handleExportWithProgress}
        onFilteredDataChange={setVisibleData}
        title="Jumlah Data Wali"
        createPath={isAdmin ? "/wali/create" : undefined}
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus data wali ini?"
        deleteSuccessMessage="Data wali berhasil dihapus"
      />
    </div>
  );
}