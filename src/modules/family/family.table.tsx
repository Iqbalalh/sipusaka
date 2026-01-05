"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";
import { Children } from "@/types/models/children";

// Utils
import {
  deleteHome,
  getHomes,
} from "@/utils/services/home.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrens } from "@/utils/services/children.service";
import { getFamilyColumns } from "./family.columns";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// EXCEL EXPORT FUNCTION
// ==============================================
const exportFamilyToExcel = async (filteredData: HomeTable[]) => {
  if (!filteredData || filteredData.length === 0) return;

  // Fetch all children data
  let allChildren: Children[] = [];
  try {
    allChildren = await getChildrens();
  } catch (error) {
    console.error("Failed to fetch children:", error);
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Keluarga", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Define columns with Indonesian names
  worksheet.columns = [
    { header: "ID Keluarga", key: "id", width: 15 },
    { header: "NIP/NIPP Pegawai", key: "nipNipp", width: 20 },
    { header: "Nama Pegawai", key: "employeeName", width: 25 },
    { header: "Jenis Kelamin Pegawai", key: "employeeGender", width: 20 },
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

  // Prepare data rows - expand each family with their children
  const dataRows: any[] = [];
  filteredData.forEach((home) => {
    // Get children for this home
    const children = allChildren.filter((c) => c.homeId === home.id);

    if (children.length === 0) {
      // Add row without children
      dataRows.push({
        id: home.id,
        nipNipp: home.employees?.nipNipp || "-",
        employeeName: home.employees?.employeeName || "-",
        employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
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
        isUmkm: home.isUmkm ? "Ya" : "Tidak",
        createdAt: home.createdAt ? new Date(home.createdAt).toLocaleDateString("id-ID") : "-",
      });
    } else {
      // Add rows for each child
      children.forEach((child) => {
        dataRows.push({
          id: home.id,
          nipNipp: home.employees?.nipNipp || "-",
          employeeName: home.employees?.employeeName || "-",
          employeeGender: home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
          partnerName: home.partners?.partnerName || "-",
          partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
          waliName: home.wali?.waliName || "-",
          childrenName: child.childrenName || "-",
          childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
          childrenBirthdate: child.childrenBirthdate
            ? new Date(child.childrenBirthdate).toLocaleDateString("id-ID")
            : "-",
          address: home.partners?.address || child.childrenAddress || "-",
          postalCode: home.postalCode || home.partners?.postalCode || child.childrenAddress || "-",
          phoneNumber: home.partners?.phoneNumber || child.childrenPhone || "-",
          homeCoordinate: home.partners?.homeCoordinate || "-",
          childrenCount: home._count?.children || 0,
          isUmkm: home.isUmkm ? "Ya" : "Tidak",
          createdAt: home.createdAt ? new Date(home.createdAt).toLocaleDateString("id-ID") : "-",
        });
      });
    }
  });

  // Add data to worksheet
  dataRows.forEach((row, index) => {
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
  });

  // Merge columns for parent info (same values across children rows)
  const columnsToMerge = [
    "id",
    "nipNipp",
    "employeeName",
    "employeeGender",
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

  // Merge columns for parent info - group by family ID
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

      // Check if this is a new family
      if (familyId !== currentFamilyId) {
        // Merge previous group if it has more than 1 row
        if (currentFamilyId !== null && rowNumber - groupStartRow > 1) {
          worksheet.mergeCells(groupStartRow, column.number, rowNumber - 1, column.number);
          worksheet.getCell(groupStartRow, column.number).alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
          };
        }
        
        // Start new group
        currentFamilyId = familyId;
        groupStartRow = rowNumber;
      }
    });

    // Merge last group
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

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "data-keluarga.xlsx");
};

export default function FamilyTable() {
  // State for regions (needed for column filters)
  const [regions, setRegions] = useState<Region[]>([]);

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
  const columns = getFamilyColumns(regions);

  return (
    <DataTable<HomeTable>
      fetchData={getHomes}
      deleteItem={deleteHome}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-keluarga",
        sheetName: "Keluarga",
      }}
      title="Jumlah Data"
      createPath="/family/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus keluarga ini?"
      deleteSuccessMessage="Keluarga berhasil dihapus"
      onExport={exportFamilyToExcel}
    />
  );
}