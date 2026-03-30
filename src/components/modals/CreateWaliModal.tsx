"use client";

import { useState } from "react";
import { Modal, message } from "antd";
import { createWali } from "@/utils/services/wali.service";
import FileInput from "@/components/form/input/FileInput";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";
import TextArea from "antd/es/input/TextArea";

interface CreateWaliModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (waliId: number, waliName: string) => void;
}

export default function CreateWaliModal({
  visible,
  onCancel,
  onSuccess,
}: CreateWaliModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    waliName: "",
    nik: "",
    waliJob: "",
    relation: "",
    waliAddress: "",
    waliPhone: "",
    addressCoordinate: "",
  });

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 1 * 5120 * 5120;

    if (!allowedTypes.includes(file.type)) {
      message.error("Format tidak valid. Hanya JPG, PNG, atau WEBP.");
      return false;
    }

    if (file.size > maxSize) {
      message.error("Ukuran file maksimal 1MB.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!form.waliName) {
      message.error("Nama wali wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      message.loading({ content: "Membuat data wali...", key: "create", duration: 0 });

      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, String(value));
        }
      });

      if (photoFile) {
        fd.append("photo", photoFile);
      }

      const res = await createWali(fd);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal membuat data wali");
      }

      const result = await res.json();
      message.success({ content: "Data wali berhasil dibuat!", key: "create", duration: 2 });

      setForm({
        waliName: "",
        nik: "",
        waliJob: "",
        relation: "",
        waliAddress: "",
        waliPhone: "",
        addressCoordinate: "",
      });
      setPhotoFile(null);
      onSuccess(result.data.id, result.data.waliName);
    } catch (error: any) {
      console.error(error);
      message.error({
        content: error.message || "Gagal membuat data wali.",
        key: "create",
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Buat Wali Baru"
      open={visible}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnClose={false}
      footer={
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="outline">
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-primary-600 text-white">
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      }
      width={600}
    >
      <div className="space-y-4">
        <FormField label="Nama Wali" required>
          <TextInput
            value={form.waliName}
            onChange={(value) => setForm({ ...form, waliName: value })}
            placeholder="Masukkan nama wali"
          />
        </FormField>
        <FormField label="NIK">
          <TextInput
            value={form.nik}
            onChange={(value) => setForm({ ...form, nik: value })}
            placeholder="Masukkan NIK wali"
          />
        </FormField>
        <FormField label="Pekerjaan Wali">
          <TextInput
            value={form.waliJob}
            onChange={(value) => setForm({ ...form, waliJob: value })}
            placeholder="Masukkan pekerjaan wali"
          />
        </FormField>
        <FormField label="Hubungan">
          <TextInput
            value={form.relation}
            onChange={(value) => setForm({ ...form, relation: value })}
            placeholder="Masukkan hubungan"
          />
        </FormField>
        <FormField label="Alamat Wali">
          <TextArea
            rows={3}
            value={form.waliAddress}
            onChange={(e) => setForm({ ...form, waliAddress: e.target.value })}
            placeholder="Masukkan alamat wali"
          />
        </FormField>
        <FormField label="No. Telepon Wali">
          <TextInput
            value={form.waliPhone}
            onChange={(value) => setForm({ ...form, waliPhone: value })}
            placeholder="Masukkan nomor telepon wali"
          />
        </FormField>
        <FormField label="Koordinat Alamat">
          <TextInput
            value={form.addressCoordinate}
            onChange={(value) => setForm({ ...form, addressCoordinate: value })}
            placeholder="Masukkan koordinat alamat"
          />
        </FormField>
        <FormField label="Foto Wali">
          <FileInput
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && validateFile(file)) {
                setPhotoFile(file);
              }
            }}
          />
        </FormField>
      </div>
    </Modal>
  );
}