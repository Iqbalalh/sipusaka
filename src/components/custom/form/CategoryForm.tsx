"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";

// Hooks & Utils
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_GALLERIES } from "@/constants/endpoint";
import { getCategory } from "@/utils/services/gallery.service";
import { Category } from "@/types/models/gallery";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: Partial<Category> = {
  name: "",
  slug: "",
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: Partial<Category>
): { isValid: boolean; error?: string } => {
  if (!form.name?.trim()) {
    return { isValid: false, error: "Nama kategori wajib diisi!" };
  }
  if (!form.slug?.trim()) {
    return { isValid: false, error: "Slug wajib diisi!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function CategoryForm({ mode, categoryId }: CategoryFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Category>>(INITIAL_FORM_STATE);

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (data) => {
      const url = mode === "edit"
        ? `${API_GALLERIES}/categories/${categoryId}`
        : `${API_GALLERIES}/categories`;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, {
        method,
        body: data as any,
      });
    },
    () => {
      const message =
        mode === "edit"
          ? "Kategori berhasil diperbarui!"
          : "Kategori berhasil ditambahkan!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/categories");
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (mode === "edit" && categoryId) {
          const categoryData = await getCategory(categoryId);
          setForm(categoryData);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, categoryId, notify]);

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof Category>(field: K, value: Category[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    // Only send the required fields (name and slug)
    const submitData = {
      name: form.name ?? "",
      slug: form.slug ?? "",
    };

    const { success, error } = await submit(submitData);

    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, submit, notify]);

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
      ? `Edit Kategori: ${form.name}`
      : "Tambah Data Kategori";

  const submitButtonText = mode === "edit" ? "Update Kategori" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Kategori">
            <div className="space-y-5">
              <FormField label="Nama Kategori" required>
                <TextInput
                  value={form.name ?? ""}
                  onChange={(value) => handleFieldChange("name", value)}
                  placeholder="Masukkan nama kategori"
                  required
                />
              </FormField>

              <FormField label="Slug" required>
                <TextInput
                  value={form.slug ?? ""}
                  onChange={(value) => handleFieldChange("slug", value)}
                  placeholder="Masukkan slug (contoh: kegiatan-anak)"
                  required
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi">
            <div className="space-y-5">
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Tentang Slug:</p>
                <p className="mb-2">Slug adalah versi URL-friendly dari nama kategori.</p>
                <p className="mb-2">Contoh:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Nama: <strong>Kegiatan Anak</strong> → Slug: <strong>kegiatan-anak</strong></li>
                  <li>Nama: <strong>Program Pendidikan</strong> → Slug: <strong>program-pendidikan</strong></li>
                </ul>
              </div>
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