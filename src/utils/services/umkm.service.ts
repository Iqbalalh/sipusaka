import { Umkm } from "@/types/models/umkm";
import { apiClient } from "../fetch/apiClient";
import { API_UMKM, API_UMKM_OPTIMIZED, API_UMKM_TABLE_SUMMARY } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getUmkmList = async (): Promise<Umkm[]> => {
  try {
    const json = await apiClient<ApiResponseList<Umkm>>(API_UMKM);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Umkm[];
  } catch (error) {
    throw error;
  }
};

export const getUmkm = async (id: number | string): Promise<Umkm> => {
  try {
    const json = await apiClient<ApiResponseSingle<Umkm>>(`${API_UMKM}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Umkm;
  } catch (error) {
    throw error;
  }
};

export const createUmkm = async (fd: FormData) => {
  return await fetchWithAuth(API_UMKM, {
    method: "POST",
    body: fd,
  });
};

export const updateUmkm = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_UMKM}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteUmkm = async (id: number) => {
  try {
    return await deleteResource(`${API_UMKM}/${id}`);
  } catch (error) {
    throw error;
  }
};

export interface UmkmPagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface UmkmPaginatedResponse { data: Umkm[]; pagination: UmkmPagination; }
export interface UmkmSummary { total: number; active: number; inactive: number; totalDana?: number; totalDanaYP?: number; totalDanaUPZ?: number; }

export const getUmkmOptimized = async (
  page = 1,
  pageSize = 50,
  search = "",
  filters?: Record<string, string[]>
): Promise<UmkmPaginatedResponse> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const json = await apiClient<ApiResponseList<Umkm> & { pagination: UmkmPagination }>(
    `${API_UMKM_OPTIMIZED}?${params.toString()}`
  );
  const data = camelcaseKeys(json.data ?? [], { deep: true }) as unknown as Umkm[];
  return { data: Array.isArray(data) ? data : [], pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 } };
};

export const getUmkmSummary = async (search?: string, filters?: Record<string, string[]>): Promise<UmkmSummary> => {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const qs = params.toString();
  const json = await apiClient<{ data: UmkmSummary }>(qs ? `${API_UMKM_TABLE_SUMMARY}?${qs}` : API_UMKM_TABLE_SUMMARY);
  return json.data;
};