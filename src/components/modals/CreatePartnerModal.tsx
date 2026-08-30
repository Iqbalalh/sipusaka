"use client";

import { useState } from "react";
import { Modal, message } from "antd";
import { Option } from "@/types/generic/select-option";
import { createPartner } from "@/utils/services/partner.service";
import FileInput from "@/components/form/input/FileInput";
import { compressImage } from "@/utils/image/compressImage";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";
import TextArea from "antd/es/input/TextArea";

interface CreatePartnerModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (partnerId: number, partnerName: string) => void;
  regions: Option[];
}

export default function CreatePartnerModal({
  visible,
  onCancel,
  onSuccess,
  regions,
}: CreatePartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    partnerName: "",
    partnerNik: "",
    partnerJob: "",
    address: "",
    phoneNumber: "",
    phoneNumberAlt: "",
    regionId: null as number | null,
    subdistrictName: "",
    postalCode: "",
    homeCoordinate: "",
    isActive: true,
    isAlive: true,
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
    if (!form.partnerName) {
      message.error("Nama pasangan wajib diisi!");
      return;
    }
    if (!form.regionId) {
      message.error("Wilayah wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      message.loading({ content: "Membuat data pasangan...", key: "create", duration: 0 });

      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          fd.append(key, String(value));
        }
      });

      if (photoFile) {
        fd.append("photo", await compressImage(photoFile));
      }

      const res = await createPartner(fd);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal membuat data pasangan");
      }

      const result = await res.json();
      message.success({ content: "Data pasangan berhasil dibuat!", key: "create", duration: 2 });

      setForm({
        partnerName: "",
        partnerNik: "",
        partnerJob: "",
        address: "",
        phoneNumber: "",
        phoneNumberAlt: "",
        regionId: null,
        subdistrictName: "",
        postalCode: "",
        homeCoordinate: "",
        isActive: true,
        isAlive: true,
      });
      setPhotoFile(null);
      onSuccess(result.data.id, result.data.partnerName);
    } catch (error: any) {
      console.error(error);
      message.error({
        content: error.message || "Gagal membuat data pasangan.",
        key: "create",
        duration: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Buat Pasangan Baru"
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
        <FormField label="Nama Pasangan" required>
          <TextInput
            value={form.partnerName}
            onChange={(value) => setForm({ ...form, partnerName: value })}
            placeholder="Masukkan nama pasangan"
          />
        </FormField>
        <FormField label="NIK">
          <TextInput
            value={form.partnerNik}
            onChange={(value) => setForm({ ...form, partnerNik: value })}
            placeholder="Masukkan NIK"
          />
        </FormField>
        <FormField label="Pekerjaan">
          <TextInput
            value={form.partnerJob}
            onChange={(value) => setForm({ ...form, partnerJob: value })}
            placeholder="Masukkan pekerjaan"
          />
        </FormField>
        <FormField label="Alamat">
          <TextArea
            rows={4}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Masukkan alamat lengkap"
          />
        </FormField>
        <FormField label="Nomor Telepon">
          <TextInput
            value={form.phoneNumber}
            onChange={(value) => setForm({ ...form, phoneNumber: value })}
            placeholder="Masukkan nomor telepon"
          />
        </FormField>
        <FormField label="Nomor Telepon Alternatif">
          <TextInput
            value={form.phoneNumberAlt}
            onChange={(value) => setForm({ ...form, phoneNumberAlt: value })}
            placeholder="Masukkan nomor telepon alternatif"
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
        <FormField label="Kecamatan">
          <TextInput
            value={form.subdistrictName}
            onChange={(value) => setForm({ ...form, subdistrictName: value })}
            placeholder="Masukkan nama kecamatan"
          />
        </FormField>
        <FormField label="Kode Pos">
          <TextInput
            value={form.postalCode}
            onChange={(value) => setForm({ ...form, postalCode: value })}
            placeholder="Masukkan kode pos"
          />
        </FormField>
        <FormField label="Koordinat Rumah">
          <TextInput
            value={form.homeCoordinate}
            onChange={(value) => setForm({ ...form, homeCoordinate: value })}
            placeholder="Masukkan koordinat rumah"
          />
        </FormField>
        <FormField label="Status Aktif" required>
          <SelectInput
            value={form.isActive}
            onChange={(value) => setForm({ ...form, isActive: value })}
            options={[
              { value: true, label: "Aktif" },
              { value: false, label: "Tidak Aktif" },
            ]}
            placeholder="Pilih status aktif"
          />
        </FormField>
        <FormField label="Status Hidup" required>
          <SelectInput
            value={form.isAlive}
            onChange={(value) => setForm({ ...form, isAlive: value })}
            options={[
              { value: true, label: "Hidup" },
              { value: false, label: "Meninggal" },
            ]}
            placeholder="Pilih status hidup"
          />
        </FormField>
        <FormField label="Foto Pasangan">
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