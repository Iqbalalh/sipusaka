"use client";

import { Input, Tag, DatePicker, Button, Select } from "antd";
import ButtonUI from "@/components/ui/button/Button";
import { DeleteOutlined, SearchOutlined, FilterOutlined, EditOutlined } from "@ant-design/icons";
import { ChildAssistance } from "@/utils/services/childassistance.service";
import type { ColumnsType } from "antd/es/table";
import { formatDate } from "@/utils/formatter/formatDate";
import { useState } from "react";
import { useRouter } from "next/navigation";

const { RangePicker } = DatePicker;
const { Option } = Select;

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
  
  // Generate year options (last 10 years + current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear; i >= currentYear - 10; i--) {
    yearOptions.push(i);
  }
  
  return (
    <div style={{ padding: 8, minWidth: 280 }}>
      <div className="flex gap-2 mb-2">
        <Button
          size="small"
          type={filterType === "year" ? "primary" : "default"}
          onClick={() => setFilterType("year")}
        >
          Tahun
        </Button>
        <Button
          size="small"
          type={filterType === "range" ? "primary" : "default"}
          onClick={() => setFilterType("range")}
        >
          Rentang
        </Button>
      </div>
      
      {filterType === "year" ? (
        <Select
          placeholder="Pilih Tahun"
          value={selectedKeys[0]}
          onChange={(value) => setSelectedKeys(value ? [value] : [])}
          style={{ width: "100%", marginBottom: 8 }}
          allowClear
        >
          {yearOptions.map((year) => (
            <Option key={year} value={year}>
              {year}
            </Option>
          ))}
        </Select>
      ) : (
        <RangePicker
          value={selectedKeys[0] ? [selectedKeys[0], selectedKeys[1]] : null}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setSelectedKeys([dates[0].startOf("day").toISOString(), dates[1].endOf("day").toISOString()]);
            } else {
              setSelectedKeys([]);
            }
          }}
          style={{ width: "100%", marginBottom: 8 }}
        />
      )}
      
      <div className="flex gap-2">
        <button
          className="text-white bg-blue-500 px-2 py-1 rounded text-xs"
          onClick={() => confirm()}
        >
          Terapkan
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
  );
};

// ==============================================
// COLUMN CONFIGURATION
// ==============================================
export const getChildAssistanceColumns = (router: any): ColumnsType<ChildAssistance> => [
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
    sorter: (a, b) => new Date(b.assistanceDate).getTime() - new Date(a.assistanceDate).getTime(),
    filterDropdown: DateFilter,
    filterIcon: (filtered: boolean) => (
      <FilterOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value: any, record: ChildAssistance) => {
      const recordDate = new Date(record.assistanceDate);
      
      // Year filter
      if (typeof value === "number") {
        return recordDate.getFullYear() === value;
      }
      
      // Range filter
      if (Array.isArray(value) && value.length === 2) {
        const startDate = new Date(value[0]);
        const endDate = new Date(value[1]);
        return recordDate >= startDate && recordDate <= endDate;
      }
      
      return false;
    },
    render: (value) => value ? formatDate(value) : "-",
  },
  {
    title: "Jumlah Bantuan",
    dataIndex: "assistanceAmount",
    key: "assistanceAmount",
    width: 150,
    sorter: (a, b) => a.assistanceAmount - b.assistanceAmount,
    render: (value) => {
      return value ? `Rp ${value.toLocaleString("id-ID")}` : "-";
    },
  },
  {
    title: "Penyedia Bantuan",
    dataIndex: "assistanceProvider",
    key: "assistanceProvider",
    width: 150,
    ...getColumnSearchProps("assistanceProvider"),
    render: (value) => (
      <Tag color="blue">{value || "-"}</Tag>
    ),
  },
  {
    title: "Tingkat Pendidikan",
    dataIndex: "educationLevel",
    key: "educationLevel",
    width: 120,
    ...getColumnSearchProps("educationLevel"),
    render: (value) => (
      <Tag color="green">{value || "-"}</Tag>
    ),
  },
  {
    title: "Usia",
    dataIndex: "age",
    key: "age",
    width: 80,
    sorter: (a, b) => (a.age || 0) - (b.age || 0),
    render: (value) => value ? `${value} tahun` : "-",
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
      <div className="flex gap-2 text-xs">
        <Button
          type="default"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            if (record.childrenId) {
              router.push(`/children/view/${record.childrenId}`);
            }
          }}
        />
        <ButtonUI
          size="xs"
          onClick={() => {
            if (!record.id) return;
            // @ts-ignore - _openDeleteModal is injected by DataTable
            record._openDeleteModal(record.id);
          }}
        >
          <DeleteOutlined />
        </ButtonUI>
      </div>
    ),
  },
];
