"use client";

import type { TableColumnsType } from "antd";
import { Badge, Tag } from "antd";
import { LetterType } from "@/types/models/letterType";
import ButtonUI from "@/components/ui/button/Button";

export const getLetterTypeColumns = (
  router: any,
  role?: string,
  openDeleteModal?: (id: number) => void
): TableColumnsType<LetterType> => [
  {
    title: "Jenis Surat",
    dataIndex: "jenisSurat",
    key: "jenisSurat",
    render: (value) => <span className="font-medium">{value || "-"}</span>,
  },
  {
    title: "Kode",
    key: "kode",
    width: 180,
    render: (_, record) => (
      <div className="flex flex-wrap gap-1">
        <Tag color="blue">{record.kodeSurat1}</Tag>
        {record.kodeSurat2 && <Tag color="cyan">{record.kodeSurat2}</Tag>}
      </div>
    ),
  },
  {
    title: "Counter",
    dataIndex: "currentCounter",
    key: "currentCounter",
    width: 90,
    align: "center",
    render: (value) => (
      <span className="font-mono font-semibold text-blue-600">
        {String(value).padStart(3, "0")}
      </span>
    ),
  },
  {
    title: "Perihal",
    dataIndex: "perihal",
    key: "perihal",
    render: (value) =>
      value ? (
        <span className="text-sm text-gray-600 line-clamp-1">{value}</span>
      ) : (
        <span className="text-gray-400 text-sm">-</span>
      ),
  },
  {
    title: "Status",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    align: "center",
    render: (value) =>
      value ? (
        <Badge status="success" text="Aktif" />
      ) : (
        <Badge status="default" text="Nonaktif" />
      ),
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 110,
    render: (_, record) => (
      <div className="flex gap-2">
        <button
          className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
          onClick={() => router.push(`/letters/types/view/${record.id}`)}
          title="Lihat"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-600">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
        </button>
        {role !== "staff" && (
          <button
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => router.push(`/letters/types/edit/${record.id}`)}
            title="Edit"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-600">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
        {role !== "staff" && (
          <ButtonUI
            size="xs"
            onClick={() => {
              if (!record.id) return;
              openDeleteModal?.(record.id);
            }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </ButtonUI>
        )}
      </div>
    ),
  },
];
