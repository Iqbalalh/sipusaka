"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Switch, Upload, InputNumber, Spin, Button as AntButton, Segmented } from "antd";
import {
  LoadingOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileWordOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";

import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { getLetterType, createLetterType, updateLetterType, updateLetterTypeCounter } from "@/utils/services/letterType.service";
import { TemplateField } from "@/types/models/letterType";

const RichTextEditor = dynamic(
  () => import("@/components/custom/RichTextEditor"),
  { ssr: false, loading: () => <div className="h-96 border border-gray-200 rounded-lg animate-pulse bg-gray-50" /> }
);

interface LetterTypesFormProps {
  mode: "create" | "edit";
  letterTypeId?: string;
}

type TemplateSource = "upload" | "editor";

interface FormState {
  jenisSurat: string;
  perihal: string;
  kodeSurat1: string;
  kodeSurat2: string;
  isActive: boolean;
  currentCounter: number;
}

const INITIAL_FORM: FormState = {
  jenisSurat: "",
  perihal: "",
  kodeSurat1: "",
  kodeSurat2: "",
  isActive: true,
  currentCounter: 0,
};

export default function LetterTypesForm({ mode, letterTypeId }: LetterTypesFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [originalCounter, setOriginalCounter] = useState(0);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

  // Upload mode
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [existingTemplateName, setExistingTemplateName] = useState<string | null>(null);
  const [existingTemplateUrl, setExistingTemplateUrl] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Editor mode
  const [templateSource, setTemplateSource] = useState<TemplateSource>("upload");
  const [templateHtml, setTemplateHtml] = useState("");
  const [loadingHtml, setLoadingHtml] = useState(false);

  const [loading, setLoading] = useState(mode === "edit");
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (mode === "edit" && letterTypeId) {
      const fetchExisting = async () => {
        try {
          const lt = await getLetterType(letterTypeId);
          const counter = lt.currentCounter;
          setForm({
            jenisSurat: lt.jenisSurat,
            perihal: lt.perihal || "",
            kodeSurat1: lt.kodeSurat1,
            kodeSurat2: lt.kodeSurat2 || "",
            isActive: lt.isActive,
            currentCounter: counter,
          });
          setOriginalCounter(counter);
          setTemplateFields(Array.isArray(lt.templateFields) ? lt.templateFields : []);
          if (lt.templatePath) {
            const parts = lt.templatePath.split("/");
            setExistingTemplateName(parts[parts.length - 1]);
          }
          if (lt.templateUrl) {
            setExistingTemplateUrl(lt.templateUrl);
          }
        } catch (err) {
          notifyFromResult(notify, { error: err });
        } finally {
          setLoading(false);
        }
      };
      fetchExisting();
    }
  }, [mode, letterTypeId]);

  const setField = (key: keyof FormState, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addTemplateField = () =>
    setTemplateFields((prev) => [...prev, { key: "", label: "", required: false }]);

  const updateTemplateField = (index: number, field: Partial<TemplateField>) =>
    setTemplateFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...field } : f)));

  const removeTemplateField = (index: number) =>
    setTemplateFields((prev) => prev.filter((_, i) => i !== index));

  const handleLoadFromDocx = async () => {
    if (!existingTemplateUrl) return;
    setLoadingHtml(true);
    try {
      const response = await fetch(existingTemplateUrl);
      const arrayBuffer = await response.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setTemplateHtml(result.value);
      notifyFromResult(notify, { successMessage: "Template berhasil dimuat ke editor" });
    } catch (err) {
      notifyFromResult(notify, { error: new Error("Gagal memuat template dari file .docx") });
    } finally {
      setLoadingHtml(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenisSurat.trim() || !form.kodeSurat1.trim()) {
      notifyFromResult(notify, { error: new Error("Jenis Surat dan Kode Surat I wajib diisi") });
      return;
    }
    if (templateSource === "editor" && !templateHtml.trim()) {
      notifyFromResult(notify, { error: new Error("Konten editor tidak boleh kosong") });
      return;
    }

    setSubmitLoading(true);
    try {
      const fd = new FormData();
      fd.append("jenisSurat", form.jenisSurat);
      fd.append("perihal", form.perihal);
      fd.append("kodeSurat1", form.kodeSurat1);
      fd.append("kodeSurat2", form.kodeSurat2);
      fd.append("isActive", String(form.isActive));
      fd.append("templateFields", JSON.stringify(templateFields));

      if (templateSource === "upload" && templateFile) {
        fd.append("template", templateFile);
      } else if (templateSource === "editor" && templateHtml) {
        fd.append("templateHtml", templateHtml);
      }

      let res;
      if (mode === "create") {
        res = await createLetterType(fd);
      } else {
        res = await updateLetterType(letterTypeId!, fd);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || "Gagal menyimpan Template Surat");
        }
        if (form.currentCounter !== originalCounter) {
          await updateLetterTypeCounter(letterTypeId!, form.currentCounter);
        }
        notifyFromResult(notify, { successMessage: "Template Surat berhasil diperbarui!" });
        router.push("/letters/types");
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Gagal menyimpan Template Surat");
      }

      notifyFromResult(notify, { successMessage: "Template Surat berhasil dibuat!" });
      router.push("/letters/types");
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle={mode === "create" ? "Tambah Template Surat" : "Edit Template Surat"}
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* INFORMASI DASAR */}
          <ComponentCard title="Informasi Template Surat">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField label="Jenis Surat" required>
                  <TextInput
                    value={form.jenisSurat}
                    onChange={(v) => setField("jenisSurat", v)}
                    placeholder="Contoh: Surat Pengumuman"
                    required
                  />
                </FormField>
              </div>
              <div className="md:col-span-2">
                <FormField label="Perihal (default)">
                  <TextInput
                    value={form.perihal}
                    onChange={(v) => setField("perihal", v)}
                    placeholder="Perihal surat (akan otomatis diisi saat buat surat)"
                  />
                </FormField>
              </div>
              <FormField label="Kode Surat I" required>
                <TextInput
                  value={form.kodeSurat1}
                  onChange={(v) => setField("kodeSurat1", v.toUpperCase())}
                  placeholder="Contoh: PENG, SPK"
                  required
                />
              </FormField>
              <FormField label="Kode Surat II">
                <TextInput
                  value={form.kodeSurat2}
                  onChange={(v) => setField("kodeSurat2", v)}
                  placeholder="Contoh: Banpen, Bansos, UMKM"
                />
              </FormField>
              <FormField label="Status">
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={form.isActive}
                    onChange={(v) => setField("isActive", v)}
                  />
                  <span className="text-sm text-gray-600">
                    {form.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </FormField>
              {mode === "edit" && (
                <FormField label="Counter Saat Ini">
                  <InputNumber
                    size="large"
                    style={{ width: "100%" }}
                    value={form.currentCounter}
                    onChange={(v) => setField("currentCounter", v ?? 0)}
                    min={0}
                    addonBefore="#"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Surat berikutnya akan mendapat nomor #{form.currentCounter + 1}
                  </p>
                </FormField>
              )}
            </div>
          </ComponentCard>

          {/* TEMPLATE FIELDS */}
          <ComponentCard title="Field Template Surat">
            <p className="text-sm text-gray-500 mb-2">
              Tentukan variabel yang akan diisi saat membuat surat. Gunakan nama field (case-sensitive)
              di template dengan kurung kurawal tunggal.
            </p>
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-mono">
                {"{nomorSurat}"} — auto
              </span>
              <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-mono">
                {"{tanggalSurat}"} — auto
              </span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-mono">
                {"{namaField}"} — diisi pengguna
              </span>
            </div>

            <div className="space-y-3">
              {templateFields.map((field, index) => (
                <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Nama Field (key)">
                      <TextInput
                        value={field.key}
                        onChange={(v) => updateTemplateField(index, { key: v.replace(/\s+/g, "_") })}
                        placeholder="Contoh: penerima, pengirim"
                      />
                    </FormField>
                    <FormField label="Label Tampilan">
                      <TextInput
                        value={field.label}
                        onChange={(v) => updateTemplateField(index, { label: v })}
                        placeholder="Contoh: Nama Penerima"
                      />
                    </FormField>
                  </div>
                  <div className="flex flex-col items-center gap-2 pt-6">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Switch
                        size="small"
                        checked={!!field.required}
                        onChange={(v) => updateTemplateField(index, { required: v })}
                      />
                      <span>Wajib</span>
                    </div>
                    <AntButton
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTemplateField(index)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <AntButton
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addTemplateField}
              className="mt-4"
              block
            >
              Tambah Field Template
            </AntButton>
          </ComponentCard>

          {/* TEMPLATE DOKUMEN */}
          <ComponentCard title="Template Dokumen">
            <div className="flex justify-center mb-6">
              <Segmented
                value={templateSource}
                onChange={(v) => setTemplateSource(v as TemplateSource)}
                options={[
                  { label: "Upload .docx", value: "upload" },
                  { label: "Edit di Browser", value: "editor" },
                ]}
              />
            </div>

            {templateSource === "upload" ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Upload file .docx yang berisi template surat. Gunakan{" "}
                  <code className="bg-gray-100 px-1 rounded text-blue-700">{"{namaField}"}</code>{" "}
                  (kurung kurawal tunggal) sebagai variabel.{" "}
                  <code className="bg-green-50 px-1 rounded text-green-700">{"{nomorSurat}"}</code> dan{" "}
                  <code className="bg-green-50 px-1 rounded text-green-700">{"{tanggalSurat}"}</code>{" "}
                  diisi otomatis.
                </p>

                {existingTemplateName && !templateFile && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <FileWordOutlined className="text-blue-500 text-lg" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Template aktif</p>
                      <p className="text-xs text-blue-500 truncate max-w-xs">{existingTemplateName}</p>
                    </div>
                  </div>
                )}

                <Upload
                  accept=".docx"
                  maxCount={1}
                  fileList={fileList}
                  beforeUpload={(file) => {
                    if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                      notifyFromResult(notify, { error: new Error("Hanya file .docx yang diperbolehkan") });
                      return Upload.LIST_IGNORE;
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      notifyFromResult(notify, { error: new Error("Ukuran file maksimal 10MB") });
                      return Upload.LIST_IGNORE;
                    }
                    setTemplateFile(file);
                    setFileList([{ uid: file.uid, name: file.name, status: "done" }]);
                    return false;
                  }}
                  onRemove={() => {
                    setTemplateFile(null);
                    setFileList([]);
                  }}
                >
                  <AntButton icon={<UploadOutlined />}>
                    {existingTemplateName ? "Ganti Template" : "Upload Template .docx"}
                  </AntButton>
                </Upload>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Buat template langsung di browser. Ketik{" "}
                  <code className="bg-green-50 px-1 rounded text-green-700">{"{nomorSurat}"}</code>,{" "}
                  <code className="bg-green-50 px-1 rounded text-green-700">{"{tanggalSurat}"}</code>, dan{" "}
                  <code className="bg-blue-50 px-1 rounded text-blue-700">{"{namaField}"}</code>{" "}
                  sebagai variabel. Saat surat dibuat, variabel akan diganti otomatis.
                </p>

                {existingTemplateUrl && !templateHtml && (
                  <AntButton
                    icon={<EditOutlined />}
                    onClick={handleLoadFromDocx}
                    loading={loadingHtml}
                    className="mb-3"
                  >
                    Load dari template .docx yang ada
                  </AntButton>
                )}

                <RichTextEditor
                  value={templateHtml}
                  onChange={setTemplateHtml}
                  minHeight={450}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Konten ini akan dikonversi ke file .docx saat disimpan.
                </p>
              </>
            )}
          </ComponentCard>

          {/* ACTIONS */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/letters/types")}
              disabled={submitLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <span className="flex items-center gap-2">
                  <Spin indicator={<LoadingOutlined spin />} size="small" />
                  Menyimpan...
                </span>
              ) : mode === "create" ? (
                "Buat Template Surat"
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
