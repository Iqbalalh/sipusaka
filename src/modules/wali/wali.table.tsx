"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress } from "antd";

// Types
import { Wali } from "@/types/models/wali";

// Utils
import {
  deleteWali,
  getWalis,
} from "@/utils/services/wali.service";
import { getWaliColumns } from "./wali.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function WaliTable() {
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate columns
  const columns = getWaliColumns();

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

      <DataTable<Wali>
        fetchData={getWalis}
        deleteItem={deleteWali}
        columns={columns}
        rowKey="id"
        exportConfig={{
          filename: "data-wali",
          sheetName: "Wali",
        }}
        onExport={handleExportWithProgress}
        title="Jumlah Data"
        createPath="/wali/create"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus data wali ini?"
        deleteSuccessMessage="Data wali berhasil dihapus"
      />
    </div>
  );
}