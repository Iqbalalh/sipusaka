"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { API_ALUMNI } from "@/constants/endpoint";
import { getAlumni } from "@/utils/services/alumni.service";
import { BaseAlumni } from "@/types/models/alumni";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { GENDER_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE & OPTIONS
// ==============================================
const INITIAL_FORM_STATE: BaseAlumni = {
  alumniName: "",
  nik: "",
  alumniBirthdate: null,
  alumniAddress: "",
  alumniPhone: "",
  alumniJob: "",
  educationLevel: "",
  notes: "",
  alumniGender: "M",
};

const JENJANG_PENDIDIKAN_OPTIONS = [
  { value: "TK", label: "TK" },
  { value: "SD/Sederajat", label: "SD/Sederajat" },
  { value: "SMP/Sederajat", label: "SMP/Sederajat" },
  { value: "SMA/Sederajat", label: "SMA/Sederajat" },
  { value: "Diploma", label: "Diploma" },
  { value: "Sarjana", label: "Sarjana" },
  { value: "Magister", label: "Magister" },
  { value: "Doktor", label: "Doktor" },
];

const validateForm = (form: BaseAlumni): { isValid: boolean; error?: string } => {
  if (!form.alumniName?.trim()) return { isValid: false, error: "Nama alumni wajib diisi!" };
  if (!form.alumniGender) return { isValid: false, error: "Jenis kelamin wajib diisi!" };
  return { isValid: true };
};

interface AlumniFormProps {
  mode: "create" | "edit";
  alumniId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function AlumniForm({ mode, alumniId }: AlumniFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(mode === "edit");
  const [form, setForm] = useState<BaseAlumni>(INITIAL_FORM_STATE);

  // EXECUTION LOCK: prevent re-trigger on window focus/tab switch
  const isInitialized = useRef(false);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_ALUMNI}/${alumniId}` : API_ALUMNI;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    (data) => {
      const message = mode === "edit" ? "Data alumni berhasil diperbarui!" : "Alumni berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      const id = mode === "edit" ? alumniId : data?.data?.id;
      const redirect = searchParams.get("redirect");
      if (redirect) router.push(redirect);
      else router.push(`/alumni/view/${id}`);
    }
  );

  // FETCH DATA (edit mode only)
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;
      try {
        if (mode === "edit" && alumniId) {
          setLoading(true);
          const alumniData = await getAlumni(alumniId);
          setForm(alumniData);
        }
        isInitialized.current = true;
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [mode, alumniId, notify]);

  const handleDeletePhoto = async () => {
    if (!form?.alumniPict) return notify("warning", "Tidak ada foto untuk dihapus.");
    try {
      notify("info", "Sedang menghapus foto...");
      await hardDeleteFile(form.alumniPict);
      setForm((prev) => ({ ...prev, alumniPict: null }));
      clearFile();
      notify("success", "Foto berhasil dihapus!");
    } catch (err: any) {
      notify("error", err.message || "Gagal menghapus foto.");
    }
  };

  const handleFieldChange = useCallback(
    <K extends keyof BaseAlumni>(field: K, value: BaseAlumni[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSelectFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
    },
    [selectFile]
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    if (!validation.isValid) return notify("warning", validation.error!);

    const extraData = new FormData();
    if (photoFile) extraData.append("photo", photoFile);

    const { success, error } = await submit(form, extraData);
    if (!success) notifyFromResult(notify, { error });
  }, [form, photoFile, submit, notify]);

  const handleGoBack = useCallback(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) router.push(redirect);
    else if (mode === "create") router.push("/alumni");
    else router.push(`/alumni/view/${alumniId}`);
  }, [router, mode, alumniId, searchParams]);

  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  const pageTitle = mode === "edit" ? `Edit Alumni: ${form.alumniName}` : "Tambah Data Alumni";

  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Alumni">
            <div className="space-y-5">
              <FormField label="Nama Alumni" required>
                <TextInput
                  value={form.alumniName}
                  onChange={(v) => handleFieldChange("alumniName", v)}
                  placeholder="Masukkan nama alumni"
                />
              </FormField>

              <FormField label="NIK">
                <TextInput
                  value={form.nik ?? ""}
                  onChange={(v) => handleFieldChange("nik", v)}
                  placeholder="Masukkan NIK"
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <SelectInput
                  value={form.alumniGender}
                  onChange={(v) => handleFieldChange("alumniGender", v)}
                  options={GENDER_OPTIONS}
                />
              </FormField>

              <FormField label="Tanggal Lahir">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={form.alumniBirthdate ? dayjs(form.alumniBirthdate) : null}
                  onChange={(d) => handleFieldChange("alumniBirthdate", d ? d.format("YYYY-MM-DD") : null)}
                />
              </FormField>

              <FormField label="Pendidikan Terakhir">
                <SelectInput
                  value={form.educationLevel ?? ""}
                  onChange={(v) => handleFieldChange("educationLevel", v)}
                  options={JENJANG_PENDIDIKAN_OPTIONS}
                />
              </FormField>

              <FormField label="Pekerjaan">
                <TextInput value={form.alumniJob ?? ""} onChange={(v) => handleFieldChange("alumniJob", v)} />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput value={form.alumniPhone ?? ""} onChange={(v) => handleFieldChange("alumniPhone", v)} />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Alamat">
                <TextArea
                  rows={3}
                  value={form.alumniAddress ?? ""}
                  onChange={(e) => handleFieldChange("alumniAddress", e.target.value)}
                />
              </FormField>

              <FormField label="Catatan">
                <TextArea
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(e) => handleFieldChange("notes", e.target.value)}
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Alumni">
                {mode === "edit" && form.alumniPict ? (
                  <div className="relative inline-block mt-2">
                    <Image src={form.alumniPict} alt="" className="object-cover rounded-lg w-48 h-48 border" />
                    <Popconfirm
                      title="Hapus foto permanen?"
                      onConfirm={handleDeletePhoto}
                      okText="Hapus"
                      okButtonProps={{ danger: true }}
                    >
                      <button className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg">
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                ) : (
                  <div className="mt-2">
                    {preview ? (
                      <div className="relative inline-block">
                        <Image src={preview} alt="" className="object-cover rounded-lg w-48 h-48 border border-primary-200" />
                        <button onClick={clearFile} className="absolute -top-3 -right-3 bg-gray-500 text-white rounded-full p-2 shadow-md">
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
              <Button onClick={handleSubmit} disabled={submitLoading} className="bg-primary-600 text-white min-w-[150px]">
                {submitLoading ? "Menyimpan..." : mode === "edit" ? "Update Data" : "Simpan"}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
