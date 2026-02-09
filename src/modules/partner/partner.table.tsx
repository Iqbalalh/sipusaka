"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress } from "antd";

// Types
import { Partner } from "@/types/models/partner";
import { Region } from "@/types/models/region";

// Utils
import {
  deletePartner,
  getPartners,
} from "@/utils/services/partner.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getPartnerColumns } from "./partner.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function PartnerTable() {
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
  const columns = getPartnerColumns(regions);

  // Custom export function with progress
  const handleExportWithProgress = async (filteredData: Partner[]) => {
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
        filename: "data-pasangan",
        sheetName: "Pasangan",
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

      <DataTable<Partner>
        fetchData={getPartners}
        deleteItem={deletePartner}
        columns={columns}
        rowKey="id"
        exportConfig={{
          filename: "data-pasangan",
          sheetName: "Pasangan",
        }}
        onExport={handleExportWithProgress}
        title="Jumlah Data"
        createPath="/partner/create"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus pasangan ini?"
        deleteSuccessMessage="Pasangan berhasil dihapus"
      />
    </div>
  );
}