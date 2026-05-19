import { Home, HomeTable } from "@/types/models/home";
import { apiClient } from "../fetch/apiClient";
import { API_HOME, API_HOME_EXPORT, API_HOME_OPTIMIZED, API_HOME_SUMMARY } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HomePaginatedResponse {
  data: HomeTable[];
  pagination: PaginationResponse;
}

export const getHomes = async (): Promise<HomeTable[]> => {
  try {
    const json = await apiClient<ApiResponseList<HomeTable>>(API_HOME);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as HomeTable[];
  } catch (error) {
    throw error;
  }
};

export const getHomesOptimized = async (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  filters?: Record<string, any>
): Promise<HomePaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search.trim()) params.append("search", search);
    if (filters && Object.keys(filters).length > 0) {
      params.append("filters", JSON.stringify(filters));
    }

    const url = `${API_HOME_OPTIMIZED}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<HomeTable> & { pagination: PaginationResponse }>(url);

    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as HomeTable[];
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

export const getHome = async (id: number | string): Promise<Home> => {
  try {
    const json = await apiClient<ApiResponseSingle<Home>>(`${API_HOME}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Home;
  } catch (error) {
    throw error;
  }
};

export const getHomeDetail = async (id: number | string): Promise<Home> => {
  try {
    const json = await apiClient<ApiResponseSingle<Home>>(`${API_HOME}/detail/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Home;
  } catch (error) {
    throw error;
  }
};

export const getHomeWithIds = async (id: number | string): Promise<Home> => {
  try {
    const json = await apiClient<ApiResponseSingle<Home>>(`${API_HOME}/detail/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Home;
  } catch (error) {
    throw error;
  }
};

export const updateHome = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_HOME}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteHome = async (id: number) => {
  try {
    return await deleteResource(`${API_HOME}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const getHomesList = async (): Promise<HomeTable[]> => {
  try {
    const json = await apiClient<ApiResponseList<HomeTable>>(API_HOME);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as HomeTable[];
  } catch (error) {
    throw error;
  }
};

export const getHomesForExport = async (search?: string, filters?: Record<string, any>): Promise<HomeTable[]> => {
  try {
    const params = new URLSearchParams();
    if (search?.trim()) params.append("search", search.trim());
    if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
    const qs = params.toString();
    const url = qs ? `${API_HOME_EXPORT}?${qs}` : API_HOME_EXPORT;
    const json = await apiClient<ApiResponseList<HomeTable>>(url);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as HomeTable[];
  } catch (error) {
    throw error;
  }
};

// Loads all homes using the optimized endpoint (same data structure as table display)
export const getAllHomes = async (): Promise<HomeTable[]> => {
  try {
    const response = await getHomesOptimized(1, 9999, "");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export interface HomeSummary {
  totalFamilies: number;
  activeFamilies: number;
  totalChildren: number;
  totalAssistanceAmount: number;
}

export const getHomeSummary = async (search?: string, filters?: Record<string, any>): Promise<HomeSummary> => {
  try {
    const params = new URLSearchParams();
    if (search?.trim()) params.append("search", search.trim());
    if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
    const qs = params.toString();
    const url = qs ? `${API_HOME_SUMMARY}?${qs}` : API_HOME_SUMMARY;
    const json = await apiClient<ApiResponseSingle<HomeSummary>>(url);
    return json.data;
  } catch (error) {
    throw error;
  }
};