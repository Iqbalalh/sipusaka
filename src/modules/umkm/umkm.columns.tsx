"use client";

import { Image } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Umkm } from "@/types/models/umkm";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getUmkmColumns = (
  regions: Region[]
): ColumnsType<Umkm> => [
  {
    title: "Foto",
    dataIndex: "umkmPict",
    key: "umkmPict",
    render: (_: any, umkm: Umkm) =>
      umkm.umkmPict ? (
        <Image
          src={umkm.umkmPict}
          alt={umkm.businessName}
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
    exportRender: (_: any, umkm: Umkm) =>
      umkm.umkmPict ? umkm.umkmPict : "-",
  } as any,

  {
    title: "Nama Usaha",
    dataIndex: "businessName",
    key: "businessName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Nama Pemilik",
    dataIndex: "ownerName",
    key: "ownerName",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Jenis Usaha",
    dataIndex: "businessType",
    key: "businessType",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Produk",
    dataIndex: "products",
    key: "products",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Alamat Usaha",
    dataIndex: "businessAddress",
    key: "businessAddress",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },
  {
    title: "Kecamatan",
    dataIndex: "subdistrictName",
    key: "subdistrictName",
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
    render: (_, umkm) => {
      const region = regions.find((r) => r.regionId === umkm.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, umkm: Umkm) => {
      const region = regions.find((r) => r.regionId === umkm.regionId);
      return region?.regionName ?? "-";
    },
  },

  {
    title: "Koordinat",
    dataIndex: "umkmCoordinate",
    key: "umkmCoordinate",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Kode Pos",
    dataIndex: "postalCode",
    key: "postalCode",
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
    render: (_, umkm) => (
      <div className="flex gap-2 text-xs">
        <Link href={`umkm/view/${umkm.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`umkm/edit/${umkm.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!umkm.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            umkm._openDeleteModal(umkm.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];