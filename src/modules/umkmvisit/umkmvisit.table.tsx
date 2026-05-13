"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Skeleton, Progress } from "antd";
import { FaStore, FaDollarSign, FaBoxOpen, FaLayerGroup } from "react-icons/fa6";
import DataTable from "@/components/custom/table/DataTable";

// Types
import { UmkmVisit } from "@/utils/services/umkmvisit.service";

// Utils
import { getUmkmVisits, deleteUmkmVisit } from "@/utils/services/umkmvisit.service";
import { getUmkmVisitColumns } from "./umkmvisit.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// FORMAT CURRENCY
// ==============================================
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

// ==============================================
// INSIGHT PANEL
// ==============================================
function UmkmVisitInsightPanel({ data, loading }: { data: UmkmVisit[] | null; loading: boolean }) {
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

  const totalKunjungan = data.length;
  const totalNilai = data.reduce((s, r) => s + (r.value ?? 0), 0);
  const uniqueSumber = new Set(data.map((r) => r.assistanceSource).filter(Boolean)).size;
  const uniqueUmkm = new Set(data.map((r) => r.umkmId)).size;

  const tiles = [
    { icon: <FaStore />, label: "Total Kunjungan", value: totalKunjungan, sub: "kunjungan tampil", color: "bg-rose-500" },
    { icon: <FaDollarSign />, label: "Total Nilai", value: fmt(totalNilai), sub: "seluruh bantuan", color: "bg-emerald-500" },
    { icon: <FaLayerGroup />, label: "Sumber Dana", value: uniqueSumber, sub: "sumber unik", color: "bg-blue-500" },
    { icon: <FaBoxOpen />, label: "UMKM Unik", value: uniqueUmkm, sub: "UMKM penerima", color: "bg-amber-500" },
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
// EXCEL EXPORT
// ==============================================
const exportUmkmVisitToExcel = async (
  filteredData: UmkmVisit[],
  setShowProgress: (show: boolean) => void,
  setProgress: (progress: number) => void
) => {
  try {
    setShowProgress(true);
    setProgress(10);
    if (!filteredData || filteredData.length === 0) { setShowProgress(false); return; }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Bantuan UMKM", { views: [{ state: "frozen", ySplit: 1 }] });
    setProgress(40);

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Kunjungan ke-", key: "visitNumber", width: 15 },
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

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    setProgress(50);

    filteredData.forEach((record, index) => {
      const excelRow = worksheet.addRow({
        id: record.id,
        visitNumber: record.visitNumber || "-",
        businessName: record.umkm?.businessName || "-",
        ownerName: record.umkm?.ownerName || "-",
        assistanceDate: record.assistanceDate ? formatDate(record.assistanceDate) : "-",
        assistanceType: record.assistanceType || "-",
        itemType: record.itemType || "-",
        assistanceAmount: record.assistanceAmount ? record.assistanceAmount.toLocaleString("id-ID") : "-",
        assistanceSource: record.assistanceSource || "-",
        value: record.value ? `Rp ${record.value.toLocaleString("id-ID")}` : "-",
        notes: record.notes || "-",
        docCount: record.umkmVisitDocs?.length || 0,
        createdAt: record.createdAt ? formatDate(record.createdAt) : "-",
      });
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; });
      }
      excelRow.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      if (filteredData.length > 10 && index % Math.floor(filteredData.length / 10) === 0) {
        setProgress(50 + Math.floor((index / filteredData.length) * 40));
      }
    });

    setProgress(90);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "data-bantuan-umkm.xlsx");
    setProgress(100);
    setTimeout(() => { setShowProgress(false); setProgress(0); }, 1000);
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

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function UmkmVisitTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const [allData, setAllData] = useState<UmkmVisit[]>([]);
  const [visibleData, setVisibleData] = useState<UmkmVisit[] | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const assistanceSources = useMemo(
    () => [...new Set(allData.map((r) => r.assistanceSource).filter(Boolean) as string[])].sort(),
    [allData]
  );
  const assistanceTypes = useMemo(
    () => [...new Set(allData.map((r) => r.assistanceType).filter(Boolean) as string[])].sort(),
    [allData]
  );
  // Count total visits per UMKM across the full dataset
  const visitCountMap = useMemo(() => {
    const map = new Map<number, number>();
    allData.forEach((r) => {
      map.set(r.umkmId, (map.get(r.umkmId) ?? 0) + 1);
    });
    return map;
  }, [allData]);

  const fetchAll = useCallback(async (): Promise<UmkmVisit[]> => {
    const data = await fetchUmkmVisitData();
    setAllData(data);
    return data;
  }, []);

  const columns = useMemo(
    () => getUmkmVisitColumns(session?.user?.role, assistanceSources, assistanceTypes, visitCountMap),
    [session?.user?.role, assistanceSources, assistanceTypes, visitCountMap]
  );

  const handleExport = useCallback(async (filteredData: UmkmVisit[]) => {
    await exportUmkmVisitToExcel(filteredData, setShowProgress, setProgress);
  }, []);

  return (
    <div>
      <UmkmVisitInsightPanel data={visibleData} loading={visibleData === null} />

      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sedang mengekspor data...</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      <DataTable<UmkmVisit>
        fetchData={fetchAll}
        deleteItem={isAdmin ? deleteUmkmVisit : undefined}
        columns={columns}
        rowKey="id"
        title="Jumlah Data Kunjungan UMKM"
        pageSize={50}
        scrollY={500}
        deleteConfirmTitle="Konfirmasi Hapus"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus bantuan UMKM ini?"
        deleteSuccessMessage="Bantuan UMKM berhasil dihapus"
        onExport={handleExport}
        onFilteredDataChange={setVisibleData}
        exportConfig={{ filename: "data-bantuan-umkm", sheetName: "Bantuan UMKM" }}
      />
    </div>
  );
}
