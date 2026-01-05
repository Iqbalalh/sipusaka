"use client";

import { Image } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Partner } from "@/types/models/partner";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getPartnerColumns = (
  regions: Region[]
): ColumnsType<Partner> => [
  {
    title: "Foto",
    dataIndex: "partnerPict",
    key: "partnerPict",
    render: (_: any, partner: Partner) =>
      partner.partnerPict ? (
        <Image
          src={partner.partnerPict}
          alt={partner.partnerName}
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
    exportRender: (_: any, partner: Partner) =>
      partner.partnerPict ? partner.partnerPict : "-",
  } as any,

  {
    title: "Nama Pasangan",
    dataIndex: "partnerName",
    key: "partnerName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "NIK",
    dataIndex: "partnerNik",
    key: "partnerNik",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Pekerjaan",
    dataIndex: "partnerJob",
    key: "partnerJob",
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
    render: (_, partner) => {
      const region = regions.find((r) => r.regionId === partner.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, partner: Partner) => {
      const region = regions.find((r) => r.regionId === partner.regionId);
      return region?.regionName ?? "-";
    },
  },

  {
    title: "Kecamatan",
    dataIndex: "subdistrictName",
    key: "subdistrictName",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },
  {
    title: "Nomor Telepon",
    dataIndex: "phoneNumber",
    key: "phoneNumber",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Status Aktif",
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
    title: "Status Hidup",
    dataIndex: "isAlive",
    key: "isAlive",
    filters: [
      { text: "Hidup", value: true },
      { text: "Meninggal", value: false },
    ],
    onFilter: (value, record) => record.isAlive === value,
    render: (isAlive: boolean) => (
      <Badge size="sm" color={isAlive ? "success" : "error"}>
        {isAlive ? "Hidup" : "Meninggal"}
      </Badge>
    ),
    exportRender: (value: boolean) => (value ? "Hidup" : "Meninggal"),
  },

  {
    title: "Alamat",
    dataIndex: "address",
    key: "address",
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
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, partner) => (
      <div className="flex gap-2 text-xs">
        <Link href={`partner/view/${partner.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`partner/edit/${partner.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!partner.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            partner._openDeleteModal(partner.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];
