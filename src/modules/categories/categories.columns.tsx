"use client";

import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Category } from "@/types/models/gallery";
import type { TableColumn } from "@/types/generic/antd-table";

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getCategoryColumns = (): TableColumn<Category>[] => [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    render: (text) => text || "-",
    exportRender: (value: number) => value ?? "-",
  },

  {
    title: "Nama Kategori",
    dataIndex: "name",
    key: "name",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Slug",
    dataIndex: "slug",
    key: "slug",
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
    render: (value) => value || "-",
    exportRender: (value: number) => value ?? "-",
  },

  {
    title: "Diedit Oleh",
    dataIndex: "editedBy",
    key: "editedBy",
    render: (value) => value || "-",
    exportRender: (value: number) => value ?? "-",
  },

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, category) => (
      <div className="flex gap-2 text-xs">
        <Link href={`categories/edit/${category.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        <Button
          size="xs"
          onClick={() => {
            if (!category.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            category._openDeleteModal(category.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];