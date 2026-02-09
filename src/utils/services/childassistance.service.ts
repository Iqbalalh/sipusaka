import { apiClient } from "../fetch/apiClient";
import { API_CHILD_ASSISTANCE, API_CHILD_ASSISTANCE_OPTIMIZED } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface ChildAssistance {
  id: number;
  childrenId: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceProvider: string;
  assistanceAmount: number;
  educationLevel?: string | null;
  educationGrade?: string | null;
  schoolName?: string | null;
  age?: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  children?: {
    id: number;
    childrenName: string;
  };
  childAssistanceDocs?: ChildAssistanceDoc[];
}

export interface ChildAssistanceDoc {
  id: number;
  childAssistanceId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ChildAssistancePaginatedResponse {
  data: ChildAssistance[];
  pagination: PaginationResponse;
}

export const getChildAssistance = async (
  childrenId?: number
): Promise<ChildAssistance[]> => {
  try {
    const url = childrenId
      ? `${API_CHILD_ASSISTANCE}?childrenId=${childrenId}`
      : API_CHILD_ASSISTANCE;
    const json = await apiClient<ApiResponseList<ChildAssistance>>(url);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance[];
  } catch (error) {
    throw error;
  }
};

export const getAllChildAssistanceOptimized = async (
  page: number = 1,
  pageSize: number = 20,
  search: string = ""
): Promise<ChildAssistancePaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search);
    }
    
    const url = `${API_CHILD_ASSISTANCE_OPTIMIZED}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<ChildAssistance> & { pagination: PaginationResponse }>(url);
    
    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance[];
    const pagination = json.pagination;
    
    return {
      data: Array.isArray(data) ? data : [],
      pagination: pagination || {
        page: 1,
        pageSize: pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getChildAssistanceById = async (id: number | string): Promise<ChildAssistance> => {
  try {
    const json = await apiClient<ApiResponseSingle<ChildAssistance>>(
      `${API_CHILD_ASSISTANCE}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance;
  } catch (error) {
    throw error;
  }
};

export const createChildAssistance = async (fd: FormData) => {
  return await fetchWithAuth(API_CHILD_ASSISTANCE, {
    method: "POST",
    body: fd,
  });
};

export const updateChildAssistance = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_CHILD_ASSISTANCE}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteChildAssistance = async (id: number) => {
  try {
    return await deleteResource(`${API_CHILD_ASSISTANCE}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteChildAssistanceDocument = async (
  assistanceId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_CHILD_ASSISTANCE}/${assistanceId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};

export const getAllChildAssistanceByYear = async (
  year: number
): Promise<ChildAssistance[]> => {
  try {
    // Get all records without date filter from API
    const params = new URLSearchParams({
      pageSize: '9999', // Get all records
      page: '1'
    });
    
    const url = `${API_CHILD_ASSISTANCE_OPTIMIZED}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<ChildAssistance> & { pagination: PaginationResponse }>(url);
    
    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance[];
    const allData = Array.isArray(data) ? data : [];
    
    // Filter by assistance date on client side
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st end of day
    
    const filteredData = allData.filter((item) => {
      if (!item.assistanceDate) return false;
      const assistanceDate = new Date(item.assistanceDate);
      return assistanceDate >= startDate && assistanceDate <= endDate;
    });
    
    return filteredData;
  } catch (error) {
    throw error;
  }
};