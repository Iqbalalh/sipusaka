"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Progress } from "antd";
import DataTable from "@/components/custom/table/DataTable";

// Types
import { HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";

// Utils
import { deleteHome, getAllHomes, getHomesForExport } from "@/utils/services/home.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getFamilyColumns } from "./family.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportFamilyToExcel = async (
  exportData: HomeTable[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      return;
    }

    setProgress(30);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Keluarga", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    // Define columns with Indonesian names
    worksheet.columns = [
      { header: "ID Keluarga", key: "id", width: 15 },
      { header: "NIP/NIPP Pegawai", key: "nipNipp", width: 20 },
      { header: "Nama Pegawai", key: "employeeName", width: 25 },
      { header: "Jenis Kelamin Pegawai", key: "employeeGender", width: 20 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Nama Pasangan", key: "partnerName", width: 25 },
      { header: "Status Pasangan", key: "partnerStatus", width: 15 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "Jenis Kelamin Anak", key: "childrenGender", width: 20 },
      { header: "Tanggal Lahir Anak", key: "childrenBirthdate", width: 20 },
      { header: "Alamat", key: "address", width: 200 },
      { header: "Kode Pos", key: "postalCode", width: 15 },
      { header: "Nomor Telepon", key: "phoneNumber", width: 20 },
      { header: "Koordinat Rumah", key: "homeCoordinate", width: 30 },
      { header: "Jumlah Anak", key: "childrenCount", width: 15 },
      { header: "UMKM", key: "isUmkm", width: 15 },
      { header: "Tanggal Dibuat", key: "createdAt", width: 20 },
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

    // Prepare data rows - expand each family with their children
    const dataRows: any[] = [];
    exportData.forEach((home) => {
      const children = (home as any).children || [];

      if (children.length === 0) {
        dataRows.push({
          id: home.id,
          nipNipp: home.employees?.nipNipp || "-",
          employeeName: home.employees?.employeeName || "-",
          employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
          regionName: home.regions?.regionName || home.employees?.regions?.regionName || "-",
          partnerName: home.partners?.partnerName || "-",
          partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
          waliName: home.wali?.waliName || "-",
          childrenName: "-",
          childrenGender: "-",
          childrenBirthdate: "-",
          address: home.partners?.address || "-",
          postalCode: home.postalCode || home.partners?.postalCode || "-",
          phoneNumber: home.partners?.phoneNumber || "-",
          homeCoordinate: home.partners?.homeCoordinate || "-",
          childrenCount: home._count?.children || 0,
          isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
          createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
        });
      } else {
        children.forEach((child: any) => {
          dataRows.push({
            id: home.id,
            nipNipp: home.employees?.nipNipp || "-",
            employeeName: home.employees?.employeeName || "-",
            employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
            regionName: home.regions?.regionName || home.employees?.regions?.regionName || "-",
            partnerName: home.partners?.partnerName || "-",
            partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
            waliName: home.wali?.waliName || "-",
            childrenName: child.childrenName || "-",
            childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
            childrenBirthdate: child.childrenBirthdate
              ? formatDate(child.childrenBirthdate)
              : "-",
            address: home.partners?.address || child.childrenAddress || "-",
            postalCode: home.postalCode || home.partners?.postalCode || child.childrenAddress || "-",
            phoneNumber: home.partners?.phoneNumber || child.childrenPhone || "-",
            homeCoordinate: home.partners?.homeCoordinate || "-",
            childrenCount: home._count?.children || 0,
            isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
            createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
          });
        });
      }
    });

    // Add data to worksheet
    dataRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);

      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF1F5F9" },
          };
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

      if (index % Math.floor(dataRows.length / 10) === 0) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

    // Merge columns for parent info (same values across children rows)
    const columnsToMerge = [
      "id",
      "nipNipp",
      "employeeName",
      "employeeGender",
      "regionName",
      "partnerName",
      "partnerStatus",
      "waliName",
      "address",
      "postalCode",
      "phoneNumber",
      "homeCoordinate",
      "childrenCount",
      "isUmkm",
      "createdAt",
    ];

    columnsToMerge.forEach((columnKey) => {
      const column = worksheet.getColumn(columnKey);
      if (!column) return;

      let currentFamilyId: number | null = null;
      let groupStartRow = 2;

      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        if (rowNumber === 1) return;

        const row = worksheet.getRow(rowNumber);
        const idCell = row.getCell("id");
        const familyId = idCell.value as number;

        if (familyId !== currentFamilyId) {
          if (currentFamilyId !== null && rowNumber - groupStartRow > 1) {
            worksheet.mergeCells(groupStartRow, column.number, rowNumber - 1, column.number);
            worksheet.getCell(groupStartRow, column.number).alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
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
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
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
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "data-keluarga.xlsx");

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

export default function FamilyTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [regions, setRegions] = useState<Region[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
  }, []);

  const columns = getFamilyColumns(regions, session?.user?.role);

  // Export filtered table records by fetching full export data (with children) for only the filtered IDs
  const handleExport = async (filteredData: HomeTable[]) => {
    const filteredIds = new Set(filteredData.map((h) => h.id));
    const allExportData = await getHomesForExport();
    const exportData = allExportData.filter((h) => filteredIds.has(h.id));
    await exportFamilyToExcel(exportData, setShowProgress, setProgress);
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
      <DataTable<HomeTable>
        fetchData={getAllHomes}
        deleteItem={isAdmin ? deleteHome : undefined}
        columns={columns}
        rowKey="id"
        exportConfig={{ filename: "data-keluarga", sheetName: "Keluarga" }}
        onExport={handleExport}
        title="Jumlah Data Keluarga"
        showSearch={false}
        createPath={isAdmin ? "/family/create" : undefined}
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus keluarga ini?"
        deleteSuccessMessage="Keluarga berhasil dihapus"
      />
    </div>
  );
}
