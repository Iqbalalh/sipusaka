"use client";

import Link from "next/link";
import { Tag } from "antd";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Letter, LetterStatus } from "@/types/models/letter";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";

// ==============================================
// STATUS BADGE
// ==============================================
const statusConfig: Record<LetterStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "default" },
  pending1: { label: "Menunggu TTD 1", color: "processing" },
  pending2: { label: "Menunggu TTD 2", color: "processing" },
  pending3: { label: "Menunggu TTD 3", color: "processing" },
  approved: { label: "Disetujui", color: "success" },
  published: { label: "Diterbitkan", color: "purple" },
};

const StatusBadge = ({ status }: { status: LetterStatus }) => {
  const config = statusConfig[status] || { label: status, color: "default" };
  return <Tag color={config.color}>{config.label}</Tag>;
};

// ==============================================
// DRAFT COLUMNS
// ==============================================
export const getDraftColumns = (onSubmit?: (id: number) => void): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text) => text || "-",
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text) => text || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    ellipsis: true,
    render: (text) => text || "-",
  },
  {
    title: "Tanggal",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text) => (text ? formatDate(text) : "-"),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: LetterStatus) => <StatusBadge status={status} />,
  },
  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) => (text ? formatDate(text) : "-"),
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        {letter.status === "draft" && onSubmit && (
          <Button
            size="xs"
            onClick={() => onSubmit(letter.id)}
            className="bg-blue-500 text-white"
          >
            <SendOutlined />
          </Button>
        )}
        <Link href={`/letters/drafts/edit/${letter.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>
        <Button
          size="xs"
          onClick={() => {
            if (!letter.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            letter._openDeleteModal(letter.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];

// ==============================================
// APPROVAL COLUMNS
// ==============================================
export const getApprovalColumns = (): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text) => text || "-",
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text) => text || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    ellipsis: true,
    render: (text) => text || "-",
  },
  {
    title: "Pengirim",
    key: "createdByName",
    render: (_: any, record: any) =>
      record.createdByStaffName || record.createdByName || "-",
  },
  {
    title: "Tanggal",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text) => (text ? formatDate(text) : "-"),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: LetterStatus) => <StatusBadge status={status} />,
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        <Link href={`/letters/approvals/view/${letter.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
      </div>
    ),
  },
];

// ==============================================
// ARCHIVE COLUMNS
// ==============================================
export const getArchiveColumns = (): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text) => text || "-",
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text) => text || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    ellipsis: true,
    render: (text) => text || "-",
  },
  {
    title: "Tujuan",
    dataIndex: "destination",
    key: "destination",
    ellipsis: true,
    render: (text) => text || "-",
  },
  {
    title: "Tanggal",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text) => (text ? formatDate(text) : "-"),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Draft", value: "draft" },
      { text: "Menunggu TTD 1", value: "pending1" },
      { text: "Menunggu TTD 2", value: "pending2" },
      { text: "Menunggu TTD 3", value: "pending3" },
      { text: "Disetujui", value: "approved" },
      { text: "Diterbitkan", value: "published" },
    ],
    onFilter: (value: any, record: Letter) => record.status === value,
    render: (status: LetterStatus) => <StatusBadge status={status} />,
  },
  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text) => (text ? formatDate(text) : "-"),
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        <Link href={`/letters/archives/view/${letter.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
      </div>
    ),
  },
];
