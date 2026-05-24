"use client";

import { Image } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { User } from "@/utils/services/user.service";
import type { TableColumn } from "@/types/generic/antd-table";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getUserColumns = (onDelete?: (id: number) => void): TableColumn<User>[] => [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Nama Staf",
    dataIndex: "staffName",
    key: "staffName",
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
    title: "Role",
    dataIndex: "role",
    key: "role",
    render: (text) => text || "-",
    exportRender: (value: string) => value ?? "-",
  },

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, user) => (
      <div className="flex gap-2 text-xs">
        <Link href={`users/edit/${user.userId}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>

        {onDelete && (
          <Button
            size="xs"
            onClick={() => { if (user.userId) onDelete(user.userId); }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];
