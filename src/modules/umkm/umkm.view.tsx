"use client";

// Hooks
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Components
import {
  Image,
  Spin,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  message,
  Space,
  Card,
} from "antd";
import Button from "@/components/ui/button/Button";
import { InfoItem } from "@/components/ui/field/InfoItem";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Libs
import Link from "next/link";

// Icons
import {
  LoadingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

// Type
import { Umkm } from "@/types/models/umkm";
import {
  UmkmVisit,
  UmkmVisitDoc,
  getUmkmVisits,
  createUmkmVisit,
  updateUmkmVisit,
  deleteUmkmVisit,
  deleteUmkmVisitDocument,
} from "@/utils/services/umkmvisit.service";
import {
  UmkmMonitoring,
  UmkmMonitoringDoc,
  getUmkmMonitoring,
  createUmkmMonitoring,
  updateUmkmMonitoring,
  deleteUmkmMonitoring,
  deleteUmkmMonitoringDocument,
} from "@/utils/services/umkmmonitoring.service";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

// Utils
import { getUmkm } from "@/utils/services/umkm.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";

export default function UmkmView() {
  // Data state
  const [data, setData] = useState<Umkm | null>(null);
  const { id } = useParams<{ id: string }>();

  // Page State
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  // Visit state
  const [visits, setVisits] = useState<UmkmVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVisit, setEditingVisit] = useState<UmkmVisit | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [deletingVisitId, setDeletingVisitId] = useState<number | null>(null);

  // Monitoring state
  const [monitoring, setMonitoring] = useState<UmkmMonitoring[]>([]);
  const [monitoringLoading, setMonitoringLoading] = useState(true);
  const [monitoringModalVisible, setMonitoringModalVisible] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState<UmkmMonitoring | null>(null);
  const [monitoringForm] = Form.useForm();
  const [monitoringFileList, setMonitoringFileList] = useState<UploadFile[]>([]);
  const [deletingMonitoringId, setDeletingMonitoringId] = useState<number | null>(null);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const umkm = await getUmkm(id);

        setData(umkm);
      } catch (err) {
        notifyFromResult(notify, {
          error: err,
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, notify]);

  // ==========================
  // FETCH UMKM VISITS
  // ==========================
  const fetchVisits = useCallback(async () => {
    try {
      setVisitsLoading(true);
      const data = await getUmkmVisits(Number(id));
      setVisits(data);
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setVisitsLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    if (id) {
      fetchVisits();
    }
  }, [fetchVisits, id]);

  // ==========================
  // FETCH UMKM MONITORING
  // ==========================
  const fetchMonitoring = useCallback(async () => {
    try {
      setMonitoringLoading(true);
      const data = await getUmkmMonitoring(Number(id));
      setMonitoring(data);
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setMonitoringLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    if (id) {
      fetchMonitoring();
    }
  }, [fetchMonitoring, id]);

  // ==========================
  // VISIT HANDLERS
  // ==========================
  const handleCreateVisit = () => {
    setEditingVisit(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ umkmId: Number(id) });
    setModalVisible(true);
  };

  const handleEditVisit = (record: UmkmVisit) => {
    setEditingVisit(record);
    setFileList([]);
    form.setFieldsValue({
      ...record,
      assistanceDate: dayjs(record.assistanceDate),
    });
    setModalVisible(true);
  };

  const handleDeleteDocumentFromModal = async (docId: number) => {
    try {
      if (editingVisit) {
        await deleteUmkmVisitDocument(editingVisit.id, docId);
        messageApi.success({
          content: "Document deleted successfully",
          key: "delete-doc-modal",
          duration: 2,
        });
        fetchVisits();
        // Refresh the editing visit data
        const updatedVisits = await getUmkmVisits(Number(id));
        const updatedVisit = updatedVisits.find(
          (v) => v.id === editingVisit.id
        );
        if (updatedVisit) {
          setEditingVisit(updatedVisit);
        }
      }
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleDeleteVisit = async (visitId: number) => {
    try {
      setDeletingVisitId(visitId);
      await deleteUmkmVisit(visitId);
      messageApi.success({
        content: "UMKM visit deleted successfully",
        key: "delete-visit",
        duration: 2,
      });
      fetchVisits();
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setDeletingVisitId(null);
    }
  };

  const handleDeleteDocument = async (visitId: number, docId: number) => {
    try {
      await deleteUmkmVisitDocument(visitId, docId);
      messageApi.success({
        content: "Document deleted successfully",
        key: "delete-doc",
        duration: 2,
      });
      fetchVisits();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleSubmitVisit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append("umkmId", values.umkmId);
      formData.append("visitNumber", values.visitNumber);
      formData.append("assistanceDate", values.assistanceDate.format("YYYY-MM-DD"));
      formData.append("assistanceType", values.assistanceType);
      formData.append("itemType", values.itemType);
      formData.append("assistanceAmount", values.assistanceAmount);
      formData.append("assistanceSource", values.assistanceSource);
      formData.append("value", values.value);
      if (values.notes) {
        formData.append("notes", values.notes);
      }

      // Append files
      fileList.forEach((file: UploadFile) => {
        if (file.originFileObj) {
          formData.append("documents", file.originFileObj);
        }
      });

      if (editingVisit) {
        await updateUmkmVisit(editingVisit.id, formData);
        messageApi.success({
          content: "UMKM visit updated successfully",
          key: "update-visit",
          duration: 2,
        });
      } else {
        await createUmkmVisit(formData);
        messageApi.success({
          content: "UMKM visit created successfully",
          key: "create-visit",
          duration: 2,
        });
      }

      setModalVisible(false);
      fetchVisits();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  // ==========================
  // MONITORING HANDLERS
  // ==========================
  const handleCreateMonitoring = () => {
    setEditingMonitoring(null);
    setMonitoringFileList([]);
    monitoringForm.resetFields();
    monitoringForm.setFieldsValue({ umkmId: Number(id) });
    setMonitoringModalVisible(true);
  };

  const handleEditMonitoring = (record: UmkmMonitoring) => {
    setEditingMonitoring(record);
    setMonitoringFileList([]);
    monitoringForm.setFieldsValue({
      ...record,
      monitoringDate: dayjs(record.monitoringDate),
    });
    setMonitoringModalVisible(true);
  };

  const handleDeleteDocumentFromMonitoringModal = async (docId: number) => {
    try {
      if (editingMonitoring) {
        await deleteUmkmMonitoringDocument(editingMonitoring.id, docId);
        messageApi.success({
          content: "Document deleted successfully",
          key: "delete-doc-monitoring-modal",
          duration: 2,
        });
        fetchMonitoring();
        const updatedMonitoring = await getUmkmMonitoring(Number(id));
        const updatedRecord = updatedMonitoring.find(
          (m) => m.id === editingMonitoring.id
        );
        if (updatedRecord) {
          setEditingMonitoring(updatedRecord);
        }
      }
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleDeleteMonitoring = async (monitoringId: number) => {
    try {
      setDeletingMonitoringId(monitoringId);
      await deleteUmkmMonitoring(monitoringId);
      messageApi.success({
        content: "UMKM monitoring deleted successfully",
        key: "delete-monitoring",
        duration: 2,
      });
      fetchMonitoring();
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setDeletingMonitoringId(null);
    }
  };

  const handleDeleteMonitoringDocument = async (monitoringId: number, docId: number) => {
    try {
      await deleteUmkmMonitoringDocument(monitoringId, docId);
      messageApi.success({
        content: "Document deleted successfully",
        key: "delete-doc-monitoring",
        duration: 2,
      });
      fetchMonitoring();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleSubmitMonitoring = async () => {
    try {
      const values = await monitoringForm.validateFields();
      const formData = new FormData();

      formData.append("umkmId", values.umkmId);
      formData.append("visitNumber", values.visitNumber);
      formData.append("monitoringDate", values.monitoringDate.format("YYYY-MM-DD"));
      formData.append("surveyor", values.surveyor);
      if (values.turnoverBefore !== undefined && values.turnoverBefore !== null) {
        formData.append("turnoverBefore", values.turnoverBefore);
      }
      if (values.turnoverAfter !== undefined && values.turnoverAfter !== null) {
        formData.append("turnoverAfter", values.turnoverAfter);
      }
      if (values.workersBefore !== undefined && values.workersBefore !== null) {
        formData.append("workersBefore", values.workersBefore);
      }
      if (values.workersAfter !== undefined && values.workersAfter !== null) {
        formData.append("workersAfter", values.workersAfter);
      }
      if (values.productionBefore !== undefined && values.productionBefore !== null) {
        formData.append("productionBefore", values.productionBefore);
      }
      if (values.productionAfter !== undefined && values.productionAfter !== null) {
        formData.append("productionAfter", values.productionAfter);
      }
      if (values.customersBefore !== undefined && values.customersBefore !== null) {
        formData.append("customersBefore", values.customersBefore);
      }
      if (values.customersAfter !== undefined && values.customersAfter !== null) {
        formData.append("customersAfter", values.customersAfter);
      }
      if (values.benefitLevel) {
        formData.append("benefitLevel", values.benefitLevel);
      }
      if (values.challenges) {
        formData.append("challenges", values.challenges);
      }
      if (values.developmentNeeds) {
        formData.append("developmentNeeds", values.developmentNeeds);
      }
      if (values.otherNotes) {
        formData.append("otherNotes", values.otherNotes);
      }

      // Append files
      monitoringFileList.forEach((file: UploadFile) => {
        if (file.originFileObj) {
          formData.append("documents", file.originFileObj);
        }
      });

      if (editingMonitoring) {
        await updateUmkmMonitoring(editingMonitoring.id, formData);
        messageApi.success({
          content: "UMKM monitoring updated successfully",
          key: "update-monitoring",
          duration: 2,
        });
      } else {
        await createUmkmMonitoring(formData);
        messageApi.success({
          content: "UMKM monitoring created successfully",
          key: "create-monitoring",
          duration: 2,
        });
      }

      setMonitoringModalVisible(false);
      fetchMonitoring();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const beforeUpload = (file: UploadFile) => {
    const isImage = file.type?.startsWith("image/");
    if (!isImage) {
      messageApi.error({
        content: "Hanya file gambar yang diperbolehkan!",
        key: "upload-error",
        duration: 2,
      });
    }
    return isImage;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={data?.umkmPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {data?.businessName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-md text-gray-500 dark:text-gray-400">
                  {data?.ownerName}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.businessType || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <Link href={`/umkm/edit/${data?.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ====== Detail Info ====== */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <InfoItem label="Nama Usaha" value={data?.businessName || "-"} />
            <InfoItem label="Nama Pemilik" value={data?.ownerName || "-"} />
            <InfoItem label="Jenis Usaha" value={data?.businessType || "-"} />
            <InfoItem label="Produk" value={data?.products || "-"} />
            <InfoItem label="Alamat Usaha" value={data?.businessAddress || "-"} />
            <InfoItem label="Kecamatan" value={data?.subdistrictName || "-"} />
            <InfoItem label="Kode Pos" value={data?.postalCode || "-"} />
            <InfoItem label="Koordinat" value={data?.umkmCoordinate || "-"} />
            <InfoItem label="Wilayah" value={data?.regionName || "-"} />
            <InfoItem
              label="Dibuat Pada"
              value={
                data?.createdAt
                  ? new Date(data.createdAt).toLocaleString()
                  : "-"
              }
            />
            <InfoItem
              label="Diperbarui Pada"
              value={
                data?.updatedAt
                  ? new Date(data.updatedAt).toLocaleString()
                  : "-"
              }
            />
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="mt-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Statistik UMKM
          </h4>
          
          {/* Visit Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Kunjungan</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{visits.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
                  <BarChartOutlined className="text-xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nilai Bantuan</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Rp{visits.reduce((sum, v) => sum + v.value, 0).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
                  <DollarOutlined className="text-xl text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Monitoring</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monitoring.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/30 rounded-full flex items-center justify-center">
                  <BarChartOutlined className="text-xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rata-rata Manfaat</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {monitoring.length > 0
                      ? (() => {
                          const benefitCounts = monitoring.reduce((acc, m) => {
                            if (m.benefitLevel) {
                              acc[m.benefitLevel] = (acc[m.benefitLevel] || 0) + 1;
                            }
                            return acc;
                          }, {} as Record<string, number>);
                          const mostCommon = Object.entries(benefitCounts).sort((a, b) => b[1] - a[1])[0];
                          return mostCommon ? mostCommon[0].split(' ')[0] : '-';
                        })()
                      : '-'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800/30 rounded-full flex items-center justify-center">
                  <RiseOutlined className="text-xl text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Monitoring Improvement Statistics - Latest Visit */}
          {monitoring.length > 0 && (() => {
            const latestMonitoring = monitoring[0];
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Turnover Improvement */}
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Perubahan Omset</p>
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/30 rounded-full flex items-center justify-center">
                      <DollarOutlined className="text-sm text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sebelum:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.turnoverBefore !== null
                          ? `Rp${latestMonitoring.turnoverBefore.toLocaleString("id-ID")}`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sesudah:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.turnoverAfter !== null
                          ? `Rp${latestMonitoring.turnoverAfter.toLocaleString("id-ID")}`
                          : '-'}
                      </span>
                    </div>
                    {latestMonitoring.turnoverBefore !== null && latestMonitoring.turnoverAfter !== null && (
                      <div className="pt-2 border-t border-emerald-200 dark:border-emerald-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Kenaikan:</span>
                          <span className={`text-sm font-bold flex items-center ${
                            latestMonitoring.turnoverAfter >= latestMonitoring.turnoverBefore
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(() => {
                              const before = latestMonitoring.turnoverBefore;
                              const after = latestMonitoring.turnoverAfter;
                              const diff = after - before;
                              const percent = before > 0 ? ((diff / before) * 100).toFixed(1) : 0;
                              return diff >= 0 ? (
                                <><RiseOutlined className="mr-1" />+{percent}%</>
                              ) : (
                                <><FallOutlined className="mr-1" />{percent}%</>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workers Improvement */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Perubahan Tenaga Kerja</p>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
                      <TeamOutlined className="text-sm text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sebelum:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.workersBefore !== null
                          ? `${latestMonitoring.workersBefore} orang`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sesudah:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.workersAfter !== null
                          ? `${latestMonitoring.workersAfter} orang`
                          : '-'}
                      </span>
                    </div>
                    {latestMonitoring.workersBefore !== null && latestMonitoring.workersAfter !== null && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Kenaikan:</span>
                          <span className={`text-sm font-bold flex items-center ${
                            latestMonitoring.workersAfter >= latestMonitoring.workersBefore
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(() => {
                              const before = latestMonitoring.workersBefore;
                              const after = latestMonitoring.workersAfter;
                              const diff = after - before;
                              const percent = before > 0 ? ((diff / before) * 100).toFixed(1) : 0;
                              return diff >= 0 ? (
                                <><RiseOutlined className="mr-1" />+{percent}%</>
                              ) : (
                                <><FallOutlined className="mr-1" />{percent}%</>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Production Improvement */}
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Perubahan Produksi</p>
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/30 rounded-full flex items-center justify-center">
                      <BarChartOutlined className="text-sm text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sebelum:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.productionBefore !== null
                          ? latestMonitoring.productionBefore.toLocaleString("id-ID")
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sesudah:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.productionAfter !== null
                          ? latestMonitoring.productionAfter.toLocaleString("id-ID")
                          : '-'}
                      </span>
                    </div>
                    {latestMonitoring.productionBefore !== null && latestMonitoring.productionAfter !== null && (
                      <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Kenaikan:</span>
                          <span className={`text-sm font-bold flex items-center ${
                            latestMonitoring.productionAfter >= latestMonitoring.productionBefore
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(() => {
                              const before = latestMonitoring.productionBefore;
                              const after = latestMonitoring.productionAfter;
                              const diff = after - before;
                              const percent = before > 0 ? ((diff / before) * 100).toFixed(1) : 0;
                              return diff >= 0 ? (
                                <><RiseOutlined className="mr-1" />+{percent}%</>
                              ) : (
                                <><FallOutlined className="mr-1" />{percent}%</>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customers Improvement */}
                <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Perubahan Pelanggan</p>
                    <div className="w-8 h-8 bg-rose-100 dark:bg-rose-800/30 rounded-full flex items-center justify-center">
                      <ShoppingOutlined className="text-sm text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sebelum:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.customersBefore !== null
                          ? `${latestMonitoring.customersBefore} orang`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sesudah:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {latestMonitoring.customersAfter !== null
                          ? `${latestMonitoring.customersAfter} orang`
                          : '-'}
                      </span>
                    </div>
                    {latestMonitoring.customersBefore !== null && latestMonitoring.customersAfter !== null && (
                      <div className="pt-2 border-t border-rose-200 dark:border-rose-700">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Kenaikan:</span>
                          <span className={`text-sm font-bold flex items-center ${
                            latestMonitoring.customersAfter >= latestMonitoring.customersBefore
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(() => {
                              const before = latestMonitoring.customersBefore;
                              const after = latestMonitoring.customersAfter;
                              const diff = after - before;
                              const percent = before > 0 ? ((diff / before) * 100).toFixed(1) : 0;
                              return diff >= 0 ? (
                                <><RiseOutlined className="mr-1" />+{percent}%</>
                              ) : (
                                <><FallOutlined className="mr-1" />{percent}%</>
                              );
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Trend Charts */}
          {monitoring.length > 0 && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Turnover Trend */}
              <Card
                title="Tren Omset"
                className="border-emerald-200 dark:border-emerald-800"
                styles={{
                  header: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monitoring.map(m => ({
                    name: `Kunjungan ${m.visitNumber}`,
                    sebelum: m.turnoverBefore || 0,
                    sesudah: m.turnoverAfter || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `Rp${value.toLocaleString('id-ID')}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sebelum"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      name="Sebelum"
                    />
                    <Line
                      type="monotone"
                      dataKey="sesudah"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Sesudah"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Workers Trend */}
              <Card
                title="Tren Tenaga Kerja"
                className="border-blue-200 dark:border-blue-800"
                styles={{
                  header: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monitoring.map(m => ({
                    name: `Kunjungan ${m.visitNumber}`,
                    sebelum: m.workersBefore || 0,
                    sesudah: m.workersAfter || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value} orang`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sebelum"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      name="Sebelum"
                    />
                    <Line
                      type="monotone"
                      dataKey="sesudah"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Sesudah"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Production Trend */}
              <Card
                title="Tren Produksi"
                className="border-amber-200 dark:border-amber-800"
                styles={{
                  header: { backgroundColor: 'rgba(245, 158, 11, 0.1)' }
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monitoring.map(m => ({
                    name: `Kunjungan ${m.visitNumber}`,
                    sebelum: m.productionBefore || 0,
                    sesudah: m.productionAfter || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => value.toLocaleString('id-ID')}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sebelum"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      name="Sebelum"
                    />
                    <Line
                      type="monotone"
                      dataKey="sesudah"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Sesudah"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Customers Trend */}
              <Card
                title="Tren Pelanggan"
                className="border-rose-200 dark:border-rose-800"
                styles={{
                  header: { backgroundColor: 'rgba(244, 63, 94, 0.1)' }
                }}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monitoring.map(m => ({
                    name: `Kunjungan ${m.visitNumber}`,
                    sebelum: m.customersBefore || 0,
                    sesudah: m.customersAfter || 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `${value} orang`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sebelum"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      name="Sebelum"
                    />
                    <Line
                      type="monotone"
                      dataKey="sesudah"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      name="Sesudah"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>

        {/* UMKM Visits */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Kunjungan UMKM ({visits.length})
            </h4>
            <Button
              onClick={handleCreateVisit}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <PlusOutlined className="mr-2" />
              Tambah Kunjungan
            </Button>
          </div>

          {visitsLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
          ) : visits.length > 0 ? (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 border border-gray-200 rounded-xl dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-6 justify-between items-center">
                      <div className="block gap-4">
                        <div className="flex items-center gap-2">
                          <Button size="xs" className="text-xs text-gray-800 dark:text-white/90">
                            #{visit.visitNumber}
                          </Button>
                          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                            {visit.assistanceType}
                          </span>
                          <p className="text-lg text-gray-500 dark:text-gray-400">
                            ({dayjs(visit.assistanceDate).format("DD-MM-YYYY")})
                          </p>
                        </div>
                      </div>
                    </div>
                    <Space>
                      <Button size="sm" onClick={() => handleEditVisit(visit)}>
                        <EditOutlined className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDeleteVisit(visit.id)}
                        disabled={deletingVisitId === visit.id}
                      >
                        {deletingVisitId === visit.id ? (
                          <>
                            <Spin size="small" className="mr-2" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <DeleteOutlined className="mr-2" />
                            Hapus
                          </>
                        )}
                      </Button>
                    </Space>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 mb-3">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Jenis Barang:
                      </span>
                      <span className="ml-2 text-gray-800 dark:text-white/90">
                        {visit.itemType}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Jumlah Bantuan:
                      </span>
                      <span className="ml-2 text-gray-800 dark:text-white/90">
                        {visit.assistanceAmount}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Sumber Bantuan:
                      </span>
                      <span className="ml-2 text-gray-800 dark:text-white/90">
                        {visit.assistanceSource}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Nilai: 
                      </span>
                      <span className="ml-2 text-gray-800 dark:text-white/90">
                        Rp{visit.value.toLocaleString("id-ID")}
                      </span>
                    </div>
                    {visit.notes && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Catatan:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {visit.notes}
                        </span>
                      </div>
                    )}
                  </div>

                  {visit.umkmVisitDocs &&
                    visit.umkmVisitDocs.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          Dokumentasi:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                          {visit.umkmVisitDocs.map((doc: UmkmVisitDoc) => (
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
            <p className="text-gray-500 dark:text-gray-400">
              Belum ada kunjungan yang tercatat.
            </p>
          )}
        </div>

        {/* UMKM Monitoring */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Monitoring UMKM ({monitoring.length})
            </h4>
            <Button
              onClick={handleCreateMonitoring}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <PlusOutlined className="mr-2" />
              Tambah Monitoring
            </Button>
          </div>

          {monitoringLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            </div>
          ) : monitoring.length > 0 ? (
            <div className="space-y-4">
              {monitoring.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border border-gray-200 rounded-xl dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-6 justify-between items-center">
                      <div className="block gap-4">
                        <div className="flex items-center gap-2">
                          <Button size="xs" className="text-xs text-gray-800 dark:text-white/90">
                            #{record.visitNumber}
                          </Button>
                          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                            {record.surveyor}
                          </span>
                          <p className="text-lg text-gray-500 dark:text-gray-400">
                            ({dayjs(record.monitoringDate).format("DD-MM-YYYY")})
                          </p>
                        </div>
                      </div>
                    </div>
                    <Space>
                      <Button size="sm" onClick={() => handleEditMonitoring(record)}>
                        <EditOutlined className="mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleDeleteMonitoring(record.id)}
                        disabled={deletingMonitoringId === record.id}
                      >
                        {deletingMonitoringId === record.id ? (
                          <>
                            <Spin size="small" className="mr-2" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <DeleteOutlined className="mr-2" />
                            Hapus
                          </>
                        )}
                      </Button>
                    </Space>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 mb-3">
                    {record.benefitLevel && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Manfaat Bantuan:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.benefitLevel}
                        </span>
                      </div>
                    )}
                    {record.turnoverBefore !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Omset/Bulan Sebelum:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          Rp{record.turnoverBefore.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    {record.turnoverAfter !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Omset/Bulan Sesudah:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          Rp{record.turnoverAfter.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                    {record.workersBefore !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Tenaga Kerja Sebelum:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.workersBefore}
                        </span>
                      </div>
                    )}
                    {record.workersAfter !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Tenaga Kerja Sesudah:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.workersAfter}
                        </span>
                      </div>
                    )}
                    {record.productionBefore !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Produksi Sebelum:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.productionBefore}
                        </span>
                      </div>
                    )}
                    {record.productionAfter !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Produksi Sesudah:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.productionAfter}
                        </span>
                      </div>
                    )}
                    {record.customersBefore !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Pelanggan Sebelum:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.customersBefore}
                        </span>
                      </div>
                    )}
                    {record.customersAfter !== null && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Jumlah Pelanggan Sesudah:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.customersAfter}
                        </span>
                      </div>
                    )}
                    {record.challenges && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Kendala yang Dihadapi:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.challenges}
                        </span>
                      </div>
                    )}
                    {record.developmentNeeds && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Kebutuhan Tambahan/Rencana Pengembangan:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.developmentNeeds}
                        </span>
                      </div>
                    )}
                    {record.otherNotes && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Catatan Lain:
                        </span>
                        <span className="ml-2 text-gray-800 dark:text-white/90">
                          {record.otherNotes}
                        </span>
                      </div>
                    )}
                  </div>

                  {record.umkmMonitoringDocs &&
                    record.umkmMonitoringDocs.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          Dokumentasi:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                          {record.umkmMonitoringDocs.map((doc: UmkmMonitoringDoc) => (
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
            <p className="text-gray-500 dark:text-gray-400">
              Belum ada monitoring yang tercatat.
            </p>
          )}
        </div>
      </div>

      {/* Modal for Create/Edit Visit */}
      <Modal
        title={
          editingVisit ? "Edit Kunjungan UMKM" : "Tambah Kunjungan UMKM"
        }
        open={modalVisible}
        onOk={handleSubmitVisit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="umkmId"
            label="ID UMKM"
            rules={[
              { required: true, message: "Silakan masukkan ID UMKM" },
            ]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="visitNumber"
            label="Kunjungan ke-"
            rules={[
              { required: true, message: "Wajib diisi" },
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="assistanceDate"
            label="Tanggal Pemberian Bantuan"
            rules={[
              { required: true, message: "Silakan pilih tanggal pemberian bantuan" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="assistanceType"
            label="Jenis Bantuan"
            rules={[
              { required: true, message: "Silakan masukkan jenis bantuan" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="itemType"
            label="Jenis Barang"
            rules={[
              { required: true, message: "Silakan masukkan jenis barang (barang/uang)" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="assistanceAmount"
            label="Jumlah Bantuan"
            rules={[
              { required: true, message: "Silakan masukkan jumlah bantuan" },
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="assistanceSource"
            label="Sumber Bantuan"
            rules={[
              { required: true, message: "Silakan masukkan sumber bantuan" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="value"
            label="Nilai (Rp)"
            rules={[
              { required: true, message: "Silakan masukkan nilai bantuan" },
            ]}
          >
            <Input type="number" min={0} step={1000} />
          </Form.Item>

          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Dokumen">
            <Upload
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              beforeUpload={beforeUpload}
              multiple
              listType="picture"
              accept="image/*"
            >
              <Button>
                <UploadOutlined className="mr-2" />
                Upload Gambar
              </Button>
            </Upload>
            <div className="text-sm text-gray-500 mt-2">
              Anda dapat mengunggah beberapa gambar (JPG, PNG, WEBP, dll.)
            </div>

            {/* Show existing documents when editing */}
            {editingVisit &&
              editingVisit.umkmVisitDocs &&
              editingVisit.umkmVisitDocs.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dokumen yang ada:
                  </div>
                  <div className="space-y-2">
                    {editingVisit.umkmVisitDocs.map((doc: UmkmVisitDoc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileTextOutlined className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={doc.urlDoc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Lihat
                          </a>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() =>
                              handleDeleteDocumentFromModal(doc.id)
                            }
                          >
                            <DeleteOutlined className="mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for Create/Edit Monitoring */}
      <Modal
        title={
          editingMonitoring ? "Edit Monitoring UMKM" : "Tambah Monitoring UMKM"
        }
        open={monitoringModalVisible}
        onOk={handleSubmitMonitoring}
        onCancel={() => setMonitoringModalVisible(false)}
        width={800}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={monitoringForm} layout="vertical">
          <Form.Item
            name="umkmId"
            label="ID UMKM"
            rules={[
              { required: true, message: "Silakan masukkan ID UMKM" },
            ]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="visitNumber"
            label="Kunjungan ke-"
            rules={[
              { required: true, message: "Wajib diisi" },
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="monitoringDate"
            label="Tanggal Monitoring"
            rules={[
              { required: true, message: "Silakan pilih tanggal monitoring" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="surveyor"
            label="Surveyor"
            rules={[
              { required: true, message: "Silakan masukkan nama surveyor" },
            ]}
          >
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="turnoverBefore" label="Omset/Bulan Sebelum (Rp)">
              <Input type="number" min={0} step={1000} />
            </Form.Item>
            <Form.Item name="turnoverAfter" label="Omset/Bulan Sesudah (Rp)">
              <Input type="number" min={0} step={1000} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="workersBefore" label="Jumlah Tenaga Kerja Sebelum">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item name="workersAfter" label="Jumlah Tenaga Kerja Sesudah">
              <Input type="number" min={0} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="productionBefore" label="Jumlah Produksi Sebelum">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item name="productionAfter" label="Jumlah Produksi Sesudah">
              <Input type="number" min={0} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="customersBefore" label="Jumlah Pelanggan Sebelum">
              <Input type="number" min={0} />
            </Form.Item>
            <Form.Item name="customersAfter" label="Jumlah Pelanggan Sesudah">
              <Input type="number" min={0} />
            </Form.Item>
          </div>

          <Form.Item
            name="benefitLevel"
            label="Manfaat Bantuan"
            rules={[
              { message: "Silakan pilih tingkat manfaat bantuan" },
            ]}
          >
            <Input placeholder="Tidak bermanfaat/Kurang bermanfaat/Cukup bermanfaat/Bermanfaat/Sangat bermanfaat" />
          </Form.Item>

          <Form.Item name="challenges" label="Kendala yang Masih Dihadapi">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="developmentNeeds" label="Kebutuhan Tambahan/Rencana Pengembangan">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="otherNotes" label="Catatan Lain">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Dokumentasi">
            <Upload
              fileList={monitoringFileList}
              onChange={({ fileList }) => setMonitoringFileList(fileList)}
              beforeUpload={beforeUpload}
              multiple
              listType="picture"
              accept="image/*"
            >
              <Button>
                <UploadOutlined className="mr-2" />
                Upload Gambar
              </Button>
            </Upload>
            <div className="text-sm text-gray-500 mt-2">
              Anda dapat mengunggah beberapa gambar (JPG, PNG, WEBP, dll.)
            </div>

            {/* Show existing documents when editing */}
            {editingMonitoring &&
              editingMonitoring.umkmMonitoringDocs &&
              editingMonitoring.umkmMonitoringDocs.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dokumen yang ada:
                  </div>
                  <div className="space-y-2">
                    {editingMonitoring.umkmMonitoringDocs.map((doc: UmkmMonitoringDoc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileTextOutlined className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <a
                            href={doc.urlDoc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Lihat
                          </a>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() =>
                              handleDeleteDocumentFromMonitoringModal(doc.id)
                            }
                          >
                            <DeleteOutlined className="mr-2" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}