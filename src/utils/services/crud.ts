import camelcaseKeys from "camelcase-keys";
import { apiClient } from "../fetch/apiClient";
import { fetchWithAuth } from "../fetch/fetchWithAuth";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

const camel = <T>(value: unknown): T =>
  camelcaseKeys(value as never, { deep: true }) as unknown as T;

const buildQuery = (
  search?: string,
  filters?: Record<string, string[]>,
  base?: Record<string, string>
) => {
  const params = new URLSearchParams(base);
  if (search?.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) {
    params.append("filters", JSON.stringify(filters));
  }
  return params.toString();
};

/** The five CRUD calls every resource in this app shares. */
export const crudService = <T>(baseUrl: string) => ({
  list: async (): Promise<T[]> => {
    const json = await apiClient<ApiResponseList<T>>(baseUrl);
    return camel<T[]>(json.data ?? json);
  },
  get: async (id: number | string): Promise<T> => {
    const json = await apiClient<ApiResponseSingle<T>>(`${baseUrl}/${id}`);
    return camel<T>(json.data ?? json);
  },
  create: (fd: FormData) =>
    fetchWithAuth(baseUrl, { method: "POST", body: fd }),
  update: (id: string | number, fd: FormData) =>
    fetchWithAuth(`${baseUrl}/${id}`, { method: "PATCH", body: fd }),
  remove: async (id: number): Promise<void> => {
    await apiClient<void>(`${baseUrl}/${id}`, { method: "DELETE" });
  },
});

/** Server-side paginated list: `?page&pageSize&search&filters`. */
export const paginatedFetch =
  <T>(url: string) =>
  async (
    page = 1,
    pageSize = 50,
    search = "",
    filters?: Record<string, string[]>
  ): Promise<Paginated<T>> => {
    const qs = buildQuery(search, filters, {
      page: String(page),
      pageSize: String(pageSize),
    });
    const json = await apiClient<
      ApiResponseList<T> & { pagination: Pagination }
    >(`${url}?${qs}`);
    const data = camel<T[]>(json.data ?? []);
    return {
      data: Array.isArray(data) ? data : [],
      pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 },
    };
  };

/** Aggregate counts for a table's insight panel, honouring the same filters. */
export const summaryFetch =
  <S>(url: string) =>
  async (
    search?: string,
    filters?: Record<string, string[]>
  ): Promise<S> => {
    const qs = buildQuery(search, filters);
    const json = await apiClient<{ data: S }>(qs ? `${url}?${qs}` : url);
    return json.data;
  };
