import { Employee } from "@/types/models/employee";
import { apiClient } from "../fetch/apiClient";
import { API_EMPLOYEE } from "@/constants/endpoint";
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