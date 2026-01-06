"use client";

import { useEffect, useState, useCallback} from "react";
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
import { API_STAFF } from "@/constants/endpoint";
import { getStaff } from "@/utils/services/staff.service";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { GENDER_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE
// ==============================================
interface BaseStaff {
  staffName: string;
  gender: "M" | "F";
  birthplace: string | null;
  birthdate: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  nik: string;
  roleId: number | null;
  staffPict: string | null;
}

const INITIAL_FORM_STATE: BaseStaff = {
  staffName: "",
  gender: "M",
  birthplace: null,
  birthdate: null,
  address: null,
  phoneNumber: null,
  email: null,
  nik: "",
  roleId: null,
  staffPict: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BaseStaff
): { isValid: boolean; error?: string } => {
  if (!form.staffName?.trim()) {
    return { isValid: false, error: "Nama staf wajib diisi!" };
  }
  if (!form.nik?.trim()) {
    return { isValid: false, error: "NIK wajib diisi!" };
  }
  if (!form.gender) {
    return { isValid: false, error: "Jenis kelamin wajib diisi!" };
  }
  if (!form.roleId) {
    return { isValid: false, error: "Role wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface StaffFormProps {
  mode: "create" | "edit";
  staffId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function StaffForm({ mode, staffId }: StaffFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [roles, setRoles] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseStaff>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_STAFF}/${staffId}` : API_STAFF;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    () => {
      const message =
        mode === "edit"
          ? "Data staf berhasil diperbarui!"
          : "Staf berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/staff");
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Mock roles - in real app, fetch from API
        setRoles([
          { value: 1, label: "Admin" },
          { value: 2, label: "Staff" },
          { value: 3, label: "Super Admin" },
        ]);

        if (mode === "edit" && staffId) {
          const staffData = await getStaff(staffId);
          setForm(staffData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, staffId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.staffPict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.staffPict);
      setForm((prev) => ({ ...prev, staffPict: null }));
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
    <K extends keyof BaseStaff>(field: K, value: BaseStaff[K]) => {
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
      extraData.append("picture", photoFile);
    }

    const { success, error } = await submit(form, extraData);

    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, photoFile, submit, notify]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

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
      ? `Edit Staf: ${form.staffName}`
      : "Tambah Data Staf";

  const submitButtonText = mode === "edit" ? "Update Data Staf" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Staf">
            <div className="space-y-5">
              <FormField label="Nama Staf" required>
                <TextInput
                  value={form.staffName}
                  onChange={(value) => handleFieldChange("staffName", value)}
                  placeholder="Masukkan nama staf"
                  required
                />
              </FormField>

              <FormField label="NIK" required>
                <TextInput
                  type="text"
                  value={form.nik}
                  onChange={(value) => handleFieldChange("nik", value)}
                  placeholder="Masukkan NIK"
                  required
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <SelectInput
                  value={form.gender}
                  onChange={(value) => handleFieldChange("gender", value)}
                  options={GENDER_OPTIONS}
                  placeholder="Pilih jenis kelamin"
                />
              </FormField>

              <FormField label="Role" required>
                <SelectInput
                  value={form.roleId}
                  onChange={(value) => handleFieldChange("roleId", value)}
                  options={roles}
                  placeholder="Pilih role"
                />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput
                  type="tel"
                  value={form.phoneNumber ?? ""}
                  onChange={(value) => handleFieldChange("phoneNumber", value)}
                  placeholder="Masukkan nomor telepon"
                />
              </FormField>

              <FormField label="Email">
                <TextInput
                  type="email"
                  value={form.email ?? ""}
                  onChange={(value) => handleFieldChange("email", value)}
                  placeholder="Masukkan email"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Tempat Lahir">
                <TextInput
                  value={form.birthplace ?? ""}
                  onChange={(value) => handleFieldChange("birthplace", value)}
                  placeholder="Masukkan tempat lahir"
                />
              </FormField>

              <FormField label="Tanggal Lahir">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Pilih tanggal lahir"
                  value={form.birthdate ? dayjs(form.birthdate) : null}
                  onChange={(date) => 
                    handleFieldChange("birthdate", date ? date.format("YYYY-MM-DD") : null)
                  }
                />
              </FormField>

              <FormField label="Alamat">
                <TextArea
                  size="large"
                  rows={4}
                  value={form.address ?? ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Masukkan alamat lengkap"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Staf">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.staffPict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.staffPict}
                        alt="Foto Staf"
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