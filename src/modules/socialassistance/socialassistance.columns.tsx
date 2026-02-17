"use client";

import { Input, Tag } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { SocialAssistance } from "@/utils/services/socialassistance.service";
import { MEDICAL_EQUIPMENT_OPTIONS } from "./socialassistance.constants";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// FORMAT MEDICAL EQUIPMENT
// ==============================================
const formatMedicalEquipment = (equipment: SocialAssistance['medicalEquipment']): string => {
  if (!equipment || equipment.length === 0) return "-";
  
  return equipment.map(item => {
    const typeLabel = MEDICAL_EQUIPMENT_OPTIONS.find(opt => opt.value === item.type)?.label || item.type;
    return `${typeLabel} (${item.quantity}x Rp ${item.nominal.toLocaleString("id-ID")})`;
  }).join(", ");
};

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
  onFilter: (value: string | number | boolean, record: SocialAssistance) => {
    const searchValue = String(value).toLowerCase();
    if (dataIndex === "nipNipp") {
      return record.nipNipp?.toLowerCase().includes(searchValue) || false;
    }
    if (dataIndex === "recipientName") {
      return record.recipientName?.toLowerCase().includes(searchValue) || false;
    }
    if (dataIndex === "ktpAddress") {
      return record.ktpAddress?.toLowerCase().includes(searchValue) || false;
    }
    if (dataIndex === "region") {
      return record.region?.toLowerCase().includes(searchValue) || false;
    }
    if (dataIndex === "condition") {
      return record.condition?.toLowerCase().includes(searchValue) || false;
    }
    return false;
  },
});

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getSocialAssistanceColumns = (): ColumnsType<SocialAssistance> => [
  {
    title: "NIP/NIPP",
    dataIndex: "nipNipp",
    key: "nipNipp",
    width: 120,
    ...getColumnSearchProps("nipNipp"),
    render: (value) => value || "-",
  },
  {
    title: "Nama Penerima",
    dataIndex: "recipientName",
    key: "recipientName",
    width: 180,
    ...getColumnSearchProps("recipientName"),
    render: (value) => (
      <span className="font-medium text-gray-800 dark:text-white/90">
        {value || "-"}
      </span>
    ),
  },
  {
    title: "Alamat KTP",
    dataIndex: "ktpAddress",
    key: "ktpAddress",
    width: 200,
    ellipsis: true,
    ...getColumnSearchProps("ktpAddress"),
    render: (value) => value || "-",
  },
  {
    title: "Wilayah (PD)",
    dataIndex: "region",
    key: "region",
    width: 120,
    ...getColumnSearchProps("region"),
    render: (value) => (
      <Tag color="purple">{value || "-"}</Tag>
    ),
  },
  {
    title: "Kondisi/Penyakit",
    dataIndex: "condition",
    key: "condition",
    width: 150,
    ellipsis: true,
    ...getColumnSearchProps("condition"),
    render: (value) => value || "-",
  },
  {
    title: "Alat Kesehatan",
    dataIndex: "medicalEquipment",
    key: "medicalEquipment",
    width: 200,
    ellipsis: true,
    render: (equipment) => formatMedicalEquipment(equipment),
  },
  {
    title: "Uang",
    dataIndex: "cashAmount",
    key: "cashAmount",
    width: 130,
    align: "right",
    render: (value) => value ? `Rp ${value.toLocaleString("id-ID")}` : "-",
  },
  {
    title: "Total",
    dataIndex: "totalAmount",
    key: "totalAmount",
    width: 130,
    align: "right",
    render: (value) => (
      <span className="font-semibold text-blue-600">
        {value ? `Rp ${value.toLocaleString("id-ID")}` : "-"}
      </span>
    ),
  },
  {
    title: "Keterangan",
    dataIndex: "notes",
    key: "notes",
    width: 150,
    ellipsis: true,
    render: (value) => value || "-",
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 130,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        <Link href={`socialassistance/view/${record.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
        <Link href={`socialassistance/edit/${record.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>
        <Button
          size="xs"
          onClick={() => {
            if (!record.id) return;
            // @ts-ignore - _openDeleteModal is injected by table
            record._openDeleteModal(record.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];
