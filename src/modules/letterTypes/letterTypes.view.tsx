"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tag, Badge, Spin, Descriptions, Divider } from "antd";
import { LoadingOutlined, EditOutlined } from "@ant-design/icons";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import DocumentViewer from "@/components/custom/DocumentViewer";

import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { getLetterType } from "@/utils/services/letterType.service";
import { LetterType } from "@/types/models/letterType";

interface LetterTypesViewProps {
  letterTypeId: string;
}

export default function LetterTypesView({ letterTypeId }: LetterTypesViewProps) {
  const router = useRouter();
  const { notify } = useNotify();
  const [letterType, setLetterType] = useState<LetterType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lt = await getLetterType(letterTypeId);
        setLetterType(lt);
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [letterTypeId, notify]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );
  }

  if (!letterType) {
    return (
      <div className="text-center py-16 text-gray-500">Template Surat tidak ditemukan</div>
    );
  }

  const previewNumber = `${String(letterType.currentCounter + 1).padStart(3, "0")}/${letterType.kodeSurat1}${letterType.kodeSurat2 ? "/" + letterType.kodeSurat2 : ""}/…/….`;

  return (
    <div>
      <PageBreadcrumb pageTitle="Detail Template Surat" />
      <div className="space-y-6">
        <ComponentCard
          title={letterType.jenisSurat}
          header
        >
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => router.push(`/letters/types/edit/${letterType.id}`)}
            >
              <EditOutlined className="mr-1" /> Edit
            </Button>
          </div>

          <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
            <Descriptions.Item label="Jenis Surat" span={2}>
              <span className="font-medium">{letterType.jenisSurat}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Perihal Default" span={2}>
              {letterType.perihal || <span className="text-gray-400">-</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Kode Surat I">
              <Tag color="blue">{letterType.kodeSurat1}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kode Surat II">
              {letterType.kodeSurat2 ? (
                <Tag color="cyan">{letterType.kodeSurat2}</Tag>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Counter Saat Ini">
              <span className="font-mono font-semibold text-blue-600">
                {String(letterType.currentCounter).padStart(3, "0")}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {letterType.isActive ? (
                <Badge status="success" text="Aktif" />
              ) : (
                <Badge status="default" text="Nonaktif" />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Nomor Surat Berikutnya" span={2}>
              <span className="font-mono font-semibold text-green-700">{previewNumber}</span>
            </Descriptions.Item>
          </Descriptions>

          {letterType.templateFields.length > 0 && (
            <>
              <Divider plain>
                Field Template ({letterType.templateFields.length})
              </Divider>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {letterType.templateFields.map((field, i) => (
                  <div
                    key={i}
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <p className="text-xs text-gray-500 mb-0.5">Key</p>
                    <p className="font-mono text-sm font-medium">
                      {"{"}
                      {field.key}
                      {"}"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 mb-0.5">Label</p>
                    <p className="text-sm">{field.label}</p>
                    {field.required && (
                      <span className="mt-1 inline-block text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                        Wajib
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </ComponentCard>

        {letterType.templateUrl && (
          <ComponentCard title="Preview Template Dokumen">
            <DocumentViewer url={letterType.templateUrl} fileName="template.docx" />
          </ComponentCard>
        )}
      </div>
    </div>
  );
}
