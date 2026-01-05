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
  regions: Region[],
  openDeleteModal: (id: number) => void
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
    title: "Pekerjaan",
    dataIndex: "childrenJob",
    key: "childrenJob",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Wilayah",
    dataIndex: "regionId",
    key: "regionId",
    filters: regions.map((r) => ({
      text: r.regionName,
      value: r.regionId,
    })),
    onFilter: (value, record) => record.regionId === value,
    render: (_, child) => {
      const region = regions.find((r) => r.regionId === child.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, child: Children) => {
      const region = regions.find((r) => r.regionId === child.regionId);
      return region?.regionName ?? "-";
    },
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
    title: "ABK",
    dataIndex: "isCondition",
    key: "isCondition",
    filters: [
      { text: "Ya", value: false },
      { text: "Tidak", value: true },
    ],
    onFilter: (value, record) => record.isCondition === value,
    render: (isCondition: boolean) => (
      <Badge size="sm" color={!isCondition ? "warning" : "success"}>
        {!isCondition ? "Ya" : "Tidak"}
      </Badge>
    ),
    exportRender: (value: boolean) => (!value ? "Ya" : "Tidak"),
  },

  {
    title: "Nama Pegawai",
    dataIndex: "employeeName",
    key: "employeeName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Nama Wali",
    dataIndex: "waliName",
    key: "waliName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
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
            openDeleteModal(child.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];