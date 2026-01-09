import { Spin, Space, Button } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Image } from "antd";
import dayjs from "dayjs";
import type {
  UmkmMonitoring,
  UmkmMonitoringDoc,
} from "@/utils/services/umkmmonitoring.service";

interface UmkmMonitoringSectionProps {
  monitoring: UmkmMonitoring[];
  monitoringLoading: boolean;
  onCreateMonitoring: () => void;
  onEditMonitoring: (record: UmkmMonitoring) => void;
  onDeleteMonitoring: (monitoringId: number) => void;
  onDeleteMonitoringDocument?: (monitoringId: number, docId: number) => void;
  deletingMonitoringId: number | null;
}

export default function UmkmMonitoringSection({
  monitoring,
  monitoringLoading,
  onCreateMonitoring,
  onEditMonitoring,
  onDeleteMonitoring,
  onDeleteMonitoringDocument,
  deletingMonitoringId,
}: UmkmMonitoringSectionProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Monitoring UMKM ({monitoring.length})
        </h4>
        <Button
          onClick={onCreateMonitoring}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <PlusOutlined className="mr-2" />
          Tambah Monitoring
        </Button>
      </div>

      {monitoringLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : monitoring.length > 0 ? (
        <div className="space-y-4">
          {monitoring.map((record) => (
            <div
              key={record.id}
              className="p-4 border border-gray-200 rounded-xl dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-sm font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                    #{record.visitNumber}
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {record.surveyor}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(record.monitoringDate).format("DD MMMM YYYY")}
                  </span>
                </div>
                <Space size="small">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onEditMonitoring(record)}
                  >
                    <EditOutlined className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    className="text-red-600 hover:text-red-700 hover:border-red-600"
                    onClick={() => onDeleteMonitoring(record.id)}
                    disabled={deletingMonitoringId === record.id}
                  >
                    {deletingMonitoringId === record.id ? (
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
                {record.turnoverBefore !== null && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Omset Sebelum
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      Rp{record.turnoverBefore!.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {record.turnoverAfter !== null && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Omset Sesudah
                    </span>
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Rp{record.turnoverAfter!.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {record.workersBefore !== null && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Tenaga Kerja Sebelum
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {record.workersBefore} orang
                    </span>
                  </div>
                )}
                {record.workersAfter !== null && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Tenaga Kerja Sesudah
                    </span>
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {record.workersAfter} orang
                    </span>
                  </div>
                )}
                {record.productionBefore !== null && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Produksi Sebelum
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {record.productionBefore!.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {record.productionAfter !== null && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Produksi Sesudah
                    </span>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                      {record.productionAfter!.toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {record.customersBefore !== null && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Pelanggan Sebelum
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {record.customersBefore} orang
                    </span>
                  </div>
                )}
                {record.customersAfter !== null && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Pelanggan Sesudah
                    </span>
                    <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                      {record.customersAfter} orang
                    </span>
                  </div>
                )}
                {record.benefitLevel && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Manfaat Bantuan
                    </span>
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                      {record.benefitLevel}
                    </span>
                  </div>
                )}
              </div>

              {record.challenges && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    Kendala yang Dihadapi
                  </span>
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {record.challenges}
                  </span>
                </div>
              )}

              {record.developmentNeeds && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    Kebutuhan Tambahan/Rencana Pengembangan
                  </span>
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {record.developmentNeeds}
                  </span>
                </div>
              )}

              {record.otherNotes && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    Catatan Lain
                  </span>
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {record.otherNotes}
                  </span>
                </div>
              )}

              {record.umkmMonitoringDocs &&
                record.umkmMonitoringDocs.length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                      Dokumentasi:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {record.umkmMonitoringDocs.map(
                        (doc: UmkmMonitoringDoc) => (
                          <div key={doc.id} className="relative group">
                            <div className="relative w-full h-32 overflow-hidden rounded-lg">
                              <Image.PreviewGroup>
                                <Image
                                  src={doc.urlDoc}
                                  alt={doc.name}
                                  className="object-cover w-full h-full cursor-pointer"
                                  preview={{
                                    cover: (
                                      <div className="text-white">Lihat</div>
                                    ),
                                  }}
                                />
                              </Image.PreviewGroup>
                              {onDeleteMonitoringDocument && (
                                <button
                                  onClick={() =>
                                    onDeleteMonitoringDocument(
                                      record.id,
                                      doc.id
                                    )
                                  }
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
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          Belum ada monitoring yang tercatat.
        </p>
      )}
    </div>
  );
}
