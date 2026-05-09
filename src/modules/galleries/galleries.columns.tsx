"use client";

import { Image } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Gallery, Category } from "@/types/models/gallery";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getGalleryColumns = (regions: Region[] = [], categories: Category[] = [], role?: string): ColumnsType<Gallery> => [
  {
    title: "Gambar",
    dataIndex: "s3Path",
    key: "s3Path",
    render: (_: any, gallery: Gallery) =>
      gallery.s3Path ? (
        <Image
          src={gallery.s3Path}
          alt={gallery.caption || "Gallery Image"}
          width={60}
          height={60}
          className="rounded-lg object-cover w-15 h-15"
        />
      ) : (
        <div className="w-15 h-15 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
          No Image
        </div>
      ),
    exportRender: (_: any, gallery: Gallery) =>
      gallery.s3Path ? gallery.s3Path : "-",
  } as any,

  {
    title: "Keterangan",
    dataIndex: "caption",
    key: "caption",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Kategori",
    key: "categories",
    dataIndex: "categories",
    filters: categories.map((c) => ({ text: c.name, value: c.id })),
    onFilter: (value: any, record: Gallery) =>
      record.categories?.some((c) => c.id === value) ?? false,
    render: (_: any, gallery: Gallery) => {
      if (!gallery.categories || gallery.categories.length === 0) return "-";
      return gallery.categories.map((cat) => cat.name).join(", ");
    },
    exportRender: (_: any, gallery: Gallery) => {
      if (!gallery.categories || gallery.categories.length === 0) return "-";
      return gallery.categories.map((cat) => cat.name).join(", ");
    },
  },

  {
    title: "Tanggal Galeri",
    dataIndex: "galleryDate",
    key: "galleryDate",
    render: (text) =>
      text ? formatDate(text) : "-",
    exportRender: (value: string) =>
      value ? formatDate(value) : "-",
  },

  {
    title: "Wilayah",
    dataIndex: "regionId",
    key: "regionId",
    filters: regions.map((r) => ({
      text: r.regionName,
      value: r.regionId,
    })),
    onFilter: (value: any, record: Gallery) => record.regionId === value,
    render: (_: any, gallery: Gallery) => {
      return gallery.regionName || "-";
    },
    exportRender: (_: any, gallery: Gallery) => {
      return gallery.regionName ?? "-";
    },
  },

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) =>
      text ? formatDate(text) : "-",
    exportRender: (value: string) =>
      value ? formatDate(value) : "-",
  },

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    render: (text) =>
      text ? formatDate(text) : "-",
    exportRender: (value: string) =>
      value ? formatDate(value) : "-",
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
    render: (_, gallery) => (
      <div className="flex gap-2 text-xs">
        <Link href={`galleries/view/${gallery.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        {role !== "staff" && (
          <Link href={`galleries/edit/${gallery.id}`}>
            <Button size="xs">
              <EditOutlined />
            </Button>
          </Link>
        )}

        {role !== "staff" && (
          <Button
            size="xs"
            onClick={() => {
              if (!gallery.id) return;
              // @ts-ignore - _openDeleteModal is injected by DataTable
              gallery._openDeleteModal(gallery.id);
            }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];