import { apiClient } from "../fetch/apiClient";
import { API_STAFF } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface Staff {
  id: number;
  staffName: string;
  gender: "M" | "F";
  birthplace: string | null;
  birthdate: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  nik: string;
  roleId: number;
  staffPict: string | null;
  roleName?: string;
}

export const getStaffs = async (): Promise<Staff[]> => {
  try {
    const json = await apiClient<ApiResponseList<Staff>>(API_STAFF);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Staff[];
  } catch (error) {
    throw error;
  }
};

export const getStaff = async (id: number | string): Promise<Staff> => {
  try {
    const json = await apiClient<ApiResponseSingle<Staff>>(`${API_STAFF}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Staff;
  } catch (error) {
    throw error;
  }
};

export const createStaff = async (fd: FormData) => {
  return await fetchWithAuth(API_STAFF, {
    method: "POST",
    body: fd,
  });
};

export const updateStaff = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_STAFF}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteStaff = async (id: number) => {
  try {
    return await deleteResource(`${API_STAFF}/${id}`);
  } catch (error) {
    throw error;
  }
};