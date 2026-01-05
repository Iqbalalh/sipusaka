import { Umkm } from "@/types/models/umkm";
import { apiClient } from "../fetch/apiClient";
import { API_UMKM } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getUmkmList = async (): Promise<Umkm[]> => {
  try {
    const json = await apiClient<ApiResponseList<Umkm>>(API_UMKM);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Umkm[];
  } catch (error) {
    throw error;
  }
};

export const getUmkm = async (id: number | string): Promise<Umkm> => {
  try {
    const json = await apiClient<ApiResponseSingle<Umkm>>(`${API_UMKM}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Umkm;
  } catch (error) {
    throw error;
  }
};

export const createUmkm = async (fd: FormData) => {
  return await fetchWithAuth(API_UMKM, {
    method: "POST",
    body: fd,
  });
};

export const updateUmkm = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_UMKM}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteUmkm = async (id: number) => {
  try {
    return await deleteResource(`${API_UMKM}/${id}`);
  } catch (error) {
    throw error;
  }
};