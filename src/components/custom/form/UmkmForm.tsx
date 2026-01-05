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
import { API_UMKM } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getUmkm } from "@/utils/services/umkm.service";
import { getPartners } from "@/utils/services/partner.service";
import { getEmployees } from "@/utils/services/employee.service";
import { getWaliList } from "@/utils/services/wali.service";
import { Umkm } from "@/types/models/umkm";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: Partial<Umkm> = {
  ownerName: "",
  businessName: "",
  businessAddress: "",
  businessType: "",
  products: "",
  postalCode: "",
  umkmCoordinate: "",
  regionId: undefined,
  subdistrictName: undefined,
  partnerId: undefined,
  employeeId: undefined,
  waliId: undefined,
  childrenId: undefined,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: Partial<Umkm>
): { isValid: boolean; error?: string } => {
  if (!form.ownerName?.trim()) {
    return { isValid: false, error: "Nama pemilik wajib diisi!" };
  }
  if (!form.businessName?.trim()) {
    return { isValid: false, error: "Nama usaha wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface UmkmFormProps {
  mode: "create" | "edit";
  umkmId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function UmkmForm({ mode, umkmId }: UmkmFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [regions, setRegions] = useState<Option[]>([]);
  const [partners, setPartners] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [walis, setWalis] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Umkm>>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_UMKM}/${umkmId}` : API_UMKM;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    () => {
      const message =
        mode === "edit"
          ? "Data UMKM berhasil diperbarui!"
          : "UMKM berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/umkm");
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

        // Fetch partners
        const partnerList = await getPartners();
        setPartners(
          partnerList.map((p: any) => ({
            value: p.id,
            label: p.partnerName,
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

        // Fetch walis
        const waliList = await getWaliList();
        setWalis(
          waliList.map((w: any) => ({
            value: w.id,
            label: w.waliName,
          }))
        );

        if (mode === "edit" && umkmId) {
          const umkmData = await getUmkm(umkmId);
          setForm(umkmData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, umkmId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.umkmPict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.umkmPict);
      setForm((prev) => ({ ...prev, umkmPict: undefined }));
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
    <K extends keyof Umkm>(field: K, value: Umkm[K]) => {
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
      ? `Edit UMKM: ${form.businessName}`
      : "Tambah Data UMKM";

  const submitButtonText = mode === "edit" ? "Update Data UMKM" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama UMKM">
            <div className="space-y-5">
              <FormField label="Nama Pemilik" required>
                <TextInput
                  value={form.ownerName ?? ""}
                  onChange={(value) => handleFieldChange("ownerName", value)}
                  placeholder="Masukkan nama pemilik"
                  required
                />
              </FormField>

              <FormField label="Nama Usaha" required>
                <TextInput
                  value={form.businessName ?? ""}
                  onChange={(value) => handleFieldChange("businessName", value)}
                  placeholder="Masukkan nama usaha"
                  required
                />
              </FormField>

              <FormField label="Jenis Usaha">
                <TextInput
                  value={form.businessType ?? ""}
                  onChange={(value) => handleFieldChange("businessType", value)}
                  placeholder="Masukkan jenis usaha"
                />
              </FormField>

              <FormField label="Produk">
                <TextArea
                  size="large"
                  rows={3}
                  value={form.products ?? ""}
                  onChange={(e) => handleFieldChange("products", e.target.value)}
                  placeholder="Masukkan produk yang dijual"
                />
              </FormField>

              <FormField label="Alamat Usaha">
                <TextArea
                  size="large"
                  rows={3}
                  value={form.businessAddress ?? ""}
                  onChange={(e) => handleFieldChange("businessAddress", e.target.value)}
                  placeholder="Masukkan alamat usaha"
                />
              </FormField>

              <FormField label="Kode Pos">
                <TextInput
                  value={form.postalCode ?? ""}
                  onChange={(value) => handleFieldChange("postalCode", value)}
                  placeholder="Masukkan kode pos"
                />
              </FormField>

              <FormField label="Koordinat">
                <TextInput
                  value={form.umkmCoordinate ?? ""}
                  onChange={(value) => handleFieldChange("umkmCoordinate", value)}
                  placeholder="Masukkan koordinat (latitude, longitude)"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi Tambahan">
            <div className="space-y-5">
              <FormField label="Wilayah">
                <SelectInput
                  value={form.regionId}
                  onChange={(value) => handleFieldChange("regionId", value)}
                  options={regions}
                  placeholder="Pilih wilayah"
                />
              </FormField>

              <FormField label="Kecamatan">
                <TextInput
                  value={form.subdistrictName ?? ""}
                  onChange={(value) => handleFieldChange("subdistrictName", value)}
                  placeholder="Masukkan nama kecamatan"
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

              <FormField label="Pegawai">
                <SelectInput
                  value={form.employeeId}
                  onChange={(value) => handleFieldChange("employeeId", value)}
                  options={employees}
                  placeholder="Pilih pegawai"
                />
              </FormField>

              <FormField label="Anak Asuh">
                <SelectInput
                  value={form.waliId}
                  onChange={(value) => handleFieldChange("waliId", value)}
                  options={walis}
                  placeholder="Pilih anak asuh"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto UMKM">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.umkmPict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.umkmPict}
                        alt="Foto UMKM"
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