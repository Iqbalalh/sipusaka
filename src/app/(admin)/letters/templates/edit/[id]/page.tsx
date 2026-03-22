"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Flex, Spin, Badge, Alert } from "antd";
import { LoadingOutlined, CheckCircleOutlined } from "@ant-design/icons";
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
import {
  getLetterTemplateById,
  updateLetterTemplate,
  validateTemplateFile,
  fixTemplateFile,
  TemplateValidationResult,
} from "@/utils/services/letter-template.service";
import { LETTER_TYPE_OPTIONS } from "@/modules/letters/letters.constants";

// Types
import { LetterType } from "@/utils/services/letter.service";
import { LetterTemplate } from "@/utils/services/letter-template.service";

// ==============================================
// FORM STATE INTERFACE
// ==============================================
interface TemplateFormState {
  letterType: LetterType | "";
  templateName: string;
  file: File | null;
  isActive: boolean;
}

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: TemplateFormState = {
  letterType: "",
  templateName: "",
  file: null,
  isActive: true,
};

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: TemplateFormState,
  originalTemplate: LetterTemplate | null
): { isValid: boolean; error?: string } => {
  if (!form.templateName.trim()) {
    return { isValid: false, error: "Nama template wajib diisi!" };
  }
  // File is optional for update - only validate if a new file is selected
  if (form.file && !form.file.name.endsWith(".docx")) {
    return { isValid: false, error: "File harus berformat .docx!" };
  }
  return { isValid: true };
};

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = Number(params.id);
  const { notify } = useNotify();

  const [form, setForm] = useState<TemplateFormState>(INITIAL_FORM_STATE);
  const [originalTemplate, setOriginalTemplate] = useState<LetterTemplate | null>(null);
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null);
  const [existingVariables, setExistingVariables] = useState<string[]>([]);
  const [extractingVariables, setExtractingVariables] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fixingTemplate, setFixingTemplate] = useState(false);

  // ==============================================
  // FETCH TEMPLATE DATA
  // ==============================================
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const template = await getLetterTemplateById(templateId);
        setOriginalTemplate(template);
        setForm({
          letterType: template.letterType,
          templateName: template.templateName,
          file: null,
          isActive: template.isActive,
        });
        // Set existing variables from the template
        if (template.variables && Array.isArray(template.variables)) {
          setExistingVariables(template.variables);
        }
      } catch (error) {
        notify("error", "Gagal memuat data template");
        router.push("/letters/templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, notify, router]);

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
          } else if (result.issues.splitTagIssues.length > 0 || result.issues.brokenPatterns.length > 0) {
            notify("warning", "Template memiliki masalah format variabel");
          } else if (result.variables.length === 0) {
            notify("info", "Tidak ada variabel template ditemukan dalam file");
          }
        } catch (error) {
          notify("error", "Gagal memvalidasi file template");
        } finally {
          setExtractingVariables(false);
        }
      }
    },
    [notify]
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form, originalTemplate);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    setSubmitLoading(true);
    try {
      await updateLetterTemplate(templateId, {
        templateName: form.templateName,
        templateFile: form.file || undefined,
        isActive: form.isActive,
      });

      notify("success", "Template berhasil diperbarui!");
      router.push("/letters/templates");
    } catch (error: any) {
      notifyFromResult(notify, { error });
    } finally {
      setSubmitLoading(false);
    }
  }, [form, originalTemplate, templateId, notify, router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleFixTemplate = useCallback(async () => {
    if (!form.file) {
      notify("warning", "Tidak ada file template untuk diperbaiki. Upload file baru terlebih dahulu.");
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
      notify("error", error.title || "Gagal memperbaiki template");
    } finally {
      setFixingTemplate(false);
    }
  }, [form.file, notify]);

  // ==============================================
  // LOADING STATE
  // ==============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} />
        <span className="ml-2 text-gray-500">Memuat data template...</span>
      </div>
    );
  }

  // ==============================================
  // PAGE TITLE
  // ==============================================
  const pageTitle = "Edit Template Surat";

  // ==============================================
  // CURRENT VARIABLES TO DISPLAY
  // ==============================================
  const currentVariables = validationResult?.variables && validationResult.variables.length > 0 
    ? validationResult.variables 
    : existingVariables;

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
              <FormField label="Jenis Surat">
                <SelectInput
                  value={form.letterType}
                  onChange={() => {}} // Disabled - cannot change letter type
                  options={LETTER_TYPE_OPTIONS}
                  placeholder="Jenis surat"
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">
                  Jenis surat tidak dapat diubah
                </p>
              </FormField>

              <FormField label="Nama Template" required>
                <TextInput
                  value={form.templateName}
                  onChange={(value) => handleFieldChange("templateName", value)}
                  placeholder="Masukkan nama template"
                  required
                />
              </FormField>

              <FormField label="File Template Baru (.docx)">
                <div className="space-y-3">
                  <FileInput
                    accept=".docx"
                    onChange={handleFileChange}
                  />
                  {form.file ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaFileWord className="text-blue-500" />
                      <span>{form.file.name}</span>
                      <span className="text-gray-400">
                        ({(form.file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  ) : originalTemplate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaFileWord className="text-gray-400" />
                      <span>File template saat ini tersimpan</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Kosongkan jika tidak ingin mengubah file template
                  </p>
                </div>
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Variabel Template">
            <div className="space-y-4">
              {/* Warning for broken template variables */}
              {validationResult && !validationResult.isValid && (
                <div className="space-y-4">
                  <Alert
                    title="Variabel Tidak Terdeteksi"
                    description={
                      <div className="space-y-2">
                        {validationResult.issues.splitTagIssues.length > 0 && (
                          <div>
                            <p className="font-semibold">Variabel rusak terdeteksi:</p>
                            <ul className="list-disc list-inside text-sm">
                              {validationResult.issues.splitTagIssues.map((issue, i) => (
                                <li key={i}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {validationResult.recommendations.length > 0 && (
                          <div>
                            <p className="font-semibold">Rekomendasi:</p>
                            <ul className="list-disc list-inside text-sm">
                              {validationResult.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    }
                    type="warning"
                    showIcon
                    icon={<FaExclamationTriangle />}
                  />
                  {/* Fix Template Button */}
                  {validationResult.issues.splitTagIssues.length > 0 && form.file && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm font-semibold text-orange-700 mb-2">
                        Perbaikan Otomatis Tersedia:
                      </p>
                      <p className="text-xs text-orange-600 mb-3">
                        Sistem dapat memperbaiki variabel yang terpecah secara otomatis.
                      </p>
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
                  )}
                </div>
              )}

              {/* Success indicator for valid template */}
              {validationResult?.isValid && validationResult.variables.length > 0 && (
                <Alert
                  title="Template Valid"
                  description={`Ditemukan ${validationResult.variables.length} variabel yang dapat digunakan.`}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              )}

              {extractingVariables ? (
                <Flex align="center" justify="center" className="min-h-[100px]">
                  <Spin indicator={<LoadingOutlined spin />} />
                  <span className="ml-2 text-gray-500">
                    Mengekstrak variabel...
                  </span>
                </Flex>
              ) : currentVariables.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {validationResult?.variables && validationResult.variables.length > 0 
                      ? "Variabel dari file baru:" 
                      : "Variabel dalam template:"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentVariables.map((variable, index) => (
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
                  <p className="text-xs text-gray-400 mt-4">
                    Variabel ini akan diganti dengan data surat saat membuat
                    draf surat baru.
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <p>Tidak ada variabel template yang tersimpan.</p>
                  <p className="mt-2">
                    Upload file .docx baru untuk menambahkan variabel.
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
                {submitLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </ComponentCard>

          <ComponentCard title="Panduan Template">
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <p className="font-semibold">Cara membuat template:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2 mt-2">
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

              {/* Troubleshooting Tips */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaLightbulb className="text-amber-500" />
                  <p className="font-semibold text-amber-700">
                    Tips Menghindari Error:
                  </p>
                </div>
                <ul className="text-xs text-amber-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>
                      <strong>JANGAN</strong> copy-paste variabel dari sumber lain
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>
                      <strong>KETIK</strong> variabel secara manual di Microsoft Word
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>
                      Gunakan format <code className="bg-amber-100 px-1 rounded">{"{nama_variabel}"}</code> tanpa spasi
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>
                      Simpan file sebagai <strong>.docx</strong> (bukan .doc atau .rtf)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <FaExclamationTriangle className="text-red-500" />
                  <p className="font-semibold text-red-700">
                    Jika Variabel Tidak Terdeteksi:
                  </p>
                </div>
                <ol className="text-xs text-red-700 space-y-2 list-decimal list-inside">
                  <li>Buka file template di Microsoft Word</li>
                  <li>Hapus variabel yang bermasalah</li>
                  <li>Ketik ulang variabel secara manual (jangan copy-paste!)</li>
                  <li>Simpan file dan upload ulang</li>
                </ol>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
