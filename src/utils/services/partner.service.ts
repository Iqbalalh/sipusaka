import { Partner } from "@/types/models/partner";
import { apiClient } from "../fetch/apiClient";
import { API_PARTNER } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getPartners = async (): Promise<Partner[]> => {
  try {
    const json = await apiClient<ApiResponseList<Partner>>(API_PARTNER);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Partner[];
  } catch (error) {
    throw error;
  }
};

export const getPartner = async (id: number | string): Promise<Partner> => {
  try {
    const json = await apiClient<ApiResponseSingle<Partner>>(`${API_PARTNER}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Partner;
  } catch (error) {
    throw error;
  }
};

export const updatePartner = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_PARTNER}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deletePartner = async (id: number) => {
  try {
    return await deleteResource(`${API_PARTNER}/${id}`);
  } catch (error) {
    throw error;
  }
};