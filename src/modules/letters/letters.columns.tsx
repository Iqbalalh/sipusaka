"use client";

import { Tag } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { Letter } from "@/utils/services/letter.service";
import { getLetterTypeLabel, getLetterStatusInfo } from "./letters.constants";
import { formatDate } from "@/utils/formatter/formatDate";
import type { ColumnsType } from "antd/es/table";

// ==============================================
// COLUMN CONFIGURATION FOR LETTER TABLE
// ==============================================
export const getLetterColumns = (): ColumnsType<Letter> => [
  {
    title: "No",
    key: "no",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    width: 150,
    render: (value) => getLetterTypeLabel(value),
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    width: 120,
    render: (value) => value || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    width: 200,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Tanggal Pembuatan",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    render: (value) => formatDate(value),
  },
  {
    title: "Tujuan Surat",
    dataIndex: "destination",
    key: "destination",
    width: 150,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Penandatangan",
    key: "signers",
    width: 200,
    render: (_, record) => {
      const signers = [
        record.signer1,
        record.signer2,
        record.signer3,
      ].filter(Boolean);

      if (signers.length === 0) return "-";

      return (
        <div className="flex flex-col gap-1">
          {signers.map((signer, index) => (
            <span key={index} className="text-xs">
              {index + 1}. {signer?.staffs?.staffName || signer?.username}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (value) => {
      const { label, color, bgColor } = getLetterStatusInfo(value);
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}
        >
          {label}
        </span>
      );
    },
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 130,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/view/${record.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
        {(record.status === "DRAFT" || record.status === "REJECTED") && (
          <Link href={`letters/edit/${record.id}`}>
            <Button size="xs">
              <EditOutlined />
            </Button>
          </Link>
        )}
        {record.status === "DRAFT" && (
          <Button
            size="xs"
            onClick={() => {
              if (!record.id) return;
              // @ts-ignore - _openDeleteModal is injected by table
              record._openDeleteModal(record.id);
            }}
          >
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];

// ==============================================
// COLUMN CONFIGURATION FOR PENDING LETTERS
// ==============================================
export const getPendingLetterColumns = (): ColumnsType<Letter> => [
  {
    title: "No",
    key: "no",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    width: 150,
    render: (value) => getLetterTypeLabel(value),
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    width: 120,
    render: (value) => value || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    width: 200,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Tanggal Pembuatan",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    render: (value) => formatDate(value),
  },
  {
    title: "Tujuan Surat",
    dataIndex: "destination",
    key: "destination",
    width: 150,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 150,
    render: (value) => {
      const { label, color, bgColor } = getLetterStatusInfo(value);
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}
        >
          {label}
        </span>
      );
    },
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 180,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/pending/view/${record.id}`}>
          <Button size="xs" className="bg-blue-600 hover:bg-blue-700">
            <FileSearchOutlined />
          </Button>
        </Link>
        <Link href={`letters/view/${record.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
      </div>
    ),
  },
];

// ==============================================
// COLUMN CONFIGURATION FOR DRAFT LETTERS
// ==============================================
export const getDraftLetterColumns = (): ColumnsType<Letter> => [
  {
    title: "No",
    key: "no",
    width: 60,
    render: (_, __, index) => index + 1,
  },
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    width: 150,
    render: (value) => getLetterTypeLabel(value),
  },
  {
    title: "Nomor Surat",
    dataIndex: "letterNumber",
    key: "letterNumber",
    width: 120,
    render: (value) => value || "-",
  },
  {
    title: "Perihal",
    dataIndex: "subject",
    key: "subject",
    width: 200,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Tanggal Pembuatan",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 120,
    render: (value) => formatDate(value),
  },
  {
    title: "Tujuan Surat",
    dataIndex: "destination",
    key: "destination",
    width: 150,
    ellipsis: true,
    render: (value) => (
      <span className="line-clamp-2" title={value}>
        {value}
      </span>
    ),
  },
  {
    title: "Penandatangan",
    key: "signers",
    width: 200,
    render: (_, record) => {
      const signers = [
        record.signer1,
        record.signer2,
        record.signer3,
      ].filter(Boolean);

      if (signers.length === 0) return "-";

      return (
        <div className="flex flex-col gap-1">
          {signers.map((signer, index) => (
            <span key={index} className="text-xs">
              {index + 1}. {signer?.staffs?.staffName || signer?.username}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 150,
    render: (_, record) => (
      <div className="flex gap-2 text-xs">
        <Link href={`letters/view/${record.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
        <Link href={`letters/edit/${record.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>
        <Button
          size="xs"
          onClick={() => {
            if (!record.id) return;
            // @ts-ignore - _openDeleteModal is injected by table
            record._openDeleteModal(record.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];
