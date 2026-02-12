"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { message, Select } from "antd";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { SelectInput } from "@/components/custom/SelectInput";
import { TextInput } from "@/components/custom/TextInput";

// Modals
import CreateEmployeeModal from "@/components/modals/CreateEmployeeModal";
import CreatePartnerModal from "@/components/modals/CreatePartnerModal";
import CreateWaliModal from "@/components/modals/CreateWaliModal";
import CreateChildrenModal from "@/components/modals/CreateChildrenModal";

// Hooks & Utils
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_HOME } from "@/constants/endpoint";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployees } from "@/utils/services/employee.service";
import { getPartners } from "@/utils/services/partner.service";
import { getWaliList } from "@/utils/services/wali.service";
import { getChildrens } from "@/utils/services/children.service";
import { BaseHome, Home } from "@/types/models/home";
import { Option } from "@/types/generic/select-option";
import { Region } from "@/types/models/region";

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
  mode: "create" | "edit";
  familyId?: string;
  homeData?: Home;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function FamilyForm({ mode, familyId, homeData }: FamilyFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useNotify();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Options lists
  const [regions, setRegions] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [partners, setPartners] = useState<Option[]>([]);
  const [wali, setWali] = useState<Option[]>([]);
  const [childrenOptions, setChildrenOptions] = useState<Option[]>([]);

  // Wali mode
  const [waliMode, setWaliMode] = useState<"none" | "existing">("none");

  // Form state
  const [form, setForm] = useState<BaseHome>(INITIAL_FORM_STATE);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>([]);

  // Modal states
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [waliModalVisible, setWaliModalVisible] = useState(false);
  const [childrenModalVisible, setChildrenModalVisible] = useState(false);

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
          childrenList,
        ] = await Promise.all([
          getRegionsList(),
          getEmployees(),
          getPartners(),
          getWaliList(),
          getChildrens(),
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
            label: `${p.partnerName}${p.regions?.regionName ? ` - ${p.regions.regionName}` : ""}`,
          }))
        );

        setWali(
          waliList.map((w: any) => ({
            value: w.id,
            label: `${w.waliName}`,
          }))
        );

        setChildrenOptions(
          childrenList.map((c: any) => ({
            value: c.id,
            label: `${c.childrenName} ${c.nik ? `(${c.nik})` : ""}`,
          }))
        );

        // If edit mode and homeData is provided, prefill the form
        if (mode === "edit" && homeData) {
          console.log("Prefilling form with homeData:", homeData);
          
          const employeeId = homeData.employeeId;
          const partnerId = homeData.partnerId;
          const waliId = homeData.waliId;
          
          console.log("Setting form with:", {
            id: homeData.id,
            regionId: homeData.regionId,
            postalCode: homeData.postalCode,
            employeeId,
            partnerId,
            waliId,
          });
          
          // Set form state after options are populated to ensure proper prefilling
          setTimeout(() => {
            setForm({
              id: homeData.id,
              regionId: homeData.regionId,
              postalCode: homeData.postalCode,
              employeeId,
              partnerId,
              waliId,
            });
            setSelectedChildrenIds(homeData.childrens?.map((c: any) => c.id) || []);
            setWaliMode(waliId ? "existing" : "none");
          }, 0);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, homeData, notify]);

  // ==============================================
  // VALIDATION
  // ==============================================
  const validateForm = (): boolean => {
    if (!form.regionId) {
      messageApi.error("Wilayah wajib diisi!");
      return false;
    }

    if (!form.employeeId) {
      messageApi.error("Pilih pegawai!");
      return false;
    }

    if (!form.partnerId) {
      messageApi.error("Pilih pasangan!");
      return false;
    }

    return true;
  };

  // ==============================================
  // SUBMIT HANDLER
  // ==============================================
  const handleSubmit = async () => {
    if (submitting) return; // Prevent multiple submissions
    if (!validateForm()) return;

    setSubmitting(true);
    const messageText = mode === "edit" ? "Memperbarui data keluarga..." : "Membuat data keluarga...";
    messageApi.loading({
      content: messageText,
      key: "save",
      duration: 0,
    });

    try {
      const fd = new FormData();

      // Home fields - snake_case
      fd.append("region_id", String(form.regionId));
      fd.append("postal_code", form.postalCode ?? "");

      // Employee ID - camelCase
      if (form.employeeId) {
        fd.append("employeeId", String(form.employeeId));
      }

      // Partner ID - camelCase
      if (form.partnerId) {
        fd.append("partnerId", String(form.partnerId));
      }

      // Wali ID - camelCase
      if (form.waliId) {
        fd.append("waliId", String(form.waliId));
      }

      // Children IDs - Send as JSON string
      fd.append("childrens", JSON.stringify(selectedChildrenIds.map(id => ({ id }))));

      const url = mode === "edit" ? `${API_HOME}/${familyId}` : API_HOME;
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        body: fd,
      });

      if (!res.ok) throw new Error(mode === "edit" ? "Gagal memperbarui data keluarga" : "Gagal membuat data keluarga");

      const result = await res.json();

      const successMessage = mode === "edit" ? "Data keluarga berhasil diperbarui!" : "Data keluarga berhasil dibuat!";
      messageApi.success({
        content: successMessage,
        key: "save",
        duration: 2,
      });

      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else {
        router.push(`/family/view/${result.data.home.id}`);
      }
    } catch (err) {
      console.error(err);
      messageApi.error({
        content: mode === "edit" ? "Gagal memperbarui data keluarga." : "Gagal membuat data keluarga.",
        key: "save",
        duration: 2,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==============================================
  // SUCCESS HANDLERS FOR MODALS
  // ==============================================
  const handleEmployeeCreated = (employeeId: number, employeeName: string) => {
    setEmployees([...employees, { value: employeeId, label: employeeName }]);
    setForm({ ...form, employeeId });
    setEmployeeModalVisible(false);
  };

  const handlePartnerCreated = (partnerId: number, partnerName: string) => {
    setPartners([...partners, { value: partnerId, label: partnerName }]);
    setForm({ ...form, partnerId });
    setPartnerModalVisible(false);
  };

  const handleWaliCreated = (waliId: number, waliName: string) => {
    setWali([...wali, { value: waliId, label: waliName }]);
    setForm({ ...form, waliId });
    setWaliModalVisible(false);
  };

  const handleChildrenCreated = (childrenId: number, childrenName: string) => {
    setChildrenOptions([...childrenOptions, { value: childrenId, label: childrenName }]);
    setSelectedChildrenIds([...selectedChildrenIds, childrenId]);
    setChildrenModalVisible(false);
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
  const pageTitle = mode === "edit" ? "Edit Data Keluarga Asuh" : "Tambah Data Keluarga Asuh";
  const submitButtonText = mode === "edit" ? "Update Keluarga" : "Simpan Keluarga";

  return (
    <div className="pb-10">
      {contextHolder}
      <PageBreadcrumb pageTitle={pageTitle} />

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
        <ComponentCard title="Pegawai (Wajib)">
          <div className="space-y-4">
            <FormField label="Pilih Pegawai" required>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectInput
                    value={form.employeeId ?? undefined}
                    onChange={(value) => setForm({ ...form, employeeId: value })}
                    options={employees}
                    placeholder="Pilih pegawai"
                  />
                </div>
                <Button
                  onClick={() => setEmployeeModalVisible(true)}
                  disabled={submitting}
                  size="sm"
                >
                  Buat Baru
                </Button>
              </div>
            </FormField>
          </div>
        </ComponentCard>

        {/* PARTNER GROUP */}
        <ComponentCard title="Pasangan (Wajib)">
          <div className="space-y-4">
            <FormField label="Pilih Pasangan" required>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectInput
                    value={form.partnerId ?? undefined}
                    onChange={(value) => setForm({ ...form, partnerId: value })}
                    options={partners}
                    placeholder="Pilih pasangan"
                  />
                </div>
                <Button
                  onClick={() => setPartnerModalVisible(true)}
                  disabled={submitting}
                  size="sm"
                >
                  Buat Baru
                </Button>
              </div>
            </FormField>
          </div>
        </ComponentCard>

        {/* WALI GROUP */}
        <ComponentCard title="Wali (Opsional)">
          <div className="space-y-4">
            <Select
              className="w-max"
              value={waliMode}
              onChange={(value) => setWaliMode(value as any)}
              options={[
                { label: "Tidak Ada", value: "none" },
                { label: "Sudah Ada/Buat Baru", value: "existing" },
              ]}
              disabled={submitting}
              size="large"
            />

            {waliMode === "existing" && (
              <div className="mt-4">
                <FormField label="Pilih Wali">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SelectInput
                        value={form.waliId ?? undefined}
                        onChange={(value) => setForm({ ...form, waliId: value })}
                        options={wali}
                        placeholder="Pilih wali"
                      />
                    </div>
                    <Button
                      onClick={() => setWaliModalVisible(true)}
                      disabled={submitting}
                      size="sm"
                    >
                      Buat Baru
                    </Button>
                  </div>
                </FormField>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* CHILDREN GROUP */}
        <ComponentCard title="Anak Asuh">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select
                className="flex-1"
                size="large"
                mode="multiple"
                placeholder="Pilih anak dari data yang sudah ada"
                options={childrenOptions}
                value={selectedChildrenIds}
                onChange={(values) => setSelectedChildrenIds(values as number[])}
                disabled={submitting}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
              <Button
                onClick={() => setChildrenModalVisible(true)}
                disabled={submitting}
                size="sm"
              >
                Buat Baru
              </Button>
            </div>

            {selectedChildrenIds.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedChildrenIds.length} anak akan ditautkan ke keluarga ini.
              </div>
            )}
          </div>
        </ComponentCard>

        <div className="grid grid-cols-2 gap-8">
          <Button
            onClick={() => router.push("/family")}
            variant="outline"
            disabled={submitting}
          >
            Kembali
          </Button>

          <Button
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Menyimpan..." : submitButtonText}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateEmployeeModal
        visible={employeeModalVisible}
        onCancel={() => setEmployeeModalVisible(false)}
        onSuccess={handleEmployeeCreated}
        regions={regions}
      />

      <CreatePartnerModal
        visible={partnerModalVisible}
        onCancel={() => setPartnerModalVisible(false)}
        onSuccess={handlePartnerCreated}
        regions={regions}
      />

      <CreateWaliModal
        visible={waliModalVisible}
        onCancel={() => setWaliModalVisible(false)}
        onSuccess={handleWaliCreated}
      />

      <CreateChildrenModal
        visible={childrenModalVisible}
        onCancel={() => setChildrenModalVisible(false)}
        onSuccess={handleChildrenCreated}
      />
    </div>
  );
}
