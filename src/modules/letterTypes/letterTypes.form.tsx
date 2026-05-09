"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Switch, Upload, InputNumber, Spin, Button as AntButton } from "antd";
import {
  LoadingOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileWordOutlined,
  LockOutlined,
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

interface LetterTypesFormProps {
  mode: "create" | "edit";
  letterTypeId?: string;
}

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
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [existingTemplateName, setExistingTemplateName] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenisSurat.trim() || !form.kodeSurat1.trim()) {
      notifyFromResult(notify, { error: new Error("Jenis Surat dan Kode Surat I wajib diisi") });
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
      fd.append("currentCounter", String(form.currentCounter));
      fd.append("templateFields", JSON.stringify(templateFields));
      if (templateFile) fd.append("template", templateFile);

      let res;
      if (mode === "create") {
        res = await createLetterType(fd);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || "Gagal menyimpan tipe surat");
        }
        notifyFromResult(notify, { successMessage: "Tipe surat berhasil dibuat!" });
      } else {
        res = await updateLetterType(letterTypeId!, fd);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || "Gagal menyimpan tipe surat");
        }
        if (form.currentCounter !== originalCounter) {
          await updateLetterTypeCounter(letterTypeId!, form.currentCounter);
        }
        notifyFromResult(notify, { successMessage: "Tipe surat berhasil diperbarui!" });
      }

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
        pageTitle={mode === "create" ? "Tambah Tipe Surat" : "Edit Tipe Surat"}
      />
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* INFORMASI DASAR */}
          <ComponentCard title="Informasi Tipe Surat">
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
              <FormField
                label={mode === "create" ? "Mulai Dari Nomor" : "Counter Saat Ini"}
                required={mode === "create"}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  value={form.currentCounter}
                  onChange={(v) => setField("currentCounter", v ?? 0)}
                  min={0}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {mode === "create"
                    ? `Surat pertama akan mendapat nomor #${String(form.currentCounter + 1).padStart(3, "0")} — isi 0 untuk mulai dari 001`
                    : `Surat berikutnya akan mendapat nomor #${String(form.currentCounter + 1).padStart(3, "0")}`}
                </p>
              </FormField>
            </div>
          </ComponentCard>

          {/* TEMPLATE FIELDS */}
          <ComponentCard title="Field Template Surat">
            <p className="text-sm text-gray-500 mb-4">
              Tentukan variabel yang akan diisi saat membuat surat. Gunakan nama field (case-sensitive)
              di template .docx dengan kurung kurawal tunggal, contoh:{" "}
              <code className="bg-gray-100 px-1 rounded text-blue-700">{"{namaField}"}</code>
            </p>

            {/* System fields — always present, non-removable */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Field Sistem (otomatis)</p>
              {[
                { key: "nomorSurat", label: "Nomor Surat", desc: "Diisi otomatis — nomor urut/kode/bulan/tahun" },
                { key: "tanggalSurat", label: "Tanggal Surat", desc: "Diisi otomatis — dari tanggal yang dipilih saat buat surat" },
                { key: "tanggal", label: "Tanggal (alias)", desc: "Alias dari tanggalSurat, tersedia di semua template" },
              ].map((sf) => (
                <div
                  key={sf.key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-700/40"
                >
                  <LockOutlined className="text-amber-500 shrink-0" />
                  <code className="text-sm font-mono text-amber-700 dark:text-amber-400 min-w-[120px]">
                    {`{${sf.key}}`}
                  </code>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{sf.label}</p>
                    <p className="text-xs text-gray-400">{sf.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Field Kustom (diisi pengguna)</p>
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

          {/* UPLOAD TEMPLATE */}
          <ComponentCard title="Template Dokumen (.docx)">
            <p className="text-sm text-gray-500 mb-4">
              Upload file .docx yang berisi template surat. Gunakan{" "}
              <code className="bg-gray-100 px-1 rounded text-blue-700">{"{namaField}"}</code>{" "}
              (kurung kurawal tunggal) sebagai variabel.{" "}
              <code className="bg-green-50 px-1 rounded text-green-700">{"{nomorSurat}"}</code> dan{" "}
              <code className="bg-green-50 px-1 rounded text-green-700">{"{tanggalSurat}"}</code>{" "}
              akan diisi otomatis.
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
                "Buat Tipe Surat"
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
