import { Spin, Space, Button, Form, Input, DatePicker, Upload, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import { Image } from "antd";
import dayjs from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import type { ChildAssistance, ChildAssistanceDoc } from "@/utils/services/childassistance.service";

interface ChildAssistanceSectionProps {
  assistance: ChildAssistance[];
  assistanceLoading: boolean;
  onCreateAssistance: () => void;
  onEditAssistance: (assist: ChildAssistance) => void;
  onDeleteAssistance: (assistId: number) => void;
  onDeleteAssistanceDocument?: (assistId: number, docId: number) => void;
  deletingAssistanceId: number | null;
}

export default function ChildAssistanceSection({
  assistance,
  assistanceLoading,
  onCreateAssistance,
  onEditAssistance,
  onDeleteAssistance,
  onDeleteAssistanceDocument,
  deletingAssistanceId,
}: ChildAssistanceSectionProps) {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Bantuan Anak ({assistance.length})
          </h4>
          <Button
            onClick={onCreateAssistance}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusOutlined className="mr-2" />
            Tambah Bantuan
          </Button>
        </div>

        {assistanceLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : assistance.length > 0 ? (
          <div className="space-y-4">
            {assistance.map((assist) => (
              <div
                key={assist.id}
                className="p-4 border border-gray-200 rounded-xl dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      #{assist.assistanceNumber}
                    </span>
                    <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {assist.assistanceType}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {dayjs(assist.assistanceDate).format("DD MMMM YYYY")}
                    </span>
                  </div>
                  <Space size="small">
                    <Button size="small" variant="outlined" onClick={() => onEditAssistance(assist)}>
                      <EditOutlined className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                      onClick={() => onDeleteAssistance(assist.id)}
                      disabled={deletingAssistanceId === assist.id}
                    >
                      {deletingAssistanceId === assist.id ? (
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Pemberi Bantuan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {assist.assistanceProvider}
                    </span>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Nominal Bantuan
                    </span>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Rp{assist.assistanceAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  {assist.age && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Usia
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {assist.age} Tahun
                      </span>
                    </div>
                  )}
                  {assist.educationLevel && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Jenjang Pendidikan
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {assist.educationLevel}
                      </span>
                    </div>
                  )}
                  {assist.educationGrade && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Tingkat Pendidikan
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {assist.educationGrade}
                      </span>
                    </div>
                  )}
                </div>

                {assist.notes && (
                  <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Catatan
                    </span>
                    <span className="text-sm text-gray-800 dark:text-white/90">
                      {assist.notes}
                    </span>
                  </div>
                )}

                {assist.childAssistanceDocs && assist.childAssistanceDocs.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Dokumentasi:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {assist.childAssistanceDocs.map((doc: ChildAssistanceDoc) => (
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
                            {onDeleteAssistanceDocument && (
                              <button
                                onClick={() => onDeleteAssistanceDocument(assist.id, doc.id)}
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