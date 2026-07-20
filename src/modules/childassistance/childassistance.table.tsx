"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Modal, Input, Button as AntButton } from "antd";
import type { TableProps } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  ChildAssistance,
  deleteChildAssistance,
  getAllChildAssistanceOptimized,
} from "@/utils/services/childassistance.service";
import { getChildAssistanceColumns } from "./childassistance.columns";
import { Region } from "@/types/models/region";
import { getRegionsList } from "@/utils/services/region.service";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ==============================================
// CLIENT-SIDE FILTER KEYS (kept in URL for bookmark/share)
// ==============================================
const CLIENT_FILTER_KEYS = [
  "assistanceProvider",
  "educationLevel",
  "regionId",
  "assistanceDate",
] as const;

// ==============================================
// EXCEL EXPORT
// ==============================================
const exportToExcel = async (data: ChildAssistance[]) => {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Bantuan Anak", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  ws.columns = [
    { header: "Bantuan Ke-", key: "assistanceNumber", width: 14 },
    { header: "Nama Anak", key: "childrenName", width: 26 },
    { header: "Tanggal Bantuan", key: "assistanceDate", width: 20 },
    { header: "Jenis Bantuan", key: "assistanceType", width: 20 },
    { header: "Jumlah Bantuan", key: "assistanceAmount", width: 22 },
    { header: "Penyedia Bantuan", key: "assistanceProvider", width: 26 },
    { header: "Tingkat Pendidikan", key: "educationLevel", width: 20 },
    { header: "Kelas", key: "educationGrade", width: 12 },
    { header: "Nama Sekolah", key: "schoolName", width: 30 },
    { header: "Usia", key: "age", width: 10 },
    { header: "Wilayah", key: "regionName", width: 20 },
    { header: "Catatan", key: "notes", width: 40 },
  ];

  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    cell.border = {
      top: { style: "thin" }, bottom: { style: "thin" },
      left: { style: "thin" }, right: { style: "thin" },
    };
  });

  data.forEach((item, index) => {
    const row = ws.addRow({
      assistanceNumber: item.assistanceNumber ?? "-",
      childrenName: item.children?.childrenName ?? "-",
      assistanceDate: item.assistanceDate ? formatDate(item.assistanceDate) : "-",
      assistanceType: item.assistanceType ?? "-",
      assistanceAmount: item.assistanceAmount
        ? `Rp ${item.assistanceAmount.toLocaleString("id-ID")}`
        : "-",
      assistanceProvider: item.assistanceProvider ?? "-",
      educationLevel: item.educationLevel ?? "-",
      educationGrade: item.educationGrade ?? "-",
      schoolName: item.schoolName ?? "-",
      age: item.age ? `${item.age} tahun` : "-",
      regionName: item.children?.homes?.regions?.regionName ?? "-",
      notes: item.notes ?? "-",
    });
    if (index % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      });
    }
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "Bantuan_Anak.xlsx"
  );
};

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function ChildAssistanceTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const page = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";
  const urlFilters: Record<string, any[]> = useMemo(() => {
    try {
      return JSON.parse(searchParams.get("filters") || "{}");
    } catch {
      return {};
    }
  }, [searchParams]);

  const [allData, setAllData] = useState<ChildAssistance[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // The rows that survive search + column filters (kept in sync via Table.onChange)
  const [visibleRows, setVisibleRows] = useState<ChildAssistance[]>([]);

  // ==========================
  // URL HELPER
  // ==========================
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      router.push(`?${p.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ==========================
  // FETCH (all records once, client-side table)
  // ==========================
  const loadData = useCallback(() => {
    setLoading(true);
    // Large pageSize → load everything; the optimized payload includes region data
    getAllChildAssistanceOptimized(1, 100000, "")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setAllData(
          [...rows].sort(
            (a, b) =>
              new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime()
          )
        );
      })
      .catch((err) => {
        notifyFromResult(notifyRef.current, { error: err });
        setAllData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
    getRegionsList().then(setRegions).catch(() => {});
  }, [loadData]);

  // ==========================
  // CLIENT-SIDE SEARCH
  // ==========================
  const searchedData = useMemo(() => {
    if (!urlSearch.trim()) return allData;
    const q = urlSearch.toLowerCase();
    return allData.filter(
      (r) =>
        r.children?.childrenName?.toLowerCase().includes(q) ||
        r.assistanceProvider?.toLowerCase().includes(q) ||
        r.educationLevel?.toLowerCase().includes(q) ||
        r.schoolName?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
    );
  }, [allData, urlSearch]);

  // Keep visibleRows aligned when search changes (before Table.onChange fires)
  useEffect(() => {
    setVisibleRows(searchedData);
  }, [searchedData]);

  const handleSearch = useCallback(
    (val: string) => pushParams({ search: val, page: "1" }),
    [pushParams]
  );

  // ==========================
  // TABLE CHANGE (persist column filters in URL, track visible rows)
  // ==========================
  const handleTableChange: TableProps<ChildAssistance>["onChange"] = useCallback(
    (_pagination: any, filters: Record<string, any>, _sorter: any, extra: any) => {
      // Persist client-side column filters in the URL
      const cleaned: Record<string, any[]> = {};
      CLIENT_FILTER_KEYS.forEach((key) => {
        const vals = filters[key];
        if (vals && vals.length > 0) cleaned[key] = vals;
      });
      const next = JSON.stringify(cleaned);
      const current = JSON.stringify(urlFilters);
      if (next !== current) {
        pushParams({ filters: Object.keys(cleaned).length > 0 ? next : "", page: "1" });
      }
      // Track the effectively-visible rows for export
      if (extra?.currentDataSource) {
        setVisibleRows(extra.currentDataSource as ChildAssistance[]);
      }
    },
    [urlFilters, pushParams]
  );

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteChildAssistance(deleteId);
      setIsDeleteModalOpen(false);
      loadData();
      notifyFromResult(notifyRef.current, { successMessage: "Data bantuan anak berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteId, loadData]);

  // ==========================
  // EXPORT (whatever is currently visible after search + filters)
  // ==========================
  const handleExport = useCallback(async () => {
    if (visibleRows.length === 0) return;
    setExportLoading(true);
    try {
      await exportToExcel(visibleRows);
      notifyFromResult(notifyRef.current, {
        successMessage: `Export ${visibleRows.length} data berhasil!`,
      });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setExportLoading(false);
    }
  }, [visibleRows]);

  // ==========================
  // COLUMNS
  // ==========================
  const providers = useMemo(
    () =>
      [...new Set(allData.map((r) => r.assistanceProvider).filter(Boolean) as string[])].sort(),
    [allData]
  );
  const educationLevels = useMemo(
    () =>
      [...new Set(allData.map((r) => r.educationLevel?.trim()).filter(Boolean) as string[])].sort(),
    [allData]
  );

  const baseColumns = useMemo(
    () =>
      getChildAssistanceColumns(
        regions,
        educationLevels,
        providers,
        session?.user?.role,
        isAdmin
          ? (id) => {
              setDeleteId(id);
              setIsDeleteModalOpen(true);
            }
          : undefined
      ),
    [regions, educationLevels, providers, session?.user?.role, isAdmin]
  );

  // Reflect URL filters back into the Table's controlled filter state.
  // antd requires ALL filterable columns to be controlled once any is — so
  // every column with filters/filterDropdown gets an explicit filteredValue.
  const columns = useMemo(
    () =>
      baseColumns.map((col) => {
        const key = col.key as string;
        if (CLIENT_FILTER_KEYS.includes(key as any)) {
          return { ...col, filteredValue: urlFilters[key] ?? null };
        }
        if ((col as any).filters !== undefined || (col as any).filterDropdown !== undefined) {
          return { ...col, filteredValue: null };
        }
        return col;
      }),
    [baseColumns, urlFilters]
  );

  // ==========================
  // RENDER
  // ==========================
  return (
    <>
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
        <p>Apakah Anda yakin ingin menghapus data bantuan anak ini?</p>
      </Modal>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        <div className="w-full max-w-[360px]">
          <Input.Search
            placeholder="Cari nama anak, penyedia, tingkat pendidikan..."
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
        <div className="flex gap-2">
          <AntButton
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportLoading}
            disabled={visibleRows.length === 0}
          >
            Export ({visibleRows.length})
          </AntButton>
        </div>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={searchedData}
        rowKey="id"
        bordered
        loading={loading}
        // Each row has a `children` object (child info); prevent antd from
        // treating it as nested tree rows by pointing at an unused key.
        expandable={{ childrenColumnName: "__childRows__" }}
        pagination={{
          current: page,
          pageSize: 20,
          total: searchedData.length,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} dari ${t} data`,
          onChange: (p) => pushParams({ page: String(p) }),
        }}
        onChange={handleTableChange}
        scroll={{ x: "max-content", y: 520 }}
      />
    </>
  );
}
