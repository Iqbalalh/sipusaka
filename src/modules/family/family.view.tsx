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
} from "antd";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { InfoItem } from "@/components/ui/field/InfoItem";

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
} from "@ant-design/icons";

// Type
import { Home } from "@/types/models/home";
import {
  FamilyVisit,
  FamilyVisitDoc,
  getFamilyVisits,
  createFamilyVisit,
  updateFamilyVisit,
  deleteFamilyVisit,
  deleteFamilyVisitDocument,
} from "@/utils/services/famvisit.service";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

// Utils
import { getHomeDetail } from "@/utils/services/home.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { handlePrintFamily } from "@/utils/export/pdf/modules/family.pdf";
import { API_IMAGE } from "@/constants/endpoint";

export default function FamilyView() {
  // Data state
  const [data, setData] = useState<Home | null>(null);
  const { id } = useParams<{ id: string }>();

  // Page State
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  // Visit state
  const [visits, setVisits] = useState<FamilyVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVisit, setEditingVisit] = useState<FamilyVisit | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [deletingVisitId, setDeletingVisitId] = useState<number | null>(null);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const home = await getHomeDetail(id);

        setData(home);
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
  // FETCH FAMILY VISITS
  // ==========================
  const fetchVisits = useCallback(async () => {
    try {
      setVisitsLoading(true);
      const data = await getFamilyVisits(Number(id));
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
  // VISIT HANDLERS
  // ==========================
  const handleCreateVisit = () => {
    setEditingVisit(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ homeId: Number(id) });
    setModalVisible(true);
  };

  const handleEditVisit = (record: FamilyVisit) => {
    setEditingVisit(record);
    setFileList([]);
    form.setFieldsValue({
      ...record,
      visitDate: dayjs(record.visitDate),
    });
    setModalVisible(true);
  };

  const handleDeleteDocumentFromModal = async (docId: number) => {
    try {
      if (editingVisit) {
        await deleteFamilyVisitDocument(editingVisit.id, docId);
        messageApi.success({
          content: "Document deleted successfully",
          key: "delete-doc-modal",
          duration: 2,
        });
        fetchVisits();
        // Refresh the editing visit data
        const updatedVisits = await getFamilyVisits(Number(id));
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
      await deleteFamilyVisit(visitId);
      messageApi.success({
        content: "Family visit deleted successfully",
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
      await deleteFamilyVisitDocument(visitId, docId);
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

      formData.append("homeId", values.homeId);
      formData.append("visitDate", values.visitDate.format("YYYY-MM-DD"));
      formData.append("visitNumber", values.visitNumber);
      formData.append("officer", values.officer);
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
        await updateFamilyVisit(editingVisit.id, formData);
        messageApi.success({
          content: "Family visit updated successfully",
          key: "update-visit",
          duration: 2,
        });
      } else {
        await createFamilyVisit(formData);
        messageApi.success({
          content: "Family visit created successfully",
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
        {/* Home Info */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <h4 className="text-2xl gap-4 flex font-semibold text-gray-800 dark:text-white/90">
              Data Keluarga{" "}
              <div>
                <Badge>{data?.regions?.regionName || "Tidak ada data"}</Badge>
              </div>
            </h4>
            <Button
              variant="outline"
              onClick={() =>
                handlePrintFamily(
                  data,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.employee?.employeePict
                  )}`,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.partner?.partnerPict
                  )}`,
                  data?.waliId && data?.wali
                    ? `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                        data.wali.waliPict
                      )}`
                    : undefined,
                  data?.childrens?.map(
                    (child) =>
                      `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                        child.childrenPict
                      )}`
                  )
                )
              }
            >
              Print
            </Button>
          </div>
        </div>

        {/* Employee */}
        <div className="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Pegawai
          </h4>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <Image
                  width={80}
                  height={80}
                  src={
                    data?.employee?.employeePict || "/images/user/alt-user.png"
                  }
                  alt={"Profile"}
                />
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {data?.employee?.employeeName} ({data?.employee?.nipNipp})
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-md text-gray-500 dark:text-gray-400">
                    {data?.employee?.employeeGender === "M"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Badge>
                      {data?.employee?.isAccident ? "PLH" : "Non-PLH"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                <Link href={`/employee/edit/${data?.employeeId}`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ====== Detail Info ====== */}
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <InfoItem
                label="Kecelakaan/Meninggal"
                value={data?.employee?.isAccident ? "Kecelakaan" : "Meninggal"}
              />
              <InfoItem
                label="Penyebab Kematian"
                value={data?.employee?.deathCause || "-"}
              />
              <InfoItem
                label="Posisi Terakhir"
                value={data?.employee?.lastPosition || "-"}
              />
              <InfoItem label="Catatan" value={data?.employee?.notes || "-"} />
              <InfoItem
                label="Dibuat Pada"
                value={
                  data?.employee?.createdAt
                    ? new Date(data.employee.createdAt).toLocaleString()
                    : "-"
                }
              />
              <InfoItem
                label="Diperbarui Pada"
                value={
                  data?.employee?.updatedAt
                    ? new Date(data.employee.updatedAt).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </div>

        {/* Partner */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="text-2xl font-semibold flex text-gray-800 dark:text-white/90 mb-4 gap-4">
            Pasangan{" "}
            <div>
              {data?.partner?.isUmkm ? <Badge color="info">UMKM</Badge> : ""}
            </div>
          </h4>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <Image
                  width={80}
                  height={80}
                  src={
                    data?.partner?.partnerPict || "/images/user/alt-user.png"
                  }
                  alt={"Profile"}
                />
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {data?.partner?.isAlive == false ? "Alm. " : ""}
                  {data?.partner?.partnerName}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-md text-gray-500 dark:text-gray-400">
                    {data?.partner?.partnerJob || "Tidak Bekerja"}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Badge
                      color={data?.partner?.isActive ? "success" : "error"}
                    >
                      {data?.partner?.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                <Link href={`/partner/edit/${data?.partnerId}`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ====== Detail Info ====== */}
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <InfoItem label="Alamat" value={data?.partner?.address || ""} />
              <InfoItem label="NIK" value={data?.partner?.partnerNik || "-"} />
              <InfoItem
                label="Nomor Telp"
                value={
                  data?.partner?.phoneNumber ? (
                    <a
                      href={`https://wa.me/${
                        data?.partner?.phoneNumber
                          ?.replace(/^\+?62/, "") // hapus +62 atau 62 di depan jika ada
                          ?.replace(/^0/, "") // hapus 0 di depan
                          ?.replace(/\D/g, "") // hapus karakter non-angka
                          ? `62${data.partner.phoneNumber
                              .replace(/^\+?62/, "")
                              .replace(/^0/, "")
                              .replace(/\D/g, "")}`
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {data?.partner?.phoneNumber}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <InfoItem
                label="Nomor Telp Alt"
                value={data?.partner?.phoneNumberAlt || "-"}
              />
              <InfoItem
                label="Status Hidup"
                value={data?.partner?.isAlive ? "Hidup" : "Meninggal"}
              />
              <InfoItem
                label="Koordinat Rumah"
                value={
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      String(data?.partner?.homeCoordinate || "-")
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {data?.partner?.homeCoordinate || "-"}
                  </a>
                }
              />
              <InfoItem
                label="Dibuat Pada"
                value={
                  data?.partner?.createdAt
                    ? new Date(data.partner.createdAt).toLocaleString()
                    : "-"
                }
              />
              <InfoItem
                label="Diperbarui Pada"
                value={
                  data?.partner?.updatedAt
                    ? new Date(data.partner.updatedAt).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </div>

        {/* Wali */}
        {data?.waliId && (
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Wali
            </h4>

            <>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                  <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                    <Image
                      width={80}
                      height={80}
                      src={data.wali?.waliPict || "/images/user/alt-user.png"}
                      alt={`Profile Wali ${data.wali?.waliName || ""}`}
                    />
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                      {data.wali?.waliName}
                    </h4>
                    <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                      <p className="text-md text-gray-500 dark:text-gray-400">
                        {data.wali?.relation || "Relasi tidak diketahui"}
                      </p>
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <Badge>
                          {data?.regions?.regionName || "Region tidak ada"}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                    <Link href={`/wali/edit/${data?.waliId}`}>
                      <Button variant="outline">Edit</Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ====== Detail Info Wali ====== */}
              <div className="mt-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                  <InfoItem
                    label="Nomor Telp"
                    value={data.wali?.waliPhone || "-"}
                  />
                  <InfoItem
                    label="Hubungan"
                    value={data.wali?.relation || "-"}
                  />
                  <InfoItem
                    label="Alamat"
                    value={data.wali?.waliAddress || "-"}
                  />
                  <InfoItem
                    label="Koordinat Alamat"
                    value={data.wali?.addressCoordinate || "-"}
                  />
                  <InfoItem
                    label="Dibuat Pada"
                    value={
                      data.wali?.createdAt
                        ? new Date(data.wali.createdAt).toLocaleString()
                        : "-"
                    }
                  />
                  <InfoItem
                    label="Diperbarui Pada"
                    value={
                      data.wali?.updatedAt
                        ? new Date(data.wali.updatedAt).toLocaleString()
                        : "-"
                    }
                  />
                </div>
              </div>
            </>
          </div>
        )}

        {/* Children List */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Anak Tertanggung ({data?.childrens?.length || 0})
          </h4>
          {data?.childrens && data.childrens.length > 0 ? (
            data.childrens.map((child, index) => (
              <div
                key={child.id || index}
                className={`border-t border-gray-200 dark:border-gray-700 py-4 ${
                  index > 0 ? "mt-2" : ""
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                    <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                      <Image
                        width={80}
                        height={80}
                        src={child.childrenPict || "/images/user/alt-user.png"}
                        alt={`Profile ${child.childrenName}`}
                      />
                    </div>

                    <div>
                      <div className="flex">
                        <h5 className="text-lg flex font-semibold text-gray-800 dark:text-white/90 mb-3">
                          {child.childrenName}
                        </h5>
                      </div>

                      <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                        <p className="text-md text-gray-500 dark:text-gray-400">
                          {child.childrenGender === "M"
                            ? "Laki-laki"
                            : child.childrenGender === "F"
                            ? "Perempuan"
                            : "-"}
                        </p>
                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <Badge color={child.isActive ? "success" : "error"}>
                            {child.isActive ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </p>

                        {!child.isCondition ? (
                          <>
                            <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                            <Badge size="sm" color="warning">
                              ABK
                            </Badge>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                      <Link href={`/children/edit/${child.id}`}>
                        <Button variant="outline">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ====== Detail Info Anak ====== */}
                <div className="mt-2">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <InfoItem
                      label="Tanggal Lahir"
                      value={child?.childrenBirthdate || "-"}
                    />
                    <InfoItem label="NIK" value={child?.nik || "-"} />
                    <InfoItem
                      label="Pekerjaan"
                      value={child?.childrenJob || "-"}
                    />
                    <InfoItem
                      label="Alamat"
                      value={child?.childrenAddress || "-"}
                    />
                    <InfoItem
                      label="Nomor Telp"
                      value={child?.childrenPhone || "-"}
                    />
                    <InfoItem
                      label="Anak Ke"
                      value={child?.index?.toString() || "-"}
                    />
                    <InfoItem
                      label="Dibuat Pada"
                      value={
                        child?.createdAt
                          ? new Date(child.createdAt).toLocaleString()
                          : "-"
                      }
                    />
                    <InfoItem
                      label="Diperbarui Pada"
                      value={
                        child?.updatedAt
                          ? new Date(child.updatedAt).toLocaleString()
                          : "-"
                      }
                    />

                    <InfoItem label="Catatan" value={child?.notes || "-"} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada data anak yang tercatat.
            </p>
          )}
        </div>

        {/* Family Visits */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Kunjungan Keluarga ({visits.length})
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
                            {visit.visitNumber}
                          </Button>
                          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                            {visit.officer}
                          </span>
                          <p className="text-lg text-gray-500 dark:text-gray-400">
                            ({dayjs(visit.visitDate).format("DD-MM-YYYY")})
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

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 mb-3">
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

                  {visit.familyVisitDocs &&
                    visit.familyVisitDocs.length > 0 && (
                      <div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                          Dokumentasi:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                          {visit.familyVisitDocs.map((doc: FamilyVisitDoc) => (
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
      </div>

      {/* Modal for Create/Edit Visit */}
      <Modal
        title={
          editingVisit ? "Edit Kunjungan Keluarga" : "Tambah Kunjungan Keluarga"
        }
        open={modalVisible}
        onOk={handleSubmitVisit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="homeId"
            label="ID Keluarga"
            rules={[
              { required: true, message: "Silakan masukkan ID keluarga" },
            ]}
          >
            <Input type="number" disabled />
          </Form.Item>

          <Form.Item
            name="visitDate"
            label="Tanggal Kunjungan"
            rules={[
              { required: true, message: "Silakan pilih tanggal kunjungan" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
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
            name="officer"
            label="Petugas"
            rules={[
              { required: true, message: "Silakan masukkan nama petugas" },
            ]}
          >
            <Input />
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
              editingVisit.familyVisitDocs &&
              editingVisit.familyVisitDocs.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Dokumen yang ada:
                  </div>
                  <div className="space-y-2">
                    {editingVisit.familyVisitDocs.map((doc: FamilyVisitDoc) => (
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
    </>
  );
}
