import { apiClient } from "../fetch/apiClient";
import { API_SOCIAL_ASSISTANCE, API_SOCIAL_ASSISTANCE_OPTIMIZED } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

// Medical Equipment Types
export interface MedicalEquipmentItem {
  type: string;
  quantity: number;
  nominal: number;
}

export interface SocialAssistance {
  id: number;
  nipNipp?: string | null;
  recipientName?: string | null;
  ktpAddress?: string | null;
  region?: string | null;
  condition?: string | null;
  medicalEquipment?: MedicalEquipmentItem[] | null;
  cashAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SocialAssistancePaginatedResponse {
  data: SocialAssistance[];
  pagination: PaginationResponse;
}

export interface SocialAssistanceFormData {
  nipNipp?: string | null;
  recipientName?: string | null;
  ktpAddress?: string | null;
  region?: string | null;
  condition?: string | null;
  medicalEquipment?: MedicalEquipmentItem[] | null;
  cashAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
}

export const getSocialAssistance = async (): Promise<SocialAssistance[]> => {
  try {
    const json = await apiClient<ApiResponseList<SocialAssistance>>(API_SOCIAL_ASSISTANCE);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as SocialAssistance[];
  } catch (error) {
    throw error;
  }
};

export const getAllSocialAssistanceOptimized = async (
  page: number = 1,
  pageSize: number = 20,
  search: string = ""
): Promise<SocialAssistancePaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search.trim()) {
      params.append('search', search);
    }
    
    const url = `${API_SOCIAL_ASSISTANCE_OPTIMIZED}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<SocialAssistance> & { pagination: PaginationResponse }>(url);
    
    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as SocialAssistance[];
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

export const getSocialAssistanceById = async (id: number | string): Promise<SocialAssistance> => {
  try {
    const json = await apiClient<ApiResponseSingle<SocialAssistance>>(
      `${API_SOCIAL_ASSISTANCE}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as SocialAssistance;
  } catch (error) {
    throw error;
  }
};

export const createSocialAssistance = async (data: SocialAssistanceFormData) => {
  return await fetchWithAuth(API_SOCIAL_ASSISTANCE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const updateSocialAssistance = async (id: string | number, data: SocialAssistanceFormData) => {
  return await fetchWithAuth(`${API_SOCIAL_ASSISTANCE}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const deleteSocialAssistance = async (id: number) => {
  try {
    return await deleteResource(`${API_SOCIAL_ASSISTANCE}/${id}`);
  } catch (error) {
    throw error;
  }
};
