import { Badge } from "antd";
import { EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { LetterTemplate } from "@/utils/services/letter-template.service";
import { getLetterTypeLabel } from "../letters.constants";

interface LetterTemplateWithActions extends LetterTemplate {
  _openDeleteModal?: (id: number) => void;
  _openEditModal?: (template: LetterTemplate) => void;
  _downloadTemplate?: (id: number, templateName: string) => void;
}

export const getLetterTemplateColumns = (): ColumnsType<LetterTemplateWithActions> => [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 60,
    render: (id: number) => <span className="font-medium">#{id}</span>,
  },
  {
    title: "Jenis Surat",
    dataIndex: "letterType",
    key: "letterType",
    width: 180,
    render: (letterType: string) => (
      <Badge
        color="blue"
        text={getLetterTypeLabel(letterType as any)}
      />
    ),
  },
  {
    title: "Nama Template",
    dataIndex: "templateName",
    key: "templateName",
    width: 200,
    render: (name: string) => <span className="font-medium">{name}</span>,
  },
  {
    title: "Versi",
    dataIndex: "version",
    key: "version",
    width: 80,
    render: (version: number) => <Badge color="green" text={`v${version}`} />,
  },
  {
    title: "Status",
    dataIndex: "isActive",
    key: "isActive",
    width: 100,
    render: (isActive: boolean) => (
      <Badge
        color={isActive ? "green" : "red"}
        text={isActive ? "Aktif" : "Nonaktif"}
      />
    ),
  },
  {
    title: "Variabel",
    dataIndex: "variables",
    key: "variables",
    width: 200,
    render: (variables: string[] | null) => {
      if (!variables || variables.length === 0) {
        return <span className="text-gray-400">Tidak ada variabel</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {variables.slice(0, 3).map((v, i) => (
            <Badge
              key={i}
              color="purple"
              text={`{${v}}`}
              className="text-xs"
            />
          ))}
          {variables.length > 3 && (
            <span className="text-gray-400 text-xs">
              +{variables.length - 3} lainnya
            </span>
          )}
        </div>
      );
    },
  },
  {
    title: "Dibuat Oleh",
    dataIndex: "user",
    key: "user",
    width: 150,
    render: (user: { name: string } | null) => (
      <span>{user?.name || "-"}</span>
    ),
  },
  {
    title: "Tanggal Dibuat",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 150,
    render: (date: string) => {
      const d = new Date(date);
      return <span>{d.toLocaleDateString("id-ID")}</span>;
    },
  },
  {
    title: "Aksi",
    key: "actions",
    width: 120,
    fixed: "right",
    render: (_, record) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => record._downloadTemplate?.(record.id, record.templateName)}
          className="text-green-600 hover:text-green-800 transition-colors"
          title="Download Template"
        >
          <DownloadOutlined />
        </button>
        <button
          onClick={() => record._openEditModal?.(record)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="Edit Template"
        >
          <EditOutlined />
        </button>
        <button
          onClick={() => record._openDeleteModal?.(record.id)}
          className="text-red-600 hover:text-red-800 transition-colors"
          title="Hapus Template"
        >
          <DeleteOutlined />
        </button>
      </div>
    ),
  },
];
