"use client";

import { Tag } from "antd";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { DeleteOutlined } from "@ant-design/icons";
import { UmkmVisit } from "@/utils/services/umkmvisit.service";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";
import { getDateRangeFilterProps } from "@/utils/table/dateRangeFilter";

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getUmkmVisitColumns = (
  role?: string,
  assistanceSources: string[] = [],
  assistanceTypes: string[] = [],
  visitCountMap: Map<number, number> = new Map(),
  onDelete?: (id: number) => void,
): ColumnsType<UmkmVisit> => [
  {
    title: "Kunjungan ke-",
    dataIndex: "visitNumber",
    key: "visitNumber",
    width: 100,
    sorter: (a, b) => a.visitNumber - b.visitNumber,
    render: (value) => value || "-",
  },
  {
    title: "Total Bantuan",
    key: "totalVisits",
    width: 120,
    align: "center",
    sorter: (a, b) => (visitCountMap.get(a.umkmId) ?? 0) - (visitCountMap.get(b.umkmId) ?? 0),
    render: (_, record) => {
      const count = visitCountMap.get(record.umkmId) ?? 0;
      return (
        <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          {count}x
        </span>
      );
    },
  },
  {
    title: "Nama UMKM",
    dataIndex: "businessName",
    key: "businessName",
    render: (_, record) => record.umkm?.businessName || "-",
  },
  {
    title: "Pemilik",
    dataIndex: "ownerName",
    key: "ownerName",
    render: (_, record) => record.umkm?.ownerName || "-",
  },
  {
    title: "Tanggal Bantuan",
    dataIndex: "assistanceDate",
    key: "assistanceDate",
    width: 140,
    sorter: (a, b) => new Date(a.assistanceDate).getTime() - new Date(b.assistanceDate).getTime(),
    ...getDateRangeFilterProps<UmkmVisit>("assistanceDate"),
    render: (value) => (value ? formatDate(value) : "-"),
  },
  {
    title: "Jenis Bantuan",
    dataIndex: "assistanceType",
    key: "assistanceType",
    filters: assistanceTypes.map((t) => ({ text: t, value: t })),
    filterSearch: assistanceTypes.length > 8,
    onFilter: (value, record) => record.assistanceType === value,
    render: (value) => <Tag color="green">{value || "-"}</Tag>,
  },
  {
    title: "Jenis Barang",
    dataIndex: "itemType",
    key: "itemType",
    render: (value) => value || "-",
  },
  {
    title: "Jumlah Barang",
    dataIndex: "assistanceAmount",
    key: "assistanceAmount",
    width: 120,
    sorter: (a, b) => a.assistanceAmount - b.assistanceAmount,
    render: (value) => (value ? value.toLocaleString("id-ID") : "-"),
  },
  {
    title: "Sumber Dana",
    dataIndex: "assistanceSource",
    key: "assistanceSource",
    filters: assistanceSources.map((s) => ({ text: s, value: s })),
    filterSearch: assistanceSources.length > 8,
    onFilter: (value, record) => record.assistanceSource === value,
    render: (value) => value || "-",
  },
  {
    title: "Nilai (Rp)",
    dataIndex: "value",
    key: "value",
    width: 150,
    align: "right",
    sorter: (a, b) => (a.value ?? 0) - (b.value ?? 0),
    render: (value: number) =>
      value ? (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          Rp {value.toLocaleString("id-ID")}
        </span>
      ) : "-",
  },
  {
    title: "Catatan",
    dataIndex: "notes",
    key: "notes",
    width: 200,
    render: (value) =>
      value ? (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ) : "-",
  },
  {
    title: "Dokumen",
    dataIndex: "umkmVisitDocs",
    key: "umkmVisitDocs",
    width: 90,
    align: "center",
    render: (_, record) => {
      const docCount = record.umkmVisitDocs?.length || 0;
      return <Badge size="sm" color={docCount > 0 ? "success" : "info"}>{docCount}</Badge>;
    },
  },
  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 130,
    sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ...getDateRangeFilterProps<UmkmVisit>("createdAt"),
    render: (value) => (value ? formatDate(value) : "-"),
    hidden: true,
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 80,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        {role !== "staff" && onDelete && (
          <Button
            size="xs"
            onClick={() => { if (record.id) onDelete(record.id); }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];
