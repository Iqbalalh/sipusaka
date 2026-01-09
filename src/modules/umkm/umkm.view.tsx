"use client";

// Hooks
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Components
import {
  Spin,
  Modal,
  Form,
  Input,
  DatePicker,
  Upload,
  message,
  Space,
  Image,
} from "antd";
import Button from "@/components/ui/button/Button";
import {
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

// Modular Components
import UmkmHeader from "./components/UmkmHeader";
import UmkmPhotos from "./components/UmkmPhotos";
import UmkmInfo from "./components/UmkmInfo";
import UmkmStatistics from "./components/UmkmStatistics";
import UmkmMonitoringCharts from "./components/UmkmMonitoringCharts";
import UmkmVisitsSection from "./components/UmkmVisitsSection";
import UmkmMonitoringSection from "./components/UmkmMonitoringSection";

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
  const [editingMonitoring, setEditingMonitoring] =
    useState<UmkmMonitoring | null>(null);
  const [monitoringForm] = Form.useForm();
  const [monitoringFileList, setMonitoringFileList] = useState<UploadFile[]>(
    []
  );
  const [deletingMonitoringId, setDeletingMonitoringId] = useState<
    number | null
  >(null);

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
        content: "Bantuan UMKM berhasil dihapus",
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
      formData.append(
        "assistanceDate",
        values.assistanceDate.format("YYYY-MM-DD")
      );
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
          content: "Bantuan UMKM berhasil diperbarui",
          key: "update-visit",
          duration: 2,
        });
      } else {
        await createUmkmVisit(formData);
        messageApi.success({
          content: "Bantuan UMKM berhasil ditambahkan",
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

  const handleDeleteMonitoringDocument = async (
    monitoringId: number,
    docId: number
  ) => {
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
      formData.append(
        "monitoringDate",
        values.monitoringDate.format("YYYY-MM-DD")
      );
      formData.append("surveyor", values.surveyor);
      if (
        values.turnoverBefore !== undefined &&
        values.turnoverBefore !== null
      ) {
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
      if (
        values.productionBefore !== undefined &&
        values.productionBefore !== null
      ) {
        formData.append("productionBefore", values.productionBefore);
      }
      if (
        values.productionAfter !== undefined &&
        values.productionAfter !== null
      ) {
        formData.append("productionAfter", values.productionAfter);
      }
      if (
        values.customersBefore !== undefined &&
        values.customersBefore !== null
      ) {
        formData.append("customersBefore", values.customersBefore);
      }
      if (
        values.customersAfter !== undefined &&
        values.customersAfter !== null
      ) {
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

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      messageApi.error({
        content: "Hanya file gambar yang diperbolehkan!",
        key: "upload-error",
        duration: 2,
      });
    }
    return isImage || Upload.LIST_IGNORE;
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
      {/* <UmkmHeader data={data} /> */}

      <UmkmInfo data={data} />
      <UmkmPhotos data={data} />
      <UmkmStatistics visits={visits} monitoring={monitoring} />

      <UmkmVisitsSection
        visits={visits}
        visitsLoading={visitsLoading}
        onCreateVisit={handleCreateVisit}
        onEditVisit={handleEditVisit}
        onDeleteVisit={handleDeleteVisit}
        onDeleteVisitDocument={handleDeleteDocument}
        deletingVisitId={deletingVisitId}
      />
      <UmkmMonitoringSection
        monitoring={monitoring}
        monitoringLoading={monitoringLoading}
        onCreateMonitoring={handleCreateMonitoring}
        onEditMonitoring={handleEditMonitoring}
        onDeleteMonitoring={handleDeleteMonitoring}
        onDeleteMonitoringDocument={handleDeleteMonitoringDocument}
        deletingMonitoringId={deletingMonitoringId}
      />

      <UmkmMonitoringCharts monitoring={monitoring} />

      {/* Modal for Create/Edit Visit */}
      <Modal
        title={editingVisit ? "Edit Bantuan UMKM" : "Tambah Bantuan UMKM"}
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
            rules={[{ required: true, message: "Silakan masukkan ID UMKM" }]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="visitNumber"
            label="Kunjungan ke-"
            rules={[{ required: true, message: "Wajib diisi" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            name="assistanceDate"
            label="Tanggal Pemberian Bantuan"
            rules={[
              {
                required: true,
                message: "Silakan pilih tanggal pemberian bantuan",
              },
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
              {
                required: true,
                message: "Silakan masukkan jenis barang (barang/uang)",
              },
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
            rules={[{ required: true, message: "Silakan masukkan ID UMKM" }]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="visitNumber"
            label="Kunjungan ke-"
            rules={[{ required: true, message: "Wajib diisi" }]}
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
            rules={[{ message: "Silakan pilih tingkat manfaat bantuan" }]}
          >
            <Input placeholder="Tidak bermanfaat/Kurang bermanfaat/Cukup bermanfaat/Bermanfaat/Sangat bermanfaat" />
          </Form.Item>

          <Form.Item name="challenges" label="Kendala yang Masih Dihadapi">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="developmentNeeds"
            label="Kebutuhan Tambahan/Rencana Pengembangan"
          >
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
                    {editingMonitoring.umkmMonitoringDocs.map(
                      (doc: UmkmMonitoringDoc) => (
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
                      )
                    )}
                  </div>
                </div>
              )}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
