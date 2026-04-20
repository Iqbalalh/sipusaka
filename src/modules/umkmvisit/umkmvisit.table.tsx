"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

// Components
import DataTable from "@/components/custom/table/DataTable";
import { Button, Progress } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

// Types
import { UmkmVisit } from "@/utils/services/umkmvisit.service";

// Utils
import {
  getUmkmVisits,
  deleteUmkmVisit,
} from "@/utils/services/umkmvisit.service";
import { getUmkmVisitColumns } from "./umkmvisit.columns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatDate } from "@/utils/formatter/formatDate";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS BAR
// ==============================================
const exportUmkmVisitToExcel = async (
  filteredData: UmkmVisit[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    const allData = filteredData;
    setProgress(30);

    if (!allData || allData.length === 0) {
      setShowProgress(false);
      return;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Bantuan UMKM", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Kunjunga ke-", key: "visitNumber", width: 15 },
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

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    setProgress(50);

    // Add data rows
    allData.forEach((record, index) => {
      const row = {
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
        value: record.value
          ? `Rp ${record.value.toLocaleString("id-ID")}`
          : "-",
        notes: record.notes || "-",
        docCount: record.umkmVisitDocs?.length || 0,
        createdAt: record.createdAt ? formatDate(record.createdAt) : "-",
      };

      const excelRow = worksheet.addRow(row);

      // Style alternating rows
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
        });
      }

      // Style all cells
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Update progress
      if (index % Math.floor(allData.length / 10) === 0) {
        setProgress(50 + Math.floor((index / allData.length) * 40));
      }
    });

    setProgress(90);

    // Auto-fit column widths
    worksheet.columns?.forEach((column: any) => {
      if (!column || typeof column.eachCell !== "function") return;

      let maxLength = 10;

      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const value = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, value.length);
      });

      column.width = Math.min(maxLength + 4, 50);
    });

    setProgress(95);

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "data-bantuan-umkm.xlsx");

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

const fetchUmkmVisitData = async (): Promise<UmkmVisit[]> => {
  try {
    const data = await getUmkmVisits();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching UMKM visit data:", error);
    return [];
  }
};

export default function UmkmVisitTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const columns = getUmkmVisitColumns(session?.user?.role);

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

      <DataTable<UmkmVisit>
        fetchData={fetchUmkmVisitData}
        deleteItem={isAdmin ? deleteUmkmVisit : undefined}
        columns={columns}
        rowKey="id"
        title="Jumlah Data"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus bantuan UMKM ini?"
        deleteSuccessMessage="Bantuan UMKM berhasil dihapus"
        onExport={(filteredData) => exportUmkmVisitToExcel(filteredData as UmkmVisit[], setShowProgress, setProgress)}
        exportConfig={{
          filename: "data-bantuan-umkm",
          sheetName: "Bantuan UMKM",
        }}
      />
    </div>
  );
}