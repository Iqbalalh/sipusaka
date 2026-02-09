"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress } from "antd";

// Types
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteChildren,
  getChildrens,
} from "@/utils/services/children.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrenColumns } from "./children.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function ChildrenTable() {
  // State for regions (needed for column filters)
  const [regions, setRegions] = useState<Region[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // Fetch regions for column filters
  useEffect(() => {
    const init = async () => {
      try {
        const regionList = await getRegionsList();
        setRegions(regionList);
      } catch (err) {
        console.error("Failed to fetch regions:", err);
      }
    };

    init();
  }, []);

  // Generate columns with regions
  const columns = getChildrenColumns(regions);

  // Custom export function with progress
  const handleExportWithProgress = async (filteredData: Children[]) => {
    try {
      setShowProgress(true);
      setProgress(10);

      // Simulate progress steps
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(30);

      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(50);

      // Export to Excel
      await exportTableToExcel({
        data: filteredData,
        columns,
        filename: "data-anak-asuh",
        sheetName: "Anak Asuh",
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

      <DataTable<Children>
        fetchData={getChildrens}
        deleteItem={deleteChildren}
        columns={columns}
        rowKey="id"
        exportConfig={{
          filename: "data-anak-asuh",
          sheetName: "Anak Asuh",
        }}
        onExport={handleExportWithProgress}
        title="Jumlah Data"
        createPath="/children/create"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus data anak asuh ini?"
        deleteSuccessMessage="Data anak asuh berhasil dihapus"
      />
    </div>
  );
}