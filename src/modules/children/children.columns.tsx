"use client";

import { Image } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";
import { getDateRangeFilterProps } from "@/utils/table/dateRangeFilter";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getChildrenColumns = (
  regions: Region[],
  role?: string,
  eduFilters?: { text: string; value: string }[],
  onDelete?: (id: number) => void,
): ColumnsType<Children> => [
  {
    title: "Foto",
    dataIndex: "childrenPict",
    key: "childrenPict",
    render: (_: any, child: Children) =>
      child.childrenPict ? (
        <Image
          src={child.childrenPict}
          alt={child.childrenName}
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
      ) : (
        <Image
          src="/images/user/alt-user.png"
          alt="N/A"
          width={40}
          height={40}
        />
      ),
    exportRender: (_: any, child: Children) =>
      child.childrenPict ? child.childrenPict : "-",
  } as any,

  {
    title: "Nama Anak",
    dataIndex: "childrenName",
    key: "childrenName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "NIK",
    dataIndex: "nik",
    key: "nik",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Anak ke-",
    dataIndex: "index",
    key: "index",
    render: (index: number | null) => index ? `${index}` : "-",
    exportRender: (index: number | null) => index ? `${index}` : "-",
  },

  {
    title: "Jenis Kelamin",
    dataIndex: "childrenGender",
    key: "childrenGender",
    filters: [
      { text: "Laki-laki", value: "M" },
      { text: "Perempuan", value: "F" },
    ],
    onFilter: (value, record) => record.childrenGender === value,
    render: (gender: "M" | "F") =>
      gender === "M" ? "Laki-laki" : "Perempuan",
    exportRender: (value: "M" | "F") =>
      value === "M" ? "Laki-laki" : "Perempuan",
  },

  {
    title: "Tanggal Lahir",
    dataIndex: "childrenBirthdate",
    key: "childrenBirthdate",
    ...getDateRangeFilterProps<Children>("childrenBirthdate"),
    render: (text) => text ? formatDate(text) : "-",
    exportRender: (_: any, row: any) => {
      const formatted = formatDate(row.childrenBirthdate);
      return formatted ? formatted : "-";
    },
  },

  {
    title: "Usia",
    dataIndex: "childrenBirthdate",
    key: "age",
    render: (text) => {
      if (!text) return "-";
      const birth = new Date(text);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} Tahun`;
    },
    exportRender: (_: any, row: any) => {
      if (!row.childrenBirthdate) return "-";
      const birth = new Date(row.childrenBirthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} Tahun`;
    },
  },

  {
    title: "Pendidikan Terakhir",
    key: "lastEducationLevel",
    filters: eduFilters ?? [],
    onFilter: (value, record: any) => {
      const level = (record as any).childAssistance?.[0]?.educationLevel?.trim() ?? "";
      return level === String(value);
    },
    render: (_: any, record: any) => {
      const level = (record as any).childAssistance?.[0]?.educationLevel?.trim();
      return level || "-";
    },
    exportRender: (_: any, record: any) => {
      return (record as any).childAssistance?.[0]?.educationLevel?.trim() ?? "-";
    },
  },

  {
    title: "Nama Sekolah",
    dataIndex: "schoolName",
    key: "schoolName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Pekerjaan",
    dataIndex: "childrenJob",
    key: "childrenJob",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  // ==========================
  // NAMA ORANGTUA (employee - partner)
  // ==========================
  {
    title: "Nama Orangtua",
    key: "orangtua",
    dataIndex: "orangtua",
    sorter: (a: any, b: any) => {
      const x = `${a.homes?.employees?.employeeName ?? ""} ${a.homes?.partners?.partnerName ?? ""}`.toLowerCase();
      const y = `${b.homes?.employees?.employeeName ?? ""} ${b.homes?.partners?.partnerName ?? ""}`.toLowerCase();
      return x.localeCompare(y);
    },
    render: (_: any, row: any) => {
      const text = `${row.homes?.employees?.employeeName ?? "-"} - ${row.homes?.partners?.partnerName ?? "-"}`;
      return text;
    },
    exportRender: (_: any, row: any) => {
      return `${row.homes?.employees?.employeeName ?? "-"} - ${row.homes?.partners?.partnerName ?? "-"}`;
    },
  },

  // ==========================
  // Yatim / Piatu
  // ==========================
  {
    title: "Yatim/Piatu",
    key: "yatimStatus",
    filters: [
      { text: "Yatim", value: "yatim" },
      { text: "Piatu", value: "piatu" },
      { text: "Yatim Piatu", value: "yatim-piatu" },
    ],
    onFilter: (value, record: Children) => {
      const father = record.isFatherAlive;
      const mother = record.isMotherAlive;

      if (!father && mother && value === "yatim") return true;
      if (father && !mother && value === "piatu") return true;
      if (!father && !mother && value === "yatim-piatu") return true;

      return false;
    },
    render: (_: any, record: Children) => {
      const father = record.isFatherAlive;
      const mother = record.isMotherAlive;

      let label = "Tidak";
      let color: "success" | "error" | "warning" = "success";

      if (!father && mother) {
        label = "Yatim";
        color = "warning";
      } else if (father && !mother) {
        label = "Piatu";
        color = "warning";
      } else if (!father && !mother) {
        label = "Yatim Piatu";
        color = "error";
      }

      return (
        <Badge size="sm" color={color}>
          {label}
        </Badge>
      );
    },
    exportRender: (_: any, record: Children) => {
      const father = record.isFatherAlive;
      const mother = record.isMotherAlive;

      if (!father && mother) return "Yatim";
      if (father && !mother) return "Piatu";
      if (!father && !mother) return "Yatim Piatu";

      return "Tidak";
    },
  },

  {
    title: "Wilayah",
    dataIndex: "regionId",
    key: "regionId",
    filters: regions.map((r) => ({
      text: r.regionName,
      value: r.regionId,
    })),
    onFilter: (value, record) => (record as any).homes?.employees?.regions?.regionId === value,
    render: (_, child: any) => child.homes?.employees?.regions?.regionName ?? "-",
    exportRender: (_: any, child: any) => child.homes?.employees?.regions?.regionName ?? "-",
  },

  {
    title: "Nama Wali",
    dataIndex: "waliName",
    key: "waliName",
    render: (_: any, row: any) => row.homes?.wali?.waliName || "-",
    exportRender: (_: any, row: any) => row.homes?.wali?.waliName ?? "-",
  },

  {
    title: "Total Dana",
    key: "totalAssistanceAmount",
    align: "right",
    sorter: (a: any, b: any) => (a.totalAssistanceAmount ?? 0) - (b.totalAssistanceAmount ?? 0),
    render: (_: any, record: any) => {
      const amount = record.totalAssistanceAmount ?? 0;
      if (amount === 0) return <span className="text-gray-400 text-xs">-</span>;
      return (
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)}
        </span>
      );
    },
    exportRender: (_: any, record: any) =>
      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(record.totalAssistanceAmount ?? 0),
  },

  {
    title: "Total Bantuan",
    dataIndex: "_count",
    key: "childAssistanceCount",
    align: "center",
    filters: [
      { text: "0 (Belum Ada)", value: "0" },
      { text: "1", value: "1" },
      { text: "2", value: "2" },
      { text: "3", value: "3" },
      { text: "4", value: "4" },
      { text: "5", value: "5" },
      { text: "5+", value: "5+" },
    ],
    onFilter: (value, record: any) => {
      const count = record._count?.childAssistance ?? 0;
      if (value === "5+") return count > 5;
      return count === Number(value);
    },
    render: (_: any, record: any) => (
      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
        {record._count?.childAssistance ?? 0}
      </span>
    ),
    exportRender: (_: any, record: any) =>
      String(record._count?.childAssistance ?? 0),
  },

  {
    title: "Status",
    dataIndex: "isActive",
    key: "isActive",
    filters: [
      { text: "Aktif", value: true },
      { text: "Tidak Aktif", value: false },
    ],
    onFilter: (value, record) => record.isActive === value,
    render: (isActive: boolean) => (
      <Badge size="sm" color={isActive ? "success" : "error"}>
        {isActive ? "Aktif" : "Tidak Aktif"}
      </Badge>
    ),
    exportRender: (value: boolean) => (value ? "Aktif" : "Tidak Aktif"),
  },

  {
    title: "Kondisi",
    dataIndex: "isCondition",
    key: "isCondition",
    filters: [
      { text: "Normal", value: true },
      { text: "ABK", value: false },
    ],
    onFilter: (value, record) => record.isCondition === value,
    render: (isCondition: boolean) => (
      <Badge size="sm" color={isCondition ? "primary" : "warning"}>
        {isCondition ? "Normal" : "ABK"}
      </Badge>
    ),
    exportRender: (value: boolean) => (value ? "Normal" : "ABK"),
  },

  {
    title: "Keterangan",
    dataIndex: "notes",
    key: "notes",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    ...getDateRangeFilterProps<Children>("createdAt"),
    render: (text) => text ? formatDate(text) : "-",
    exportRender: (value: string) => formatDate(value) || "-",
    hidden: true,
  },

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    ...getDateRangeFilterProps<Children>("updatedAt"),
    render: (text) => text ? formatDate(text) : "-",
    exportRender: (value: string) => formatDate(value) || "-",
    hidden: true,
  },

  {
    title: "Dibuat Oleh",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (_: any, record: any) => (record as any)?.createdByStaffName || (record as any)?.createdBy || "-",
    exportRender: (_: any, record: any) => ((record as any)?.createdByStaffName || (record as any)?.createdBy) ?? "-",
  },

  {
    title: "Diedit Oleh",
    dataIndex: "editedBy",
    key: "editedBy",
    render: (_: any, record: any) => (record as any)?.editedByStaffName || (record as any)?.editedBy || "-",
    exportRender: (_: any, record: any) => ((record as any)?.editedByStaffName || (record as any)?.editedBy) ?? "-",
  },

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, child) => (
      <div className="flex gap-2 text-xs">
        <Link href={`children/view/${child.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        {role !== "staff" && (
          <Link href={`children/edit/${child.id}`}>
            <Button size="xs">
              <EditOutlined />
            </Button>
          </Link>
        )}

        {role !== "staff" && onDelete && (
          <Button
            size="xs"
            onClick={() => { if (child.id) onDelete(child.id); }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];