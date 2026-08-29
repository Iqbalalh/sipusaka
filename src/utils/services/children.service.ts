import { Children } from "@/types/models/children";
export type { Children };
import { apiClient } from "../fetch/apiClient";
import { API_CHILDREN } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponsePaginated,
} from "@/types/generic/api-response";
import { fetchWithAuth } from "../fetch/fetchWithAuth";
import { crudService, Pagination } from "./crud";

export const {
  list: getChildrens,
  get: getChildren,
  create: createChildren,
  update: updateChildren,
  remove: deleteChildren,
} = crudService<Children>(API_CHILDREN);

export const assignChildToHome = async (childId: number, homeId: number) => {
  return await fetchWithAuth(`${API_CHILDREN}/${childId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeId }),
  });
};

export interface ChildrenFilters {
  educationLevel?: string;
  yatimStatus?: string;
  regionId?: number;
  isActive?: boolean;
  isCondition?: boolean;
  ageSort?: "asc" | "desc";
  gender?: string;
}

export interface ChildrenOptimizedResponse {
  data: Children[];
  pagination: Pagination;
}

// Children filters go over the wire as flat query params, not the JSON
// `filters` blob the shared paginatedFetch sends.
const childrenParams = (search: string, filters?: ChildrenFilters) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters?.educationLevel)
    params.append("educationLevel", filters.educationLevel);
  if (filters?.yatimStatus) params.append("yatimStatus", filters.yatimStatus);
  if (filters?.regionId) params.append("regionId", String(filters.regionId));
  if (filters?.isActive !== undefined)
    params.append("isActive", String(filters.isActive));
  if (filters?.isCondition !== undefined)
    params.append("isCondition", String(filters.isCondition));
  if (filters?.gender) params.append("gender", filters.gender);
  if (filters?.ageSort) params.append("ageSort", filters.ageSort);
  return params;
};

export const getChildrenOptimized = async (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  filters?: ChildrenFilters
): Promise<ChildrenOptimizedResponse> => {
  const params = childrenParams(search, filters);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const json = await apiClient<ApiResponsePaginated<Children>>(
    `${API_CHILDREN}/optimized?${params.toString()}`
  );

  return {
    data: camelcaseKeys(json.data ?? json, {
      deep: true,
    }) as unknown as Children[],
    pagination: json.pagination || { page, pageSize, total: 0, totalPages: 0 },
  };
};

export interface ChildrenStats {
  total: number;
  active: number;
  inactive: number;
  yatim: number;
  piatu: number;
  yatimPiatu: number;
  abk: number;
  yatimActive: number;
  piatuActive: number;
  yatimPiatuActive: number;
  abkActive: number;
  yatimInactive: number;
  piatuInactive: number;
  yatimPiatuInactive: number;
  abkInactive: number;
  totalDana: number;
  totalBantuan: number;
  totalDanaActive: number;
  totalBantuanActive: number;
  totalDanaInactive: number;
  totalBantuanInactive: number;
}

export const getChildrenStats = async (
  search: string = "",
  filters?: Omit<ChildrenFilters, "ageSort">
): Promise<ChildrenStats> => {
  const qs = childrenParams(search, filters).toString();
  const res = await fetchWithAuth(
    `${API_CHILDREN}/stats${qs ? `?${qs}` : ""}`
  );
  const json = await res.json();
  return json.data as ChildrenStats;
};

export const getChildrenForExport = async (
  filters?: ChildrenFilters
): Promise<Children[]> => {
  const qs = childrenParams("", filters).toString();
  const json = await apiClient<ApiResponseList<Children>>(
    `${API_CHILDREN}/export${qs ? `?${qs}` : ""}`
  );

  return camelcaseKeys(json.data ?? json, {
    deep: true,
    exclude: [/^_/],
  }) as unknown as Children[];
};
