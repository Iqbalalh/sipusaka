"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message, Switch, Select, DatePicker } from "antd";
import dayjs from "dayjs";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import FileInput from "@/components/form/input/FileInput";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";
import TextArea from "antd/es/input/TextArea";

// Hooks & Utils
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_HOME } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployees } from "@/utils/services/employee.service";
import { getPartners } from "@/utils/services/partner.service";
import { getWaliList } from "@/utils/services/wali.service";
import { BaseHome } from "@/types/models/home";
import { BaseEmployee } from "@/types/models/employee";
import { BasePartner } from "@/types/models/partner";
import { BaseWali } from "@/types/models/wali";
import { BaseChildren } from "@/types/models/children";
import { Option } from "@/types/generic/select-option";
import { GENDER_OPTIONS, PLH_OPTIONS } from "@/constants/option";
import { Region } from "@/types/models/region";
import { Employee } from "@/types/models/employee";
import { Partner } from "@/types/models/partner";
import { Wali } from "@/types/models/wali";

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: BaseHome = {
  id: null,
  regionId: null,
  postalCode: null,
  employeeId: null,
  partnerId: null,
  waliId: null,
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface FamilyFormProps {
  mode: "create";
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function FamilyForm({ mode }: FamilyFormProps) {
  const router = useRouter();
  const { notify } = useNotify();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Options lists
  const [regions, setRegions] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [partners, setPartners] = useState<Option[]>([]);
  const [wali, setWali] = useState<Option[]>([]);

  // Modes
  const [employeeMode, setEmployeeMode] = useState<"existing" | "new">(
    "existing"
  );
  const [partnerMode, setPartnerMode] = useState<"existing" | "new">(
    "existing"
  );
  const [waliMode, setWaliMode] = useState<"none" | "existing" | "new">("none");

  // Form state
  const [form, setForm] = useState<BaseHome>(INITIAL_FORM_STATE);
  const [employeeForm, setEmployeeForm] = useState<BaseEmployee>({
    nipNipp: "",
    employeeName: "",
    deathCause: "",
    lastPosition: "",
    notes: "",
    regionId: null,
    employeeGender: "M",
    isAccident: false,
  });
  const [partnerForm, setPartnerForm] = useState<BasePartner>({
    partnerName: "",
    partnerJob: "",
    partnerNik: "",
    regionId: null,
    address: null,
    subdistrictName: null,
    postalCode: "",
    homeCoordinate: "",
    phoneNumber: "",
    phoneNumberAlt: "",
    isActive: true,
    isAlive: true,
  });
  const [waliForm, setWaliForm] = useState<BaseWali>({
    waliName: "",
    relation: null,
    waliAddress: null,
    addressCoordinate: null,
    waliPhone: null,
  });
  const [childrens, setChildrens] = useState<BaseChildren[]>([]);

  // File states
  const [employeePhotoFile, setEmployeePhotoFile] = useState<File | null>(null);
  const [partnerPhotoFile, setPartnerPhotoFile] = useState<File | null>(null);
  const [waliPhotoFile, setWaliPhotoFile] = useState<File | null>(null);

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [
          regionList,
          employeeList,
          partnerList,
          waliList,
        ] = await Promise.all([
          getRegionsList(),
          getEmployees(),
          getPartners(),
          getWaliList(),
        ]);

        setRegions(
          regionList.map((r: Region) => ({
            value: r.regionId,
            label: r.regionName,
          }))
        );

        setEmployees(
          employeeList.map((e: any) => ({
            value: e.id,
            label: `${e.employeeName}`,
          }))
        );

        setPartners(
          partnerList.map((p: any) => ({
            value: p.id,
            label: `${p.partnerName}`,
          }))
        );

        setWali(
          waliList.map((w: any) => ({
            value: w.id,
            label: `${w.waliName}`,
          }))
        );
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [notify]);

  // ==============================================
  // VALIDATION
  // ==============================================
  const validateForm = (): boolean => {
    // Validate home
    if (!form.regionId) {
      messageApi.error("Wilayah wajib diisi!");
      return false;
    }

    // Validate employee
    if (employeeMode === "existing") {
      if (!form.employeeId) {
        messageApi.error("Pilih pegawai yang sudah ada!");
        return false;
      }
    } else {
      if (!employeeForm.nipNipp) {
        messageApi.error("NIP/NIPP wajib diisi!");
        return false;
      }
      if (!employeeForm.employeeName) {
        messageApi.error("Nama pegawai wajib diisi!");
        return false;
      }
      if (!employeeForm.regionId) {
        messageApi.error("Wilayah pegawai wajib diisi!");
        return false;
      }
    }

    // Validate partner
    if (partnerMode === "existing") {
      if (!form.partnerId) {
        messageApi.error("Pilih pasangan yang sudah ada!");
        return false;
      }
    } else {
      if (!partnerForm.partnerName) {
        messageApi.error("Nama pasangan wajib diisi!");
        return false;
      }
      if (!partnerForm.regionId) {
        messageApi.error("Wilayah pasangan wajib diisi!");
        return false;
      }
    }

    return true;
  };

  // ==============================================
  // SUBMIT HANDLER
  // ==============================================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    messageApi.loading({
      content: "Membuat data keluarga...",
      key: "save",
      duration: 0,
    });

    try {
      const fd = new FormData();

      // Home fields
      fd.append("region_id", String(form.regionId));
      fd.append("postal_code", form.postalCode ?? "");

      // Employee
      if (employeeMode === "existing") {
        fd.append("employee_id", String(form.employeeId));
      } else {
        Object.entries(employeeForm).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const snakeKey = key.replace(
              /[A-Z]/g,
              (letter) => `_${letter.toLowerCase()}`
            );
            fd.append(`employee_${snakeKey}`, String(value));
          }
        });
        if (employeePhotoFile) {
          fd.append("employee_pict", employeePhotoFile);
        }
      }

      // Partner
      if (partnerMode === "existing") {
        fd.append("partner_id", String(form.partnerId));
      } else {
        Object.entries(partnerForm).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const snakeKey = key.replace(
              /[A-Z]/g,
              (letter) => `_${letter.toLowerCase()}`
            );
            fd.append(`partner_${snakeKey}`, String(value));
          }
        });
        if (partnerPhotoFile) {
          fd.append("partner_pict", partnerPhotoFile);
        }
      }

      // Wali
      if (waliMode === "existing") {
        fd.append("wali_id", String(form.waliId));
      } else if (waliMode === "new") {
        Object.entries(waliForm).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const snakeKey = key.replace(
              /[A-Z]/g,
              (letter) => `_${letter.toLowerCase()}`
            );
            fd.append(`wali_${snakeKey}`, String(value));
          }
        });
        if (waliPhotoFile) {
          fd.append("wali_pict", waliPhotoFile);
        }
      }

      // Children
      childrens.forEach((child, index) => {
        Object.entries(child).forEach(([key, value]) => {
          if (key === "childrenPictFile") return;
          if (value !== null && value !== undefined) {
            const snakeKey = key.replace(
              /[A-Z]/g,
              (letter) => `_${letter.toLowerCase()}`
            );
            fd.append(`childrens[${index}][${snakeKey}]`, String(value));
          }
        });
        if ((child as any).childrenPictFile) {
          fd.append(
            `childrens[${index}][children_pict]`,
            (child as any).childrenPictFile
          );
        }
      });

      const res = await fetchWithAuth(API_HOME, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Gagal membuat data keluarga");

      messageApi.success({
        content: "Data keluarga berhasil dibuat!",
        key: "save",
        duration: 2,
      });

      router.push("/family");
    } catch (err) {
      console.error(err);
      messageApi.error({
        content: "Gagal membuat data keluarga.",
        key: "save",
        duration: 2,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================================
  // CHILDREN HANDLERS
  // ==============================================
  const addChild = () => {
    setChildrens([
      ...childrens,
      {
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
      },
    ]);
  };

  const removeChild = (index: number) => {
    setChildrens(childrens.filter((_, i) => i !== index));
  };

  const updateChild = (
    index: number,
    field: keyof BaseChildren,
    value: any
  ) => {
    setChildrens(
      childrens.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    );
  };

  // ==============================================
  // FILE VALIDATION
  // ==============================================
  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 1 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      messageApi.error("Format tidak valid. Hanya JPG, PNG, atau WEBP.");
      return false;
    }

    if (file.size > maxSize) {
      messageApi.error("Ukuran file maksimal 1MB.");
      return false;
    }

    return true;
  };

  // ==============================================
  // RENDER LOADING STATE
  // ==============================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      {contextHolder}
      <PageBreadcrumb pageTitle="Tambah Data Keluarga Asuh" />

      <div className="space-y-6">
        {/* HOME GROUP */}
        <ComponentCard title="Keluarga Asuh">
          <div className="space-y-5">
            <FormField label="Wilayah" required>
              <SelectInput
                value={form.regionId}
                onChange={(value) => setForm({ ...form, regionId: value })}
                options={regions}
                placeholder="Pilih wilayah"
              />
            </FormField>
            <FormField label="Kode Pos">
              <TextInput
                value={form.postalCode ?? ""}
                onChange={(value) => setForm({ ...form, postalCode: value })}
                placeholder="Masukkan kode pos"
              />
            </FormField>
          </div>
        </ComponentCard>

        {/* EMPLOYEE GROUP */}
        <ComponentCard
          title="Pegawai (Wajib)"
          rightComponent={
            <Switch
              checked={employeeMode === "new"}
              onChange={(checked) =>
                setEmployeeMode(checked ? "new" : "existing")
              }
              checkedChildren="Buat Baru"
              unCheckedChildren="Sudah Ada"
            />
          }
        >
          {employeeMode === "existing" ? (
            <FormField label="Pilih Pegawai" required>
              <SelectInput
                value={form.employeeId ?? undefined}
                onChange={(value) => setForm({ ...form, employeeId: value })}
                options={employees}
                placeholder="Pilih pegawai"
              />
            </FormField>
          ) : (
            <div className="space-y-5">
              <FormField label="NIP / NIPP" required>
                <TextInput
                  value={employeeForm.nipNipp}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, nipNipp: value })
                  }
                  placeholder="Masukkan NIP / NIPP"
                />
              </FormField>
              <FormField label="Nama Pegawai" required>
                <TextInput
                  value={employeeForm.employeeName}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, employeeName: value })
                  }
                  placeholder="Masukkan nama pegawai"
                />
              </FormField>
              <FormField label="PLH / Non-PLH" required>
                <SelectInput
                  value={employeeForm.isAccident}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, isAccident: value })
                  }
                  options={PLH_OPTIONS}
                  placeholder="Pilih status PLH"
                />
              </FormField>
              <FormField label="Posisi Terakhir">
                <TextInput
                  value={employeeForm.lastPosition ?? ""}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, lastPosition: value })
                  }
                  placeholder="Masukkan posisi terakhir"
                />
              </FormField>
              <FormField label="Wilayah" required>
                <SelectInput
                  value={employeeForm.regionId}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, regionId: value })
                  }
                  options={regions}
                  placeholder="Pilih wilayah"
                />
              </FormField>
              <FormField label="Jenis Kelamin" required>
                <SelectInput
                  value={employeeForm.employeeGender}
                  onChange={(value) =>
                    setEmployeeForm({ ...employeeForm, employeeGender: value })
                  }
                  options={GENDER_OPTIONS}
                  placeholder="Pilih jenis kelamin"
                />
              </FormField>
              <FormField label="Catatan">
                <TextArea
                  rows={4}
                  value={employeeForm.notes ?? ""}
                  onChange={(e) =>
                    setEmployeeForm({ ...employeeForm, notes: e.target.value })
                  }
                  placeholder="Tambahkan catatan (opsional)"
                />
              </FormField>
              <FormField label="Foto Pegawai">
                <FileInput
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateFile(file)) {
                      setEmployeePhotoFile(file);
                    }
                  }}
                />
              </FormField>
            </div>
          )}
        </ComponentCard>

        {/* PARTNER GROUP */}
        <ComponentCard
          title="Pasangan (Wajib)"
          rightComponent={
            <Switch
              checked={partnerMode === "new"}
              onChange={(checked) =>
                setPartnerMode(checked ? "new" : "existing")
              }
              checkedChildren="Buat Baru"
              unCheckedChildren="Sudah Ada"
            />
          }
        >
          {partnerMode === "existing" ? (
            <FormField label="Pilih Pasangan" required>
              <SelectInput
                value={form.partnerId ?? undefined}
                onChange={(value) => setForm({ ...form, partnerId: value })}
                options={partners}
                placeholder="Pilih pasangan"
              />
            </FormField>
          ) : (
            <div className="space-y-5">
              <FormField label="Nama Pasangan" required>
                <TextInput
                  value={partnerForm.partnerName ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, partnerName: value })
                  }
                  placeholder="Masukkan nama pasangan"
                />
              </FormField>
              <FormField label="NIK">
                <TextInput
                  value={partnerForm.partnerNik ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, partnerNik: value })
                  }
                  placeholder="Masukkan NIK"
                />
              </FormField>
              <FormField label="Pekerjaan">
                <TextInput
                  value={partnerForm.partnerJob ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, partnerJob: value })
                  }
                  placeholder="Masukkan pekerjaan"
                />
              </FormField>
              <FormField label="Alamat">
                <TextArea
                  rows={4}
                  value={partnerForm.address ?? ""}
                  onChange={(e) =>
                    setPartnerForm({ ...partnerForm, address: e.target.value })
                  }
                  placeholder="Masukkan alamat lengkap"
                />
              </FormField>
              <FormField label="Nomor Telepon">
                <TextInput
                  value={partnerForm.phoneNumber ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, phoneNumber: value })
                  }
                  placeholder="Masukkan nomor telepon"
                />
              </FormField>
              <FormField label="Nomor Telepon Alternatif">
                <TextInput
                  value={partnerForm.phoneNumberAlt ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, phoneNumberAlt: value })
                  }
                  placeholder="Masukkan nomor telepon alternatif"
                />
              </FormField>
              <FormField label="Wilayah" required>
                <SelectInput
                  value={partnerForm.regionId}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, regionId: value })
                  }
                  options={regions}
                  placeholder="Pilih wilayah"
                />
              </FormField>
              <FormField label="Kecamatan">
                <TextInput
                  value={partnerForm.subdistrictName ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, subdistrictName: value })
                  }
                  placeholder="Masukkan nama kecamatan"
                />
              </FormField>
              <FormField label="Kode Pos">
                <TextInput
                  value={partnerForm.postalCode ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, postalCode: value })
                  }
                  placeholder="Masukkan kode pos"
                />
              </FormField>
              <FormField label="Koordinat Rumah">
                <TextInput
                  value={partnerForm.homeCoordinate ?? ""}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, homeCoordinate: value })
                  }
                  placeholder="Masukkan koordinat rumah"
                />
              </FormField>
              <FormField label="Status Aktif" required>
                <SelectInput
                  value={partnerForm.isActive}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, isActive: value })
                  }
                  options={[
                    { value: true, label: "Aktif" },
                    { value: false, label: "Tidak Aktif" },
                  ]}
                  placeholder="Pilih status aktif"
                />
              </FormField>
              <FormField label="Status Hidup" required>
                <SelectInput
                  value={partnerForm.isAlive}
                  onChange={(value) =>
                    setPartnerForm({ ...partnerForm, isAlive: value })
                  }
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
                      setPartnerPhotoFile(file);
                    }
                  }}
                />
              </FormField>
            </div>
          )}
        </ComponentCard>

        {/* WALI GROUP */}
        <ComponentCard
          title="Wali (Opsional)"
          rightComponent={
            <Select
              className="w-40"
              value={waliMode}
              onChange={(value) => setWaliMode(value as any)}
              options={[
                { label: "Tidak Ada", value: "none" },
                { label: "Sudah Ada", value: "existing" },
                { label: "Buat Baru", value: "new" },
              ]}
            />
          }
        >
          {waliMode === "existing" && (
            <FormField label="Pilih Wali">
              <SelectInput
                value={form.waliId ?? undefined}
                onChange={(value) => setForm({ ...form, waliId: value })}
                options={wali}
                placeholder="Pilih wali"
              />
            </FormField>
          )}

          {waliMode === "new" && (
            <div className="space-y-5">
              <FormField label="Nama Wali">
                <TextInput
                  value={waliForm.waliName}
                  onChange={(value) =>
                    setWaliForm({ ...waliForm, waliName: value })
                  }
                  placeholder="Masukkan nama wali"
                />
              </FormField>
              <FormField label="Hubungan">
                <TextInput
                  value={waliForm.relation ?? ""}
                  onChange={(value) =>
                    setWaliForm({ ...waliForm, relation: value })
                  }
                  placeholder="Masukkan hubungan"
                />
              </FormField>
              <FormField label="Alamat Wali">
                <TextArea
                  rows={3}
                  value={waliForm.waliAddress ?? ""}
                  onChange={(e) =>
                    setWaliForm({ ...waliForm, waliAddress: e.target.value })
                  }
                  placeholder="Masukkan alamat wali"
                />
              </FormField>
              <FormField label="No. Telepon Wali">
                <TextInput
                  value={waliForm.waliPhone ?? ""}
                  onChange={(value) =>
                    setWaliForm({ ...waliForm, waliPhone: value })
                  }
                  placeholder="Masukkan nomor telepon wali"
                />
              </FormField>
              <FormField label="Koordinat Alamat">
                <TextInput
                  value={waliForm.addressCoordinate ?? ""}
                  onChange={(value) =>
                    setWaliForm({ ...waliForm, addressCoordinate: value })
                  }
                  placeholder="Masukkan koordinat alamat"
                />
              </FormField>
              <FormField label="Foto Wali">
                <FileInput
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateFile(file)) {
                      setWaliPhotoFile(file);
                    }
                  }}
                />
              </FormField>
            </div>
          )}
        </ComponentCard>

        {/* CHILDREN GROUP */}
        <ComponentCard title="Anak Asuh">
          <div className="space-y-4">
            <Button onClick={addChild}>Tambah Anak</Button>

            {childrens.map((child, index) => (
              <div key={index} className="border p-4 rounded space-y-4">
                <div className="flex justify-between items-center">
                  <strong className="font-semibold">Anak #{index + 1}</strong>
                  <Button size="xs" onClick={() => removeChild(index)}>
                    Hapus
                  </Button>
                </div>

                <FormField label="Nama Anak">
                  <TextInput
                    value={child.childrenName}
                    onChange={(value) =>
                      updateChild(index, "childrenName", value)
                    }
                    placeholder="Masukkan nama anak"
                  />
                </FormField>

                <FormField label="Anak-ke">
                  <TextInput
                    type="number"
                    value={child.index?.toString() ?? ""}
                    onChange={(value) =>
                      updateChild(
                        index,
                        "index",
                        value ? parseInt(value, 10) : null
                      )
                    }
                    placeholder="Masukkan urutan anak"
                  />
                </FormField>

                <FormField label="Gender">
                  <SelectInput
                    value={child.childrenGender}
                    onChange={(value) =>
                      updateChild(index, "childrenGender", value)
                    }
                    options={GENDER_OPTIONS}
                    placeholder="Pilih jenis kelamin"
                  />
                </FormField>

                <FormField label="Tanggal Lahir">
                  <DatePicker
                    size="large"
                    className="w-full"
                    value={
                      child.childrenBirthdate
                        ? dayjs(child.childrenBirthdate)
                        : null
                    }
                    onChange={(date) =>
                      updateChild(
                        index,
                        "childrenBirthdate",
                        date ? date.format("YYYY-MM-DD") : null
                      )
                    }
                  />
                </FormField>

                <FormField label="Alamat Anak">
                  <TextInput
                    value={child.childrenAddress ?? ""}
                    onChange={(value) =>
                      updateChild(index, "childrenAddress", value)
                    }
                    placeholder="Masukkan alamat anak"
                  />
                </FormField>

                <FormField label="No. HP Anak">
                  <TextInput
                    value={child.childrenPhone ?? ""}
                    onChange={(value) =>
                      updateChild(index, "childrenPhone", value)
                    }
                    placeholder="Masukkan nomor HP anak"
                  />
                </FormField>

                <FormField label="Status Aktif">
                  <SelectInput
                    value={child.isActive}
                    onChange={(value) => updateChild(index, "isActive", value)}
                    options={[
                      { value: true, label: "Ya" },
                      { value: false, label: "Tidak" },
                    ]}
                    placeholder="Pilih status aktif"
                  />
                </FormField>

                <FormField label="Yatim">
                  <SelectInput
                    value={child.isFatherAlive}
                    onChange={(value) =>
                      updateChild(index, "isFatherAlive", value)
                    }
                    options={[
                      { value: true, label: "Tidak" },
                      { value: false, label: "Ya" },
                    ]}
                    placeholder="Pilih status yatim"
                  />
                </FormField>

                <FormField label="Piatu">
                  <SelectInput
                    value={child.isMotherAlive}
                    onChange={(value) =>
                      updateChild(index, "isMotherAlive", value)
                    }
                    options={[
                      { value: true, label: "Tidak" },
                      { value: false, label: "Ya" },
                    ]}
                    placeholder="Pilih status piatu"
                  />
                </FormField>

                <FormField label="Kondisi Khusus">
                  <SelectInput
                    value={child.isCondition}
                    onChange={(value) =>
                      updateChild(index, "isCondition", value)
                    }
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
                    value={child.notes ?? ""}
                    onChange={(e) =>
                      updateChild(index, "notes", e.target.value)
                    }
                    placeholder="Tambahkan catatan (opsional)"
                  />
                </FormField>

                <FormField label="Foto Anak">
                  <FileInput
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && validateFile(file)) {
                        updateChild(index, "childrenPictFile" as any, file);
                      }
                    }}
                  />
                </FormField>
              </div>
            ))}
          </div>
        </ComponentCard>

        <div className="grid grid-cols-2 gap-8">
          <Button onClick={() => router.back()} variant="outline">
            Kembali
          </Button>

          <Button
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-primary-600 text-white"
          >
            {submitting ? "Menyimpan..." : "Simpan Keluarga"}
          </Button>
        </div>
      </div>
    </div>
  );
}
