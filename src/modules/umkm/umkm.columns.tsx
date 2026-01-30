"use client";

import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Umkm } from "@/types/models/umkm";
import { Region } from "@/types/models/region";
import type { TableColumn } from "@/types/generic/antd-table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getUmkmColumns = (regions: Region[]): TableColumn<Umkm>[] => [
  {
    title: "Nama Usaha",
    dataIndex: "businessName",
    key: "businessName",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.businessName ?? "-",
  } as any,

  {
    title: "Nama Pemilik",
    dataIndex: "ownerName",
    key: "ownerName",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.ownerName ?? "-",
  } as any,

  {
    title: "Jenis Usaha",
    dataIndex: "businessType",
    key: "businessType",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.businessType ?? "-",
  } as any,

  {
    title: "Produk",
    dataIndex: "products",
    key: "products",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.products ?? "-",
  } as any,

  {
    title: "Alamat Usaha",
    dataIndex: "businessAddress",
    key: "businessAddress",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.businessAddress ?? "-",
  } as any,
  {
    title: "Kecamatan",
    dataIndex: "subdistrictName",
    key: "subdistrictName",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.subdistrictName ?? "-",
  } as any,

  {
    title: "Wilayah",
    dataIndex: "regionId",
    key: "regionId",
    filters: regions.map((r) => ({
      text: r.regionName,
      value: r.regionId,
    })),
    onFilter: (value: any, record: Umkm) => record.regionId === value,
    render: (_: any, umkm: Umkm) => {
      const region = regions.find((r) => r.regionId === umkm.regionId);
      return region ? region.regionName : "-";
    },
    exportRender: (_: any, umkm: Umkm) => {
      const region = regions.find((r) => r.regionId === umkm.regionId);
      return region?.regionName ?? "-";
    },
  } as any,

  {
    title: "Koordinat",
    dataIndex: "umkmCoordinate",
    key: "umkmCoordinate",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.umkmCoordinate ?? "-",
  } as any,

  {
    title: "Kode Pos",
    dataIndex: "postalCode",
    key: "postalCode",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.postalCode ?? "-",
  } as any,

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text: any) => (text ? new Date(text).toLocaleDateString("id-ID") : "-"),
    exportRender: (_: any, record: Umkm) =>
      record.createdAt ? new Date(record.createdAt).toLocaleDateString("id-ID") : "-",
    hidden: true,
  } as any,

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    render: (text: any) => (text ? new Date(text).toLocaleDateString("id-ID") : "-"),
    exportRender: (_: any, record: Umkm) =>
      record.updatedAt ? new Date(record.updatedAt).toLocaleDateString("id-ID") : "-",
    hidden: true,
  } as any,

  {
    title: "Dibuat Oleh",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.createdBy ?? "-",
  } as any,

  {
    title: "Diedit Oleh",
    dataIndex: "editedBy",
    key: "editedBy",
    render: (text: any) => text || "-",
    exportRender: (_: any, record: Umkm) => record.editedBy ?? "-",
  } as any,

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
