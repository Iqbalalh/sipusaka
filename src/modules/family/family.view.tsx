"use client";

// Hooks
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
  Select,
  Popconfirm,
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

// Action Buttons
import { WhatsAppButton, GoogleMapsButton } from "@/components/ui/action-buttons/ActionButtons";

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
import { addSiblingHome, deleteHome, getHomeDetail } from "@/utils/services/home.service";
import { assignChildToHome } from "@/utils/services/children.service";
import { getWaliOptimized } from "@/utils/services/wali.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { calculateAge } from "@/utils/formatter/calculateAge";
import { formatDate } from "@/utils/formatter/formatDate";
import { handlePrintFamily } from "@/utils/export/pdf/modules/family.pdf";
import { API_IMAGE } from "@/constants/endpoint";

export default function FamilyView() {
  // Data state
  const [data, setData] = useState<Home | null>(null);
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role !== "staff";

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
  const [submitLoading, setSubmitLoading] = useState(false);

  // Tambah Wali modal state
  const [addWaliOpen, setAddWaliOpen] = useState(false);
  const [addWaliLoading, setAddWaliLoading] = useState(false);
  const [selectedWaliId, setSelectedWaliId] = useState<number | null>(null);
  const [waliOptions, setWaliOptions] = useState<{ value: number; label: string }[]>([]);
  const [waliSearchLoading, setWaliSearchLoading] = useState(false);

  // Hapus Wali (sibling home) state
  const [deletingSiblingId, setDeletingSiblingId] = useState<number | null>(null);

  // Tambah Anak ke cluster state
  const [addAnakTargetHomeId, setAddAnakTargetHomeId] = useState<number | null>(null);
  const [addAnakLoading, setAddAnakLoading] = useState(false);
  const [selectedChildIds, setSelectedChildIds] = useState<number[]>([]);

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
      setSubmitLoading(true);
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
    } finally {
      setSubmitLoading(false);
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

  // ==========================
  // TAMBAH WALI HANDLERS
  // ==========================
  const handleOpenAddWali = async () => {
    setSelectedWaliId(null);
    setAddWaliOpen(true);
    setWaliSearchLoading(true);
    try {
      const result = await getWaliOptimized(1, 50, "");
      setWaliOptions(result.data.map((w) => ({ value: w.id!, label: w.waliName })));
    } catch {
      // ignore
    } finally {
      setWaliSearchLoading(false);
    }
  };

  const handleWaliSearch = async (search: string) => {
    setWaliSearchLoading(true);
    try {
      const result = await getWaliOptimized(1, 50, search);
      setWaliOptions(result.data.map((w) => ({ value: w.id!, label: w.waliName })));
    } catch {
      // ignore
    } finally {
      setWaliSearchLoading(false);
    }
  };

  const handleAddWaliSubmit = async () => {
    if (!selectedWaliId) return;
    setAddWaliLoading(true);
    try {
      // Use the live canonical home id — the URL id may point to a sibling that
      // was since deleted.
      const activeId = data?.id ?? id;
      await addSiblingHome(activeId, selectedWaliId);
      setAddWaliOpen(false);
      // Refresh family data
      const home = await getHomeDetail(activeId);
      setData(home);
      messageApi.success({ content: "Wali berhasil ditambahkan", key: "add-wali", duration: 2 });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setAddWaliLoading(false);
    }
  };

  const handleDeleteSibling = async (siblingHomeId: number) => {
    setDeletingSiblingId(siblingHomeId);
    try {
      await deleteHome(siblingHomeId);
      // Refresh from a surviving sibling — the deleted home may be the one the
      // URL/`data.id` points to, which would 404 on reload.
      const survivingId =
        (data?.walis ?? [])
          .map((w) => w.homeId)
          .filter((h) => h !== siblingHomeId)
          .sort((a, b) => a - b)[0] ?? (data?.id ?? id);
      const home = await getHomeDetail(survivingId);
      setData(home);
      messageApi.success({ content: "Wali berhasil dihapus dari keluarga", key: "del-wali", duration: 2 });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeletingSiblingId(null);
    }
  };

  const handleAddAnakSubmit = async () => {
    if (!addAnakTargetHomeId || selectedChildIds.length === 0) return;
    setAddAnakLoading(true);
    try {
      await Promise.all(selectedChildIds.map((childId) => assignChildToHome(childId, addAnakTargetHomeId)));
      const home = await getHomeDetail(data?.id ?? id);
      setData(home);
      setAddAnakTargetHomeId(null);
      setSelectedChildIds([]);
      messageApi.success({ content: "Anak berhasil ditambahkan ke cluster ini", key: "add-anak", duration: 2 });
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setAddAnakLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );
  }

  // Live canonical home id for links/redirects (URL id may be a deleted sibling)
  const activeId = data?.id ?? id;

  return (
    <>
      {contextHolder}

      {/* Tambah Wali Modal */}
      <Modal
        title="Tambah Wali"
        open={addWaliOpen}
        onCancel={() => setAddWaliOpen(false)}
        onOk={handleAddWaliSubmit}
        okText="Tambah"
        cancelText="Batal"
        confirmLoading={addWaliLoading}
        okButtonProps={{ disabled: !selectedWaliId }}
      >
        <div className="py-3">
          <p className="text-sm text-gray-500 mb-3">
            Pilih wali yang akan ditambahkan ke keluarga ini. Wali baru akan menjadi bagian dari keluarga yang sama dengan data pegawai dan pasangan yang identik.
          </p>
          <Select
            showSearch
            placeholder="Cari nama wali..."
            className="w-full"
            value={selectedWaliId}
            onChange={(val) => setSelectedWaliId(val)}
            onSearch={handleWaliSearch}
            loading={waliSearchLoading}
            filterOption={false}
            options={waliOptions}
            notFoundContent={waliSearchLoading ? <Spin size="small" /> : "Tidak ditemukan"}
          />
        </div>
      </Modal>

      {/* Tambah Anak Modal */}
      {(() => {
        const targetEntry = data?.walis?.find((e) => e.homeId === addAnakTargetHomeId);
        const targetWaliName = targetEntry?.wali?.waliName;
        const otherChildren = (data?.childrens ?? []).filter(
          (c: any) => c.homeId !== addAnakTargetHomeId
        );
        return (
          <Modal
            title={`Tambah Anak ke Rumah${targetWaliName ? ` (${targetWaliName})` : ""}`}
            open={addAnakTargetHomeId !== null}
            onCancel={() => { setAddAnakTargetHomeId(null); setSelectedChildIds([]); }}
            onOk={handleAddAnakSubmit}
            okText="Pindahkan"
            cancelText="Batal"
            confirmLoading={addAnakLoading}
            okButtonProps={{ disabled: selectedChildIds.length === 0 }}
          >
            <div className="py-3">
              <p className="text-sm text-gray-500 mb-3">
                Pilih anak yang akan dipindahkan ke cluster ini. Anak yang dipilih akan dipindahkan dari cluster sebelumnya.
              </p>
              {otherChildren.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Tidak ada anak lain di keluarga ini yang bisa dipindahkan.</p>
              ) : (
                <Select
                  mode="multiple"
                  placeholder="Pilih anak..."
                  className="w-full"
                  value={selectedChildIds}
                  onChange={(vals) => setSelectedChildIds(vals as number[])}
                  options={otherChildren.map((c: any) => ({
                    value: c.id,
                    label: `${c.childrenName}${c.isActive ? "" : " (Tidak Aktif)"}`,
                  }))}
                />
              )}
            </div>
          </Modal>
        );
      })()}

      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        {/* Home Info */}
        <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5 mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-xl gap-3 flex font-semibold text-gray-800 dark:text-white/90">
              Data Keluarga{" "}
            </h4>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddWali}
                >
                  + Tambah Wali
                </Button>
              )}
              {isAdmin && (
                <Link href={`/family/edit/${activeId}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handlePrintFamily(
                    data,
                    `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                      data?.employee?.employeePict
                    )}`,
                    `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                      data?.partner?.partnerPict
                    )}`,
                    (() => {
                      const firstWali = data?.walis?.find((e) => e.wali)?.wali;
                      return firstWali
                        ? `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl((firstWali as any).waliPict)}`
                        : undefined;
                    })(),
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
        </div>

        {/* Employee */}
        <div className="p-4 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Pegawai
          </h4>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
                <Image
                  width={56}
                  height={56}
                  src={
                    data?.employee?.employeePict || "/images/user/alt-user.png"
                  }
                  alt={"Profile"}
                />
              </div>

              <div className="min-w-0">
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                  {data?.employee?.employeeName} ({data?.employee?.nipNipp})
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {data?.employee?.employeeGender === "M"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <Badge variant={data?.employee?.isAccident ? "solid" : "light"} color={data?.employee?.isAccident ? "primary" : "dark"}>
                    {data?.employee?.isAccident ? "PLH" : "Non-PLH"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <Link href={`/employee/edit/${data?.employeeId}?redirect=/family/view/${activeId}`}>
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
                Kecelakaan/Meninggal
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.isAccident ? "Kecelakaan" : "Meninggal"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Penyebab Kematian
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.deathCause || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Posisi Terakhir
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.lastPosition || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Catatan
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.notes || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Dibuat Pada
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.createdAt
                  ? formatDate(data.employee.createdAt)
                  : "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Diperbarui Pada
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.employee?.updatedAt
                  ? formatDate(data.employee.updatedAt)
                  : "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Dibuat Oleh
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {(data?.employee as any)?.createdByStaffName || data?.employee?.createdBy || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Diedit Oleh
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {(data?.employee as any)?.editedByStaffName || data?.employee?.editedBy || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Partner */}
        <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5 mb-5">
          <h4 className="text-xl font-semibold flex text-gray-800 dark:text-white/90 mb-4 gap-3">
            Pasangan{" "}
            {data?.partner?.isUmkm ? (
              <Badge variant="light" color="info">UMKM</Badge>
            ) : ""}
          </h4>
          <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
                <Image
                  width={56}
                  height={56}
                  src={
                    data?.partner?.partnerPict || "/images/user/alt-user.png"
                  }
                  alt={"Profile"}
                />
              </div>

              <div className="min-w-0">
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
                  {data?.partner?.isAlive == false ? "Alm. " : ""}
                  {data?.partner?.partnerName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {data?.partner?.partnerJob || "Tidak Bekerja"}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <Badge variant={data?.partner?.isActive ? "solid" : "light"} color={data?.partner?.isActive ? "success" : "error"}>
                    {data?.partner?.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <Link href={`/partner/edit/${data?.partnerId}?redirect=/family/view/${activeId}`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          {/* Detail Info Grid - Block Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Alamat
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.partner?.address || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                NIK
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.partner?.partnerNik || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Nomor Telp
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                  {data?.partner?.phoneNumber || "-"}
                </span>
                {data?.partner?.phoneNumber && <WhatsAppButton phoneNumber={data.partner.phoneNumber} />}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Nomor Telp Alt
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                  {data?.partner?.phoneNumberAlt || "-"}
                </span>
                {data?.partner?.phoneNumberAlt && <WhatsAppButton phoneNumber={data.partner.phoneNumberAlt} />}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Status Hidup
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.partner?.isAlive ? "Hidup" : "Meninggal"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Koordinat Rumah
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                  {data?.partner?.homeCoordinate || "-"}
                </span>
                {data?.partner?.homeCoordinate && <GoogleMapsButton coordinate={data.partner.homeCoordinate} />}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Dibuat Pada
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.partner?.createdAt
                  ? formatDate(data.partner.createdAt)
                  : "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Diperbarui Pada
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {data?.partner?.updatedAt
                  ? formatDate(data.partner.updatedAt)
                  : "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Dibuat Oleh
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {(data?.partner as any)?.createdByStaffName || data?.partner?.createdBy || "-"}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Diedit Oleh
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {(data?.partner as any)?.editedByStaffName || data?.partner?.editedBy || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Cluster per sibling home: satu card = Rumah (Nama Wali) + Anak */}
        {(data?.walis ?? []).map((entry) => {
          const w = entry.wali;
          const clusterTitle = w ? `Rumah (${w.waliName})` : "Anak Tertanggung";
          const groupChildren = (data?.childrens ?? []).filter(
            (c: any) => c.homeId === entry.homeId
          );
          const otherChildrenExist = (data?.childrens ?? []).some(
            (c: any) => c.homeId !== entry.homeId
          );

          return (
            <div key={entry.homeId} className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5 mb-5">
              {/* Cluster header */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">{clusterTitle}</h4>
                <div className="flex items-center gap-2 sm:justify-end">
                  {isAdmin && otherChildrenExist && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setAddAnakTargetHomeId(entry.homeId); setSelectedChildIds([]); }}
                    >
                      + Tambah Anak
                    </Button>
                  )}
                  {w && entry.waliId && (
                    <Link href={`/wali/edit/${entry.waliId}?redirect=/family/view/${activeId}`}>
                      <Button variant="outline" size="sm">Edit Wali</Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Popconfirm
                      title="Hapus cluster ini?"
                      description="Wali dan anak yang terkait akan dilepas. Apakah Anda yakin?"
                      okText="Hapus"
                      cancelText="Batal"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDeleteSibling(entry.homeId)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="!text-red-500 !border-red-300 hover:!border-red-500"
                        disabled={deletingSiblingId === entry.homeId}
                      >
                        {deletingSiblingId === entry.homeId ? "Menghapus..." : "Hapus"}
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>

              {/* Wali detail — only when wali exists */}
              {w && (
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
                      <Image width={48} height={48} src={(w as any).waliPict || "/images/user/alt-user.png"} alt={`Wali ${w.waliName}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">{w.waliName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{w.relation || "Relasi tidak diketahui"}</span>
                        {entry.regions?.regionName && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <Badge variant="light" color="info">{entry.regions.regionName}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Nomor Telp</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">{w.waliPhone || "-"}</span>
                        {w.waliPhone && <WhatsAppButton phoneNumber={w.waliPhone} />}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Hubungan</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">{w.relation || "-"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alamat Wali</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">{w.waliAddress || "-"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Koordinat Alamat</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">{(w as any).addressCoordinate || "-"}</span>
                        {(w as any).addressCoordinate && <GoogleMapsButton coordinate={(w as any).addressCoordinate} />}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Pada</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{(w as any).createdAt ? formatDate((w as any).createdAt) : "-"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Diperbarui Pada</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{(w as any).updatedAt ? formatDate((w as any).updatedAt) : "-"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Oleh</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{(w as any).createdByStaffName || (w as any).createdBy || "-"}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Diedit Oleh</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">{(w as any).editedByStaffName || (w as any).editedBy || "-"}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 mt-5" />
                </div>
              )}

              {/* Anak Tertanggung */}
              <div>
                <h5 className="text-base font-semibold text-gray-700 dark:text-white/80 mb-3">
                  Anak Tertanggung ({groupChildren.length})
                </h5>
                {groupChildren.length > 0 ? (
                  groupChildren.map((child: any, childIdx: number) => (
                    <div key={child.id || childIdx} className={`border-t border-gray-200 dark:border-gray-700 pt-4 ${childIdx > 0 ? "mt-4" : ""}`}>
                      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
                            <Image width={56} height={56} src={child.childrenPict || "/images/user/alt-user.png"} alt={`Profile ${child.childrenName}`} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">{child.childrenName}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {child.childrenGender === "M" ? "Laki-laki" : child.childrenGender === "F" ? "Perempuan" : "-"}
                              </span>
                              <span className="text-gray-300 dark:text-gray-700">•</span>
                              <Badge variant={child.isActive ? "solid" : "light"} color={child.isActive ? "success" : "error"}>
                                {child.isActive ? "Aktif" : "Tidak Aktif"}
                              </Badge>
                              {!child.isCondition && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-700">•</span>
                                  <Badge variant="light" color="warning" size="sm">ABK</Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <Link href={`/children/edit/${child.id}?redirect=/family/view/${activeId}`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tanggal Lahir</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.childrenBirthdate ? formatDate(child.childrenBirthdate) : "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Usia</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{calculateAge(child?.childrenBirthdate) !== null ? `${calculateAge(child?.childrenBirthdate)} Tahun` : "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">NIK</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.nik || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Jenjang Pendidikan</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.educationLevel || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tingkat Pendidikan</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.educationGrade || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Nama Sekolah</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.schoolName || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pekerjaan</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.childrenJob || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alamat</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.childrenAddress || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Nomor Telp</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90 flex-1">{child?.childrenPhone || "-"}</span>
                            {child?.childrenPhone && <WhatsAppButton phoneNumber={child.childrenPhone} />}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Anak Ke</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.index?.toString() || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Pada</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.createdAt ? formatDate(child.createdAt) : "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Diperbarui Pada</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.updatedAt ? formatDate(child.updatedAt) : "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Oleh</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.createdByStaffName || child?.createdBy || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Diedit Oleh</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.editedByStaffName || child?.editedBy || "-"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Catatan</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">{child?.notes || "-"}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada anak yang tercatat di cluster ini.</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Validation Status */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-5 ${
          (data as any)?.isValidated
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700/50"
            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50"
        }`}>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold ${
            (data as any)?.isValidated ? "bg-emerald-500" : "bg-red-500"
          }`}>
            {(data as any)?.isValidated ? "✓" : "✗"}
          </div>
          <div>
            <p className={`text-sm font-semibold ${
              (data as any)?.isValidated
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {(data as any)?.isValidated ? "Sudah Dikunjungi" : "Belum Dikunjungi"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(data as any)?.isValidated
                ? "Sudah Dikunjungi"
                : "Belum Dikunjungi"}
            </p>
          </div>
        </div>

        {/* Family Visits */}
        <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Kunjungan Keluarga ({visits.length})
            </h4>
            <Button
              onClick={handleCreateVisit}
              className="bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
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
                    <div className="flex gap-4 justify-between items-center">
                      <div className="block gap-3">
                        <div className="flex items-center gap-2">
                          <Button size="xs" className="text-xs text-gray-800 dark:text-white/90">
                            {visit.visitNumber}
                          </Button>
                          <span className="text-base font-semibold text-gray-500 dark:text-gray-400">
                            {visit.officer}
                          </span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ({dayjs(visit.visitDate).format("DD/MM/YYYY")})
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
        onCancel={() => !submitLoading && setModalVisible(false)}
        width={600}
        footer={
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalVisible(false)}
              disabled={submitLoading}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitVisit}
              disabled={submitLoading}
            >
              {submitLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        }
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
