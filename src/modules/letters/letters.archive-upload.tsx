"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "antd";
import { FileOutlined, DeleteOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import dayjs, { Dayjs } from "dayjs";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";

import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { createArchiveLetter } from "@/utils/services/letter.service";

interface ArchiveForm {
  letterType: string;
  letterNumber: string;
  subject: string;
  letterDate: string | null;
  destination: string;
  carbonCopy: string;
  attachment: string;
  notes: string;
}

const INITIAL: ArchiveForm = {
  letterType: "",
  letterNumber: "",
  subject: "",
  letterDate: null,
  destination: "",
  carbonCopy: "",
  attachment: "",
  notes: "",
};

export default function ArchiveUpload() {
  const router = useRouter();
  const { notify } = useNotify();
  const [form, setForm] = useState<ArchiveForm>(INITIAL);
  const [letterDate, setLetterDate] = useState<Dayjs | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleChange = (field: keyof ArchiveForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.letterType || !form.subject || !form.destination || !letterDate) {
      notify("error", "Jenis surat, perihal, tujuan, dan tanggal wajib diisi.");
      return;
    }
    if (!documentFile) {
      notify("error", "Dokumen wajib diunggah.");
      return;
    }

    setSubmitLoading(true);
    try {
      const fd = new FormData();
      fd.append("letterType", form.letterType);
      fd.append("subject", form.subject);
      fd.append("destination", form.destination);
      fd.append("letterDate", letterDate.format("YYYY-MM-DD"));
      if (form.letterNumber) fd.append("letterNumber", form.letterNumber);
      if (form.attachment) fd.append("attachment", form.attachment);
      if (form.carbonCopy) fd.append("carbonCopy", form.carbonCopy);
      if (form.notes) fd.append("notes", form.notes);
      fd.append("document", documentFile);

      const res = await createArchiveLetter(fd);
      if (res?.ok || res?.status === 201) {
        notifyFromResult(notify, { successMessage: "Arsip surat berhasil diunggah!" });
        router.push("/letters/archives");
      } else {
        const json = typeof res?.json === "function" ? await res.json() : res;
        notify("error", json?.message || "Gagal mengunggah arsip surat.");
      }
    } catch (err: any) {
      notify("error", err?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <PageBreadcrumb pageTitle="Upload Arsip Surat" />
      <ComponentCard title="Upload Arsip Surat">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <FormField label="Jenis Surat *">
            <TextInput
              value={form.letterType}
              onChange={(v) => handleChange("letterType", v)}
              placeholder="Contoh: Surat Keputusan, Surat Keterangan"
            />
          </FormField>

          <FormField label="Nomor Surat">
            <TextInput
              value={form.letterNumber}
              onChange={(v) => handleChange("letterNumber", v)}
              placeholder="Nomor surat (opsional)"
            />
          </FormField>

          <FormField label="Perihal *">
            <TextInput
              value={form.subject}
              onChange={(v) => handleChange("subject", v)}
              placeholder="Perihal surat"
            />
          </FormField>

          <FormField label="Tanggal Surat *">
            <DatePicker
              value={letterDate}
              onChange={(date) => {
                setLetterDate(date);
                setForm((prev) => ({
                  ...prev,
                  letterDate: date ? date.format("YYYY-MM-DD") : null,
                }));
              }}
              format="DD/MM/YYYY"
              className="w-full h-11"
              placeholder="Pilih tanggal"
            />
          </FormField>

          <FormField label="Tujuan *">
            <TextInput
              value={form.destination}
              onChange={(v) => handleChange("destination", v)}
              placeholder="Tujuan surat"
            />
          </FormField>

          <FormField label="Lampiran">
            <TextInput
              value={form.attachment}
              onChange={(v) => handleChange("attachment", v)}
              placeholder="Lampiran (opsional)"
            />
          </FormField>

          <div className="lg:col-span-2">
            <FormField label="Tembusan">
              <TextArea
                value={form.carbonCopy}
                onChange={(e) => handleChange("carbonCopy", e.target.value)}
                placeholder="Tembusan (opsional)"
                rows={2}
              />
            </FormField>
          </div>

          <div className="lg:col-span-2">
            <FormField label="Keterangan">
              <TextArea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Keterangan tambahan (opsional)"
                rows={3}
              />
            </FormField>
          </div>

          <div className="lg:col-span-2">
          <FormField label="Dokumen *">
            {documentFile ? (
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg dark:border-gray-700">
                <FileOutlined className="text-blue-500 text-xl" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {documentFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setDocumentFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <DeleteOutlined />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors dark:border-gray-600 dark:hover:border-blue-400">
                <div className="text-center">
                  <FileOutlined className="text-2xl text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">Klik untuk memilih dokumen (PDF, DOCX, DOC)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDocumentFile(file);
                  }}
                />
              </label>
            )}
          </FormField>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={submitLoading}
            className="min-w-[140px]"
          >
            {submitLoading ? "Mengunggah..." : "Upload Arsip"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/letters/archives")}
          >
            Batal
          </Button>
        </div>
      </ComponentCard>
    </>
  );
}
