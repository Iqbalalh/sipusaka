import { Children } from "@/types/models/children";
import { apiClient } from "../fetch/apiClient";
import { API_CHILDREN } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
  ApiResponsePaginated,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getChildrens = async (): Promise<Children[]> => {
  try {
    const json = await apiClient<ApiResponseList<Children>>(API_CHILDREN);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children[];
  } catch (error) {
    throw error;
  }
};

export const getChildren = async (id: number | string): Promise<Children> => {
  try {
    const json = await apiClient<ApiResponseSingle<Children>>(`${API_CHILDREN}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children;
  } catch (error) {
    throw error;
  }
};

export const createChildren = async (fd: FormData) => {
  return await fetchWithAuth(API_CHILDREN, {
    method: "POST",
    body: fd,
  });
};

export const updateChildren = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_CHILDREN}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteChildren = async (id: number) => {
  try {
    return await deleteResource(`${API_CHILDREN}/${id}`);
  } catch (error) {
    throw error;
  }
};

export interface ChildrenFilters {
  educationLevel?: string;
  yatimStatus?: string;
  regionId?: number;
  isActive?: boolean;
  isCondition?: boolean;
  ageSort?: "asc" | "desc";
}

export interface ChildrenOptimizedResponse {
  data: Children[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const getChildrenOptimized = async (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  filters?: ChildrenFilters
): Promise<ChildrenOptimizedResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    if (search) params.append("search", search);
    
    if (filters?.educationLevel) params.append("educationLevel", filters.educationLevel);
    if (filters?.yatimStatus) params.append("yatimStatus", filters.yatimStatus);
    if (filters?.regionId) params.append("regionId", filters.regionId.toString());
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    if (filters?.isCondition !== undefined) params.append("isCondition", filters.isCondition.toString());
    if (filters?.ageSort) params.append("ageSort", filters.ageSort);

    const url = `${API_CHILDREN}/optimized?${params.toString()}`;
    const json = await apiClient<ApiResponsePaginated<Children>>(url);
    
    return {
      data: camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children[],
      pagination: json.pagination || {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getChildrenForExport = async (
  filters?: ChildrenFilters
): Promise<Children[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.educationLevel) params.append("educationLevel", filters.educationLevel);
    if (filters?.yatimStatus) params.append("yatimStatus", filters.yatimStatus);
    if (filters?.regionId) params.append("regionId", filters.regionId.toString());
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    if (filters?.isCondition !== undefined) params.append("isCondition", filters.isCondition.toString());
    if (filters?.ageSort) params.append("ageSort", filters.ageSort);

    const url = params.toString() ? `${API_CHILDREN}/export?${params.toString()}` : `${API_CHILDREN}/export`;
    const json = await apiClient<ApiResponseList<Children>>(url);
    
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children[];
  } catch (error) {
    throw error;
  }
};