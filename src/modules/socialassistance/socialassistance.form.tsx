"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Button, Spin } from "antd";
import { LoadingOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { 
  SocialAssistance, 
  SocialAssistanceFormData, 
  MedicalEquipmentItem,
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
  const [medicalEquipment, setMedicalEquipment] = useState<MedicalEquipmentItem[]>([]);
  const [cashAmount, setCashAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // Calculate total
  const equipmentTotal = medicalEquipment.reduce((sum, item) => sum + (item.quantity * item.nominal), 0);
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
          setMedicalEquipment(data.medicalEquipment || []);
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
  // MEDICAL EQUIPMENT HANDLERS
  // ==========================
  const addMedicalEquipment = () => {
    setMedicalEquipment([
      ...medicalEquipment,
      { type: "kursi roda", quantity: 1, nominal: 0 }
    ]);
  };

  const removeMedicalEquipment = (index: number) => {
    setMedicalEquipment(medicalEquipment.filter((_, i) => i !== index));
  };

  const updateMedicalEquipment = (index: number, field: keyof MedicalEquipmentItem, value: string | number) => {
    const updated = [...medicalEquipment];
    if (field === "type") {
      updated[index].type = value as string;
    } else if (field === "quantity") {
      updated[index].quantity = Number(value);
    } else if (field === "nominal") {
      updated[index].nominal = Number(value);
    }
    setMedicalEquipment(updated);
  };

  // ==========================
  // FORM SUBMIT
  // ==========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData: SocialAssistanceFormData = {
        nipNipp: nipNipp || null,
        recipientName: recipientName || null,
        ktpAddress: ktpAddress || null,
        region: region || null,
        condition: condition || null,
        medicalEquipment: medicalEquipment.length > 0 ? medicalEquipment : null,
        cashAmount: cashAmount,
        totalAmount: totalAmount,
        notes: notes || null,
      };

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
        <div className="space-y-3">
          {medicalEquipment.map((item, index) => (
            <div key={index} className="flex flex-wrap gap-3 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* Type */}
              <div className="w-full sm:w-48">
                <label className="block text-xs text-gray-500 mb-1">Jenis</label>
                <Select
                  value={item.type}
                  onChange={(value) => updateMedicalEquipment(index, "type", value)}
                  className="w-full"
                >
                  {MEDICAL_EQUIPMENT_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Quantity */}
              <div className="w-24">
                <label className="block text-xs text-gray-500 mb-1">Jumlah</label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateMedicalEquipment(index, "quantity", e.target.value)}
                />
              </div>

              {/* Nominal */}
              <div className="w-40">
                <label className="block text-xs text-gray-500 mb-1">Nominal (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  value={item.nominal}
                  onChange={(e) => updateMedicalEquipment(index, "nominal", e.target.value)}
                />
              </div>

              {/* Subtotal */}
              <div className="w-40">
                <label className="block text-xs text-gray-500 mb-1">Subtotal</label>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1.5">
                  Rp {(item.quantity * item.nominal).toLocaleString("id-ID")}
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex items-end">
                <Button
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeMedicalEquipment(index)}
                />
              </div>
            </div>
          ))}

          {/* Add Button */}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addMedicalEquipment}
            className="w-full"
          >
            Tambah Alat Kesehatan
          </Button>
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
