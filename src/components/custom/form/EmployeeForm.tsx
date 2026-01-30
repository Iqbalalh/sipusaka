"use client";

import { useEffect, useState, useCallback} from "react";
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
import { API_EMPLOYEE } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployee } from "@/utils/services/employee.service";
import { BaseEmployee } from "@/types/models/employee";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";
import { GENDER_OPTIONS, PLH_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BaseEmployee = {
  nipNipp: "",
  employeeName: "",
  deathCause: "",
  lastPosition: "",
  notes: "",
  regionId: null,
  employeeGender: "M",
  isAccident: false,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BaseEmployee
): { isValid: boolean; error?: string } => {
  if (!form.nipNipp?.trim()) {
    return { isValid: false, error: "NIP wajib diisi!" };
  }
  if (!form.employeeName?.trim()) {
    return { isValid: false, error: "Nama wajib diisi!" };
  }
  if (!form.regionId) {
    return { isValid: false, error: "Wilayah wajib diisi!" };
  }
  if (!form.employeeGender) {
    return { isValid: false, error: "Gender wajib diisi!" };
  }
  if (form.isAccident === null || form.isAccident === undefined) {
    return { isValid: false, error: "PLH wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function EmployeeForm({ mode, employeeId }: EmployeeFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [regions, setRegions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseEmployee>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_EMPLOYEE}/${employeeId}` : API_EMPLOYEE;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    (data) => {
      const message =
        mode === "edit"
          ? "Data pegawai berhasil diperbarui!"
          : "Pegawai berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      const id = mode === "edit" ? employeeId : data?.id;
      router.push(`/employee/view/${id}`);
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const regionList = await getRegionsList();
        setRegions(
          regionList.map((r: Region) => ({
            value: r.regionId,
            label: r.regionName,
          }))
        );

        if (mode === "edit" && employeeId) {
          const empData = await getEmployee(employeeId);
          setForm(empData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, employeeId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.employeePict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.employeePict);
      setForm((prev) => ({ ...prev, employeePict: null }));
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
    <K extends keyof BaseEmployee>(field: K, value: BaseEmployee[K]) => {
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
    router.push(`/employee/view/${employeeId}`);
  }, [router, employeeId]);

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
      ? `Edit Pegawai: ${form.employeeName}`
      : "Tambah Data Pegawai";

  const submitButtonText = mode === "edit" ? "Update Data Pegawai" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Pegawai">
            <div className="space-y-5">
              <FormField label="NIP / NIPP" required>
                <TextInput
                  type="text"
                  value={form.nipNipp}
                  onChange={(value) => handleFieldChange("nipNipp", value)}
                  placeholder="Masukkan NIP / NIPP"
                  required
                />
              </FormField>

              <FormField label="Nama Pegawai" required>
                <TextInput
                  value={form.employeeName}
                  onChange={(value) => handleFieldChange("employeeName", value)}
                  placeholder="Masukkan nama pegawai"
                  required
                />
              </FormField>

              <FormField label="PLH / Non-PLH" required>
                <SelectInput
                  value={form.isAccident}
                  onChange={(value) => handleFieldChange("isAccident", value)}
                  options={PLH_OPTIONS}
                  placeholder="Pilih status PLH"
                />
              </FormField>

              <FormField label="Posisi Terakhir">
                <TextInput
                  value={form.lastPosition ?? ""}
                  onChange={(value) => handleFieldChange("lastPosition", value)}
                  placeholder="Masukkan posisi terakhir"
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
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Wilayah" required>
                <SelectInput
                  value={form.regionId}
                  onChange={(value) => handleFieldChange("regionId", value)}
                  options={regions}
                  placeholder="Pilih wilayah"
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <SelectInput
                  value={form.employeeGender}
                  onChange={(value) => handleFieldChange("employeeGender", value)}
                  options={GENDER_OPTIONS}
                  placeholder="Pilih jenis kelamin"
                />
              </FormField>

              <FormField label="Penyebab Kematian">
                <TextInput
                  value={form.deathCause ?? ""}
                  onChange={(value) => handleFieldChange("deathCause", value)}
                  placeholder="Masukkan penyebab kematian"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Pegawai">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.employeePict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.employeePict}
                        alt="Foto Pegawai"
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