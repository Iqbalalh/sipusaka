import { Wali } from "@/types/models/wali";
import { apiClient } from "../fetch/apiClient";
import { API_WALI } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getWalis = async (): Promise<Wali[]> => {
  try {
    const json = await apiClient<ApiResponseList<Wali>>(API_WALI);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali[];
  } catch (error) {
    throw error;
  }
};

export const getWali = async (id: number | string): Promise<Wali> => {
  try {
    const json = await apiClient<ApiResponseSingle<Wali>>(`${API_WALI}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali;
  } catch (error) {
    throw error;
  }
};

export const updateWali = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_WALI}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteWali = async (id: number) => {
  try {
    return await deleteResource(`${API_WALI}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const getWaliList = async () => {
  try {
    const json = await apiClient<ApiResponseList<Wali>>(`${API_WALI}/list`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Wali[];
  } catch (error) {
    throw error;
  }
};