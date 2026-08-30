"use client";

import { useState } from "react";
import { Modal, message } from "antd";
import { Option } from "@/types/generic/select-option";
import { GENDER_OPTIONS, PLH_OPTIONS } from "@/constants/option";
import { createEmployee } from "@/utils/services/employee.service";
import FileInput from "@/components/form/input/FileInput";
import { compressImage } from "@/utils/image/compressImage";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";
import TextArea from "antd/es/input/TextArea";

interface CreateEmployeeModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (employeeId: number, employeeName: string) => void;
  regions: Option[];
}

export default function CreateEmployeeModal({
  visible,
  onCancel,
  onSuccess,
  regions,
}: CreateEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    nipNipp: "",
    employeeName: "",
    isAccident: false,
    lastPosition: "",
    regionId: null as number | null,
    employeeGender: "M",
    notes: "",
  });

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      message.error("Format tidak valid. Hanya JPG, PNG, atau WEBP.");
      return false;
    }

    if (file.size > maxSize) {
      message.error("Ukuran file maksimal 20MB.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!form.nipNipp) {
      message.error("NIP/NIPP wajib diisi!");
      return;
    }
    if (!form.employeeName) {
      message.error("Nama pegawai wajib diisi!");
      return;
    }
    if (!form.regionId) {
      message.error("Wilayah wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      message.loading({ content: "Membuat data pegawai...", key: "create", duration: 0 });

      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, String(value));
        }
      });

      if (photoFile) {
        fd.append("photo", await compressImage(photoFile));
      }

      const res = await createEmployee(fd);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal membuat data pegawai");
      }

      const result = await res.json();
      message.success({ content: "Data pegawai berhasil dibuat!", key: "create", duration: 2 });

      setForm({
        nipNipp: "",
        employeeName: "",
        isAccident: false,
        lastPosition: "",
        regionId: null,
        employeeGender: "M",
        notes: "",
      });
      setPhotoFile(null);
      onSuccess(result.data.id, result.data.employeeName);
    } catch (error: any) {
      console.error(error);
      message.error({
        content: error.message || "Gagal membuat data pegawai.",
        key: "create",
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Buat Pegawai Baru"
      open={visible}
      onCancel={onCancel}
      maskClosable={false}
      destroyOnHidden={false}
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
        <FormField label="NIP / NIPP" required>
          <TextInput
            value={form.nipNipp}
            onChange={(value) => setForm({ ...form, nipNipp: value })}
            placeholder="Masukkan NIP / NIPP"
          />
        </FormField>
        <FormField label="Nama Pegawai" required>
          <TextInput
            value={form.employeeName}
            onChange={(value) => setForm({ ...form, employeeName: value })}
            placeholder="Masukkan nama pegawai"
          />
        </FormField>
        <FormField label="PLH / Non-PLH" required>
          <SelectInput
            value={form.isAccident}
            onChange={(value) => setForm({ ...form, isAccident: value })}
            options={PLH_OPTIONS}
            placeholder="Pilih status PLH"
          />
        </FormField>
        <FormField label="Posisi Terakhir">
          <TextInput
            value={form.lastPosition}
            onChange={(value) => setForm({ ...form, lastPosition: value })}
            placeholder="Masukkan posisi terakhir"
          />
        </FormField>
        <FormField label="Wilayah" required>
          <SelectInput
            value={form.regionId}
            onChange={(value) => setForm({ ...form, regionId: value })}
            options={regions}
            placeholder="Pilih wilayah"
          />
        </FormField>
        <FormField label="Jenis Kelamin" required>
          <SelectInput
            value={form.employeeGender}
            onChange={(value) => setForm({ ...form, employeeGender: value })}
            options={GENDER_OPTIONS}
            placeholder="Pilih jenis kelamin"
          />
        </FormField>
        <FormField label="Catatan">
          <TextArea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Tambahkan catatan (opsional)"
          />
        </FormField>
        <FormField label="Foto Pegawai">
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