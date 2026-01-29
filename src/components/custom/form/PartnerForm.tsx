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
import { API_PARTNER } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getPartner } from "@/utils/services/partner.service";
import { BasePartner } from "@/types/models/partner";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";
import { GENDER_OPTIONS } from "@/constants/option";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BasePartner = {
  partnerName: "",
  partnerJob: "",
  partnerNik: "",
  regionId: null,
  address: null,
  subdistrictName: null,
  postalCode: "",
  homeCoordinate: "",
  phoneNumber: "",
  phoneNumberAlt: "",
  isActive: true,
  isAlive: true,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BasePartner
): { isValid: boolean; error?: string } => {
  if (!form.partnerName?.trim()) {
    return { isValid: false, error: "Nama pasangan wajib diisi!" };
  }
  if (!form.regionId) {
    return { isValid: false, error: "Wilayah wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface PartnerFormProps {
  mode: "create" | "edit";
  partnerId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function PartnerForm({ mode, partnerId }: PartnerFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [regions, setRegions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BasePartner>(INITIAL_FORM_STATE);

  const { file: photoFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_PARTNER}/${partnerId}` : API_PARTNER;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    () => {
      const message =
        mode === "edit"
          ? "Data pasangan berhasil diperbarui!"
          : "Pasangan berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/partner");
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

        if (mode === "edit" && partnerId) {
          const partnerData = await getPartner(partnerId);
          setForm(partnerData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, partnerId, notify]);

  // ==============================================
  // DELETE PHOTO (EDIT MODE ONLY)
  // ==============================================
  const handleDeletePhoto = async () => {
    if (!form?.partnerPict)
      return notify("warning", "Tidak ada foto untuk dihapus.");

    try {
      notify("info", "Sedang menghapus foto dari server...");

      await hardDeleteFile(form.partnerPict);
      setForm((prev) => ({ ...prev, partnerPict: null }));
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
    <K extends keyof BasePartner>(field: K, value: BasePartner[K]) => {
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
    router.push(`/partner/view/${partnerId}`);
  }, [router, partnerId]);

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
      ? `Edit Pasangan: ${form.partnerName}`
      : "Tambah Data Pasangan";

  const submitButtonText = mode === "edit" ? "Update Data Pasangan" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Pasangan">
            <div className="space-y-5">
              <FormField label="Nama Pasangan" required>
                <TextInput
                  value={form.partnerName ?? ""}
                  onChange={(value) => handleFieldChange("partnerName", value)}
                  placeholder="Masukkan nama pasangan"
                  required
                />
              </FormField>

              <FormField label="NIK">
                <TextInput
                  value={form.partnerNik ?? ""}
                  onChange={(value) => handleFieldChange("partnerNik", value)}
                  placeholder="Masukkan NIK"
                />
              </FormField>

              <FormField label="Pekerjaan">
                <TextInput
                  value={form.partnerJob ?? ""}
                  onChange={(value) => handleFieldChange("partnerJob", value)}
                  placeholder="Masukkan pekerjaan"
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

              <FormField label="Kode Pos">
                <TextInput
                  value={form.postalCode ?? ""}
                  onChange={(value) => handleFieldChange("postalCode", value)}
                  placeholder="Masukkan kode pos"
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

              <FormField label="Kecamatan">
                <TextInput
                  value={form.subdistrictName ?? ""}
                  onChange={(value) => handleFieldChange("subdistrictName", value)}
                  placeholder="Masukkan nama kecamatan"
                />
              </FormField>

              <FormField label="Nomor Telepon">
                <TextInput
                  value={form.phoneNumber ?? ""}
                  onChange={(value) => handleFieldChange("phoneNumber", value)}
                  placeholder="Masukkan nomor telepon"
                />
              </FormField>

              <FormField label="Nomor Telepon Alternatif">
                <TextInput
                  value={form.phoneNumberAlt ?? ""}
                  onChange={(value) => handleFieldChange("phoneNumberAlt", value)}
                  placeholder="Masukkan nomor telepon alternatif"
                />
              </FormField>

              <FormField label="Koordinat Rumah">
                <TextInput
                  value={form.homeCoordinate ?? ""}
                  onChange={(value) => handleFieldChange("homeCoordinate", value)}
                  placeholder="Masukkan koordinat rumah"
                />
              </FormField>

              <hr className="border-gray-100" />

              <FormField label="Foto Pasangan">
                {/* LOGIKA FOTO SERVER (EDIT MODE) */}
                {mode === "edit" && form.partnerPict ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.partnerPict}
                        alt="Foto Pasangan"
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