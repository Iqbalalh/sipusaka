"use client";

// Hooks
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Components
import { Spin, Modal, Form, Input, DatePicker, Upload, message, Image } from "antd";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { InfoItem } from "@/components/ui/field/InfoItem";

// Icons
import { LoadingOutlined, PlusOutlined, UploadOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

// Modular Components
import ChildAssistanceStatistics from "./components/ChildAssistanceStatistics";
import ChildAssistanceSection from "./components/ChildAssistanceSection";
import ChildAssistanceCharts from "./components/ChildAssistanceCharts";

// Libs
import Link from "next/link";

// Type
import { Children } from "@/types/models/children";
import {
  ChildAssistance,
  ChildAssistanceDoc,
  getChildAssistance,
  createChildAssistance,
  updateChildAssistance,
  deleteChildAssistance,
  deleteChildAssistanceDocument,
} from "@/utils/services/childassistance.service";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

// Utils
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { calculateAge } from "@/utils/formatter/calculateAge";
import { getChildren } from "@/utils/services/children.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { API_IMAGE } from "@/constants/endpoint";
import { handlePrintChildren } from "@/utils/export/pdf/modules/children.pdf";

export default function ChildrenView() {
  // Data state
  const [data, setData] = useState<Children | null>(null);
  const { id } = useParams<{ id: string }>();

  // Page State
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  // Assistance state
  const [assistance, setAssistance] = useState<ChildAssistance[]>([]);
  const [assistanceLoading, setAssistanceLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssistance, setEditingAssistance] = useState<ChildAssistance | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [deletingAssistanceId, setDeletingAssistanceId] = useState<number | null>(null);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const children = await getChildren(id);

        setData(children);
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
  // FETCH CHILD ASSISTANCE
  // ==========================
  const fetchAssistance = useCallback(async () => {
    try {
      setAssistanceLoading(true);
      const data = await getChildAssistance(Number(id));
      setAssistance(data);
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setAssistanceLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    if (id) {
      fetchAssistance();
    }
  }, [fetchAssistance, id]);

  // ==========================
  // ASSISTANCE HANDLERS
  // ==========================
  const handleCreateAssistance = () => {
    setEditingAssistance(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ childrenId: Number(id) });
    setModalVisible(true);
  };

  const handleEditAssistance = (record: ChildAssistance) => {
    setEditingAssistance(record);
    setFileList([]);
    form.setFieldsValue({
      ...record,
      assistanceDate: dayjs(record.assistanceDate),
    });
    setModalVisible(true);
  };

  const handleDeleteDocumentFromModal = async (docId: number) => {
    try {
      if (editingAssistance) {
        await deleteChildAssistanceDocument(editingAssistance.id, docId);
        messageApi.success({
          content: "Document deleted successfully",
          key: "delete-doc-modal",
          duration: 2,
        });
        fetchAssistance();
        const updatedAssistance = await getChildAssistance(Number(id));
        const updatedRecord = updatedAssistance.find(
          (a) => a.id === editingAssistance.id
        );
        if (updatedRecord) {
          setEditingAssistance(updatedRecord);
        }
      }
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleDeleteAssistance = async (assistId: number) => {
    try {
      setDeletingAssistanceId(assistId);
      await deleteChildAssistance(assistId);
      messageApi.success({
        content: "Bantuan Anak berhasil dihapus",
        key: "delete-assistance",
        duration: 2,
      });
      fetchAssistance();
    } catch (error) {
      notifyFromResult(notify, { error });
    } finally {
      setDeletingAssistanceId(null);
    }
  };

  const handleDeleteDocument = async (assistId: number, docId: number) => {
    try {
      await deleteChildAssistanceDocument(assistId, docId);
      messageApi.success({
        content: "Document deleted successfully",
        key: "delete-doc",
        duration: 2,
      });
      fetchAssistance();
    } catch (error) {
      notifyFromResult(notify, { error });
    }
  };

  const handleSubmitAssistance = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append("childrenId", values.childrenId);
      formData.append("assistanceNumber", values.assistanceNumber);
      formData.append(
        "assistanceDate",
        values.assistanceDate.format("YYYY-MM-DD")
      );
      formData.append("assistanceType", values.assistanceType);
      formData.append("assistanceProvider", values.assistanceProvider);
      formData.append("assistanceAmount", values.assistanceAmount);
      if (values.educationLevel) {
        formData.append("educationLevel", values.educationLevel);
      }
      if (values.educationGrade) {
        formData.append("educationGrade", values.educationGrade);
      }
      if (values.age) {
        formData.append("age", values.age);
      }
      if (values.notes) {
        formData.append("notes", values.notes);
      }

      // Append files
      fileList.forEach((file: UploadFile) => {
        if (file.originFileObj) {
          formData.append("documents", file.originFileObj);
        }
      });

      if (editingAssistance) {
        await updateChildAssistance(editingAssistance.id, formData);
        messageApi.success({
          content: "Bantuan Anak berhasil diperbarui",
          key: "update-assistance",
          duration: 2,
        });
      } else {
        await createChildAssistance(formData);
        messageApi.success({
          content: "Bantuan Anak berhasil ditambahkan",
          key: "create-assistance",
          duration: 2,
        });
      }

      setModalVisible(false);
      fetchAssistance();
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
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
              <Image
                width={64}
                height={64}
                src={data?.childrenPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 truncate">
                {data?.childrenName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.childrenGender === "M" ? "Laki-laki" : "Perempuan"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <Badge variant={data?.isActive ? "solid" : "light"} color={data?.isActive ? "success" : "error"}>
                  {data?.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePrintChildren(
                  data,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.childrenPict
                  )}`
                )
              }
            >
              Print
            </Button>
            <Link href={`/children/edit/${data?.id}`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Detail Info Grid - Block Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              NIK
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.nik || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Tanggal Lahir
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.childrenBirthdate
                ? new Date(data.childrenBirthdate).toLocaleDateString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Usia
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {calculateAge(data?.childrenBirthdate) !== null
                ? `${calculateAge(data?.childrenBirthdate)} Tahun`
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Jenjang Pendidikan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.educationLevel || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Tingkat Pendidikan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.educationGrade || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nama Sekolah
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.schoolName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Pekerjaan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.childrenJob || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Alamat
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.childrenAddress || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nomor Telepon
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.childrenPhone || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Status
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.isActive ? "Aktif" : "Tidak Aktif"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              ABK
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {!data?.isCondition ? "Ya" : "Tidak"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Yatim/Piatu
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {!data?.isFatherAlive && data?.isMotherAlive
                ? "Yatim"
                : data?.isFatherAlive && !data?.isMotherAlive
                ? "Piatu"
                : !data?.isFatherAlive && !data?.isMotherAlive
                ? "Yatim Piatu"
                : "Tidak"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nama Pegawai
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.homes?.employees?.employeeName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nama Wali
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.homes?.wali?.waliName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.createdAt
                ? new Date(data.createdAt).toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diperbarui Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.updatedAt
                ? new Date(data.updatedAt).toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.createdBy || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diedit Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.editedBy || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Catatan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.notes || "-"}
            </span>
          </div>
        </div>
      </div>

      <ChildAssistanceStatistics assistance={assistance} />

      <ChildAssistanceSection
        assistance={assistance}
        assistanceLoading={assistanceLoading}
        onCreateAssistance={handleCreateAssistance}
        onEditAssistance={handleEditAssistance}
        onDeleteAssistance={handleDeleteAssistance}
        onDeleteAssistanceDocument={handleDeleteDocument}
        deletingAssistanceId={deletingAssistanceId}
      />

      <ChildAssistanceCharts assistance={assistance} />

      {/* Modal for Create/Edit Assistance */}
      <Modal
        title={editingAssistance ? "Edit Bantuan Anak" : "Tambah Bantuan Anak"}
        open={modalVisible}
        onOk={handleSubmitAssistance}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="childrenId"
            label="ID Anak"
            rules={[{ required: true, message: "Silakan masukkan ID Anak" }]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="assistanceNumber"
            label="Bantuan ke-"
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
            name="assistanceProvider"
            label="Pemberi Bantuan"
            rules={[
              { required: true, message: "Silakan masukkan pemberi bantuan" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="assistanceAmount"
            label="Nominal Bantuan (Rp)"
            rules={[
              { required: true, message: "Silakan masukkan nominal bantuan" },
            ]}
          >
            <Input type="number" min={0} step={1000} />
          </Form.Item>

          <Form.Item name="educationLevel" label="Jenjang Pendidikan">
            <Input />
          </Form.Item>

          <Form.Item name="educationGrade" label="Tingkat Pendidikan">
            <Input />
          </Form.Item>

          <Form.Item name="age" label="Usia">
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Dokumentasi">
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
            {editingAssistance &&
              editingAssistance.childAssistanceDocs &&
              editingAssistance.childAssistanceDocs.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dokumen yang ada:
                  </div>
                  <div className="space-y-2">
                    {editingAssistance.childAssistanceDocs.map((doc: ChildAssistanceDoc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileTextOutlined className="text-gray-500 dark:text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
    </>
  );
}