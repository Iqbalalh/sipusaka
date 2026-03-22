"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, Badge, Alert } from "antd";
import { LoadingOutlined, WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { FaFileWord, FaExclamationTriangle, FaLightbulb, FaWrench } from "react-icons/fa";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";
import { SelectInput } from "@/components/custom/SelectInput";
import FileInput from "@/components/form/input/FileInput";

// Hooks & Utils
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_LETTER_TEMPLATES } from "@/constants/endpoint";
import { LETTER_TYPE_OPTIONS } from "@/modules/letters/letters.constants";
import {
  validateTemplateFile,
  createLetterTemplate,
  fixTemplateFile,
  TemplateValidationResult,
} from "@/utils/services/letter-template.service";

// Types
import { LetterType } from "@/utils/services/letter.service";

// ==============================================
// FORM STATE INTERFACE
// ==============================================
interface TemplateFormState {
  letterType: LetterType | "";
  templateName: string;
  file: File | null;
}

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: TemplateFormState = {
  letterType: "",
  templateName: "",
  file: null,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: TemplateFormState
): { isValid: boolean; error?: string } => {
  if (!form.letterType) {
    return { isValid: false, error: "Jenis surat wajib dipilih!" };
  }
  if (!form.templateName.trim()) {
    return { isValid: false, error: "Nama template wajib diisi!" };
  }
  if (!form.file) {
    return { isValid: false, error: "File template wajib diupload!" };
  }
  if (!form.file.name.endsWith(".docx")) {
    return { isValid: false, error: "File harus berformat .docx!" };
  }
  return { isValid: true };
};

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function CreateTemplatePage() {
  const router = useRouter();
  const { notify } = useNotify();

  const [form, setForm] = useState<TemplateFormState>(INITIAL_FORM_STATE);
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null);
  const [extractingVariables, setExtractingVariables] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fixingTemplate, setFixingTemplate] = useState(false);

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof TemplateFormState>(
      field: K,
      value: TemplateFormState[K]
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setForm((prev) => ({ ...prev, file }));
        setValidationResult(null);

        // Validate the template file
        setExtractingVariables(true);
        try {
          const result = await validateTemplateFile(file);
          setValidationResult(result);
          
          if (result.isValid && result.variables.length > 0) {
            notify("success", `Ditemukan ${result.variables.length} variabel template`);
          } else if (result.issues.brokenPatterns.length > 0 || result.issues.splitTagIssues.length > 0) {
            notify("warning", "Template memiliki masalah format variabel");
          } else {
            notify("info", "Tidak ada variabel template ditemukan dalam file");
          }
        } catch (error) {
          notify("error", "Gagal memvalidasi template");
        } finally {
          setExtractingVariables(false);
        }
      }
    },
    [notify]
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    setSubmitLoading(true);
    try {
      await createLetterTemplate({
        letterType: form.letterType as LetterType,
        templateName: form.templateName,
        templateFile: form.file!,
      });

      notify("success", "Template berhasil ditambahkan!");
      router.push("/letters/templates");
    } catch (error: any) {
      notifyFromResult(notify, { error });
    } finally {
      setSubmitLoading(false);
    }
  }, [form, notify, router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleFixTemplate = useCallback(async () => {
    if (!form.file) {
      notify("warning", "Tidak ada file template untuk diperbaiki");
      return;
    }

    setFixingTemplate(true);
    try {
      const fixedBlob = await fixTemplateFile(form.file);
      
      // Create a download link for the fixed template
      const url = window.URL.createObjectURL(fixedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixed_${form.file.name}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notify("success", "Template berhasil diperbaiki! File yang sudah diperbaiki telah diunduh.");
      notify("info", "Silakan upload file yang sudah diperbaiki untuk menggunakannya.");
    } catch (error: any) {
      notify("error", error.message || "Gagal memperbaiki template");
    } finally {
      setFixingTemplate(false);
    }
  }, [form.file, notify]);

  // ==============================================
  // PAGE TITLE
  // ==============================================
  const pageTitle = "Upload Template Surat";

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data Template">
            <div className="space-y-5">
              <FormField label="Jenis Surat" required>
                <SelectInput
                  value={form.letterType}
                  onChange={(value) => handleFieldChange("letterType", value)}
                  options={LETTER_TYPE_OPTIONS}
                  placeholder="Pilih jenis surat"
                />
              </FormField>

              <FormField label="Nama Template" required>
                <TextInput
                  value={form.templateName}
                  onChange={(value) => handleFieldChange("templateName", value)}
                  placeholder="Masukkan nama template"
                  required
                />
              </FormField>

              <FormField label="File Template (.docx)" required>
                <div className="space-y-3">
                  <FileInput
                    accept=".docx"
                    onChange={handleFileChange}
                  />
                  {form.file && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaFileWord className="text-blue-500" />
                      <span>{form.file.name}</span>
                      <span className="text-gray-400">
                        ({(form.file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  )}
                </div>
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Variabel Template">
            <div className="space-y-4">
              {extractingVariables ? (
                <Flex align="center" justify="center" className="min-h-[100px]">
                  <Spin indicator={<LoadingOutlined spin />} />
                  <span className="ml-2 text-gray-500">
                    Memvalidasi template...
                  </span>
                </Flex>
              ) : validationResult ? (
                <div className="space-y-4">
                  {/* Validation Status */}
                  {validationResult.isValid && validationResult.variables.length > 0 ? (
                    <Alert
                      title="Template Valid"
                      description={`${validationResult.variables.length} variabel berhasil dideteksi. Template siap digunakan.`}
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                    />
                  ) : validationResult.issues.brokenPatterns.length > 0 || validationResult.issues.splitTagIssues.length > 0 ? (
                    <Alert
                      title="Template Memiliki Masalah"
                      description="Variabel dalam template tidak terdeteksi dengan benar. Lihat detail di bawah untuk informasi lebih lanjut."
                      type="warning"
                      showIcon
                      icon={<FaExclamationTriangle />}
                    />
                  ) : (
                    <Alert
                      title="Tidak Ada Variabel"
                      description="Tidak ada variabel template yang ditemukan dalam file. Template dapat digunakan namun tidak akan ada data yang diganti."
                      type="info"
                      showIcon
                    />
                  )}

                  {/* Detected Variables */}
                  {validationResult.variables.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">
                        Variabel yang ditemukan:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.variables.map((variable, index) => (
                          <Badge
                            key={index}
                            count={`{${variable}}`}
                            style={{
                              backgroundColor: "#e6f7ff",
                              color: "#1890ff",
                              border: "1px solid #91d5ff",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Variabel ini akan diganti dengan data surat saat membuat draf surat baru.
                      </p>
                    </div>
                  )}

                  {/* Issues - Broken Patterns */}
                  {validationResult.issues.brokenPatterns.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-700 mb-2">
                        Pola Variabel Rusak Terdeteksi:
                      </p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {validationResult.issues.brokenPatterns.map((pattern, index) => (
                          <li key={index} className="font-mono">{pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Issues - Split Tags */}
                  {validationResult.issues.splitTagIssues.length > 0 && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-semibold text-orange-700 mb-2">
                        Variabel Terpecah (Split XML):
                      </p>
                      <ul className="text-xs text-orange-600 space-y-1">
                        {validationResult.issues.splitTagIssues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <Button
                          onClick={handleFixTemplate}
                          disabled={fixingTemplate}
                          className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
                        >
                          {fixingTemplate ? (
                            <Flex align="center" gap={8}>
                              <Spin indicator={<LoadingOutlined spin style={{ fontSize: 14, color: "white" }} />} />
                              <span>Memperbaiki...</span>
                            </Flex>
                          ) : (
                            <Flex align="center" gap={8}>
                              <FaWrench />
                              <span>Perbaiki Template Otomatis</span>
                            </Flex>
                          )}
                        </Button>
                        <p className="text-xs text-orange-600 mt-2">
                          Klik tombol di atas untuk mengunduh versi template yang sudah diperbaiki.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {validationResult.recommendations.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-700 mb-2">
                        Rekomendasi Perbaikan:
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
                        {validationResult.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>
                    Upload file .docx untuk melihat variabel template yang
                    tersedia.
                  </p>
                  <p className="mt-2">
                    Variabel dalam file Word harus menggunakan format{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      {"{nama_variabel}"}
                    </code>
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
              <Button onClick={handleGoBack}>Batal</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitLoading || extractingVariables}
                className="bg-primary-600 text-white min-w-[150px]"
              >
                {submitLoading ? "Menyimpan..." : "Upload Template"}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Panduan Template">
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold mb-2">Cara membuat template:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Buat dokumen Word (.docx) dengan format surat yang diinginkan</li>
                  <li>
                    Gunakan variabel dengan format{" "}
                    <code className="bg-gray-100 px-1 rounded">{"{nama_variabel}"}</code>{" "}
                    untuk data yang akan diganti
                  </li>
                  <li>Upload file template melalui form ini</li>
                  <li>
                    Saat membuat surat baru, pilih jenis surat dan template akan
                    dimuat otomatis
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-700 mb-2">
                  Contoh variabel yang tersedia:
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>
                    <code>{"{nomor_surat}"}</code> - Nomor surat
                  </li>
                  <li>
                    <code>{"{tanggal_surat}"}</code> - Tanggal surat
                  </li>
                  <li>
                    <code>{"{nama_penerima}"}</code> - Nama penerima
                  </li>
                  <li>
                    <code>{"{alamat_penerima}"}</code> - Alamat penerima
                  </li>
                  <li>
                    <code>{"{nama_pengirim}"}</code> - Nama pengirim
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <FaLightbulb className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-700 mb-2">
                      Tips Penting - Menghindari Error Template:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-2">
                      <li>
                        <strong>Ketik variabel secara manual</strong> - Jangan copy-paste variabel dari sumber lain. 
                        Ketik langsung di Microsoft Word menggunakan keyboard.
                      </li>
                      <li>
                        <strong>Hindari format berlebihan</strong> - Jangan berikan format khusus (bold, italic, warna) 
                        pada sebagian bagian variabel. Format harus konsisten untuk seluruh variabel.
                      </li>
                      <li>
                        <strong>Gunakan Microsoft Word</strong> - Template dibuat menggunakan Microsoft Word. 
                        Hindari Google Docs atau LibreOffice karena dapat menyebabkan perbedaan format XML.
                      </li>
                      <li>
                        <strong>Simpan sebagai .docx</strong> - Pastikan file disimpan dalam format 
                        Word Document (.docx), bukan format lain seperti .doc atau .rtf.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-700 mb-2">
                      Masalah Umum: Variabel Tidak Terdeteksi
                    </p>
                    <div className="text-xs text-red-700 space-y-2">
                      <p>
                        Jika template mengandung variabel namun tidak terdeteksi oleh sistem, 
                        kemungkinan penyebabnya:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Variabel di-copy paste dari tempat lain (menyebabkan XML terpecah)</li>
                        <li>Variabel memiliki format yang tidak konsisten</li>
                        <li>File dibuat dengan aplikasi non-Microsoft Word</li>
                      </ul>
                      <p className="mt-2 font-medium">
                        Solusi: Hapus variabel yang bermasalah, lalu ketik ulang secara manual di Microsoft Word.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
