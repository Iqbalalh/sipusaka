"use client";

import { Input, Tag } from "antd";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { UmkmVisit } from "@/utils/services/umkmvisit.service";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";

// ==============================================
// SEARCH CONFIGURATION
// ==============================================
const getColumnSearchProps = (dataIndex: string): any => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: any) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Cari ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: "block" }}
      />
      <div className="flex gap-2">
        <button
          className="text-white bg-blue-500 px-2 py-1 rounded text-xs"
          onClick={() => confirm()}
        >
          Cari
        </button>
        <button
          className="text-gray-700 bg-gray-200 px-2 py-1 rounded text-xs"
          onClick={() => {
            clearFilters && clearFilters();
            confirm();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value: string | number | boolean, record: UmkmVisit) => {
    if (dataIndex === "businessName") {
      return record.umkm?.businessName
        ? record.umkm.businessName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "ownerName") {
      return record.umkm?.ownerName
        ? record.umkm.ownerName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "assistanceType") {
      return record.assistanceType
        ? record.assistanceType
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "assistanceSource") {
      return record.assistanceSource
        ? record.assistanceSource
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    return false;
  },
});

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getUmkmVisitColumns = (role?: string): ColumnsType<UmkmVisit> => [
  {
    title: "Kunjungan ke-",
    dataIndex: "visitNumber",
    key: "visitNumber",
    width: 100,
    sorter: (a, b) => a.visitNumber - b.visitNumber,
    render: (value) => value || "-",
  },
  {
    title: "Nama UMKM",
    dataIndex: "businessName",
    key: "businessName",
    ...getColumnSearchProps("businessName"),
    render: (_, record) => record.umkm?.businessName || "-",
  },
  {
    title: "Pemilik",
    dataIndex: "ownerName",
    key: "ownerName",
    ...getColumnSearchProps("ownerName"),
    render: (_, record) => record.umkm?.ownerName || "-",
  },
  {
    title: "Tanggal Bantuan",
    dataIndex: "assistanceDate",
    key: "assistanceDate",
    width: 120,
    sorter: (a, b) => new Date(a.assistanceDate).getTime() - new Date(b.assistanceDate).getTime(),
    render: (value) => value ? formatDate(value) : "-",
  },
  {
    title: "Jenis Bantuan",
    dataIndex: "assistanceType",
    key: "assistanceType",
    ...getColumnSearchProps("assistanceType"),
    render: (value) => (
      <Tag color="green">{value || "-"}</Tag>
    ),
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
    render: (value) => value ? value.toLocaleString("id-ID") : "-",
  },
  {
    title: "Sumber Dana",
    dataIndex: "assistanceSource",
    key: "assistanceSource",
    ...getColumnSearchProps("assistanceSource"),
    render: (value) => value || "-",
  },
  {
    title: "Nilai (Rp)",
    dataIndex: "value",
    key: "value",
    width: 150,
    sorter: (a, b) => a.value - b.value,
    render: (value) => {
      return value ? `Rp ${value.toLocaleString("id-ID")}` : "-";
    },
  },
  {
    title: "Catatan",
    dataIndex: "notes",
    key: "notes",
    width: 200,
    render: (value) => {
      if (!value) return "-";
      return (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      );
    },
  },
  {
    title: "Dokumen",
    dataIndex: "umkmVisitDocs",
    key: "umkmVisitDocs",
    width: 100,
    render: (_, record) => {
      const docCount = record.umkmVisitDocs?.length || 0;
      return (
        <Badge size="sm" color={docCount > 0 ? "success" : "info"}>
          {docCount}
        </Badge>
      );
    },
  },
  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    render: (value) => value ? formatDate(value) : "-",
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 100,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        {role !== "staff" && (
          <Button
            size="xs"
            onClick={() => {
              if (!record.id) return;
              // @ts-ignore - _openDeleteModal is injected by DataTable
              record._openDeleteModal(record.id);
            }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];