import { Home, HomeTable } from "@/types/models/home";
import { apiClient } from "../fetch/apiClient";
import { API_HOME } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getHomes = async (): Promise<HomeTable[]> => {
  try {
    const json = await apiClient<ApiResponseList<HomeTable>>(API_HOME);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as HomeTable[];
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