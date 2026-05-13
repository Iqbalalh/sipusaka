"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Progress, Skeleton } from "antd";
import { FaChild, FaHeart, FaStar, FaHandHoldingHeart } from "react-icons/fa6";
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";

// Utils
import { deleteChildren, getChildrenForExport } from "@/utils/services/children.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrenColumns } from "./children.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_DASHBOARD } from "@/constants/endpoint";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// FORMAT CURRENCY HELPER
// ==============================================
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

// ==============================================
// INLINE INSIGHT PANEL
// ==============================================
function ChildrenInsightPanel({ data, loading }: { data: Children[] | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/3">
            <Skeleton active paragraph={{ rows: 1 }} title={{ width: "60%" }} />
          </div>
        ))}
      </div>
    );
  }

  const totalChildren = data.length;
  const activeChildren = data.filter((c) => c.isActive).length;
  const abkCount = data.filter((c) => !c.isCondition).length;
  const totalDana = data.reduce((s, c) => s + (Number((c as any).totalAssistanceAmount) || 0), 0);

  const tiles = [
    { icon: <FaChild />, label: "Jumlah Anak", value: totalChildren, sub: `${activeChildren} aktif`, color: "bg-blue-500" },
    { icon: <FaHeart />, label: "Anak Aktif", value: activeChildren, sub: `${totalChildren - activeChildren} non-aktif`, color: "bg-emerald-500" },
    { icon: <FaStar />, label: "Total ABK", value: abkCount, sub: "Tertampil", color: "bg-amber-500" },
    { icon: <FaHandHoldingHeart />, label: "Dana Bantuan", value: fmt(totalDana), sub: "Tertampil", color: "bg-rose-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {tiles.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white text-sm shadow ${t.color}`}>
            {t.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">{t.label}</p>
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">{t.value}</p>
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
const exportChildrenToExcel = async (
  exportData: Children[],
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Anak Asuh", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    worksheet.columns = [
      { header: "ID Anak", key: "id", width: 15 },
      { header: "Foto", key: "childrenPict", width: 40 },
      { header: "Nama Anak", key: "childrenName", width: 25 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Anak ke-", key: "index", width: 12 },
      { header: "Jenis Kelamin", key: "childrenGender", width: 15 },
      { header: "Tanggal Lahir", key: "childrenBirthdate", width: 20 },
      { header: "Usia", key: "age", width: 12 },
      { header: "Jenjang Pendidikan", key: "educationLevel", width: 20 },
      { header: "Tingkat Pendidikan", key: "educationGrade", width: 20 },
      { header: "Nama Sekolah", key: "schoolName", width: 30 },
      { header: "Pekerjaan", key: "childrenJob", width: 25 },
      { header: "Nama Orangtua", key: "parentName", width: 30 },
      { header: "Nama Wali", key: "waliName", width: 25 },
      { header: "Yatim/Piatu", key: "yatimStatus", width: 15 },
      { header: "Wilayah", key: "regionName", width: 20 },
      { header: "Jumlah Bantuan", key: "jumlahBantuan", width: 16 },
      { header: "Total Dana Bantuan", key: "totalAssistanceAmount", width: 22 },
      { header: "Status", key: "isActive", width: 15 },
      { header: "Kondisi", key: "isCondition", width: 15 },
      { header: "Keterangan", key: "notes", width: 40 },
      { header: "Alamat Anak", key: "childrenAddress", width: 40 },
      { header: "Telepon Anak", key: "childrenPhone", width: 20 },
      { header: "Dibuat Pada", key: "createdAt", width: 20 },
      { header: "Diperbarui Pada", key: "updatedAt", width: 20 },
      { header: "Dibuat Oleh", key: "createdBy", width: 15 },
      { header: "Diedit Oleh", key: "editedBy", width: 15 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    setProgress(50);

    const dataRows: any[] = [];
    exportData.forEach((child) => {
      const father = child.isFatherAlive;
      const mother = child.isMotherAlive;
      let yatimStatus = "Tidak";
      if (!father && mother) yatimStatus = "Yatim";
      else if (father && !mother) yatimStatus = "Piatu";
      else if (!father && !mother) yatimStatus = "Yatim Piatu";

      dataRows.push({
        id: child.id,
        childrenPict: child.childrenPict || "-",
        childrenName: child.childrenName || "-",
        nik: child.nik || "-",
        index: child.index ? `${child.index}` : "-",
        childrenGender: child.childrenGender === "M" ? "Laki-laki" : "Perempuan",
        childrenBirthdate: child.childrenBirthdate ? formatDate(child.childrenBirthdate) : "-",
        age: child.age ? `${child.age} Tahun` : "-",
        educationLevel: child.educationLevel || "-",
        educationGrade: child.educationGrade || "-",
        schoolName: child.schoolName || "-",
        childrenJob: child.childrenJob || "-",
        parentName: `${child.homes?.employees?.employeeName || "-"} - ${child.homes?.partners?.partnerName || "-"}`,
        waliName: child.homes?.wali?.waliName || "-",
        yatimStatus,
        regionName: child.homes?.employees?.regions?.regionName || child.homes?.regions?.regionName || "-",
        jumlahBantuan: (child as any)?._count?.childAssistance ?? 0,
        totalAssistanceAmount: fmt(Number((child as any).totalAssistanceAmount) || 0),
        isActive: child.isActive ? "Aktif" : "Tidak Aktif",
        isCondition: child.isCondition ? "Normal" : "ABK",
        notes: child.notes || "-",
        childrenAddress: child.childrenAddress || "-",
        childrenPhone: child.childrenPhone || "-",
        createdAt: child.createdAt ? formatDate(child.createdAt) : "-",
        updatedAt: child.updatedAt ? formatDate(child.updatedAt) : "-",
        createdBy: (child as any)?.createdByStaffName || child.createdBy || "-",
        editedBy: (child as any)?.editedByStaffName || child.editedBy || "-",
      });
    });

    dataRows.forEach((row, index) => {
      const excelRow = worksheet.addRow(row);
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      if (dataRows.length > 10 && index % Math.floor(dataRows.length / 10) === 0) {
        setProgress(50 + Math.floor((index / dataRows.length) * 30));
      }
    });

    setProgress(80);

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
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "data-anak-asuh.xlsx");
    setProgress(100);
    setTimeout(() => { setShowProgress(false); setProgress(0); }, 1000);
  } catch (error) {
    console.error("Export failed:", error);
    setShowProgress(false);
    setProgress(0);
  }
};

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function ChildrenTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [regions, setRegions] = useState<Region[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eduFilters, setEduFilters] = useState<{ text: string; value: string }[]>([]);
  const [visibleData, setVisibleData] = useState<Children[] | null>(null);

  useEffect(() => {
    getRegionsList().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    fetchWithAuth(`${API_DASHBOARD}/education-levels`)
      .then((res) => res.json())
      .then((json) => {
        const levels = Object.keys(json.data ?? {}).sort();
        setEduFilters(levels.map((l) => ({ text: l, value: l })));
      })
      .catch(console.error);
  }, []);

  const columns = getChildrenColumns(regions, session?.user?.role, eduFilters);

  const handleExport = useCallback(async (filteredData: Children[]) => {
    await exportChildrenToExcel(filteredData, setShowProgress, setProgress);
  }, []);

  return (
    <div>
      <ChildrenInsightPanel data={visibleData} loading={visibleData === null} />

      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sedang mengekspor data...</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      <DataTable<Children>
        fetchData={getChildrenForExport}
        deleteItem={isAdmin ? deleteChildren : undefined}
        columns={columns}
        rowKey="id"
        exportConfig={{ filename: "data-anak-asuh", sheetName: "Anak Asuh" }}
        onExport={handleExport}
        onFilteredDataChange={setVisibleData}
        title="Jumlah Data Anak Asuh"
        showSearch={true}
        createPath={isAdmin ? "/children/create" : undefined}
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus data anak asuh ini?"
        deleteSuccessMessage="Anak asuh berhasil dihapus"
      />
    </div>
  );
}
