import { Alumni } from "@/types/models/alumni";
export type { Alumni };
import { apiClient } from "../fetch/apiClient";
import { API_ALUMNI } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
  ApiResponsePaginated,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getAlumnis = async (): Promise<Alumni[]> => {
  try {
    const json = await apiClient<ApiResponseList<Alumni>>(API_ALUMNI);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Alumni[];
  } catch (error) {
    throw error;
  }
};

export const getAlumni = async (id: number | string): Promise<Alumni> => {
  try {
    const json = await apiClient<ApiResponseSingle<Alumni>>(`${API_ALUMNI}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Alumni;
  } catch (error) {
    throw error;
  }
};

export const createAlumni = async (fd: FormData) => {
  return await fetchWithAuth(API_ALUMNI, {
    method: "POST",
    body: fd,
  });
};

export const updateAlumni = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_ALUMNI}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteAlumni = async (id: number) => {
  try {
    return await deleteResource(`${API_ALUMNI}/${id}`);
  } catch (error) {
    throw error;
  }
};

/** Promote an (inactive) anak asuh into a new alumni record. */
export const promoteChildToAlumni = async (childrenId: number | string) => {
  return await fetchWithAuth(`${API_ALUMNI}/from-children/${childrenId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
};

export interface AlumniFilters {
  educationLevel?: string;
  gender?: string;
}

export interface AlumniOptimizedResponse {
  data: Alumni[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const getAlumniOptimized = async (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  filters?: AlumniFilters
): Promise<AlumniOptimizedResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (search) params.append("search", search);
    if (filters?.educationLevel) params.append("educationLevel", filters.educationLevel);
    if (filters?.gender) params.append("gender", filters.gender);

    const url = `${API_ALUMNI}/optimized?${params.toString()}`;
    const json = await apiClient<ApiResponsePaginated<Alumni>>(url);

    return {
      data: camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Alumni[],
      pagination: json.pagination || { page, pageSize, total: 0, totalPages: 0 },
    };
  } catch (error) {
    throw error;
  }
};

export interface AlumniStats {
  total: number;
  male: number;
  female: number;
  byEducationLevel: Record<string, number>;
}

export const getAlumniStats = async (
  search: string = "",
  filters?: AlumniFilters
): Promise<AlumniStats> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters?.educationLevel) params.append("educationLevel", filters.educationLevel);
  if (filters?.gender) params.append("gender", filters.gender);
  const url = `${API_ALUMNI}/stats${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetchWithAuth(url);
  const json = await res.json();
  return json.data as AlumniStats;
};

export const getAlumniForExport = async (
  search: string = "",
  filters?: AlumniFilters
): Promise<Alumni[]> => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filters?.educationLevel) params.append("educationLevel", filters.educationLevel);
    if (filters?.gender) params.append("gender", filters.gender);

    const url = params.toString() ? `${API_ALUMNI}/export?${params.toString()}` : `${API_ALUMNI}/export`;
    const json = await apiClient<ApiResponseList<Alumni>>(url);

    return camelcaseKeys(json.data ?? json, { deep: true, exclude: [/^_/] }) as unknown as Alumni[];
  } catch (error) {
    throw error;
  }
};
