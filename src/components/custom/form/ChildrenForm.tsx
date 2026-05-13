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
import { API_CHILDREN } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildren } from "@/utils/services/children.service";
import { getWaliList } from "@/utils/services/wali.service";
import { getHomesList } from "@/utils/services/home.service";
import { BaseChildren } from "@/types/models/children";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";
import { GENDER_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE & OPTIONS
// ==============================================
const INITIAL_FORM_STATE: BaseChildren = {
  childrenName: "",
  nik: "",
  childrenBirthdate: null,
  childrenAddress: "",
  childrenPhone: "",
  childrenJob: "",
  educationLevel: "",
  schoolName: "",
  educationGrade: "",
  notes: "",
  childrenGender: "M",
  isActive: true,
  isFatherAlive: true,
  isMotherAlive: true,
  isCondition: true,
  homeId: null,
  index: null,
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

const validateForm = (form: BaseChildren): { isValid: boolean; error?: string } => {
  if (!form.childrenName?.trim()) return { isValid: false, error: "Nama anak wajib diisi!" };
  if (!form.childrenGender) return { isValid: false, error: "Jenis kelamin wajib diisi!" };
  if (form.isActive === null || form.isActive === undefined) return { isValid: false, error: "Status wajib diisi!" };
  if (form.isCondition === null || form.isCondition === undefined) return { isValid: false, error: "Kondisi ABK wajib diisi!" };
  return { isValid: true };
};

interface ChildrenFormProps {
  mode: "create" | "edit";
  childrenId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function ChildrenForm({ mode, childrenId }: ChildrenFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotify();

  const [regions, setRegions] = useState<Option[]>([]);
  const [walis, setWalis] = useState<Option[]>([]);
  const [homes, setHomes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseChildren>(INITIAL_FORM_STATE);

  // EXECUTION LOCK: Mencegah re-trigger saat window focus/tab switch
  const isInitialized = useRef(false);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_CHILDREN}/${childrenId}` : API_CHILDREN;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    (data) => {
      const message = mode === "edit" ? "Data anak asuh berhasil diperbarui!" : "Anak asuh berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      const id = mode === "edit" ? childrenId : data?.data?.id;
      const redirect = searchParams.get('redirect');
      if (redirect) router.push(redirect);
      else router.push(`/children/view/${id}`);
    }
  );

  // FETCH INITIAL DATA (Optimized with useRef Lock)
  useEffect(() => {
    const init = async () => {
      if (isInitialized.current) return;

      try {
        setLoading(true);
        
        // Fetch all dependencies in parallel
        const [regionList, waliList, homeList] = await Promise.all([
          getRegionsList(),
          getWaliList(),
          getHomesList()
        ]);

        setRegions(regionList.map((r: Region) => ({ value: r.regionId, label: r.regionName })));
        setWalis(waliList.map((w: any) => ({ value: w.id, label: w.waliName })));
        setHomes(homeList.map((h: any) => ({
          value: h.id,
          label: `${h.employees?.employeeName ?? "-"} - ${h.partners?.partnerName ?? "-"}`
        })));

        if (mode === "edit" && childrenId) {
          const childData = await getChildren(childrenId);
          setForm(childData);
        }

        isInitialized.current = true;
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, childrenId, notify]);

  const handleDeletePhoto = async () => {
    if (!form?.childrenPict) return notify("warning", "Tidak ada foto untuk dihapus.");
    try {
      notify("info", "Sedang menghapus foto...");
      await hardDeleteFile(form.childrenPict);
      setForm((prev) => ({ ...prev, childrenPict: null }));
      clearFile();
      notify("success", "Foto berhasil dihapus!");
    } catch (err: any) {
      notify("error", err.message || "Gagal menghapus foto.");
    }
  };

  const handleFieldChange = useCallback(<K extends keyof BaseChildren>(field: K, value: BaseChildren[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSelectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  }, [selectFile]);

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    if (!validation.isValid) return notify("warning", validation.error!);

    const extraData = new FormData();
    if (photoFile) extraData.append("photo", photoFile);

    const { success, error } = await submit(form, extraData);
    if (!success) notifyFromResult(notify, { error });
  }, [form, photoFile, submit, notify]);

  const handleGoBack = useCallback(() => {
    const redirect = searchParams.get('redirect');
    if (redirect) router.push(redirect);
    else if (mode === "create") router.push("/children");
    else router.push(`/children/view/${childrenId}`);
  }, [router, mode, childrenId, searchParams]);

  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  const pageTitle = mode === "edit" ? `Edit Anak Asuh: ${form.childrenName}` : "Tambah Data Anak Asuh";

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
                  onChange={(v) => handleFieldChange("childrenName", v)}
                  placeholder="Masukkan nama anak"
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
                  value={form.childrenGender}
                  onChange={(v) => handleFieldChange("childrenGender", v)}
                  options={GENDER_OPTIONS}
                />
              </FormField>

              <FormField label="Tanggal Lahir">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  value={form.childrenBirthdate ? dayjs(form.childrenBirthdate) : null}
                  onChange={(d) => handleFieldChange("childrenBirthdate", d ? d.format("YYYY-MM-DD") : null)}
                />
              </FormField>

              <FormField label="Pekerjaan">
                <TextInput value={form.childrenJob ?? ""} onChange={(v) => handleFieldChange("childrenJob", v)} />
              </FormField>

              <FormField label="Jenjang Pendidikan">
                <SelectInput
                  value={form.educationLevel ?? ""}
                  onChange={(v) => handleFieldChange("educationLevel", v)}
                  options={JENJANG_PENDIDIKAN_OPTIONS}
                />
              </FormField>

              <FormField label="Tingkat Pendidikan">
                <TextInput value={form.educationGrade ?? ""} onChange={(v) => handleFieldChange("educationGrade", v)} />
              </FormField>

              <FormField label="Nama Sekolah">
                <TextInput value={form.schoolName ?? ""} onChange={(v) => handleFieldChange("schoolName", v)} />
              </FormField>

              <FormField label="Alamat">
                <TextArea
                  rows={3}
                  value={form.childrenAddress ?? ""}
                  onChange={(e) => handleFieldChange("childrenAddress", e.target.value)}
                />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput value={form.childrenPhone ?? ""} onChange={(v) => handleFieldChange("childrenPhone", v)} />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Status" required>
                <SelectInput
                  value={form.isActive ? 1 : 0}
                  onChange={(v) => handleFieldChange("isActive", v === 1)}
                  options={[{ value: 1, label: "Aktif" }, { value: 0, label: "Tidak Aktif" }]}
                />
              </FormField>

              <FormField label="ABK (Anak Berkebutuhan Khusus)" required>
                <SelectInput
                  value={form.isCondition ? 1 : 0}
                  onChange={(v) => handleFieldChange("isCondition", v === 1)}
                  options={[{ value: 1, label: "Tidak" }, { value: 0, label: "Ya" }]}
                />
              </FormField>

              <FormField label="Ayah Masih Hidup">
                <SelectInput
                  value={form.isFatherAlive ? 1 : 0}
                  onChange={(v) => handleFieldChange("isFatherAlive", v === 1)}
                  options={[{ value: 1, label: "Ya" }, { value: 0, label: "Tidak" }]}
                />
              </FormField>

              <FormField label="Ibu Masih Hidup">
                <SelectInput
                  value={form.isMotherAlive ? 1 : 0}
                  onChange={(v) => handleFieldChange("isMotherAlive", v === 1)}
                  options={[{ value: 1, label: "Ya" }, { value: 0, label: "Tidak" }]}
                />
              </FormField>

              <FormField label="Keluarga">
                <SelectInput
                  value={form.homeId}
                  onChange={(v) => handleFieldChange("homeId", v)}
                  options={homes}
                />
              </FormField>

              <FormField label="Anak ke-">
                <TextInput
                  value={form.index !== null ? String(form.index) : ""}
                  onChange={(v) => handleFieldChange("index", v ? Number(v) : null)}
                  type="number"
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

              <FormField label="Foto Anak">
                {mode === "edit" && form.childrenPict ? (
                  <div className="relative inline-block mt-2">
                    <Image src={form.childrenPict} alt="" className="object-cover rounded-lg w-48 h-48 border" />
                    <Popconfirm title="Hapus foto permanen?" onConfirm={handleDeletePhoto} okText="Hapus" okButtonProps={{ danger: true }}>
                      <button className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg"><DeleteOutlined /></button>
                    </Popconfirm>
                  </div>
                ) : (
                  <div className="mt-2">
                    {preview ? (
                      <div className="relative inline-block">
                        <Image src={preview} alt=""  className="object-cover rounded-lg w-48 h-48 border border-primary-200" />
                        <button onClick={clearFile} className="absolute -top-3 -right-3 bg-gray-500 text-white rounded-full p-2 shadow-md"><DeleteOutlined /></button>
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