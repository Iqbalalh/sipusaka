import { apiClient } from "../fetch/apiClient";
import { API_SOCIAL_ASSISTANCE, API_SOCIAL_ASSISTANCE_OPTIMIZED } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

// Social Assistance Types (single medical equipment)
export interface SocialAssistanceDoc {
  id: number;
  socialAssistanceId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export interface SocialAssistance {
  id: number;
  nipNipp?: string | null;
  recipientName?: string | null;
  ktpAddress?: string | null;
  region?: string | null;
  condition?: string | null;
  medicalEquipment?: string | null;
  equipmentQuantity?: number | null;
  equipmentNominal?: number | null;
  cashAmount?: number | null;
  totalAmount?: number | null;
  notes?: string | null;
  documents?: SocialAssistanceDoc[];
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
  medicalEquipment?: string | null;
  equipmentQuantity?: number | null;
  equipmentNominal?: number | null;
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

export const createSocialAssistance = async (fd: FormData) => {
  return await fetchWithAuth(API_SOCIAL_ASSISTANCE, {
    method: "POST",
    body: fd,
  });
};

export const updateSocialAssistance = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_SOCIAL_ASSISTANCE}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteSocialAssistance = async (id: number) => {
  try {
    return await deleteResource(`${API_SOCIAL_ASSISTANCE}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteSocialAssistanceDocument = async (
  assistanceId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_SOCIAL_ASSISTANCE}/${assistanceId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};

// Import result type
export interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    totalRows: number;
    insertedRows: number;
    skippedRows: number;
  };
  errors?: string[];
}

// Import Excel file
export const importSocialAssistanceFromExcel = async (
  file: File
): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithAuth(`${API_SOCIAL_ASSISTANCE}/import`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, let the browser set it with boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Import failed" }));
      throw new Error(errorData.message || "Import failed");
    }

    const result = await response.json();
    return result as ImportResult;
  } catch (error) {
    throw error;
  }
};

// Download template
export const downloadSocialAssistanceTemplate = async (): Promise<void> => {
  try {
    const response = await fetchWithAuth(`${API_SOCIAL_ASSISTANCE}/template`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to download template");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-bantuan-sosial.xlsx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    throw error;
  }
};
