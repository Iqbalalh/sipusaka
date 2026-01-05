import { Children } from "@/types/models/children";
import { apiClient } from "../fetch/apiClient";
import { API_CHILDREN } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getChildrens = async (): Promise<Children[]> => {
  try {
    const json = await apiClient<ApiResponseList<Children>>(API_CHILDREN);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children[];
  } catch (error) {
    throw error;
  }
};

export const getChildren = async (id: number | string): Promise<Children> => {
  try {
    const json = await apiClient<ApiResponseSingle<Children>>(`${API_CHILDREN}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Children;
  } catch (error) {
    throw error;
  }
};

export const createChildren = async (fd: FormData) => {
  return await fetchWithAuth(API_CHILDREN, {
    method: "POST",
    body: fd,
  });
};

export const updateChildren = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_CHILDREN}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteChildren = async (id: number) => {
  try {
    return await deleteResource(`${API_CHILDREN}/${id}`);
  } catch (error) {
    throw error;
  }
};