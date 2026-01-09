import { Spin, Space, Button, Form, Input, DatePicker, Upload, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import { Image } from "antd";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import type { UmkmVisit, UmkmVisitDoc } from "@/utils/services/umkmvisit.service";

interface UmkmVisitsSectionProps {
  visits: UmkmVisit[];
  visitsLoading: boolean;
  onCreateVisit: () => void;
  onEditVisit: (visit: UmkmVisit) => void;
  onDeleteVisit: (visitId: number) => void;
  onDeleteVisitDocument?: (visitId: number, docId: number) => void;
  deletingVisitId: number | null;
}

export default function UmkmVisitsSection({
  visits,
  visitsLoading,
  onCreateVisit,
  onEditVisit,
  onDeleteVisit,
  onDeleteVisitDocument,
  deletingVisitId,
}: UmkmVisitsSectionProps) {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Bantuan UMKM ({visits.length})
          </h4>
          <Button
            onClick={onCreateVisit}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusOutlined className="mr-2" />
            Tambah Bantuan
          </Button>
        </div>

        {visitsLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : visits.length > 0 ? (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div
                key={visit.id}
                className="p-4 border border-gray-200 rounded-xl dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      #{visit.visitNumber}
                    </span>
                    <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {visit.assistanceType}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dayjs(visit.assistanceDate).format("DD MMMM YYYY")}
                    </span>
                  </div>
                  <Space size="small">
                    <Button size="small" variant="outlined" onClick={() => onEditVisit(visit)}>
                      <EditOutlined className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                      onClick={() => onDeleteVisit(visit.id)}
                      disabled={deletingVisitId === visit.id}
                    >
                      {deletingVisitId === visit.id ? (
                        <>
                          <Spin size="small" className="mr-1" />
                          Menghapus...
                        </>
                      ) : (
                        <>
                          <DeleteOutlined className="mr-1" />
                          Hapus
                        </>
                      )}
                    </Button>
                  </Space>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Jenis Barang
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {visit.itemType}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Jumlah Bantuan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {visit.assistanceAmount}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Sumber Bantuan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {visit.assistanceSource}
                    </span>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Nilai Bantuan
                    </span>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Rp{visit.value.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {visit.notes && (
                  <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Catatan
                    </span>
                    <span className="text-sm text-gray-800 dark:text-white/90">
                      {visit.notes}
                    </span>
                  </div>
                )}

                {visit.umkmVisitDocs && visit.umkmVisitDocs.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Dokumentasi:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {visit.umkmVisitDocs.map((doc: UmkmVisitDoc) => (
                        <div key={doc.id} className="relative group">
                          <div className="relative w-full h-32 overflow-hidden rounded-lg">
                            <Image.PreviewGroup>
                              <Image
                                src={doc.urlDoc}
                                alt={doc.name}
                                className="object-cover w-full h-full cursor-pointer"
                                preview={{
                                  cover: <div className="text-white">Lihat</div>,
                                }}
                              />
                            </Image.PreviewGroup>
                            {onDeleteVisitDocument && (
                              <button
                                onClick={() => onDeleteVisitDocument(visit.id, doc.id)}
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Hapus dokumen"
                              >
                                <DeleteOutlined className="text-xs" />
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {doc.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Belum ada bantuan yang tercatat.
          </p>
        )}
      </div>
    </>
  );
}