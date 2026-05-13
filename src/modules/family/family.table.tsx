"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Progress, Skeleton } from "antd";
import {
  FaUsers,
  FaChild,
  FaDollarSign,
  FaHandHoldingHeart,
} from "react-icons/fa6";
import DataTable from "@/components/custom/table/DataTable";

// Types
import { HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteHome,
  getAllHomes,
  getHomesForExport,
} from "@/utils/services/home.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getFamilyColumns } from "./family.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// FORMAT CURRENCY HELPER
// ==============================================
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

// ==============================================
// INLINE INSIGHT PANEL
// ==============================================
function FamilyInsightPanel({
  data,
  loading,
}: {
  data: HomeTable[] | null;
  loading: boolean;
}) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/3"
          >
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  const totalFamilies = data.length;
  const activeFamilies = data.filter((h) => h.partners?.isActive).length;
  const totalChildren = data.reduce((s, h) => s + (h._count?.children ?? 0), 0);
  const totalDana = data.reduce(
    (s, h) => s + ((h as any).totalAssistanceAmount ?? 0),
    0,
  );

  const tiles = [
    {
      icon: <FaHandHoldingHeart />,
      label: "Keluarga Aktif",
      value: activeFamilies,
      sub: `${totalFamilies - activeFamilies} non-aktif`,
      color: "bg-emerald-500",
    },
    {
      icon: <FaUsers />,
      label: "Jumlah Data",
      value: totalFamilies,
      sub: `${activeFamilies} aktif`,
      color: "bg-blue-500",
    },
    {
      icon: <FaChild />,
      label: "Total Anak",
      value: totalChildren,
      sub: "Tertampil",
      color: "bg-indigo-500",
    },

    {
      icon: <FaDollarSign />,
      label: "Total Dana Bantuan Anak",
      value: fmt(totalDana),
      sub: "Tertampil",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/3"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm shadow ${t.color}`}
          >
            {t.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">
              {t.label}
            </p>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">
              {t.value}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================================
// EXCEL EXPORT FUNCTION WITH PROGRESS
// ==============================================
const exportFamilyToExcel = async (
  exportData: HomeTable[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void,
) => {
  try {
    setShowProgress(true);
    setProgress(10);

    if (!exportData || exportData.length === 0) {
      setShowProgress(false);
      return;
    }

    setProgress(30);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Keluarga", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

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
      { header: "Anak Aktif", key: "activeChildrenCount", width: 15 },
      { header: "Anak Tidak Aktif", key: "inactiveChildrenCount", width: 18 },
      { header: "UMKM", key: "isUmkm", width: 15 },
      { header: "Total Dana Bantuan", key: "totalAssistanceAmount", width: 22 },
      { header: "Tanggal Dibuat", key: "createdAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
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

    const dataRows: any[] = [];
    exportData.forEach((home) => {
      const children = (home as any).children || [];
      const totalAmt = (home as any).totalAssistanceAmount ?? 0;
      const base = {
        id: home.id,
        nipNipp: home.employees?.nipNipp || "-",
        employeeName: home.employees?.employeeName || "-",
        employeeGender:
          home.employees?.employeeGender === "M" ? "Laki-laki" : "Perempuan",
        regionName:
          home.regions?.regionName ||
          home.employees?.regions?.regionName ||
          "-",
        partnerName: home.partners?.partnerName || "-",
        partnerStatus: home.partners?.isActive ? "Aktif" : "Tidak Aktif",
        waliName: home.wali?.waliName || "-",
        address: home.partners?.address || "-",
        postalCode: home.postalCode || home.partners?.postalCode || "-",
        phoneNumber: home.partners?.phoneNumber || "-",
        homeCoordinate: home.partners?.homeCoordinate || "-",
        childrenCount: home._count?.children || 0,
        activeChildrenCount: children.filter((c: any) => c.isActive).length,
        inactiveChildrenCount: children.filter((c: any) => !c.isActive).length,
        isUmkm: (home as any).isUmkm ? "Ya" : "Tidak",
        totalAssistanceAmount: fmt(totalAmt),
        createdAt: home.createdAt ? formatDate(home.createdAt) : "-",
      };
      if (children.length === 0) {
        dataRows.push({
          ...base,
          childrenName: "-",
          childrenGender: "-",
          childrenBirthdate: "-",
        });
      } else {
        children.forEach((child: any) => {
          dataRows.push({
            ...base,
            childrenName: child.childrenName || "-",
            childrenGender:
              child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
            childrenBirthdate: child.childrenBirthdate
              ? formatDate(child.childrenBirthdate)
              : "-",
          });
        });
      }
    });

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
        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      if (
        dataRows.length > 10 &&
        index % Math.floor(dataRows.length / 10) === 0
      ) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

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
      "activeChildrenCount",
      "inactiveChildrenCount",
      "isUmkm",
      "totalAssistanceAmount",
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
        const familyId = row.getCell("id").value as number;
        if (familyId !== currentFamilyId) {
          if (currentFamilyId !== null && rowNumber - groupStartRow > 1) {
            worksheet.mergeCells(
              groupStartRow,
              column.number,
              rowNumber - 1,
              column.number,
            );
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
        worksheet.mergeCells(
          groupStartRow,
          column.number,
          lastRow,
          column.number,
        );
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
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "data-keluarga.xlsx",
    );
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

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function FamilyTable() {
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [regions, setRegions] = useState<Region[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visibleData, setVisibleData] = useState<HomeTable[] | null>(null);

  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
  }, []);

  const columns = getFamilyColumns(regions, session?.user?.role);

  const handleExport = useCallback(async (filteredData: HomeTable[]) => {
    const filteredIds = new Set(filteredData.map((h) => h.id));
    const allExportData = await getHomesForExport();
    const exportData = allExportData.filter((h) => filteredIds.has(h.id));
    await exportFamilyToExcel(exportData, setShowProgress, setProgress);
  }, []);

  return (
    <div>
      <FamilyInsightPanel data={visibleData} loading={visibleData === null} />

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
        onFilteredDataChange={setVisibleData}
        title="Jumlah Data Keluarga"
        showSearch={true}
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
