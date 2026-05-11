"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Flex, Spin, DatePicker, Alert, Segmented, Select } from "antd";
import { LoadingOutlined, FileOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";
import type { DocxJsEditorHandle } from "@/components/custom/DocxJsEditor";

const DocxJsEditor = dynamic(() => import("@/components/custom/DocxJsEditor"), { ssr: false });

// Components
import DocumentViewer from "@/components/custom/DocumentViewer";
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
import { getActiveLetterTypes, getLetterType, generatePreview } from "@/utils/services/letterType.service";
import { getUsers, User } from "@/utils/services/user.service";
import { LetterFormData } from "@/types/models/letter";
import { LetterType } from "@/types/models/letterType";
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

type CreationMode = "upload" | "template";

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function LetterForm({ mode, letterId }: LetterFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { notify } = useNotify();

  const [form, setForm] = useState<LetterFormData>(INITIAL_FORM_STATE);
  const [letterDate, setLetterDate] = useState<Dayjs | null>(null);
  const [userOptions, setUserOptions] = useState<Option[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<DocxJsEditorHandle | null>(null);

  // Template mode state — persisted in URL param so navigation away & back restores it
  const urlMode = searchParams.get("m") as CreationMode | null;
  const defaultMode: CreationMode = mode === "create"
    ? (urlMode === "upload" ? "upload" : "template")
    : "upload";
  const [creationMode, setCreationMode] = useState<CreationMode>(defaultMode);
  const [letterTypeOptions, setLetterTypeOptions] = useState<Option[]>([]);
  const [activeLetterTypes, setActiveLetterTypes] = useState<LetterType[]>([]);
  const [selectedLetterType, setSelectedLetterType] = useState<LetterType | null>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, string>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDocxEditor, setShowDocxEditor] = useState(false);

  // ==============================================
  // SUBMIT HOOK (upload mode)
  // ==============================================
  const { submit, loading: submitLoading } = useFormSubmit(
    (fd) => {
      const url = mode === "edit" ? `${API_LETTERS}/${letterId}` : API_LETTERS;
      const method = mode === "edit" ? "PATCH" : "POST";
      return fetchWithAuth(url, { method, body: fd });
    },
    () => {
      const message = mode === "edit" ? "Surat berhasil diperbarui!" : "Surat berhasil dibuat!";
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

        const [users, activeTypes] = await Promise.all([
          getUsers(),
          getActiveLetterTypes(),
        ]);

        setUserOptions(
          users.map((u: User) => ({
            value: u.userId,
            label: u.staffName ? `${u.staffName} (${u.username})` : u.username,
          }))
        );

        setActiveLetterTypes(activeTypes);
        setLetterTypeOptions(
          activeTypes.map((lt) => ({
            value: lt.id,
            label: `${lt.jenisSurat} (${lt.kodeSurat1}${lt.kodeSurat2 ? "-" + lt.kodeSurat2 : ""})`,
          }))
        );

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


          setDocumentUrl(letter.documentUrl || null);

          if (letter.revisionNote) {
            setRevisionNote(letter.revisionNote);
          }

          // If this was a template letter, switch to template mode
          if (letter.letterTypeId) {
            setCreationMode("template");
            if (letter.templateFieldData) {
              setTemplateFieldValues(letter.templateFieldData as Record<string, string>);
            }
            // Find the letter type (active list first, then direct fetch for inactive)
            const found = activeTypes.find((lt) => lt.id === letter.letterTypeId);
            if (found) {
              setSelectedLetterType(found);
            } else {
              try {
                const lt = await getLetterType(letter.letterTypeId!);
                setSelectedLetterType(lt);
              } catch { /* type was deleted, stay with null */ }
            }
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

  // Cleanup preview object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof LetterFormData>(field: K, value: LetterFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDateChange = useCallback((date: Dayjs | null) => {
    setLetterDate(date);
    handleFieldChange("letterDate", date ? date.format("YYYY-MM-DD") : null);
  }, [handleFieldChange]);

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
    },
    [notify]
  );

  const handleRemoveFile = useCallback(() => {
    setDocumentFile(null);
  }, []);

  const handleLetterTypeChange = useCallback(
    async (value: number) => {
      const found = activeLetterTypes.find((lt) => lt.id === value) || null;
      setSelectedLetterType(found);
      setTemplateFieldValues({});
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
        setPreviewUrl(null);
      }
      if (found) {
        if (found.perihal) handleFieldChange("subject", found.perihal);
        handleFieldChange("letterType", found.jenisSurat);
      }
    },
    [activeLetterTypes, handleFieldChange]
  );

  const handleGeneratePreview = useCallback(async () => {
    if (!selectedLetterType) return;
    if (!form.letterDate) {
      notify("warning", "Pilih tanggal surat terlebih dahulu!");
      return;
    }
    setPreviewLoading(true);
    try {
      const blob = await generatePreview(
        selectedLetterType.id,
        templateFieldValues,
        form.letterDate
      );
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      setShowDocxEditor(false);
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedLetterType, templateFieldValues, form.letterDate, notify]);

  const handleModeChange = useCallback((val: string | number) => {
    const next = val as CreationMode;
    setCreationMode(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("m", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });

    setSelectedLetterType(null);
    setTemplateFieldValues({});
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
    setShowDocxEditor(false);
    setDocumentFile(null);
    setForm(INITIAL_FORM_STATE);
    setLetterDate(null);
  }, [pathname, searchParams, router]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || submitLoading) return;
    if (!form.letterDate) return notify("warning", "Tanggal pembuatan wajib diisi!");
    if (!form.signer1Id) return notify("warning", "Penandatangan 1 wajib diisi!");

    if (creationMode === "template") {
      setIsSubmitting(true);
      try {
        if (mode === "create") {
          // ── CREATE TEMPLATE PATH ──────────────────────────────────────────────
          if (!selectedLetterType) return notify("warning", "Pilih Template Surat terlebih dahulu!");

          const missingRequired = selectedLetterType.templateFields
            .filter((f) => f.required && !templateFieldValues[f.key]?.trim())
            .map((f) => f.label);
          if (missingRequired.length > 0) {
            return notify("warning", `Field wajib belum diisi: ${missingRequired.join(", ")}`);
          }

          const fd = new FormData();
          fd.append("letterTypeId", String(selectedLetterType.id));
          fd.append("templateFieldData", JSON.stringify(templateFieldValues));
          fd.append("letterDate", form.letterDate!);
          fd.append("signer1Id", String(form.signer1Id));
          if (form.signer2Id) fd.append("signer2Id", String(form.signer2Id));
          if (form.signer3Id) fd.append("signer3Id", String(form.signer3Id));
          if (editorRef.current) {
            const buf = await editorRef.current.save();
            if (buf) {
              const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
              fd.append("document", new File([blob], "document.docx", { type: blob.type }));
            }
          }

          const res = await fetchWithAuth(API_LETTERS, { method: "POST", body: fd });
          let result;
          try { result = await res.json(); } catch { result = {}; }
          if (!res.ok) {
            notifyFromResult(notify, { error: new Error(result.message || "Gagal membuat surat") });
            return;
          }
          notifyFromResult(notify, { successMessage: "Surat berhasil dibuat dari template!" });
          router.push("/letters/drafts");
        } else {
          // ── EDIT TEMPLATE PATH ───────────────────────────────────────────────
          const fd = new FormData();
          fd.append("letterDate", form.letterDate!);
          fd.append("templateFieldData", JSON.stringify(templateFieldValues));
          fd.append("signer1Id", String(form.signer1Id));
          if (form.signer2Id) fd.append("signer2Id", String(form.signer2Id));
          if (form.signer3Id) fd.append("signer3Id", String(form.signer3Id));
          if (editorRef.current) {
            const buf = await editorRef.current.save();
            if (buf) {
              const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
              fd.append("document", new File([blob], "document.docx", { type: blob.type }));
            }
          }

          const res = await fetchWithAuth(`${API_LETTERS}/${letterId}`, { method: "PATCH", body: fd });
          let result;
          try { result = await res.json(); } catch { result = {}; }
          if (!res.ok) {
            notifyFromResult(notify, { error: new Error(result.message || "Gagal memperbarui surat") });
            return;
          }
          notifyFromResult(notify, { successMessage: "Surat berhasil diperbarui!" });
          router.push("/letters/drafts");
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── UPLOAD MODE ────────────────────────────────────────────────────────────
    if (!form.letterType) return notify("warning", "Jenis surat wajib diisi!");
    if (!form.subject) return notify("warning", "Perihal wajib diisi!");
    if (!form.destination) return notify("warning", "Tujuan surat wajib diisi!");

    const extraData = new FormData();
    if (documentFile) {
      extraData.append("document", documentFile);
    } else if (mode === "edit" && editorRef.current) {
      const buf = await editorRef.current.save();
      if (buf) {
        const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        extraData.append("document", new File([blob], "document.docx", { type: blob.type }));
      }
    }

    const { success, error } = await submit(form, extraData);
    if (!success) {
      notifyFromResult(notify, { error });
    }
  }, [isSubmitting, submitLoading, form, documentFile, creationMode, mode, letterId, selectedLetterType, templateFieldValues, submit, notify, router]);

  const handleGoBack = useCallback(() => {
    router.push("/letters/drafts");
  }, [router]);

  // ==============================================
  // COMPUTED
  // ==============================================
  const predictedLetterNumber = selectedLetterType
    ? (() => {
        const kode = [selectedLetterType.kodeSurat1, selectedLetterType.kodeSurat2].filter(Boolean).join("-");
        return [
          String(selectedLetterType.currentCounter + 1).padStart(3, "0"),
          kode,
          letterDate ? ROMAN_MONTHS[letterDate.month()] : "…",
          letterDate ? String(letterDate.year()) : "…",
        ].filter(Boolean).join("/");
      })()
    : null;



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
            title="Catatan Revisi"
            description={revisionNote}
            type="warning"
            showIcon
          />
        </div>
      )}

      {/* MODE SELECTOR — only in create mode */}
      {mode === "create" && (
        <div className="mb-6 flex justify-center">
          <Segmented
            size="large"
            value={creationMode}
            onChange={handleModeChange}
            options={[
              { label: "Gunakan Template", value: "template" },
              { label: "Upload Dokumen Sendiri", value: "upload" },
            ]}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {creationMode === "template" ? (
            /* ── TEMPLATE MODE ─── */
            <>
              {/* Template type selector (create only) */}
              {mode === "create" && (
                <ComponentCard title="Pilih Template Surat">
                  <div className="space-y-4">
                    <FormField label="Template Surat" required>
                      <Select
                        size="large"
                        style={{ width: "100%" }}
                        placeholder="Pilih Template Surat..."
                        options={letterTypeOptions}
                        value={selectedLetterType?.id ?? null}
                        onChange={handleLetterTypeChange}
                        showSearch={{
                          filterOption: (input: string, opt: any) =>
                            String(opt?.label ?? "").toLowerCase().includes(input.toLowerCase()),
                        }}
                        allowClear
                        onClear={() => {
                          setSelectedLetterType(null);
                          setTemplateFieldValues({});
                                            }}
                      />
                    </FormField>

                    {selectedLetterType && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-500 mb-1">Nomor surat (prediksi)</p>
                        <p className="font-mono font-semibold text-blue-700">{predictedLetterNumber}</p>
                        <p className="text-xs text-gray-400 mt-1">Nomor final dikonfirmasi saat surat disimpan</p>
                      </div>
                    )}
                  </div>
                </ComponentCard>
              )}

              {/* Template info (edit only) */}
              {mode === "edit" && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/40">
                  {selectedLetterType ? (
                    <>
                      <p className="text-xs text-blue-500 font-medium mb-0.5">Template Surat</p>
                      <p className="font-semibold text-blue-700 dark:text-blue-300">
                        {selectedLetterType.jenisSurat}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedLetterType.kodeSurat1}
                        {selectedLetterType.kodeSurat2 ? "-" + selectedLetterType.kodeSurat2 : ""}
                        {form.letterNumber ? ` · ${form.letterNumber}` : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Template asli tidak tersedia. Anda masih dapat mengedit dokumen secara langsung.
                    </p>
                  )}
                </div>
              )}

              {/* Data template fields (shown when type is selected in create, or always in edit) */}
              {(selectedLetterType !== null || mode === "edit") && (
                <ComponentCard title="Isi Data Template">
                  <div className="space-y-4">
                    {/* Tanggal surat — always shown, maps to {tanggal} placeholder */}
                    <FormField label="Tanggal Surat" required>
                      <DatePicker
                        size="large"
                        style={{ width: "100%" }}
                        value={letterDate}
                        onChange={handleDateChange}
                        placeholder="Pilih tanggal surat"
                        format="DD/MM/YYYY"
                      />
                    </FormField>
                    <p className="text-xs text-gray-400 -mt-2">
                      Digunakan untuk <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{tanggal}"}</code> dan
                      bulan/tahun pada nomor surat.
                    </p>

                    {/* Dynamic template fields */}
                    {selectedLetterType?.templateFields.map((field) => (
                      <FormField key={field.key} label={field.label} required={field.required}>
                        <TextInput
                          value={templateFieldValues[field.key] || ""}
                          onChange={(v) =>
                            setTemplateFieldValues((prev) => ({ ...prev, [field.key]: v }))
                          }
                          placeholder={`Masukkan ${field.label.toLowerCase()}`}
                          required={field.required}
                        />
                      </FormField>
                    ))}

                    {/* Generate / re-generate preview button */}
                    {selectedLetterType && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGeneratePreview}
                        disabled={!form.letterDate || previewLoading}
                        className="w-full"
                      >
                        {previewLoading ? (
                          <span className="flex items-center gap-2 justify-center">
                            <Spin indicator={<LoadingOutlined spin />} size="small" />
                            Membuat pratinjau...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 justify-center">
                            <EyeOutlined />
                            {mode === "edit" ? "Re-generate Pratinjau" : "Pratinjau Dokumen"}
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </ComponentCard>
              )}
            </>
          ) : (
            /* ── UPLOAD MODE ─── */
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
                    onChange={handleDateChange}
                    placeholder="Pilih tanggal"
                    format="DD/MM/YYYY"
                  />
                </FormField>

                <FormField label="Tujuan Surat" required>
                  <TextArea
                    size="large"
                    rows={2}
                    value={form.destination}
                    onChange={(e) => handleFieldChange("destination", e.target.value)}
                    placeholder="Masukkan tujuan surat"
                  />
                </FormField>

                <FormField label="Tembusan">
                  <TextArea
                    size="large"
                    rows={2}
                    value={form.carbonCopy}
                    onChange={(e) => handleFieldChange("carbonCopy", e.target.value)}
                    placeholder="Masukkan tembusan (opsional)"
                  />
                </FormField>
              </div>
            </ComponentCard>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Edit mode: show DocxJS editor */}
          {mode === "edit" && letterId && documentUrl && (
            <ComponentCard title="Edit Dokumen">
              <DocxJsEditor ref={editorRef} url={documentUrl} height="600px" />
            </ComponentCard>
          )}

          {/* Create + Upload mode: file upload */}
          {mode === "create" && creationMode === "upload" && (
            <ComponentCard title="Dokumen">
              <div className="space-y-5">
                <FormField label="Unggah Dokumen (.pdf / .docx)">
                  {documentFile ? (
                    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg mt-2">
                      <FileOutlined className="text-xl text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{documentFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-600">
                        <DeleteOutlined />
                      </button>
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
          )}

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
                disabled={isSubmitting || submitLoading || previewLoading}
                className="bg-primary-600 text-white min-w-[150px]"
              >
                {isSubmitting || submitLoading ? "Menyimpan..." : submitButtonText}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>

      {/* PREVIEW / EDITOR SECTION — shown below form when previewUrl is available */}
      {creationMode === "template" && previewUrl && (
        <div className="mt-6">
          <ComponentCard title={showDocxEditor ? "Edit Dokumen" : "Pratinjau Dokumen"}>
            <div className="flex items-center gap-3 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDocxEditor((v) => !v)}
              >
                {showDocxEditor ? (
                  <span className="flex items-center gap-2"><EyeOutlined /> Pratinjau</span>
                ) : (
                  <span className="flex items-center gap-2"><EditOutlined /> Edit Dokumen</span>
                )}
              </Button>
              <a
                href={previewUrl}
                download="dokumen-template.docx"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                <DownloadOutlined />
                Unduh .docx
              </a>
            </div>
            {showDocxEditor ? (
              <DocxJsEditor ref={editorRef} url={previewUrl} height="600px" />
            ) : (
              <DocumentViewer url={previewUrl} fileName="dokumen-template.docx" />
            )}
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
