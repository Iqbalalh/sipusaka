import { Employee } from "@/types/models/employee";
import { apiClient } from "../fetch/apiClient";
import { API_EMPLOYEE, API_EMPLOYEE_OPTIMIZED, API_EMPLOYEE_SUMMARY } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const json = await apiClient<ApiResponseList<Employee>>(API_EMPLOYEE);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Employee[];
  } catch (error) {
    throw error;
  }
};

export const getEmployee = async (id: number | string): Promise<Employee> => {
  try {
    const json = await apiClient<ApiResponseSingle<Employee>>(`${API_EMPLOYEE}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Employee;
  } catch (error) {
    throw error;
  }
};

export const updateEmployee = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_EMPLOYEE}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteEmployee = async (id: number) => {
  try {
    return await deleteResource(`${API_EMPLOYEE}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const createEmployee = async (fd: FormData) => {
  return await fetchWithAuth(API_EMPLOYEE, {
    method: "POST",
    body: fd,
  });
};

export interface EmployeePagination { page: number; pageSize: number; total: number; totalPages: number; }
export interface EmployeePaginatedResponse { data: Employee[]; pagination: EmployeePagination; }
export interface EmployeeSummary { total: number; active: number; inactive: number; }

export const getEmployeesOptimized = async (
  page = 1,
  pageSize = 50,
  search = "",
  filters?: Record<string, string[]>
): Promise<EmployeePaginatedResponse> => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const json = await apiClient<ApiResponseList<Employee> & { pagination: EmployeePagination }>(
    `${API_EMPLOYEE_OPTIMIZED}?${params.toString()}`
  );
  const data = camelcaseKeys(json.data ?? [], { deep: true }) as unknown as Employee[];
  return { data: Array.isArray(data) ? data : [], pagination: json.pagination ?? { page, pageSize, total: 0, totalPages: 1 } };
};

export const getEmployeeSummary = async (search?: string, filters?: Record<string, string[]>): Promise<EmployeeSummary> => {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  if (filters && Object.keys(filters).length > 0) params.append("filters", JSON.stringify(filters));
  const qs = params.toString();
  const json = await apiClient<{ data: EmployeeSummary }>(qs ? `${API_EMPLOYEE_SUMMARY}?${qs}` : API_EMPLOYEE_SUMMARY);
  return json.data;
};