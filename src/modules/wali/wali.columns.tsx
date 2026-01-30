"use client";

import { Image } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Wali } from "@/types/models/wali";
import type { TableColumn } from "@/types/generic/antd-table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getWaliColumns = (): TableColumn<Wali>[] => [
  {
    title: "Foto",
    dataIndex: "waliPict",
    key: "waliPict",
    render: (_: any, wali: Wali) =>
      wali.waliPict ? (
        <Image
          src={wali.waliPict}
          alt={wali.waliName}
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
    exportRender: (_: any, wali: Wali) =>
      wali.waliPict ? wali.waliPict : "-",
  } as any,

  {
    title: "Nama Wali",
    dataIndex: "waliName",
    key: "waliName",
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
    title: "Hubungan",
    dataIndex: "relation",
    key: "relation",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Pekerjaan",
    dataIndex: "waliJob",
    key: "waliJob",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Nomor Telepon",
    dataIndex: "waliPhone",
    key: "waliPhone",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Alamat",
    dataIndex: "waliAddress",
    key: "waliAddress",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Koordinat",
    dataIndex: "addressCoordinate",
    key: "addressCoordinate",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Nama Karyawan",
    dataIndex: "employeeName",
    key: "employeeName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) => (text ? new Date(text).toLocaleDateString("id-ID") : "-"),
    exportRender: (value: string) =>
      value ? new Date(value).toLocaleDateString("id-ID") : "-",
    hidden: true,
  },

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    render: (text) => (text ? new Date(text).toLocaleDateString("id-ID") : "-"),
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
    render: (_, wali) => (
      <div className="flex gap-2 text-xs">
        <Link href={`wali/view/${wali.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`wali/edit/${wali.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!wali.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            wali._openDeleteModal(wali.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];