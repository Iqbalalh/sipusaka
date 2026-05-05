"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Modal, Input, Spin, Button as AntButton } from "antd";
import {
  LoadingOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  ChildAssistance,
  deleteChildAssistance,
  getAllChildAssistanceOptimized,
} from "@/utils/services/childassistance.service";
import { formatDate } from "@/utils/formatter/formatDate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
// BADGE HELPERS
// ==============================================
const LevelBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
      {value}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  );

const ProviderBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      {value}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  );

const RegionBadge = ({ value }: { value?: string | null }) =>
  value ? (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
      {value}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  );

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

  const [data, setData] = useState<ChildAssistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================
  // FETCH
  // ==========================
  const fetchData = useCallback(
    async (page: number, search: string) => {
      setLoading(true);
      try {
        const res = await getAllChildAssistanceOptimized(page, pageSize, search);
        const rows = Array.isArray(res.data) ? res.data : [];
        setData(
          [...rows].sort(
            (a, b) =>
              new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime()
          )
        );
        setTotal(res.pagination?.total ?? 0);
        setCurrentPage(res.pagination?.page ?? page);
      } catch (err) {
        notifyFromResult(notifyRef.current, { error: err });
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  // Initial fetch (read URL params)
  useEffect(() => {
    const pg = parseInt(searchParams.get("page") ?? "1", 10);
    const sq = searchParams.get("search") ?? "";
    setCurrentPage(pg);
    setSearchQuery(sq);
    fetchData(pg, sq);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search debounce
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchData(1, searchQuery), 500);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, fetchData]);

  const updateUrl = (page: number, search = searchQuery) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(page));
    if (search.trim()) p.set("search", search); else p.delete("search");
    router.push(`?${p.toString()}`, { scroll: false });
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteChildAssistance(deleteId);
      await fetchData(currentPage, searchQuery);
      setIsDeleteModalOpen(false);
      notifyFromResult(notifyRef.current, { successMessage: "Data bantuan anak berhasil dihapus" });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // EXPORT
  // ==========================
  const handleExport = async () => {
    if (data.length === 0) return;
    setExportLoading(true);
    try {
      await exportToExcel(data);
      notifyFromResult(notifyRef.current, {
        successMessage: `Export ${data.length} data berhasil!`,
      });
    } catch (err) {
      notifyFromResult(notifyRef.current, { error: err });
    } finally {
      setExportLoading(false);
    }
  };

  // ==========================
  // PAGINATION HELPERS
  // ==========================
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateUrl(page);
    fetchData(page, searchQuery);
  };

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
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total:{" "}
            <span className="font-bold text-gray-900 dark:text-white">{total}</span>
            {" "}data
          </p>
          <Input
            placeholder="Cari nama anak, penyedia, tingkat pendidikan..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            style={{ width: 320 }}
          />
        </div>
        <div className="flex gap-2">
          <AntButton
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportLoading}
            disabled={data.length === 0}
          >
            Export ({data.length})
          </AntButton>
          {isAdmin && (
            <Link href="/childassistance/create">
              <AntButton type="primary" icon={<PlusOutlined />}>
                Tambah
              </AntButton>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">#</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Nama Anak</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Tanggal</th>
              <th className="px-4 py-3 text-right font-semibold whitespace-nowrap">Jumlah</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Penyedia</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Jenjang Pendidikan</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Kelas / Sekolah</th>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Wilayah</th>
              <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Dokumen</th>
              {isAdmin && (
                <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="py-16 text-center text-gray-400">
                  <Spin indicator={<LoadingOutlined spin />} size="large" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="py-16 text-center text-gray-400">
                  {searchQuery ? "Tidak ada data yang cocok dengan pencarian." : "Belum ada data bantuan anak."}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors ${
                    index % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/30" : "bg-white dark:bg-transparent"
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {item.assistanceNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {item.children?.childrenName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {item.assistanceDate ? formatDate(item.assistanceDate) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {item.assistanceAmount
                      ? `Rp ${item.assistanceAmount.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ProviderBadge value={item.assistanceProvider} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <LevelBadge value={item.educationLevel} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    <span>{item.educationGrade ?? "-"}</span>
                    {item.schoolName && (
                      <span className="block text-xs text-gray-400 truncate max-w-[180px]">
                        {item.schoolName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <RegionBadge value={item.children?.homes?.regions?.regionName} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                    {(item.childAssistanceDocs?.length ?? 0) > 0
                      ? `${item.childAssistanceDocs!.length} dokumen`
                      : "-"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1.5 justify-center">
                        <AntButton
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() =>
                            item.childrenId &&
                            router.push(`/children/view/${item.childrenId}`)
                          }
                        />
                        <AntButton
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            if (item.id) {
                              setDeleteId(item.id);
                              setIsDeleteModalOpen(true);
                            }
                          }}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && total > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Menampilkan{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)}
            </span>{" "}
            dari <span className="font-semibold text-gray-900 dark:text-white">{total}</span> data
          </p>
          <div className="flex items-center gap-1">
            <AntButton
              size="small"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              &laquo;
            </AntButton>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <AntButton
                  key={page}
                  size="small"
                  type={page === currentPage ? "primary" : "default"}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </AntButton>
              );
            })}
            <AntButton
              size="small"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              &raquo;
            </AntButton>
          </div>
        </div>
      )}
    </>
  );
}
