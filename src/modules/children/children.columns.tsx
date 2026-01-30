"use client";

import { Image } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getChildrenColumns = (
  regions: Region[]
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
    render: (text) =>
      text ? new Date(text).toLocaleDateString("id-ID") : "-",
    exportRender: (value: string) =>
      value ? new Date(value).toLocaleDateString("id-ID") : "-",
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
    exportRender: (value: string) => {
      if (!value) return "-";
      const birth = new Date(value);
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
    title: "Jenjang Pendidikan",
    dataIndex: "educationLevel",
    key: "educationLevel",
    filters: [
      { text: "TK", value: "TK" },
      { text: "SD/Sederajat", value: "SD/Sederajat" },
      { text: "SMP/Sederajat", value: "SMP/Sederajat" },
      { text: "SMA/Sederajat", value: "SMA/Sederajat" },
      { text: "Diploma", value: "Diploma" },
      { text: "Sarjana", value: "Sarjana" },
      { text: "Magister", value: "Magister" },
      { text: "Doktor", value: "Doktor" },
    ],
    onFilter: (value, record) => record.educationLevel === value,
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Tingkat Pendidikan",
    dataIndex: "educationGrade",
    key: "educationGrade",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
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
  // ORANGTUA (employee - partner)
  // ==========================
  {
    title: "Orangtua",
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
    onFilter: (value, record) => record.homes?.employees?.regionId === value,
    render: (_, child: any) => {
      const region = regions.find((r) => r.regionId === child.homes?.employees?.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, child: any) => {
      const region = regions.find((r) => r.regionId === child.homes?.employees?.regionId);
      return region?.regionName ?? "-";
    },
  },

  {
    title: "Nama Wali",
    dataIndex: "waliName",
    key: "waliName",
    render: (_: any, row: any) => row.homes?.wali?.waliName || "-",
    exportRender: (_: any, row: any) => row.homes?.wali?.waliName ?? "-",
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
    render: (text) =>
      text ? new Date(text).toLocaleDateString("id-ID") : "-",
    exportRender: (value: string) =>
      value ? new Date(value).toLocaleDateString("id-ID") : "-",
    hidden: true,
  },

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    render: (text) =>
      text ? new Date(text).toLocaleDateString("id-ID") : "-",
    exportRender: (value: string) =>
      value ? new Date(value).toLocaleDateString("id-ID") : "-",
    hidden: true,
  },

  {
    title: "Dibuat Oleh",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (text) => text || "-",
    exportRender: (value: number) => value ?? "-",
  },

  {
    title: "Diedit Oleh",
    dataIndex: "editedBy",
    key: "editedBy",
    render: (text) => text || "-",
    exportRender: (value: number) => value ?? "-",
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

        <Link href={`children/edit/${child.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!child.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            child._openDeleteModal(child.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];