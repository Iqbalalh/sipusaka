"use client";

import { Button, Input, Select, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import ButtonUI from "@/components/ui/button/Button";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import { formatDate } from "@/utils/formatter/formatDate";
import { useState } from "react";

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
    <div style={{ padding: 8, minWidth: 200 }}>
      <Input
        placeholder={`Cari ${dataIndex}`}
        value={selectedKeys[0] || ""}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: "block" }}
        size="small"
      />
      <Space>
        <Button
          type="primary"
          onClick={() => confirm()}
          icon={<SearchOutlined />}
          size="small"
        >
          Cari
        </Button>
        <Button
          size="small"
          onClick={() => {
            clearFilters && clearFilters();
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value: string | number | boolean, record: ChildAssistance) => {
    if (dataIndex === "childrenName") {
      return record.children?.childrenName
        ? record.children.childrenName
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "assistanceProvider") {
      return record.assistanceProvider
        ? record.assistanceProvider
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    if (dataIndex === "educationLevel") {
      return record.educationLevel
        ? record.educationLevel
            .toLowerCase()
            .includes(String(value).toLowerCase())
        : false;
    }
    return false;
  },
});

// ==============================================
// DATE FILTER COMPONENT
// ==============================================
const DateFilter = ({
  setSelectedKeys,
  selectedKeys,
  confirm,
  clearFilters,
}: any) => {
  const [filterType, setFilterType] = useState<"year" | "range">("year");

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear; i >= currentYear - 10; i--) {
    yearOptions.push({ value: i, label: String(i) });
  }

  return (
    <div style={{ padding: 8, minWidth: 240 }}>
      <Space style={{ marginBottom: 8 }}>
        <Button
          type={filterType === "year" ? "primary" : "default"}
          size="small"
          onClick={() => setFilterType("year")}
        >
          Tahun
        </Button>
        <Button
          type={filterType === "range" ? "primary" : "default"}
          size="small"
          onClick={() => setFilterType("range")}
        >
          Rentang
        </Button>
      </Space>

      {filterType === "year" ? (
        <Select
          style={{ width: "100%", marginBottom: 8 }}
          size="small"
          placeholder="Pilih Tahun"
          value={selectedKeys[0] || undefined}
          onChange={(val) => setSelectedKeys(val ? [val] : [])}
          options={yearOptions}
          allowClear
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 8,
          }}
        >
          <input
            type="date"
            value={
              selectedKeys[0]
                ? new Date(selectedKeys[0]).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const start = e.target.value
                ? new Date(e.target.value + "T00:00:00").toISOString()
                : "";
              setSelectedKeys(start ? [start, selectedKeys[1] || start] : []);
            }}
            style={{
              padding: "2px 6px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid #d9d9d9",
            }}
          />
          <input
            type="date"
            value={
              selectedKeys[1]
                ? new Date(selectedKeys[1]).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const end = e.target.value
                ? new Date(e.target.value + "T23:59:59").toISOString()
                : "";
              setSelectedKeys(selectedKeys[0] ? [selectedKeys[0], end] : []);
            }}
            style={{
              padding: "2px 6px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid #d9d9d9",
            }}
          />
        </div>
      )}

      <Space>
        <Button type="primary" size="small" onClick={() => confirm()}>
          Terapkan
        </Button>
        <Button
          size="small"
          onClick={() => {
            clearFilters && clearFilters();
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  );
};

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getChildAssistanceColumns = (
  router: any,
  role?: string,
  openDeleteModal?: (id: number) => void,
): TableColumnsType<ChildAssistance> => [
  {
    title: "Bantuan Ke-",
    dataIndex: "assistanceNumber",
    key: "assistanceNumber",
    width: 100,
    sorter: (a, b) => a.assistanceNumber - b.assistanceNumber,
    render: (value) => value || "-",
  },
  {
    title: "Nama Anak",
    dataIndex: "childrenName",
    key: "childrenName",
    ...getColumnSearchProps("childrenName"),
    render: (_, record) => record.children?.childrenName || "-",
  },
  {
    title: "Tanggal Bantuan",
    dataIndex: "assistanceDate",
    key: "assistanceDate",
    width: 150,
    sorter: (a, b) =>
      new Date(b.assistanceDate).getTime() -
      new Date(a.assistanceDate).getTime(),
    filterDropdown: (props: any) => <DateFilter {...props} />,
    filterIcon: (filtered: boolean) => (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        style={{
          width: 14,
          height: 14,
          color: filtered ? "#1677ff" : "#8c8c8c",
        }}
      >
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L13 10.414V15a1 1 0 01-.553.894l-4 2A1 1 0 017 17v-6.586L3.293 6.707A1 1 0 013 6V3z"
          clipRule="evenodd"
        />
      </svg>
    ),
    onFilter: (value: any, record: ChildAssistance) => {
      const recordDate = new Date(record.assistanceDate);
      if (typeof value === "number") return recordDate.getFullYear() === value;
      if (Array.isArray(value) && value.length === 2) {
        return (
          recordDate >= new Date(value[0]) && recordDate <= new Date(value[1])
        );
      }
      return false;
    },
    render: (value) => (value ? formatDate(value) : "-"),
  },
  {
    title: "Jumlah Bantuan",
    dataIndex: "assistanceAmount",
    key: "assistanceAmount",
    width: 150,
    sorter: (a: ChildAssistance, b: ChildAssistance) =>
      a.assistanceAmount - b.assistanceAmount,
    render: (value: number) =>
      value ? `Rp ${value.toLocaleString("id-ID")}` : "-",
    exportRender: (value: number) => value ?? "",
  } as any,
  {
    title: "Penyedia Bantuan",
    dataIndex: "assistanceProvider",
    key: "assistanceProvider",
    width: 160,
    ...getColumnSearchProps("assistanceProvider"),
    render: (value) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        {value || "-"}
      </span>
    ),
  },
  {
    title: "Tingkat Pendidikan",
    dataIndex: "educationLevel",
    key: "educationLevel",
    width: 160,
    ...getColumnSearchProps("educationLevel"),
    render: (value) => (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        {value || "-"}
      </span>
    ),
  },
  {
    title: "Wilayah",
    dataIndex: "regionName",
    key: "regionName",
    width: 130,
    render: (_, record) => (
      <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        {record.children?.homes?.regions?.regionName || "-"}
      </span>
    ),
  },
  {
    title: "Usia",
    dataIndex: "age",
    key: "age",
    width: 80,
    sorter: (a, b) => (a.age || 0) - (b.age || 0),
    render: (value) => (value ? `${value} tahun` : "-"),
  },
  {
    title: "Dokumen",
    dataIndex: "childAssistanceDocs",
    key: "childAssistanceDocs",
    width: 100,
    render: (_, record) => {
      const docCount = record.childAssistanceDocs?.length || 0;
      return docCount > 0 ? `${docCount} dokumen` : "-";
    },
  },
  {
    title: "Aksi",
    key: "actions",
    fixed: "right",
    width: 100,
    render: (_, record) => (
      <div className="flex gap-2">
        {role !== "staff" && (
          <button
            className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (record.childrenId)
                router.push(`/children/view/${record.childrenId}`);
            }}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5 text-gray-600"
            >
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
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </ButtonUI>
        )}
      </div>
    ),
  },
];
