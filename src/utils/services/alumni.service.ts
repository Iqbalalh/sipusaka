import { Alumni } from "@/types/models/alumni";
export type { Alumni };
import { apiClient } from "../fetch/apiClient";
import { API_ALUMNI } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponsePaginated,
} from "@/types/generic/api-response";
import { fetchWithAuth } from "../fetch/fetchWithAuth";
import { crudService, Pagination } from "./crud";

export const {
  list: getAlumnis,
  get: getAlumni,
  create: createAlumni,
  update: updateAlumni,
  remove: deleteAlumni,
} = crudService<Alumni>(API_ALUMNI);

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
  pagination: Pagination;
}

// Alumni filters go over the wire as flat query params, not the JSON `filters`
// blob the shared paginatedFetch sends.
const alumniParams = (search: string, filters?: AlumniFilters) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (filters?.educationLevel)
    params.append("educationLevel", filters.educationLevel);
  if (filters?.gender) params.append("gender", filters.gender);
  return params;
};

export const getAlumniOptimized = async (
  page: number = 1,
  pageSize: number = 50,
  search: string = "",
  filters?: AlumniFilters
): Promise<AlumniOptimizedResponse> => {
  const params = alumniParams(search, filters);
  params.append("page", page.toString());
  params.append("pageSize", pageSize.toString());

  const json = await apiClient<ApiResponsePaginated<Alumni>>(
    `${API_ALUMNI}/optimized?${params.toString()}`
  );

  return {
    data: camelcaseKeys(json.data ?? json, {
      deep: true,
    }) as unknown as Alumni[],
    pagination: json.pagination || { page, pageSize, total: 0, totalPages: 0 },
  };
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
  const qs = alumniParams(search, filters).toString();
  const res = await fetchWithAuth(
    `${API_ALUMNI}/stats${qs ? `?${qs}` : ""}`
  );
  const json = await res.json();
  return json.data as AlumniStats;
};

export const getAlumniForExport = async (
  search: string = "",
  filters?: AlumniFilters
): Promise<Alumni[]> => {
  const qs = alumniParams(search, filters).toString();
  const json = await apiClient<ApiResponseList<Alumni>>(
    `${API_ALUMNI}/export${qs ? `?${qs}` : ""}`
  );

  return camelcaseKeys(json.data ?? json, {
    deep: true,
    exclude: [/^_/],
  }) as unknown as Alumni[];
};
