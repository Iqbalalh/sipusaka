"use client";

import { Tag } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Letter, LetterStatus, User } from "@/types/models/letter";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";

// ==============================================
// STATUS BADGE RENDERER
// ==============================================
export const renderStatus = (status: LetterStatus) => {
  const statusConfig: Record<LetterStatus, { color: string; text: string }> = {
    draft: { color: "default", text: "Draft" },
    pending1: { color: "processing", text: "Menunggu Penandatangan 1" },
    pending2: { color: "processing", text: "Menunggu Penandatangan 2" },
    pending3: { color: "processing", text: "Menunggu Penandatangan 3" },
    approved: { color: "success", text: "Disetujui" },
    published: { color: "cyan", text: "Diterbitkan" },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return <Tag color={config.color}>{config.text}</Tag>;
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================
const getSignerName = (signer?: User | null): string => {
  if (!signer) return "-";
  return signer.name || "-";
};

// ==============================================
// COLUMN CONFIGURATION FOR DRAFT LETTERS
// ==============================================
export const getDraftLetterColumns = (users: User[] = []): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Tanggal Surat",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text: any) => (text ? formatDate(text) : "-"),
    exportRender: (value: string) => (value ? formatDate(value) : "-"),
  } as any,

  {
    title: "Tujuan Surat",
    dataIndex: "destination",
    key: "destination",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Penandatangan 1",
    dataIndex: "signer1",
    key: "signer1",
    render: (_: any, letter: Letter) => getSignerName(letter.signer1),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer1),
  } as any,

  {
    title: "Penandatangan 2",
    dataIndex: "signer2",
    key: "signer2",
    render: (_: any, letter: Letter) => getSignerName(letter.signer2),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer2),
  } as any,

  {
    title: "Penandatangan 3",
    dataIndex: "signer3",
    key: "signer3",
    render: (_: any, letter: Letter) => getSignerName(letter.signer3),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer3),
  } as any,

  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: LetterStatus) => renderStatus(status),
    exportRender: (status: LetterStatus) => {
      const statusText: Record<LetterStatus, string> = {
        draft: "Draft",
        pending1: "Menunggu Penandatangan 1",
        pending2: "Menunggu Penandatangan 2",
        pending3: "Menunggu Penandatangan 3",
        approved: "Disetujui",
        published: "Diterbitkan",
      };
      return statusText[status] || "Draft";
    },
  } as any,

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (text: any) => (text ? formatDate(text) : "-"),
    exportRender: (value: string) => (value ? formatDate(value) : "-"),
  } as any,

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/drafts/view/${letter.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        <Link href={`letters/drafts/edit/${letter.id}`}>
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
// COLUMN CONFIGURATION FOR APPROVAL LETTERS
// ==============================================
export const getApprovalLetterColumns = (users: User[] = []): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Tanggal Surat",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text: any) => (text ? formatDate(text) : "-"),
    exportRender: (value: string) => (value ? formatDate(value) : "-"),
  } as any,

  {
    title: "Dibuat Oleh",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (_: any, letter: Letter) => {
      // This would need createdBy relation to be populated
      return "-";
    },
    exportRender: () => "-",
  } as any,

  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: LetterStatus) => renderStatus(status),
    exportRender: (status: LetterStatus) => {
      const statusText: Record<LetterStatus, string> = {
        draft: "Draft",
        pending1: "Menunggu Penandatangan 1",
        pending2: "Menunggu Penandatangan 2",
        pending3: "Menunggu Penandatangan 3",
        approved: "Disetujui",
        published: "Diterbitkan",
      };
      return statusText[status] || "Draft";
    },
  } as any,

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/approvals/view/${letter.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
      </div>
    ),
  },
];

// ==============================================
// COLUMN CONFIGURATION FOR ARCHIVE LETTERS
// ==============================================
export const getArchiveLetterColumns = (users: User[] = []): ColumnsType<Letter> => [
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Tanggal Surat",
    dataIndex: "letterDate",
    key: "letterDate",
    render: (text: any) => (text ? formatDate(text) : "-"),
    exportRender: (value: string) => (value ? formatDate(value) : "-"),
  } as any,

  {
    title: "Tujuan Surat",
    dataIndex: "destination",
    key: "destination",
    render: (text: any) => text || "-",
    exportRender: (value: string) => value ?? "-",
  } as any,

  {
    title: "Penandatangan 1",
    dataIndex: "signer1",
    key: "signer1",
    render: (_: any, letter: Letter) => getSignerName(letter.signer1),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer1),
  } as any,

  {
    title: "Penandatangan 2",
    dataIndex: "signer2",
    key: "signer2",
    render: (_: any, letter: Letter) => getSignerName(letter.signer2),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer2),
  } as any,

  {
    title: "Penandatangan 3",
    dataIndex: "signer3",
    key: "signer3",
    render: (_: any, letter: Letter) => getSignerName(letter.signer3),
    exportRender: (_: any, letter: Letter) => getSignerName(letter.signer3),
  } as any,

  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Draft", value: "draft" },
      { text: "Menunggu Penandatangan 1", value: "pending1" },
      { text: "Menunggu Penandatangan 2", value: "pending2" },
      { text: "Menunggu Penandatangan 3", value: "pending3" },
      { text: "Disetujui", value: "approved" },
      { text: "Diterbitkan", value: "published" },
    ],
    onFilter: (value: any, record: Letter) => record.status === value,
    render: (status: LetterStatus) => renderStatus(status),
    exportRender: (status: LetterStatus) => {
      const statusText: Record<LetterStatus, string> = {
        draft: "Draft",
        pending1: "Menunggu Penandatangan 1",
        pending2: "Menunggu Penandatangan 2",
        pending3: "Menunggu Penandatangan 3",
        approved: "Disetujui",
        published: "Diterbitkan",
      };
      return statusText[status] || "Draft";
    },
  } as any,

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: (a: Letter, b: Letter) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    defaultSortOrder: "descend",
    render: (text: any) => (text ? formatDate(text) : "-"),
    exportRender: (value: string) => (value ? formatDate(value) : "-"),
  } as any,

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, letter) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/archives/view/${letter.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
      </div>
    ),
  },
];
