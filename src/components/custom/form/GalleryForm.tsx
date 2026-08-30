"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image, Popconfirm, Flex, Spin, Checkbox, DatePicker, Progress } from "antd";
import { LoadingOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getSession } from "next-auth/react";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import FileInput from "@/components/form/input/FileInput";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";

// Hooks & Utils
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useFilePreview } from "@/hooks/useFilePreview";
import { compressFiles } from "@/utils/image/compressImage";
import { useMultipleFilePreview } from "@/hooks/useMultipleFilePreview";
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
  imageFiles: File[],
  mode: "create" | "edit"
): { isValid: boolean; error?: string } => {
  if (mode === "create" && imageFiles.length === 0) {
    return { isValid: false, error: "Minimal satu gambar wajib diunggah!" };
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Single file for edit mode
  const { file: imageFile, preview, selectFile, clearFile } = useFilePreview();
  
  // Multiple files for create mode
  const {
    files: multipleFiles,
    addFiles,
    removeFile,
    clearFiles,
    hasFiles,
    fileCount,
  } = useMultipleFilePreview();

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
      
      // For create mode with multiple files, go back to gallery list
      if (mode === "create") {
        router.push("/galleries");
      } else {
        router.push(`/galleries/view/${galleryId}`);
      }
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
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;

      try {
        if (mode === "edit") {
          // Edit mode: single file
          const file = fileList[0];
          selectFile(file);
        } else {
          // Create mode: multiple files
          const addedCount = addFiles(fileList);
          if (addedCount === 0) {
            notify("warning", "Tidak ada file yang valid untuk diunggah.");
          } else {
            notify("success", `${addedCount} gambar berhasil ditambahkan.`);
          }
        }
      } catch (error) {
        notifyFromResult(notify, { error });
      }
    },
    [selectFile, addFiles, mode, notify]
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

  const uploadWithProgress = useCallback(async (url: string, formData: FormData): Promise<void> => {
    const session = await getSession();
    const token = (session?.user as any)?.token;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploadProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body?.message || `Upload gagal (${xhr.status})`));
          } catch {
            reject(new Error(`Upload gagal (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        setUploadProgress(null);
        reject(new Error("Koneksi gagal saat mengunggah."));
      };

      xhr.send(formData);
    });
  }, []);

  // Synchronous re-entrancy lock — compression adds a multi-second gap before
  // the button disables, so guard the whole submit against double-clicks.
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;

    // Get files based on mode
    const filesToUpload = mode === "create" ? multipleFiles.map(f => f.file) : (imageFile ? [imageFile] : []);

    const validation = validateForm(form, filesToUpload, mode);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    submittingRef.current = true;
    try {
      const extraData = new FormData();

      // Append files based on mode
      if (mode === "create" && multipleFiles.length > 0) {
        // imageFile (single/edit) is already compressed by useFilePreview; the
        // multi-file list is raw, so compress it here before upload.
        const compressed = await compressFiles(multipleFiles.map((f) => f.file));
        compressed.forEach((f) => extraData.append("images", f));
      } else if (imageFile) {
        extraData.append("image", imageFile);
      }

      if (selectedCategories.length > 0) {
        selectedCategories.forEach((catId) => {
          extraData.append("categoryIds", catId.toString());
        });
      }

      // Use XHR with progress for multi-file create, regular submit for single/edit
      if (mode === "create" && multipleFiles.length > 1) {
        try {
          setUploadProgress(0);
          await uploadWithProgress(API_GALLERIES, extraData);
          notify("success", "Galeri berhasil ditambahkan!");
          router.push("/galleries");
        } catch (err: any) {
          notify("error", err.message || "Gagal mengunggah gambar.");
        }
      } else {
        const { success, error } = await submit(form, extraData);
        if (!success) {
          notifyFromResult(notify, { error });
        }
      }
    } finally {
      submittingRef.current = false;
    }
  }, [form, imageFile, multipleFiles, mode, selectedCategories, submit, notify, uploadWithProgress, router]);

  const handleGoBack = useCallback(() => {
    if (mode === "create") {
      router.push("/galleries");
    } else {
      router.push(`/galleries/view/${galleryId}`);
    }
  }, [router, mode, galleryId]);

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
                    handleFieldChange("galleryDate", date && date.isValid() ? date.format('YYYY-MM-DD') : null);
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
                ) : mode === "edit" ? (
                  /* EDIT MODE: Single file with preview */
                  <div className="mt-2">
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
                ) : (
                  /* CREATE MODE: Multiple files support */
                  <div className="mt-2">
                    {/* Preview multiple images */}
                    {hasFiles ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {multipleFiles.map((fileWithPreview, index) => (
                            <div key={index} className="relative group">
                              <Image
                                src={fileWithPreview.preview}
                                className="object-cover rounded-lg w-full h-32 border border-gray-200"
                                alt={`Preview ${index + 1}`}
                              />
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <DeleteOutlined className="text-sm" />
                              </button>
                              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add more images button */}
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors">
                            <PlusOutlined className="text-gray-500" />
                            <span className="text-sm text-gray-600">Tambah Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleSelectFile}
                            />
                          </label>
                          
                          <button
                            type="button"
                            onClick={clearFiles}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            Hapus Semua
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-500">
                          Total: {fileCount} gambar akan diunggah
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <FileInput
                          onChange={handleSelectFile}
                          multiple
                          accept="image/*"
                          className="file:cursor-pointer"
                        />
                        <p className="text-sm text-gray-500">
                          Anda dapat memilih beberapa gambar sekaligus
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </FormField>
            </div>

            {uploadProgress !== null && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Mengunggah {fileCount} gambar...</span>
                  <span className="font-semibold text-blue-600">{uploadProgress}%</span>
                </div>
                <Progress percent={uploadProgress} status="active" strokeColor="#2563EB" />
              </div>
            )}

            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
              <Button onClick={handleGoBack}>Batal</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitLoading || uploadProgress !== null}
                className="bg-primary-600 text-white min-w-[150px]"
              >
                {uploadProgress !== null ? `Mengunggah ${uploadProgress}%...` : submitLoading ? "Menyimpan..." : submitButtonText}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
