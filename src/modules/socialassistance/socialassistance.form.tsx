"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Button, Spin, Upload } from "antd";
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  SocialAssistance,
  SocialAssistanceFormData,
  createSocialAssistance,
  updateSocialAssistance,
  getSocialAssistanceById
} from "@/utils/services/socialassistance.service";
import { MEDICAL_EQUIPMENT_OPTIONS } from "./socialassistance.constants";

const { TextArea } = Input;
const { Option } = Select;

interface SocialAssistanceFormProps {
  id?: string | null;
}

export default function SocialAssistanceForm({ id }: SocialAssistanceFormProps) {
  const { notify } = useNotify();
  const router = useRouter();
  const isEditMode = !!id;

  // Form State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  // Form Fields
  const [nipNipp, setNipNipp] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [ktpAddress, setKtpAddress] = useState("");
  const [region, setRegion] = useState("");
  const [condition, setCondition] = useState("");
  const [medicalEquipment, setMedicalEquipment] = useState<string | null>(null);
  const [equipmentQuantity, setEquipmentQuantity] = useState<number | null>(null);
  const [equipmentNominal, setEquipmentNominal] = useState<number | null>(null);
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Calculate total
  const equipmentTotal = (equipmentQuantity || 0) * (equipmentNominal || 0);
  const totalAmount = equipmentTotal + (cashAmount || 0);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch existing data if in edit mode
        if (isEditMode && id) {
          const data = await getSocialAssistanceById(id);
          setNipNipp(data.nipNipp || "");
          setRecipientName(data.recipientName || "");
          setKtpAddress(data.ktpAddress || "");
          setRegion(data.region || "");
          setCondition(data.condition || "");
          setMedicalEquipment(data.medicalEquipment || null);
          setEquipmentQuantity(data.equipmentQuantity || null);
          setEquipmentNominal(data.equipmentNominal || null);
          setCashAmount(data.cashAmount || null);
          setNotes(data.notes || "");
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, notify]);

  // ==========================
  // FORM SUBMIT
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (nipNipp) formData.append("nipNipp", nipNipp);
      if (recipientName) formData.append("recipientName", recipientName);
      if (ktpAddress) formData.append("ktpAddress", ktpAddress);
      if (region) formData.append("region", region);
      if (condition) formData.append("condition", condition);
      if (medicalEquipment) formData.append("medicalEquipment", medicalEquipment);
      if (equipmentQuantity != null) formData.append("equipmentQuantity", String(equipmentQuantity));
      if (equipmentNominal != null) formData.append("equipmentNominal", String(equipmentNominal));
      if (cashAmount != null) formData.append("cashAmount", String(cashAmount));
      formData.append("totalAmount", String(totalAmount));
      if (notes) formData.append("notes", notes);

      // Append files
      fileList.forEach((file: UploadFile) => {
        if (file.originFileObj) {
          formData.append("documents", file.originFileObj);
        }
      });

      if (isEditMode && id) {
        await updateSocialAssistance(id, formData);
        notifyFromResult(notify, {
          successMessage: "Data bantuan sosial berhasil diperbarui",
        });
      } else {
        await createSocialAssistance(formData);
        notifyFromResult(notify, {
          successMessage: "Data bantuan sosial berhasil ditambahkan",
        });
      }

      router.push("/socialassistance");
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center gap-4 h-40 text-gray-500">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
        Memuat data...
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* NIP/NIPP */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          NIP/NIPP
        </label>
        <Input
          value={nipNipp}
          onChange={(e) => setNipNipp(e.target.value)}
          placeholder="Masukkan NIP/NIPP"
          className="w-full"
        />
      </div>

      {/* Recipient Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nama Penerima (Pensiunan/Istri)
        </label>
        <Input
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Masukkan nama penerima"
          className="w-full"
        />
      </div>

      {/* KTP Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alamat Sesuai KTP
        </label>
        <TextArea
          value={ktpAddress}
          onChange={(e) => setKtpAddress(e.target.value)}
          placeholder="Masukkan alamat sesuai KTP"
          rows={3}
          className="w-full"
        />
      </div>

      {/* Region */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Wilayah (PD)
        </label>
        <Input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Masukkan wilayah"
          className="w-full"
        />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Kondisi/Penyakit
        </label>
        <TextArea
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Masukkan kondisi/penyakit"
          rows={2}
          className="w-full"
        />
      </div>

      {/* Medical Equipment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alat Kesehatan
        </label>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jenis Alat</label>
            <Select
              value={medicalEquipment}
              onChange={(value) => setMedicalEquipment(value)}
              className="w-full"
              allowClear
              placeholder="Pilih jenis alat kesehatan"
            >
              {MEDICAL_EQUIPMENT_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          {/* Quantity and Nominal */}
          {medicalEquipment && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  value={equipmentQuantity || ""}
                  onChange={(e) => setEquipmentQuantity(e.target.value ? Number(e.target.value) : null)}
                  placeholder="1"
                />
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nominal (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  value={equipmentNominal || ""}
                  onChange={(e) => setEquipmentNominal(e.target.value ? Number(e.target.value) : null)}
                  placeholder="0"
                />
              </div>

              {/* Subtotal */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1.5">
                  Rp {equipmentTotal.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cash Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Uang (Rp)
        </label>
        <Input
          type="number"
          min={0}
          value={cashAmount || ""}
          onChange={(e) => setCashAmount(e.target.value ? Number(e.target.value) : null)}
          placeholder="Masukkan jumlah uang"
          className="w-full"
        />
      </div>

      {/* Total Amount (Calculated) */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total (Alat Kesehatan + Uang)
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Rp {totalAmount.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Alat Kesehatan: Rp {equipmentTotal.toLocaleString("id-ID")} + Uang: Rp {(cashAmount || 0).toLocaleString("id-ID")}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Keterangan
        </label>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Masukkan keterangan tambahan"
          rows={3}
          className="w-full"
        />
      </div>

      {/* Document Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dokumen Pendukung
        </label>
        <Upload
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={() => false}
          multiple
          maxCount={10}
        >
          <Button icon={<UploadOutlined />}>Upload Dokumen</Button>
        </Upload>
        <div className="text-xs text-gray-500 mt-1">
          Maksimal 10 file
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="default"
          onClick={() => router.push("/socialassistance")}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isEditMode ? "Perbarui" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
