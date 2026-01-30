"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Image, Popconfirm, Flex, Spin, Checkbox, DatePicker } from "antd";
import { LoadingOutlined, DeleteOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";

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
import { API_GALLERIES } from "@/constants/endpoint";
import { getCategories } from "@/utils/services/gallery.service";
import { getGallery } from "@/utils/services/gallery.service";
import { getRegionsList } from "@/utils/services/region.service";
import { BaseGallery } from "@/types/models/gallery";
import { hardDeleteFile } from "@/utils/fetch/deleteFile";
import { Option } from "@/types/generic/select-option";
import { Category } from "@/types/models/gallery";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BaseGallery = {
  caption: "",
  regionId: null,
  galleryDate: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: BaseGallery,
  imageFile: File | null,
  mode: "create" | "edit"
): { isValid: boolean; error?: string } => {
  if (mode === "create" && !imageFile) {
    return { isValid: false, error: "Gambar wajib diunggah!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface GalleryFormProps {
  mode: "create" | "edit";
  galleryId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function GalleryForm({ mode, galleryId }: GalleryFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [categories, setCategories] = useState<Option[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<BaseGallery>(INITIAL_FORM_STATE);
  const [galleryDate, setGalleryDate] = useState<Dayjs | null>(null);

  const { file: imageFile, preview, selectFile, clearFile } = useFilePreview();

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_GALLERIES}/${galleryId}` : API_GALLERIES;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    (data) => {
      const message =
        mode === "edit"
          ? "Data galeri berhasil diperbarui!"
          : "Galeri berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      const id = mode === "edit" ? galleryId : data?.id;
      router.push(`/galleries/view/${id}`);
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const categoryList = await getCategories();
        setCategories(
          categoryList.map((c: Category) => ({
            value: c.id,
            label: c.name,
          }))
        );

        const regionList = await getRegionsList();
        setRegions(
          regionList.map((r: any) => ({
            value: r.regionId,
            label: r.regionName,
          }))
        );

        if (mode === "edit" && galleryId) {
          const galleryData = await getGallery(galleryId);
          setForm(galleryData);
          if (galleryData.galleryDate) {
            setGalleryDate(dayjs(galleryData.galleryDate));
          }
          if (galleryData.categories && galleryData.categories.length > 0) {
            setSelectedCategories(galleryData.categories.map((c: Category) => c.id));
          }
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, galleryId, notify]);

  // ==============================================
  // DELETE IMAGE (EDIT MODE ONLY)
  // ==============================================
  const handleDeleteImage = async () => {
    if (!form?.s3Path)
      return notify("warning", "Tidak ada gambar untuk dihapus.");

    try {
      notify("info", "Sedang menghapus gambar dari server...");

      await hardDeleteFile(form.s3Path);
      setForm((prev) => ({ ...prev, s3Path: null }));
      clearFile();
      notify("success", "Gambar berhasil dihapus secara permanen!");
    } catch (err: any) {
      notify("error", err.message || "Gagal menghapus gambar.");
    }
  };

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof BaseGallery>(field: K, value: BaseGallery[K]) => {
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

  const handleCategoryChange = useCallback((categoryId: number) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form, imageFile, mode);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    const extraData = new FormData();
    if (imageFile) {
      extraData.append("image", imageFile);
    }
    if (selectedCategories.length > 0) {
      selectedCategories.forEach((catId) => {
        extraData.append("categoryIds", catId.toString());
      });
    }
    if (galleryDate) {
      extraData.append("galleryDate", galleryDate.format('YYYY-MM-DD'));
    }
    // Note: regionId is already in the form object and will be added by buildFormData

    const { success, error } = await submit(form, extraData);

    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, imageFile, selectedCategories, submit, notify, mode]);

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
      ? `Edit Galeri`
      : "Tambah Data Galeri";

  const submitButtonText = mode === "edit" ? "Update Data Galeri" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Utama Galeri">
            <div className="space-y-5">
              <FormField label="Keterangan" required>
                <TextArea
                  size="large"
                  rows={4}
                  value={form.caption ?? ""}
                  onChange={(e) => handleFieldChange("caption", e.target.value)}
                  placeholder="Masukkan keterangan gambar"
                />
              </FormField>

              <FormField label="Tanggal Galeri">
                <DatePicker
                  size="large"
                  style={{ width: '100%' }}
                  value={galleryDate}
                  onChange={(date) => {
                    setGalleryDate(date);
                    handleFieldChange("galleryDate", date ? date.format('YYYY-MM-DD') : null);
                  }}
                  placeholder="Pilih tanggal galeri"
                  format="DD/MM/YYYY"
                />
              </FormField>

              <FormField label="Wilayah">
                <SelectInput
                  placeholder="Pilih wilayah"
                  value={form.regionId}
                  onChange={(value) => handleFieldChange("regionId", value)}
                  options={regions}
                />
              </FormField>

              <FormField label="Kategori">
                <div className="space-y-2 mt-2">
                  {categories.map((category) => (
                    <Checkbox
                      key={String(category.value)}
                      checked={selectedCategories.includes(Number(category.value))}
                      onChange={() => handleCategoryChange(Number(category.value))}
                    >
                      {category.label}
                    </Checkbox>
                  ))}
                </div>
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Gambar">
            <div className="space-y-5">
              <FormField label="Unggah Gambar" required={mode === "create"}>
                {/* LOGIKA GAMBAR SERVER (EDIT MODE) */}
                {mode === "edit" && form.s3Path ? (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="relative inline-block">
                      <Image
                        src={form.s3Path}
                        alt="Gambar Galeri"
                        className="object-cover rounded-lg w-full max-w-md border shadow-sm"
                      />
                      <Popconfirm
                        title="Hapus gambar permanen?"
                        description="Gambar akan langsung dihapus dari server S3."
                        onConfirm={handleDeleteImage}
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
                          className="object-cover rounded-lg w-full max-w-md border border-primary-200"
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