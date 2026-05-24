import { apiClient } from "../fetch/apiClient";
import { API_STAFF, API_STAFF_OPTIMIZED } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface Staff {
  id: number;
  staffName: string;
  gender: "M" | "F";
  birthplace: string | null;
  birthdate: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  nik: string;
  roleId: number | null;
  position: string | null;
  isActive: boolean;
  staffPict: string | null;
  signaturePath: string | null;
  signatureUrl: string | null;
  parafPath: string | null;
}

export const getStaffs = async (): Promise<Staff[]> => {
  try {
    const json = await apiClient<ApiResponseList<Staff>>(API_STAFF);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Staff[];
  } catch (error) {
    throw error;
  }
};

export const getStaff = async (id: number | string): Promise<Staff> => {
  try {
    const json = await apiClient<ApiResponseSingle<Staff>>(`${API_STAFF}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Staff;
  } catch (error) {
    throw error;
  }
};

export const createStaff = async (fd: FormData) => {
  return await fetchWithAuth(API_STAFF, {
    method: "POST",
    body: fd,
  });
};

export const updateStaff = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_STAFF}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteStaff = async (id: number) => {
  try {
    return await deleteResource(`${API_STAFF}/${id}`);
  } catch (error) {
    throw error;
  }
};

export interface StaffPagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface StaffPaginatedResponse { data: Staff[]; pagination: StaffPagination; }

export const getStaffOptimized = async (
  page = 1,
  pageSize = 50,
  search = "",
  filters?: Record<string, string[]>
): Promise<StaffPaginatedResponse> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const json = await apiClient<ApiResponseList<Staff> & { pagination: StaffPagination }>(
    `${API_STAFF_OPTIMIZED}?${params.toString()}`
  );
  const data = camelcaseKeys(json.data ?? [], { deep: true }) as unknown as Staff[];
  return { data: Array.isArray(data) ? data : [], pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 } };
};