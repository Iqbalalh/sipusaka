"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spin, Select } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

// Components
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { FormField } from "@/components/custom/FormField";
import { TextInput } from "@/components/custom/TextInput";

// Hooks & Utils
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_USERS } from "@/constants/endpoint";
import { getUser, createUser, updateUser } from "@/utils/services/user.service";
import { getStaffs, Staff } from "@/utils/services/staff.service";

// ==============================================
// FORM STATE INTERFACE
// ==============================================
interface UserFormData {
  username: string;
  password: string;
  confirmPassword: string;
  staffId: number | null;
  role: string;
}

// ==============================================
// INITIAL FORM STATE
// ==============================================
const INITIAL_FORM_STATE: UserFormData = {
  username: "",
  password: "",
  confirmPassword: "",
  staffId: null,
  role: "staff",
};

// ==============================================
// ROLE OPTIONS
// ==============================================
const ROLE_OPTIONS = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

// ==============================================
// VALIDATION RULES
// ==============================================
const validateForm = (
  form: UserFormData,
  mode: "create" | "edit"
): { isValid: boolean; error?: string } => {
  if (!form.username.trim()) {
    return { isValid: false, error: "Username wajib diisi!" };
  }
  if (form.username.length < 3) {
    return { isValid: false, error: "Username minimal 3 karakter!" };
  }
  if (mode === "create" && !form.password) {
    return { isValid: false, error: "Password wajib diisi!" };
  }
  if (form.password && form.password.length < 6) {
    return { isValid: false, error: "Password minimal 6 karakter!" };
  }
  if (form.password && form.password !== form.confirmPassword) {
    return { isValid: false, error: "Password dan konfirmasi password tidak cocok!" };
  }
  if (!form.staffId) {
    return { isValid: false, error: "Staf wajib dipilih!" };
  }
  if (!form.role) {
    return { isValid: false, error: "Role wajib dipilih!" };
  }
  return { isValid: true };
};

// ==============================================
// PROPS INTERFACE
// ==============================================
interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function UserForm({ mode, userId }: UserFormProps) {
  const router = useRouter();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [form, setForm] = useState<UserFormData>(INITIAL_FORM_STATE);

  // ==============================================
  // FETCH INITIAL DATA
  // ==============================================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Fetch staff list for dropdown
        const staffs = await getStaffs();
        setStaffList(staffs);

        if (mode === "edit" && userId) {
          const userData = await getUser(userId);
          setForm({
            username: userData.username,
            password: "",
            confirmPassword: "",
            staffId: userData.staffId,
            role: userData.role || "staff",
          });
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [mode, userId, notify]);

  // ==============================================
  // EVENT HANDLERS
  // ==============================================
  const handleFieldChange = useCallback(
    <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    const validation = validateForm(form, mode);
    if (!validation.isValid) {
      return notify("warning", validation.error!);
    }

    setSubmitLoading(true);
    try {
      // Prepare submit data
      const submitData: any = {
        username: form.username,
        staffId: form.staffId,
        role: form.role,
      };

      // Only include password if provided
      if (form.password) {
        submitData.password = form.password;
      }

      if (mode === "edit" && userId) {
        await updateUser(userId, submitData);
        notify("success", "User berhasil diperbarui!");
      } else {
        await createUser(submitData);
        notify("success", "User berhasil ditambahkan!");
      }

      router.push("/users");
    } catch (err: any) {
      notifyFromResult(notify, { error: err });
    } finally {
      setSubmitLoading(false);
    }
  }, [form, mode, userId, router, notify]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // ==============================================
  // RENDER LOADING STATE
  // ==============================================
  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  // ==============================================
  // PAGE TITLE
  // ==============================================
  const pageTitle =
    mode === "edit"
      ? `Edit User: ${form.username}`
      : "Tambah User Baru";

  const submitButtonText = mode === "edit" ? "Update User" : "Simpan";

  // ==============================================
  // STAFF OPTIONS FOR SELECT
  // ==============================================
  const staffOptions = staffList.map((staff) => ({
    value: staff.id,
    label: `${staff.staffName} (${staff.nik})`,
  }));

  // ==============================================
  // RENDER FORM
  // ==============================================
  return (
    <div className="pb-10">
      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <ComponentCard title="Data User">
            <div className="space-y-5">
              <FormField label="Username" required>
                <TextInput
                  value={form.username}
                  onChange={(value) => handleFieldChange("username", value)}
                  placeholder="Masukkan username"
                  required
                />
              </FormField>

              <FormField label="Password" required={mode === "create"}>
                <TextInput
                  value={form.password}
                  onChange={(value) => handleFieldChange("password", value)}
                  placeholder={mode === "edit" ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                  type="password"
                  required={mode === "create"}
                />
              </FormField>

              <FormField label="Konfirmasi Password" required={mode === "create"}>
                <TextInput
                  value={form.confirmPassword}
                  onChange={(value) => handleFieldChange("confirmPassword", value)}
                  placeholder="Ulangi password"
                  type="password"
                  required={mode === "create"}
                />
              </FormField>

              <FormField label="Staf" required>
                <Select
                  value={form.staffId}
                  onChange={(value) => handleFieldChange("staffId", value)}
                  options={staffOptions}
                  placeholder="Pilih staf"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  className="w-full"
                  size="large"
                />
              </FormField>

              <FormField label="Role" required>
                <Select
                  value={form.role}
                  onChange={(value) => handleFieldChange("role", value)}
                  options={ROLE_OPTIONS}
                  placeholder="Pilih role"
                  className="w-full"
                  size="large"
                />
              </FormField>
            </div>
          </ComponentCard>
        </div>

        <div className="space-y-6">
          <ComponentCard title="Informasi">
            <div className="space-y-5">
              <div className="text-sm text-gray-600">
                <p className="font-semibold mb-2">Tentang User:</p>
                <p className="mb-2">User adalah akun yang dapat digunakan untuk login ke sistem SIPUSAKA.</p>
                <p className="mb-2">Keterangan:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Username minimal 3 karakter</li>
                  <li>Password minimal 6 karakter</li>
                  <li>Setiap user harus terhubung dengan data staf</li>
                  <li><strong>superadmin</strong>: Akses penuh ke semua fitur</li>
                  <li><strong>admin</strong>: Akses ke sebagian besar fitur</li>
                  <li><strong>staff</strong>: Akses terbatas</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 mt-4 border-t border-gray-100">
              <Button onClick={handleGoBack}>Batal</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="bg-primary-600 text-white min-w-[150px]"
              >
                {submitLoading ? "Menyimpan..." : submitButtonText}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
