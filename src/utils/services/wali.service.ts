import { Wali } from "@/types/models/wali";
import { apiClient } from "../fetch/apiClient";
import { API_WALI, API_WALI_OPTIMIZED, API_WALI_SUMMARY } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getWalis = async (): Promise<Wali[]> => {
  try {
    const json = await apiClient<ApiResponseList<Wali>>(API_WALI);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali[];
  } catch (error) {
    throw error;
  }
};

export const getWali = async (id: number | string): Promise<Wali> => {
  try {
    const json = await apiClient<ApiResponseSingle<Wali>>(`${API_WALI}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali;
  } catch (error) {
    throw error;
  }
};

export const updateWali = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_WALI}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteWali = async (id: number) => {
  try {
    return await deleteResource(`${API_WALI}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const getWaliList = async () => {
  try {
    const json = await apiClient<ApiResponseList<Wali>>(`${API_WALI}/list`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali[];
  } catch (error) {
    throw error;
  }
};

export const createWali = async (fd: FormData) => {
  return await fetchWithAuth(API_WALI, {
    method: "POST",
    body: fd,
  });
};

export interface WaliPagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface WaliPaginatedResponse { data: Wali[]; pagination: WaliPagination; }
export interface WaliSummary { total: number; }

export const getWaliOptimized = async (
  page = 1,
  pageSize = 50,
  search = "",
  filters?: Record<string, string[]>
): Promise<WaliPaginatedResponse> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const json = await apiClient<ApiResponseList<Wali> & { pagination: WaliPagination }>(
    `${API_WALI_OPTIMIZED}?${params.toString()}`
  );
  const data = camelcaseKeys(json.data ?? [], { deep: true }) as unknown as Wali[];
  return { data: Array.isArray(data) ? data : [], pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 } };
};

export const getWaliSummary = async (search?: string): Promise<WaliSummary> => {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  const qs = params.toString();
  const json = await apiClient<{ data: WaliSummary }>(qs ? `${API_WALI_SUMMARY}?${qs}` : API_WALI_SUMMARY);
  return json.data;
};