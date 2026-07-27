"use client";

import { Image } from "antd";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import { Alumni } from "@/types/models/alumni";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";
import { getDateRangeFilterProps } from "@/utils/table/dateRangeFilter";

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getAlumniColumns = (
  role?: string,
  eduFilters?: { text: string; value: string }[],
  onDelete?: (id: number) => void,
): ColumnsType<Alumni> => [
  {
    title: "Foto",
    dataIndex: "alumniPict",
    key: "alumniPict",
    render: (_: any, row: Alumni) =>
      row.alumniPict ? (
        <Image
          src={row.alumniPict}
          alt={row.alumniName}
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
      ) : (
        <Image src="/images/user/alt-user.png" alt="N/A" width={40} height={40} />
      ),
  },

  {
    title: "Nama Alumni",
    dataIndex: "alumniName",
    key: "alumniName",
    render: (text) => text || "-",
  },

  {
    title: "NIK",
    dataIndex: "nik",
    key: "nik",
    render: (text) => text || "-",
  },

  {
    title: "Jenis Kelamin",
    dataIndex: "alumniGender",
    key: "alumniGender",
    filters: [
      { text: "Laki-laki", value: "M" },
      { text: "Perempuan", value: "F" },
    ],
    render: (gender: "M" | "F") => (gender === "M" ? "Laki-laki" : gender === "F" ? "Perempuan" : "-"),
  },

  {
    title: "Tanggal Lahir",
    dataIndex: "alumniBirthdate",
    key: "alumniBirthdate",
    ...getDateRangeFilterProps<Alumni>("alumniBirthdate"),
    render: (text) => (text ? formatDate(text) : "-"),
  },

  {
    title: "Usia",
    dataIndex: "alumniBirthdate",
    key: "age",
    render: (text) => {
      if (!text) return "-";
      const birth = new Date(text);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} Tahun`;
    },
  },

  {
    title: "Pendidikan Terakhir",
    dataIndex: "educationLevel",
    key: "educationLevel",
    filters: eduFilters ?? [],
    onFilter: (value, record) => (record.educationLevel?.trim() ?? "") === String(value),
    render: (text) => text || "-",
  },

  {
    title: "Pekerjaan",
    dataIndex: "alumniJob",
    key: "alumniJob",
    render: (text) => text || "-",
  },

  {
    title: "No. Telepon",
    dataIndex: "alumniPhone",
    key: "alumniPhone",
    render: (text) => text || "-",
  },

  {
    title: "Alamat",
    dataIndex: "alumniAddress",
    key: "alumniAddress",
    render: (text) => text || "-",
  },

  {
    title: "Keterangan",
    dataIndex: "notes",
    key: "notes",
    render: (text) => text || "-",
  },

  {
    title: "Dibuat Pada",
    dataIndex: "createdAt",
    key: "createdAt",
    ...getDateRangeFilterProps<Alumni>("createdAt"),
    render: (text) => (text ? formatDate(text) : "-"),
    hidden: true,
  },

  {
    title: "Diperbarui Pada",
    dataIndex: "updatedAt",
    key: "updatedAt",
    ...getDateRangeFilterProps<Alumni>("updatedAt"),
    render: (text) => (text ? formatDate(text) : "-"),
    hidden: true,
  },

  {
    title: "Dibuat Oleh",
    dataIndex: "createdBy",
    key: "createdBy",
    render: (_: any, record: any) => record?.createdByStaffName || record?.createdBy || "-",
  },

  {
    title: "Diedit Oleh",
    dataIndex: "editedBy",
    key: "editedBy",
    render: (_: any, record: any) => record?.editedByStaffName || record?.editedBy || "-",
  },

  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, row) => (
      <div className="flex gap-2 text-xs">
        <Link href={`/alumni/view/${row.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>

        {role !== "staff" && (
          <Link href={`/alumni/edit/${row.id}`}>
            <Button size="xs">
              <EditOutlined />
            </Button>
          </Link>
        )}

        {role !== "staff" && onDelete && (
          <Button size="xs" onClick={() => { if (row.id) onDelete(row.id); }}>
            <DeleteOutlined />
          </Button>
        )}
      </div>
    ),
  },
];
