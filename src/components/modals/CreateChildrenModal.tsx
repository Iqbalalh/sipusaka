"use client";

import { useState } from "react";
import { Modal, message } from "antd";
import { BaseChildren } from "@/types/models/children";
import { GENDER_OPTIONS } from "@/constants/option";
import { createChildren } from "@/utils/services/children.service";
import FileInput from "@/components/form/input/FileInput";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";
import TextArea from "antd/es/input/TextArea";
import { DatePicker } from "antd";
import dayjs from "dayjs";

interface CreateChildrenModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (childrenId: number, childrenName: string) => void;
}

export default function CreateChildrenModal({
  visible,
  onCancel,
  onSuccess,
}: CreateChildrenModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState<BaseChildren>({
    id: undefined,
    childrenName: "",
    index: null,
    childrenGender: "M",
    childrenBirthdate: null,
    childrenAddress: "",
    childrenPhone: "",
    isFatherAlive: true,
    isMotherAlive: true,
    isCondition: true,
    isActive: true,
    notes: "",
  });

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 1 * 1024 * 1024;

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
    if (!form.childrenName) {
      message.error("Nama anak wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      message.loading({ content: "Membuat data anak...", key: "create", duration: 0 });

      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "childrenPictFile") return;
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, String(value));
        }
      });

      if (photoFile) {
        fd.append("photo", photoFile);
      }

      const res = await createChildren(fd);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal membuat data anak");
      }

      const result = await res.json();
      message.success({ content: "Data anak berhasil dibuat!", key: "create", duration: 2 });

      setForm({
        id: undefined,
        childrenName: "",
        index: null,
        childrenGender: "M",
        childrenBirthdate: null,
        childrenAddress: "",
        childrenPhone: "",
        isFatherAlive: true,
        isMotherAlive: true,
        isCondition: true,
        isActive: true,
        notes: "",
      });
      setPhotoFile(null);
      onSuccess(result.data.id, result.data.childrenName);
    } catch (error: any) {
      console.error(error);
      message.error({
        content: error.message || "Gagal membuat data anak.",
        key: "create",
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Buat Anak Baru"
      open={visible}
      onCancel={onCancel}
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
        <FormField label="Nama Anak" required>
          <TextInput
            value={form.childrenName}
            onChange={(value) => setForm({ ...form, childrenName: value })}
            placeholder="Masukkan nama anak"
          />
        </FormField>
        <FormField label="Anak-ke">
          <TextInput
            type="number"
            value={form.index?.toString() ?? ""}
            onChange={(value) =>
              setForm({ ...form, index: value ? parseInt(value, 10) : null })
            }
            placeholder="Masukkan urutan anak"
          />
        </FormField>
        <FormField label="Gender">
          <SelectInput
            value={form.childrenGender}
            onChange={(value) => setForm({ ...form, childrenGender: value })}
            options={GENDER_OPTIONS}
            placeholder="Pilih jenis kelamin"
          />
        </FormField>
        <FormField label="Tanggal Lahir">
          <DatePicker
            size="large"
            className="w-full"
            value={form.childrenBirthdate ? dayjs(form.childrenBirthdate) : null}
            onChange={(date) =>
              setForm({ ...form, childrenBirthdate: date ? date.format("YYYY-MM-DD") : null })
            }
          />
        </FormField>
        <FormField label="Alamat Anak">
          <TextInput
            value={form.childrenAddress ?? ""}
            onChange={(value) => setForm({ ...form, childrenAddress: value })}
            placeholder="Masukkan alamat anak"
          />
        </FormField>
        <FormField label="No. HP Anak">
          <TextInput
            value={form.childrenPhone ?? ""}
            onChange={(value) => setForm({ ...form, childrenPhone: value })}
            placeholder="Masukkan nomor HP anak"
          />
        </FormField>
        <FormField label="Status Aktif">
          <SelectInput
            value={form.isActive}
            onChange={(value) => setForm({ ...form, isActive: value })}
            options={[
              { value: true, label: "Ya" },
              { value: false, label: "Tidak" },
            ]}
            placeholder="Pilih status aktif"
          />
        </FormField>
        <FormField label="Yatim">
          <SelectInput
            value={form.isFatherAlive}
            onChange={(value) => setForm({ ...form, isFatherAlive: value })}
            options={[
              { value: true, label: "Tidak" },
              { value: false, label: "Ya" },
            ]}
            placeholder="Pilih status yatim"
          />
        </FormField>
        <FormField label="Piatu">
          <SelectInput
            value={form.isMotherAlive}
            onChange={(value) => setForm({ ...form, isMotherAlive: value })}
            options={[
              { value: true, label: "Tidak" },
              { value: false, label: "Ya" },
            ]}
            placeholder="Pilih status piatu"
          />
        </FormField>
        <FormField label="Kondisi Khusus">
          <SelectInput
            value={form.isCondition}
            onChange={(value) => setForm({ ...form, isCondition: value })}
            options={[
              { value: true, label: "Normal" },
              { value: false, label: "ABK" },
            ]}
            placeholder="Pilih kondisi khusus"
          />
        </FormField>
        <FormField label="Catatan">
          <TextArea
            rows={2}
            value={form.notes ?? ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Tambahkan catatan (opsional)"
          />
        </FormField>
        <FormField label="Foto Anak">
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