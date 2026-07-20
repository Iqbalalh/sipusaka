"use client";

import type { TableColumnsType } from "antd";
import ButtonUI from "@/components/ui/button/Button";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import { Region } from "@/types/models/region";
import { formatDate } from "@/utils/formatter/formatDate";
import { getDateRangeFilterProps } from "@/utils/table/dateRangeFilter";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import Link from "next/link";

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getChildAssistanceColumns = (
  regions: Region[],
  educationLevels: string[],
  providers: string[],
  role?: string,
  onDelete?: (id: number) => void,
): TableColumnsType<ChildAssistance> => [
  {
    title: "Bantuan Ke-",
    dataIndex: "assistanceNumber",
    key: "assistanceNumber",
    width: 100,
    sorter: (a, b) => a.assistanceNumber - b.assistanceNumber,
    render: (value) => value || "-",
  },
  {
    title: "Nama Anak",
    dataIndex: "childrenName",
    key: "childrenName",
    render: (_, record) => record.children?.childrenName || "-",
  },
  {
    title: "Tanggal Bantuan",
    dataIndex: "assistanceDate",
    key: "assistanceDate",
    width: 150,
    sorter: (a, b) => new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime(),
    ...getDateRangeFilterProps<ChildAssistance>("assistanceDate"),
    render: (value) => (value ? formatDate(value) : "-"),
  },
  {
    title: "Jumlah Bantuan",
    dataIndex: "assistanceAmount",
    key: "assistanceAmount",
    width: 160,
    align: "right",
    sorter: (a, b) => (a.assistanceAmount ?? 0) - (b.assistanceAmount ?? 0),
    render: (value: number) =>
      value ? (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          Rp {value.toLocaleString("id-ID")}
        </span>
      ) : "-",
  },
  {
    title: "Penyedia Bantuan",
    dataIndex: "assistanceProvider",
    key: "assistanceProvider",
    width: 160,
    filters: providers.map((p) => ({ text: p, value: p })),
    filterSearch: providers.length > 8,
    onFilter: (value, record) => record.assistanceProvider === value,
    render: (value) =>
      value ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {value}
        </span>
      ) : "-",
  },
  {
    title: "Tingkat Pendidikan",
    dataIndex: "educationLevel",
    key: "educationLevel",
    width: 160,
    filters: educationLevels.map((l) => ({ text: l, value: l })),
    filterSearch: educationLevels.length > 8,
    onFilter: (value, record) => (record.educationLevel?.trim() ?? "") === value,
    render: (value) =>
      value ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          {value}
        </span>
      ) : "-",
  },
  {
    title: "Kelas / Sekolah",
    key: "school",
    render: (_, record) => (
      <div>
        <span className="text-gray-800 dark:text-white">{record.educationGrade || "-"}</span>
        {record.schoolName && (
          <span className="block text-xs text-gray-400 truncate max-w-[180px]">{record.schoolName}</span>
        )}
      </div>
    ),
  },
  {
    title: "Wilayah",
    dataIndex: "regionId",
    key: "regionId",
    width: 130,
    filters: regions.map((r) => ({ text: r.regionName, value: r.regionId })),
    filterSearch: regions.length > 8,
    onFilter: (value, record) => record.children?.homes?.regionId === value,
    render: (_, record) => {
      const regionName = record.children?.homes?.regions?.regionName;
      return regionName ? (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          {regionName}
        </span>
      ) : "-";
    },
  },
  {
    title: "Usia",
    dataIndex: "age",
    key: "age",
    width: 80,
    sorter: (a, b) => (a.age ?? 0) - (b.age ?? 0),
    render: (value) => (value ? `${value} tahun` : "-"),
  },
  {
    title: "Dokumen",
    dataIndex: "childAssistanceDocs",
    key: "childAssistanceDocs",
    width: 100,
    align: "center",
    render: (_, record) => {
      const docCount = record.childAssistanceDocs?.length || 0;
      return docCount > 0 ? `${docCount} dok.` : "-";
    },
  },
  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 130,
    ...getDateRangeFilterProps<ChildAssistance>("createdAt"),
    render: (value) => (value ? formatDate(value) : "-"),
    hidden: true,
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 100,
    render: (_, record) => (
      <div className="flex gap-1.5">
        <Link href={`/children/view/${record.childrenId}`}>
          <ButtonUI size="xs">
            <EyeOutlined />
          </ButtonUI>
        </Link>
        {role !== "staff" && onDelete && (
          <ButtonUI
            size="xs"
            onClick={() => {
              if (record.id) onDelete(record.id);
            }}
          >
            <DeleteOutlined />
          </ButtonUI>
        )}
      </div>
    ),
  },
];
