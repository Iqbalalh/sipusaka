import { Partner } from "@/types/models/partner";
import { apiClient } from "../fetch/apiClient";
import { API_PARTNER, API_PARTNER_OPTIMIZED, API_PARTNER_SUMMARY } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getPartners = async (): Promise<Partner[]> => {
  try {
    const json = await apiClient<ApiResponseList<Partner>>(API_PARTNER);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Partner[];
  } catch (error) {
    throw error;
  }
};

export const getPartner = async (id: number | string): Promise<Partner> => {
  try {
    const json = await apiClient<ApiResponseSingle<Partner>>(`${API_PARTNER}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Partner;
  } catch (error) {
    throw error;
  }
};

export const updatePartner = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_PARTNER}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deletePartner = async (id: number) => {
  try {
    return await deleteResource(`${API_PARTNER}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const createPartner = async (fd: FormData) => {
  return await fetchWithAuth(API_PARTNER, {
    method: "POST",
    body: fd,
  });
};

export interface PartnerPagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface PartnerPaginatedResponse { data: Partner[]; pagination: PartnerPagination; }
export interface PartnerSummary { total: number; active: number; inactive: number; }

export const getPartnersOptimized = async (
  page = 1,
  pageSize = 50,
  search = "",
  filters?: Record<string, string[]>
): Promise<PartnerPaginatedResponse> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const json = await apiClient<ApiResponseList<Partner> & { pagination: PartnerPagination }>(
    `${API_PARTNER_OPTIMIZED}?${params.toString()}`
  );
  const data = camelcaseKeys(json.data ?? [], { deep: true }) as unknown as Partner[];
  return { data: Array.isArray(data) ? data : [], pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 } };
};

export const getPartnerSummary = async (search?: string, filters?: Record<string, string[]>): Promise<PartnerSummary> => {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const qs = params.toString();
  const json = await apiClient<{ data: PartnerSummary }>(qs ? `${API_PARTNER_SUMMARY}?${qs}` : API_PARTNER_SUMMARY);
  return json.data;
};