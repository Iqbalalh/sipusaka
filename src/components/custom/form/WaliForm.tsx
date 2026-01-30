"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Image, Popconfirm, Flex, Spin } from "antd";
import { LoadingOutlined, DeleteOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";

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
import { API_WALI } from "@/constants/endpoint";
import { getEmployees } from "@/utils/services/employee.service";
import { getWali } from "@/utils/services/wali.service";
import { BaseWali } from "@/types/models/wali";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Employee } from "@/types/models/employee";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BaseWali = {
  waliName: "",
  relation: "",
  waliAddress: null,
  addressCoordinate: "",
  waliPhone: "",
  nik: "",
  waliJob: "",
  employeeId: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BaseWali
): { isValid: boolean; error?: string } => {
  if (!form.waliName?.trim()) {
    return { isValid: false, error: "Nama wali wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface WaliFormProps {
  mode: "create" | "edit";
  waliId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function WaliForm({ mode, waliId }: WaliFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [employees, setEmployees] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseWali>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_WALI}/${waliId}` : API_WALI;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    (data) => {
      const message =
        mode === "edit"
          ? "Data wali berhasil diperbarui!"
          : "Wali berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      const id = mode === "edit" ? waliId : data?.id;
      router.push(`/wali/view/${id}`);
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const employeeList = await getEmployees();
        setEmployees(
          employeeList
            .filter((e: Employee) => e.id !== undefined)
            .map((e: Employee) => ({
              value: e.id!,
              label: `${e.employeeName || ""} (${e.nipNipp || "-"})`,
            }))
        );

        if (mode === "edit" && waliId) {
          const waliData = await getWali(waliId);
          setForm(waliData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, waliId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.waliPict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.waliPict);
      setForm((prev) => ({ ...prev, waliPict: null }));
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
    <K extends keyof BaseWali>(field: K, value: BaseWali[K]) => {
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
    router.push(`/wali/view/${waliId}`);
  }, [router, waliId]);

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
      ? `Edit Wali: ${form.waliName}`
      : "Tambah Data Wali";

  const submitButtonText = mode === "edit" ? "Update Data Wali" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Wali">
            <div className="space-y-5">
              <FormField label="Nama Wali" required>
                <TextInput
                  value={form.waliName ?? ""}
                  onChange={(value) => handleFieldChange("waliName", value)}
                  placeholder="Masukkan nama wali"
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

              <FormField label="Hubungan">
                <TextInput
                  value={form.relation ?? ""}
                  onChange={(value) => handleFieldChange("relation", value)}
                  placeholder="Masukkan hubungan (misal: Ayah, Ibu, Saudara)"
                />
              </FormField>

              <FormField label="Pekerjaan">
                <TextInput
                  value={form.waliJob ?? ""}
                  onChange={(value) => handleFieldChange("waliJob", value)}
                  placeholder="Masukkan pekerjaan"
                />
              </FormField>

              <FormField label="Alamat">
                <TextArea
                  size="large"
                  rows={4}
                  value={form.waliAddress ?? ""}
                  onChange={(e) => handleFieldChange("waliAddress", e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                />
              </FormField>

              <FormField label="Koordinat Alamat">
                <TextInput
                  value={form.addressCoordinate ?? ""}
                  onChange={(value) => handleFieldChange("addressCoordinate", value)}
                  placeholder="Masukkan koordinat alamat"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Nama Karyawan">
                <SelectInput
                  value={form.employeeId}
                  onChange={(value) => handleFieldChange("employeeId", value)}
                  options={employees}
                  placeholder="Pilih karyawan"
                />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput
                  value={form.waliPhone ?? ""}
                  onChange={(value) => handleFieldChange("waliPhone", value)}
                  placeholder="Masukkan nomor telepon"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Wali">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.waliPict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.waliPict}
                        alt="Foto Wali"
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