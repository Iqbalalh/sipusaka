"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Image, Popconfirm, Flex, Spin, DatePicker } from "antd";
import { LoadingOutlined, DeleteOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import FileInput from "@/components/form/input/FileInput";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";

// Hooks & Utils
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_CHILDREN } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildren } from "@/utils/services/children.service";
import { getEmployees } from "@/utils/services/employee.service";
import { getPartners } from "@/utils/services/partner.service";
import { getWaliList } from "@/utils/services/wali.service";
import { BaseChildren } from "@/types/models/children";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";
import { GENDER_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BaseChildren = {
  childrenName: "",
  nik: "",
  childrenBirthdate: null,
  childrenAddress: "",
  childrenPhone: "",
  childrenJob: "",
  notes: "",
  childrenGender: "M",
  isActive: true,
  isFatherAlive: true,
  isMotherAlive: true,
  isCondition: true,
  employeeId: undefined,
  partnerId: undefined,
  homeId: null,
  index: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BaseChildren
): { isValid: boolean; error?: string } => {
  if (!form.childrenName?.trim()) {
    return { isValid: false, error: "Nama anak wajib diisi!" };
  }
  if (!form.childrenGender) {
    return { isValid: false, error: "Jenis kelamin wajib diisi!" };
  }
  if (form.isActive === null || form.isActive === undefined) {
    return { isValid: false, error: "Status wajib diisi!" };
  }
  if (form.isCondition === null || form.isCondition === undefined) {
    return { isValid: false, error: "Kondisi ABK wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface ChildrenFormProps {
  mode: "create" | "edit";
  childrenId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function ChildrenForm({ mode, childrenId }: ChildrenFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [regions, setRegions] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [partners, setPartners] = useState<Option[]>([]);
  const [walis, setWalis] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseChildren>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_CHILDREN}/${childrenId}` : API_CHILDREN;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    () => {
      const message =
        mode === "edit"
          ? "Data anak asuh berhasil diperbarui!"
          : "Anak asuh berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/children");
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Fetch regions
        const regionList = await getRegionsList();
        setRegions(
          regionList.map((r: Region) => ({
            value: r.regionId,
            label: r.regionName,
          }))
        );

        // Fetch employees
        const empList = await getEmployees();
        setEmployees(
          empList.map((e: any) => ({
            value: e.id,
            label: `${e.employeeName} (${e.nipNipp})`,
          }))
        );

        // Fetch partners
        const partnerList = await getPartners();
        setPartners(
          partnerList.map((p: any) => ({
            value: p.id,
            label: p.partnerName,
          }))
        );

        // Fetch walis
        const waliList = await getWaliList();
        setWalis(
          waliList.map((w: any) => ({
            value: w.id,
            label: w.waliName,
          }))
        );

        if (mode === "edit" && childrenId) {
          const childData = await getChildren(childrenId);
          setForm(childData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, childrenId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.childrenPict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.childrenPict);
      setForm((prev) => ({ ...prev, childrenPict: null }));
      clearFile();
      notify("success", "Foto berhasil dihapus secara permanen!");
    } catch (err: any) {
      notify("error", err.message || "Gagal menghapus foto.");
    }
  };

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof BaseChildren>(field: K, value: BaseChildren[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSelectFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        selectFile(file);
      } catch (error) {
        notifyFromResult(notify, { error });
      }
    },
    [selectFile, notify]
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    const extraData = new FormData();
    if (photoFile) {
      extraData.append("photo", photoFile);
    }

    const { success, error } = await submit(form, extraData);

    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, photoFile, submit, notify]);

  const handleGoBack = useCallback(() => {
    router.push(`/children/view/${childrenId}`);
  }, [router, childrenId]);

  // ==============================================
  // RENDER LOADING STATE
  // ==============================================
  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  // ==============================================
  // PAGE TITLE
  // ==============================================
  const pageTitle =
    mode === "edit"
      ? `Edit Anak Asuh: ${form.childrenName}`
      : "Tambah Data Anak Asuh";

  const submitButtonText = mode === "edit" ? "Update Data Anak Asuh" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Anak Asuh">
            <div className="space-y-5">
              <FormField label="Nama Anak" required>
                <TextInput
                  value={form.childrenName}
                  onChange={(value) => handleFieldChange("childrenName", value)}
                  placeholder="Masukkan nama anak"
                  required
                />
              </FormField>

              <FormField label="NIK">
                <TextInput
                  value={form.nik ?? ""}
                  onChange={(value) => handleFieldChange("nik", value)}
                  placeholder="Masukkan NIK"
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <SelectInput
                  value={form.childrenGender}
                  onChange={(value) => handleFieldChange("childrenGender", value)}
                  options={GENDER_OPTIONS}
                  placeholder="Pilih jenis kelamin"
                />
              </FormField>

              <FormField label="Tanggal Lahir">
                <DatePicker
                  style={{ width: "100%" }}
                  value={
                    form.childrenBirthdate
                      ? dayjs(form.childrenBirthdate)
                      : null
                  }
                  onChange={(date) =>
                    handleFieldChange(
                      "childrenBirthdate",
                      date ? date.format("YYYY-MM-DD") : null
                    )
                  }
                />
              </FormField>

              <FormField label="Pekerjaan">
                <TextInput
                  value={form.childrenJob ?? ""}
                  onChange={(value) => handleFieldChange("childrenJob", value)}
                  placeholder="Masukkan pekerjaan"
                />
              </FormField>

              <FormField label="Alamat">
                <TextArea
                  size="large"
                  rows={3}
                  value={form.childrenAddress ?? ""}
                  onChange={(e) => handleFieldChange("childrenAddress", e.target.value)}
                  placeholder="Masukkan alamat"
                />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput
                  value={form.childrenPhone ?? ""}
                  onChange={(value) => handleFieldChange("childrenPhone", value)}
                  placeholder="Masukkan nomor telepon"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Status" required>
                <SelectInput
                  value={form.isActive}
                  onChange={(value) => handleFieldChange("isActive", value)}
                  options={[
                    { value: true, label: "Aktif" },
                    { value: false, label: "Tidak Aktif" },
                  ]}
                  placeholder="Pilih status"
                />
              </FormField>

              <FormField label="ABK (Anak Berkebutuhan Khusus)" required>
                <SelectInput
                  value={form.isCondition}
                  onChange={(value) => handleFieldChange("isCondition", value)}
                  options={[
                    { value: true, label: "Tidak" },
                    { value: false, label: "Ya" },
                  ]}
                  placeholder="Pilih kondisi ABK"
                />
              </FormField>

              <FormField label="Ayah Masih Hidup">
                <SelectInput
                  value={form.isFatherAlive}
                  onChange={(value) => handleFieldChange("isFatherAlive", value)}
                  options={[
                    { value: true, label: "Ya" },
                    { value: false, label: "Tidak" },
                  ]}
                  placeholder="Pilih status ayah"
                />
              </FormField>

              <FormField label="Ibu Masih Hidup">
                <SelectInput
                  value={form.isMotherAlive}
                  onChange={(value) => handleFieldChange("isMotherAlive", value)}
                  options={[
                    { value: true, label: "Ya" },
                    { value: false, label: "Tidak" },
                  ]}
                  placeholder="Pilih status ibu"
                />
              </FormField>


              <FormField label="Pegawai">
                <SelectInput
                  value={form.employeeId}
                  onChange={(value) => handleFieldChange("employeeId", value)}
                  options={employees}
                  placeholder="Pilih pegawai"
                />
              </FormField>

              <FormField label="Wali">
                <SelectInput
                  value={form.partnerId}
                  onChange={(value) => handleFieldChange("partnerId", value)}
                  options={partners}
                  placeholder="Pilih wali"
                />
              </FormField>

              <FormField label="Catatan">
                <TextArea
                  size="large"
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                  placeholder="Tambahkan catatan (opsional)"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Anak">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.childrenPict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.childrenPict}
                        alt="Foto Anak"
                        className="object-cover rounded-lg w-48 h-48 border shadow-sm"
                      />
                      <Popconfirm
                        title="Hapus foto permanen?"
                        description="Foto akan langsung dihapus dari server S3."
                        onConfirm={handleDeletePhoto}
                        okText="Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                      >
                        <button className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg">
                          <DeleteOutlined />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    {/* PREVIEW FILE BARU */}
                    {preview ? (
                      <div className="relative inline-block">
                        <Image
                          src={preview}
                          className="object-cover rounded-lg w-48 h-48 border border-primary-200"
                          alt="Preview"
                        />
                        <button
                          onClick={clearFile}
                          className="absolute -top-3 -right-3 bg-gray-500 text-white rounded-full p-2 hover:bg-gray-600 shadow-md"
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    ) : (
                      <FileInput onChange={handleSelectFile} />
                    )}
                  </div>
                )}
              </FormField>
            </div>

            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
              <Button onClick={handleGoBack}>Batal</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="bg-primary-600 text-white min-w-[150px]"
              >
                {submitLoading ? "Menyimpan..." : submitButtonText}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}