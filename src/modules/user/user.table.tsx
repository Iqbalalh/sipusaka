"use client";

import { useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Progress } from "antd";

// Types
import { User } from "@/utils/services/user.service";

// Utils
import { deleteUser, getUsers } from "@/utils/services/user.service";
import { getUserColumns } from "./user.columns";
import { exportTableToExcel } from "@/utils/export/excel/exportTableToExcel";

export default function UserTable() {
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate columns
  const columns = getUserColumns();

  // Custom export function with progress
  const handleExportWithProgress = async (filteredData: User[]) => {
    try {
      setShowProgress(true);
      setProgress(10);

      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(30);

      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(50);

      await exportTableToExcel({
        data: filteredData,
        columns,
        filename: "data-user",
        sheetName: "User",
      });

      setProgress(80);

      await new Promise((resolve) => setTimeout(resolve, 300));
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

      <DataTable<User>
        fetchData={getUsers}
        deleteItem={deleteUser}
        columns={columns}
        rowKey="userId"
        exportConfig={{
          filename: "data-user",
          sheetName: "User",
        }}
        onExport={handleExportWithProgress}
        title="Jumlah Data"
        createPath="/users/create"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus user ini?"
        deleteSuccessMessage="User berhasil dihapus"
      />
    </div>
  );
}
