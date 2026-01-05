"use client";

import { Image } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Employee } from "@/types/models/employee";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getEmployeeColumns = (
  regions: Region[],
  openDeleteModal: (id: number) => void
): ColumnsType<Employee> => [
  {
    title: "Foto",
    dataIndex: "employeePict",
    key: "employeePict",
    render: (_: any, emp: Employee) =>
      emp.employeePict ? (
        <Image
          src={emp.employeePict}
          alt={emp.employeeName}
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
    exportRender: (_: any, emp: Employee) =>
      emp.employeePict ? emp.employeePict : "-",
  } as any,

  {
    title: "Nama Pegawai",
    dataIndex: "employeeName",
    key: "employeeName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "NIP/NIPP",
    dataIndex: "nipNipp",
    key: "nipNipp",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Jabatan Terakhir",
    dataIndex: "lastPosition",
    key: "lastPosition",
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
    render: (_, emp) => {
      const region = regions.find((r) => r.regionId === emp.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, emp: Employee) => {
      const region = regions.find((r) => r.regionId === emp.regionId);
      return region?.regionName ?? "-";
    },
  },

  {
    title: "Jenis Kelamin",
    dataIndex: "employeeGender",
    key: "employeeGender",
    filters: [
      { text: "Laki-laki", value: "M" },
      { text: "Perempuan", value: "F" },
    ],
    onFilter: (value, record) => record.employeeGender === value,
    render: (gender: "M" | "F") =>
      gender === "M" ? "Laki-laki" : "Perempuan",
    exportRender: (value: "M" | "F") =>
      value === "M" ? "Laki-laki" : "Perempuan",
  },

  {
    title: "PLH/Non-PLH",
    dataIndex: "isAccident",
    key: "isAccident",
    filters: [
      { text: "PLH", value: true },
      { text: "Non-PLH", value: false },
    ],
    onFilter: (value, record) => record.isAccident === value,
    render: (isAccident: boolean) => (
      <Badge size="sm" color={isAccident ? "error" : "success"}>
        {isAccident ? "PLH" : "Non-PLH"}
      </Badge>
    ),
    exportRender: (value: boolean) => (value ? "PLH" : "Non-PLH"),
  },

  {
    title: "Penyebab Wafat",
    dataIndex: "deathCause",
    key: "deathCause",
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
    render: (_, emp) => (
      <div className="flex gap-2 text-xs">
        <Link href={`employee/view/${emp.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`employee/edit/${emp.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!emp.id) return;
            openDeleteModal(emp.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];