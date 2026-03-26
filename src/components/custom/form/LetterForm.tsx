"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, DatePicker, Alert } from "antd";
import { LoadingOutlined, FileOutlined, DeleteOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";

// Hooks & Utils
import { useFormSubmit } from "@/hooks/useFormSubmit";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_LETTERS } from "@/constants/endpoint";
import { getLetter } from "@/utils/services/letter.service";
import { getUsers, User } from "@/utils/services/user.service";
import { LetterFormData } from "@/types/models/letter";
import { Option } from "@/types/generic/select-option";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: LetterFormData = {
  letterType: "",
  letterNumber: "",
  attachment: "",
  subject: "",
  letterDate: null,
  destination: "",
  carbonCopy: "",
  signer1Id: null,
  signer2Id: null,
  signer3Id: null,
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

  const [form, setForm] = useState<LetterFormData>(INITIAL_FORM_STATE);
  const [letterDate, setLetterDate] = useState<Dayjs | null>(null);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [existingDocName, setExistingDocName] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ==============================================
  // SUBMIT HOOK
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_LETTERS}/${letterId}` : API_LETTERS;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
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

        // Fetch users for signer options
        const users = await getUsers();
        setUserOptions(
          users.map((u: User) => ({
            value: u.userId,
            label: u.staffName ? `${u.staffName} (${u.username})` : u.username,
          }))
        );

        // Load existing letter data for edit mode
        if (mode === "edit" && letterId) {
          const letter = await getLetter(letterId);
          setForm({
            letterType: letter.letterType || "",
            letterNumber: letter.letterNumber || "",
            attachment: letter.attachment || "",
            subject: letter.subject || "",
            letterDate: letter.letterDate || null,
            destination: letter.destination || "",
            carbonCopy: letter.carbonCopy || "",
            signer1Id: letter.signer1Id || null,
            signer2Id: letter.signer2Id || null,
            signer3Id: letter.signer3Id || null,
          });
          if (letter.letterDate) {
            setLetterDate(dayjs(letter.letterDate));
          }
          if (letter.documentPath) {
            setExistingDocName(letter.documentPath.split("/").pop() || "Dokumen");
          }
          if (letter.revisionNote) {
            setRevisionNote(letter.revisionNote);
          }
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
      if (!file) return;

      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      if (!validTypes.includes(file.type)) {
        notify("warning", "Hanya file PDF atau DOCX yang diperbolehkan!");
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        notify("warning", "Ukuran file maksimal 25MB!");
        return;
      }

      setDocumentFile(file);
      setExistingDocName(null);
    },
    [notify]
  );

  const handleRemoveFile = useCallback(() => {
    setDocumentFile(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!form.letterType) return notify("warning", "Jenis surat wajib diisi!");
    if (!form.subject) return notify("warning", "Perihal wajib diisi!");
    if (!form.letterDate) return notify("warning", "Tanggal pembuatan wajib diisi!");
    if (!form.destination) return notify("warning", "Tujuan surat wajib diisi!");
    if (!form.signer1Id) return notify("warning", "Penandatangan 1 wajib diisi!");

    const extraData = new FormData();
    if (documentFile) {
      extraData.append("document", documentFile);
    }

    const { success, error } = await submit(form, extraData);
    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [form, documentFile, submit, notify]);

  const handleGoBack = useCallback(() => {
    router.push("/letters/drafts");
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

  const pageTitle = mode === "edit" ? "Edit Surat" : "Buat Surat Baru";
  const submitButtonText = mode === "edit" ? "Perbarui Surat" : "Simpan";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      {revisionNote && (
        <div className="mb-6">
          <Alert
            message="Catatan Revisi"
            description={revisionNote}
            type="warning"
            showIcon
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT COLUMN - Main Data */}
        <div className="space-y-6">
          <ComponentCard title="Data Surat">
            <div className="space-y-5">
              <FormField label="Jenis Surat" required>
                <TextInput
                  value={form.letterType}
                  onChange={(value) => handleFieldChange("letterType", value)}
                  placeholder="Contoh: Surat Keterangan, Surat Tugas"
                />
              </FormField>

              <FormField label="Nomor Surat">
                <TextInput
                  value={form.letterNumber}
                  onChange={(value) => handleFieldChange("letterNumber", value)}
                  placeholder="Masukkan nomor surat"
                />
              </FormField>

              <FormField label="Lampiran">
                <TextInput
                  value={form.attachment}
                  onChange={(value) => handleFieldChange("attachment", value)}
                  placeholder="Contoh: 1 (satu) berkas"
                />
              </FormField>

              <FormField label="Perihal" required>
                <TextArea
                  size="large"
                  rows={3}
                  value={form.subject}
                  onChange={(e) => handleFieldChange("subject", e.target.value)}
                  placeholder="Masukkan perihal surat"
                />
              </FormField>

              <FormField label="Tanggal Pembuatan" required>
                <DatePicker
                  size="large"
                  style={{ width: "100%" }}
                  value={letterDate}
                  onChange={(date) => {
                    setLetterDate(date);
                    handleFieldChange(
                      "letterDate",
                      date ? date.format("YYYY-MM-DD") : null
                    );
                  }}
                  placeholder="Pilih tanggal"
                  format="DD/MM/YYYY"
                />
              </FormField>

              <FormField label="Tujuan Surat" required>
                <TextArea
                  size="large"
                  rows={2}
                  value={form.destination}
                  onChange={(e) =>
                    handleFieldChange("destination", e.target.value)
                  }
                  placeholder="Masukkan tujuan surat"
                />
              </FormField>

              <FormField label="Tembusan">
                <TextArea
                  size="large"
                  rows={2}
                  value={form.carbonCopy}
                  onChange={(e) =>
                    handleFieldChange("carbonCopy", e.target.value)
                  }
                  placeholder="Masukkan tembusan (opsional)"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        {/* RIGHT COLUMN - Document & Signers */}
        <div className="space-y-6">
          <ComponentCard title="Dokumen">
            <div className="space-y-5">
              <FormField label="Unggah Dokumen (.pdf / .docx)">
                {documentFile ? (
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mt-2">
                    <FileOutlined className="text-xl text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {documentFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-600"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                ) : existingDocName ? (
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mt-2">
                    <FileOutlined className="text-xl text-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {existingDocName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Dokumen sudah diunggah
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
                  />
                </div>
              </FormField>
            </div>
          </ComponentCard>

          <ComponentCard title="Penandatangan">
            <div className="space-y-5">
              <FormField label="Penandatangan 1" required>
                <SelectInput
                  placeholder="Pilih penandatangan 1"
                  value={form.signer1Id}
                  onChange={(value) => handleFieldChange("signer1Id", value)}
                  options={userOptions}
                />
              </FormField>

              <FormField label="Penandatangan 2">
                <SelectInput
                  placeholder="Pilih penandatangan 2 (opsional)"
                  value={form.signer2Id}
                  onChange={(value) => handleFieldChange("signer2Id", value)}
                  options={userOptions}
                />
              </FormField>

              <FormField label="Penandatangan 3">
                <SelectInput
                  placeholder="Pilih penandatangan 3 (opsional)"
                  value={form.signer3Id}
                  onChange={(value) => handleFieldChange("signer3Id", value)}
                  options={userOptions}
                />
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
