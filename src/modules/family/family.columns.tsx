"use client";

import { Image, Input } from "antd";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { HomeTable } from "@/types/models/home";
import { Region } from "@/types/models/region";
import type { ColumnsType } from "antd/es/table";
import type { InputRef } from "antd";

// ==============================================
// SEARCH CONFIGURATION
// ==============================================
const getColumnSearchProps = (dataIndex: string): any => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }: any) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Cari ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: "block" }}
      />
      <div className="flex gap-2">
        <button
          className="text-white bg-blue-500 px-2 py-1 rounded text-xs"
          onClick={() => confirm()}
        >
          Cari
        </button>
        <button
          className="text-gray-700 bg-gray-200 px-2 py-1 rounded text-xs"
          onClick={() => {
            clearFilters && clearFilters();
            confirm();
          }}
        >
          Reset
        </button>
      </div>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value: string | number | boolean, record: HomeTable) => {
    // Handle nested object properties
    if (dataIndex === "employeeName") {
      return record.employees?.employeeName
        ? record.employees.employeeName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "nipNipp") {
      return record.employees?.nipNipp
        ? record.employees.nipNipp
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "partnerName") {
      return record.partners?.partnerName
        ? record.partners.partnerName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "waliName") {
      return record.wali?.waliName
        ? record.wali.waliName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    return false;
  },
});

// ==============================================
// COLUMN CONFIGURATION GENERATOR
// ==============================================
export const getFamilyColumns = (regions: Region[]): ColumnsType<HomeTable> => [
  {
    title: "Pegawai",
    dataIndex: "employeeName",
    key: "employeeName",
    ...getColumnSearchProps("employeeName"),
    render: (_, home) => (
      <div className="flex items-center gap-3">
        {home.employees?.employeePict ? (
          <Image
            src={home.employees?.employeePict || "/images/user/alt-user.png"}
            alt={home.employees?.employeeName || "N/A"}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
            <Image
              src={"/images/user/alt-user.png"}
              alt={"N/A"}
              width={40}
              height={40}
            />
          </div>
        )}
        <div>
          <span className="block font-medium text-gray-800 dark:text-white/90">
            {home.employees?.employeeName || "-"}
          </span>
          <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
            NIP/NIPP: {home.employees?.nipNipp || "-"}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Pasangan",
    dataIndex: "partnerName",
    key: "partnerName",
    ...getColumnSearchProps("partnerName"),
    render: (_, home) => (
      <div className="flex items-center gap-3">
        {home.partners?.partnerPict ? (
          <Image
            src={home.partners?.partnerPict || "/images/user/alt-user.png"}
            alt={home.partners?.partnerName || "N/A"}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        ) : (
          <Image
            src={"/images/user/alt-user.png"}
            alt={"N/A"}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
          />
        )}
        <div>
          <span className="flex font-medium text-gray-800 dark:text-white/90 items-center">
            {home.partners?.partnerName || "-"}
            {home.isUmkm ? (
              <span className="ml-1 w-3 h-3 rounded-full border-2 border-blue-400"></span>
            ) : null}
            {home.partners?.isAlive === false ? (
              <span className="ml-1 w-3 h-3 rounded-full border-2 border-red-400"></span>
            ) : null}
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Wali",
    dataIndex: "waliName",
    key: "waliName",
    ...getColumnSearchProps("waliName"),
    render: (_, home) => home.wali?.waliName || "-",
  },
  {
    title: "Anak",
    dataIndex: "_count",
    key: "_count",
    align: "center",
    render: (_, home) => home._count?.children || 0,
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
    render: (_, home) => {
      const region = regions.find((r) => r.regionId === home.regionId);
      return region ? region.regionName : home.regions?.regionName || "-";
    },
  },
  {
    title: "Status",
    dataIndex: "partners",
    key: "isActive",

    width: 120,
    filters: [
      { text: "Aktif", value: true },
      { text: "Tidak Aktif", value: false },
    ],
    onFilter: (value, record) => record.partners?.isActive === value,
    render: (_, home) => (
      <Badge size="sm" color={home.partners?.isActive ? "success" : "error"}>
        {home.partners?.isActive ? "Aktif" : "Tidak Aktif"}
      </Badge>
    ),
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    render: (_, home) => (
      <div className="flex gap-2 text-xs">
        <Link href={`family/view/${home.id}`}>
          <Button size="xs">
            <EyeOutlined />
          </Button>
        </Link>
        <Link href={`family/edit/${home.id}`}>
          <Button size="xs">
            <EditOutlined />
          </Button>
        </Link>
        <Button
          size="xs"
          onClick={() => {
            if (!home.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            home._openDeleteModal(home.id);
          }}
        >
          <DeleteOutlined />
        </Button>
      </div>
    ),
  },
];
