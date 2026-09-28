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
// FORMAT MEDICAL EQUIPMENT (SINGLE ITEM)
// ==============================================
const formatMedicalEquipment = (record: SocialAssistance): string => {
  if (!record.medicalEquipment) return "-";

  const typeLabel =
    MEDICAL_EQUIPMENT_OPTIONS.find(
      (opt) => opt.value === record.medicalEquipment,
    )?.label || record.medicalEquipment;
  const quantity = record.equipmentQuantity || 1;
  const nominal = record.equipmentNominal || 0;

  if (nominal > 0) {
    return `${typeLabel} (${quantity}x Rp ${nominal.toLocaleString("id-ID")})`;
  }
  return typeLabel;
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
});

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getSocialAssistanceColumns = (
  role?: string,
  onDelete?: (id: number) => void,
): ColumnsType<SocialAssistance> => [
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
    render: (value) => <Tag color="purple">{value || "-"}</Tag>,
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
    key: "medicalEquipment",
    width: 200,
    ellipsis: true,
    render: (_, record) => formatMedicalEquipment(record),
  },
  {
    title: "Uang",
    dataIndex: "cashAmount",
    key: "cashAmount",
    width: 130,
    align: "right",
    render: (value: number) =>
      value ? `Rp ${value.toLocaleString("id-ID")}` : "-",
    exportRender: (value: number) => value ?? "",
  } as any,
  {
    title: "Total",
    dataIndex: "totalAmount",
    key: "totalAmount",
    width: 130,
    align: "right",
    render: (value: { toLocaleString: (arg0: string) => any }) => (
      <span className="font-semibold text-blue-600">
        {value ? `Rp ${value.toLocaleString("id-ID")}` : "-"}
      </span>
    ),
    exportRender: (value: number) => value ?? "",
  } as any,
  {
    title: "Pengajuan",
    dataIndex: "pengajuan",
    key: "pengajuan",
    width: 130,
    align: "right",
    render: (value: number, record: any) => {
      if (!value) return <span className="text-gray-400">-</span>;
      // Cross-check: highlight amber when the submitted amount differs from the total (realisasi)
      const mismatch = record.totalAmount != null && record.totalAmount !== value;
      return (
        <span className={mismatch ? "font-semibold text-amber-600" : "text-gray-700 dark:text-gray-300"}>
          Rp {value.toLocaleString("id-ID")}
        </span>
      );
    },
    exportRender: (value: number) => value ?? "",
  } as any,
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
        {role !== "staff" && (
          <Link href={`socialassistance/edit/${record.id}`}>
            <Button size="xs">
              <EditOutlined />
            </Button>
          </Link>
        )}
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
