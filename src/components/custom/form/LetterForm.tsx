"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, Select } from "antd";
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
import { Letter, LetterFormData, User } from "@/types/models/letter";
import {
  getLetter,
  createLetter,
  updateLetter,
  getUsers,
} from "@/utils/services/letter.service";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: LetterFormData = {
  letterType: "",
  letterNumber: "",
  attachment: "",
  subject: "",
  letterDate: "",
  destination: "",
  carbonCopy: "",
  signer1Id: 0,
  signer2Id: null,
  signer3Id: null,
  documentFile: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: LetterFormData,
  existingDocument: string | null
): { isValid: boolean; error?: string } => {
  if (!form.letterType?.trim()) {
    return { isValid: false, error: "Jenis Surat wajib diisi!" };
  }
  if (!form.subject?.trim()) {
    return { isValid: false, error: "Perihal wajib diisi!" };
  }
  if (!form.letterDate?.trim()) {
    return { isValid: false, error: "Tanggal Pembuatan wajib diisi!" };
  }
  if (!form.destination?.trim()) {
    return { isValid: false, error: "Tujuan Surat wajib diisi!" };
  }
  if (!form.signer1Id || form.signer1Id === 0) {
    return { isValid: false, error: "Penandatangan 1 wajib dipilih!" };
  }
  // Document is required for new letters, optional for edit (if already exists)
  if (!existingDocument && !form.documentFile) {
    return { isValid: false, error: "Dokumen wajib diunggah!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface LetterFormProps {
  mode: "create" | "edit";
  letterId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function LetterForm({ mode, letterId }: LetterFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<LetterFormData>(INITIAL_FORM_STATE);
  const [existingDocument, setExistingDocument] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    async (data) => {
      const fd = new FormData();
      fd.append("letterType", data.letterType);
      fd.append("letterNumber", data.letterNumber || "");
      fd.append("attachment", data.attachment || "");
      fd.append("subject", data.subject);
      fd.append("letterDate", data.letterDate);
      fd.append("destination", data.destination);
      fd.append("carbonCopy", data.carbonCopy || "");
      fd.append("signer1Id", String(data.signer1Id));
      if (data.signer2Id) {
        fd.append("signer2Id", String(data.signer2Id));
      }
      if (data.signer3Id) {
        fd.append("signer3Id", String(data.signer3Id));
      }
      if (data.documentFile) {
        fd.append("documentFile", data.documentFile);
      }

      if (mode === "edit" && letterId) {
        return await updateLetter(letterId, fd);
      } else {
        return await createLetter(fd);
      }
    },
    () => {
      const message =
        mode === "edit"
          ? "Surat berhasil diperbarui!"
          : "Surat berhasil dibuat!";
      notifyFromResult(notify, { successMessage: message });
      router.push("/letters/drafts");
    }
  );

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Fetch users for signer selection
        const usersData = await getUsers();
        setUsers(usersData);

        if (mode === "edit" && letterId) {
          const letterData = await getLetter(letterId);
          setForm({
            letterType: letterData.letterType || "",
            letterNumber: letterData.letterNumber || "",
            attachment: letterData.attachment || "",
            subject: letterData.subject || "",
            letterDate: letterData.letterDate || "",
            destination: letterData.destination || "",
            carbonCopy: letterData.carbonCopy || "",
            signer1Id: letterData.signer1Id || 0,
            signer2Id: letterData.signer2Id || null,
            signer3Id: letterData.signer3Id || null,
            documentFile: null,
          });
          setExistingDocument(letterData.documentPath);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, letterId, notify]);

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof LetterFormData>(field: K, value: LetterFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file type
        const allowedTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
        ];
        if (!allowedTypes.includes(file.type)) {
          notify("error", "Hanya file .pdf atau .docx yang diperbolehkan!");
          return;
        }
        setForm((prev) => ({ ...prev, documentFile: file }));
        setSelectedFileName(file.name);
      }
    },
    [notify]
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form, existingDocument);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    const { success, error } = await submit(form);

    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, existingDocument, submit, notify]);

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
    mode === "edit" ? `Edit Surat: ${form.subject}` : "Buat Surat Baru";

  const submitButtonText = mode === "edit" ? "Update Surat" : "Simpan Draft";

  // User options for select
  const userOptions = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Informasi Surat">
            <div className="space-y-5">
              <FormField label="Jenis Surat" required>
                <TextInput
                  value={form.letterType}
                  onChange={(value) => handleFieldChange("letterType", value)}
                  placeholder="Masukkan jenis surat (contoh: Surat Keterangan)"
                  required
                />
              </FormField>

              <FormField label="Nomor Surat">
                <TextInput
                  value={form.letterNumber}
                  onChange={(value) => handleFieldChange("letterNumber", value)}
                  placeholder="Masukkan nomor surat (contoh: 001/ABC/I/2024)"
                />
              </FormField>

              <FormField label="Lampiran">
                <TextInput
                  value={form.attachment}
                  onChange={(value) => handleFieldChange("attachment", value)}
                  placeholder="Masukkan keterangan lampiran"
                />
              </FormField>

              <FormField label="Perihal" required>
                <TextInput
                  value={form.subject}
                  onChange={(value) => handleFieldChange("subject", value)}
                  placeholder="Masukkan perihal surat"
                  required
                />
              </FormField>

              <FormField label="Tanggal Pembuatan" required>
                <input
                  type="date"
                  value={form.letterDate}
                  onChange={(e) => handleFieldChange("letterDate", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </FormField>

              <FormField label="Tujuan Surat" required>
                <TextInput
                  value={form.destination}
                  onChange={(value) => handleFieldChange("destination", value)}
                  placeholder="Masukkan tujuan surat"
                  required
                />
              </FormField>

              <FormField label="Tembusan">
                <TextInput
                  value={form.carbonCopy}
                  onChange={(value) => handleFieldChange("carbonCopy", value)}
                  placeholder="Masukkan tembusan (pisahkan dengan koma jika lebih dari satu)"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Penandatangan">
            <div className="space-y-5">
              <FormField label="Penandatangan 1" required>
                <Select
                  value={form.signer1Id || undefined}
                  onChange={(value) => handleFieldChange("signer1Id", value)}
                  options={userOptions}
                  placeholder="Pilih penandatangan 1"
                  className="w-full"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </FormField>

              <FormField label="Penandatangan 2 (Opsional)">
                <Select
                  value={form.signer2Id || undefined}
                  onChange={(value) => handleFieldChange("signer2Id", value || null)}
                  options={userOptions}
                  placeholder="Pilih penandatangan 2"
                  className="w-full"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </FormField>

              <FormField label="Penandatangan 3 (Opsional)">
                <Select
                  value={form.signer3Id || undefined}
                  onChange={(value) => handleFieldChange("signer3Id", value || null)}
                  options={userOptions}
                  placeholder="Pilih penandatangan 3"
                  className="w-full"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                />
              </FormField>
            </div>
          </ComponentCard>

          <ComponentCard title="Dokumen">
            <div className="space-y-5">
              {existingDocument && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Dokumen saat ini:</p>
                  <p className="text-sm font-medium text-primary-600">
                    {existingDocument.split("/").pop()}
                  </p>
                </div>
              )}

              <FormField label="Upload Dokumen" required={!existingDocument}>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang diterima: .pdf, .docx (maksimal 1 file)
                </p>
              </FormField>

              {selectedFileName && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">
                    File dipilih: <strong>{selectedFileName}</strong>
                  </p>
                </div>
              )}
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
