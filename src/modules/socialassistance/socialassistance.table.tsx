"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Progress, Skeleton } from "antd";
import { Button as AntButton } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  DownloadOutlined,
  PlusOutlined,
  EyeOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { FaUsers, FaDollarSign, FaMoneyBill, FaMapMarkerAlt } from "react-icons/fa";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

import { SocialAssistance } from "@/utils/services/socialassistance.service";
import {
  deleteSocialAssistance,
  getAllSocialAssistanceOptimized,
} from "@/utils/services/socialassistance.service";
import { getSocialAssistanceColumns } from "./socialassistance.columns";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { MEDICAL_EQUIPMENT_OPTIONS } from "./socialassistance.constants";
import ImportModal from "./components/ImportModal";

// ==============================================
// FORMAT CURRENCY
// ==============================================
const fmt = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

// ==============================================
// INSIGHT PANEL
// ==============================================
function SocialAssistanceInsightPanel({
  data,
  total,
  loading,
}: {
  data: SocialAssistance[];
  total: number;
  loading: boolean;
}) {
  if (loading && data.length === 0) {
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

  const totalDana = data.reduce((s, r) => s + (r.totalAmount ?? 0), 0);
  const totalUang = data.reduce((s, r) => s + (r.cashAmount ?? 0), 0);
  const uniqueWilayah = new Set(data.map((r) => r.region).filter(Boolean)).size;

  const tiles = [
    {
      icon: <FaUsers />,
      label: "Penerima",
      value: total,
      sub: "total penerima",
      color: "bg-blue-500",
    },
    {
      icon: <FaDollarSign />,
      label: "Total Dana",
      value: fmt(totalDana),
      sub: "seluruh bantuan",
      color: "bg-emerald-500",
    },
    {
      icon: <FaMoneyBill />,
      label: "Total Uang Tunai",
      value: fmt(totalUang),
      sub: "komponen tunai",
      color: "bg-indigo-500",
    },
    {
      icon: <FaMapMarkerAlt />,
      label: "Wilayah",
      value: uniqueWilayah,
      sub: "wilayah unik",
      color: "bg-amber-500",
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
const exportSocialAssistanceToExcel = async (
  exportData: SocialAssistance[],
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
    const worksheet = workbook.addWorksheet("Data Bantuan Sosial", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    setProgress(40);

    worksheet.columns = [
      { header: "No", key: "no", width: 8 },
      { header: "NIP/NIPP", key: "nipNipp", width: 20 },
      { header: "Nama Penerima", key: "recipientName", width: 25 },
      { header: "Alamat KTP", key: "ktpAddress", width: 40 },
      { header: "Wilayah (PD)", key: "region", width: 20 },
      { header: "Kondisi/Penyakit", key: "condition", width: 25 },
      { header: "Alat Kesehatan", key: "medicalEquipment", width: 30 },
      { header: "Uang", key: "cashAmount", width: 20 },
      { header: "Total", key: "totalAmount", width: 20 },
      { header: "Keterangan", key: "notes", width: 30 },
      { header: "Tanggal Dibuat", key: "createdAt", width: 20 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    setProgress(50);

    exportData.forEach((item, index) => {
      let medicalEquipmentStr = "-";
      if (item.medicalEquipment) {
        const typeLabel =
          MEDICAL_EQUIPMENT_OPTIONS.find((opt) => opt.value === item.medicalEquipment)?.label ||
          item.medicalEquipment;
        const quantity = item.equipmentQuantity || 1;
        const nominal = item.equipmentNominal || 0;
        medicalEquipmentStr =
          nominal > 0
            ? `${typeLabel} (${quantity}x Rp ${nominal.toLocaleString("id-ID")})`
            : typeLabel;
      }

      const excelRow = worksheet.addRow({
        no: index + 1,
        nipNipp: item.nipNipp || "-",
        recipientName: item.recipientName || "-",
        ktpAddress: item.ktpAddress || "-",
        region: item.region || "-",
        condition: item.condition || "-",
        medicalEquipment: medicalEquipmentStr,
        cashAmount: item.cashAmount ? `Rp ${item.cashAmount.toLocaleString("id-ID")}` : "-",
        totalAmount: item.totalAmount ? `Rp ${item.totalAmount.toLocaleString("id-ID")}` : "-",
        notes: item.notes || "-",
        createdAt: item.createdAt ? formatDate(item.createdAt) : "-",
      });

      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
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

      if (index % Math.max(1, Math.floor(exportData.length / 10)) === 0) {
        setProgress(50 + Math.floor((index / exportData.length) * 30));
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
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "data-bantuan-sosial.xlsx",
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
export default function SocialAssistanceTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";

  const pushParams = useCallback(
    (updates: Partial<Record<string, string>>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`/socialassistance?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const [data, setData] = useState<SocialAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Fetch on URL change
  useEffect(() => {
    setLoading(true);
    getAllSocialAssistanceOptimized(page, 50, urlSearch)
      .then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(res.pagination?.total ?? 0);
      })
      .catch((err) => {
        notifyFromResult(notify, { error: err });
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, urlSearch]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteSocialAssistance(deleteId);
      setIsDeleteModalOpen(false);
      getAllSocialAssistanceOptimized(page, 50, urlSearch).then((res) => {
        setData(Array.isArray(res.data) ? res.data : []);
        setTotal(res.pagination?.total ?? 0);
      });
      notifyFromResult(notify, { successMessage: "Data bantuan sosial berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, page, urlSearch, notify]);

  const handleExport = useCallback(async () => {
    if (exportLoading) return;
    setExportLoading(true);
    try {
      const res = await getAllSocialAssistanceOptimized(1, 99999, urlSearch);
      await exportSocialAssistanceToExcel(res.data, setShowProgress, setProgress);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportLoading(false);
    }
  }, [exportLoading, urlSearch]);

  const baseColumns = useMemo(
    () =>
      getSocialAssistanceColumns(session?.user?.role, isAdmin ? (id) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
      } : undefined),
    [session?.user?.role, isAdmin],
  );

  const columnsWithState = useMemo(
    () =>
      baseColumns.map((col) => ({
        ...col,
        filteredValue: (col as any).filterDropdown !== undefined ? null : undefined,
      })),
    [baseColumns],
  );

  return (
    <>
      {/* INSIGHT PANEL */}
      <SocialAssistanceInsightPanel data={data} total={total} loading={loading} />

      {/* DELETE MODAL */}
      <Modal
        title="Konfirmasi Hapus"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmLoading={deleteLoading}
        okText="Hapus"
        okButtonProps={{ danger: true }}
        cancelText="Batal"
        onOk={handleDelete}
      >
        <p>Apakah Anda yakin ingin menghapus data bantuan sosial ini?</p>
      </Modal>

      {/* IMPORT MODAL */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          getAllSocialAssistanceOptimized(page, 50, urlSearch).then((res) => {
            setData(Array.isArray(res.data) ? res.data : []);
            setTotal(res.pagination?.total ?? 0);
          });
        }}
      />

      {/* EXPORT PROGRESS */}
      {showProgress && (
        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sedang mengekspor data...
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <Progress percent={progress} status="active" strokeColor="#2563EB" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="socialassistance-search-wrap w-full max-w-[360px]">
          <style>{`
            .socialassistance-search-wrap .ant-input-search-button { box-shadow: none !important; }
            .socialassistance-search-wrap .ant-input-affix-wrapper-focused { clip-path: inset(-5px 0px -5px -5px) !important; }
            .socialassistance-search-wrap:focus-within .ant-input-search-button { border-color: #1677ff !important; box-shadow: 0 0 0 2px rgba(5,145,255,0.1) !important; clip-path: inset(-5px -5px -5px 0px); }
          `}</style>
          <Input.Search
            placeholder="Cari nama penerima, wilayah, kondisi..."
            value={searchInput}
            onChange={(e) => {
              const val = e.target.value;
              setSearchInput(val);
              if (!val) handleSearch("");
            }}
            onSearch={handleSearch}
            enterButton="Cari"
            allowClear
            style={{ width: "100%" }}
          />
        </div>
        <div className="flex items-center gap-2">
          <AntButton
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setIsImportModalOpen(true)}
            style={{ background: "#16a34a", borderColor: "#15803d" }}
          >
            Import
          </AntButton>
          <AntButton
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportLoading}
            disabled={data.length === 0}
          >
            Export ({total})
          </AntButton>
          {isAdmin && (
            <Link href="/socialassistance/create">
              <AntButton type="primary">+</AntButton>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columnsWithState}
        dataSource={data}
        rowKey="id"
        bordered
        loading={loading}
        pagination={{
          current: page,
          pageSize: 50,
          total,
          showSizeChanger: false,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        scroll={{ x: "max-content", y: 500 }}
      />
    </>
  );
}
