"use client";

import { Image } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Staff } from "@/utils/services/staff.service";
import type { TableColumn } from "@/types/generic/antd-table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getStaffColumns = (): TableColumn<Staff>[] => [
  {
    title: "Foto",
    dataIndex: "staffPict",
    key: "staffPict",
    render: (_: any, staff: Staff) =>
      staff.staffPict ? (
        <Image
          src={staff.staffPict}
          alt={staff.staffName}
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
    exportRender: (_: any, staff: Staff) =>
      staff.staffPict ? staff.staffPict : "-",
  } as any,

  {
    title: "Nama Staf",
    dataIndex: "staffName",
    key: "staffName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "NIK",
    dataIndex: "nik",
    key: "nik",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Jenis Kelamin",
    dataIndex: "gender",
    key: "gender",
    filters: [
      { text: "Laki-laki", value: "M" },
      { text: "Perempuan", value: "F" },
    ],
    onFilter: (value, record) => record.gender === value,
    render: (gender: "M" | "F") =>
      gender === "M" ? "Laki-laki" : "Perempuan",
    exportRender: (value: "M" | "F") =>
      value === "M" ? "Laki-laki" : "Perempuan",
  },

  {
    title: "Role",
    dataIndex: "roleName",
    key: "roleName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Tempat Lahir",
    dataIndex: "birthplace",
    key: "birthplace",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Tanggal Lahir",
    dataIndex: "birthdate",
    key: "birthdate",
    render: (text) =>
      text ? new Date(text).toLocaleDateString("id-ID") : "-",
    exportRender: (value: string) =>
      value ? new Date(value).toLocaleDateString("id-ID") : "-",
  },

  {
    title: "Nomor Telepon",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Alamat",
    dataIndex: "address",
    key: "address",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, staff) => (
      <div className="flex gap-2 text-xs">
        <Link href={`staff/view/${staff.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`staff/edit/${staff.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!staff.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            staff._openDeleteModal(staff.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];