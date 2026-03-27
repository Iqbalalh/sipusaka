
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress } from "antd";

// Types
import { Employee } from "@/types/models/employee";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteEmployee,
  getEmployees,
} from "@/utils/services/employee.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployeeColumns } from "./employee.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function EmployeeTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

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
  const columns = getEmployeeColumns(regions, session?.user?.role);

  // Custom export function with progress
  const handleExportWithProgress = async (filteredData: Employee[]) => {
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
        filename: "data-pegawai",
        sheetName: "Pegawai",
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

      <DataTable<Employee>
        fetchData={getEmployees}
        deleteItem={isAdmin ? deleteEmployee : undefined}
        columns={columns}
        rowKey="id"
        exportConfig={{
          filename: "data-pegawai",
          sheetName: "Pegawai",
        }}
        onExport={handleExportWithProgress}
        title="Jumlah Data"
        createPath={isAdmin ? "/employee/create" : undefined}
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus pegawai ini?"
        deleteSuccessMessage="Pegawai berhasil dihapus"
      />
    </div>
  );
}
