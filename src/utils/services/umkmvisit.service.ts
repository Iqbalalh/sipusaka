import { apiClient } from "../fetch/apiClient";
import { API_UMKM_VISIT } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface UmkmVisit {
  id: number;
  umkmId: number;
  visitNumber: number;
  assistanceDate: string;
  assistanceType: string;
  itemType: string;
  assistanceAmount: number;
  assistanceSource: string;
  value: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  umkm?: {
    id: number;
    businessName: string;
    ownerName: string;
    partners?: {
      id: number;
      partnerName: string;
    };
    employees?: {
      id: number;
      employeeName: string;
    };
  };
  umkmVisitDocs?: UmkmVisitDoc[];
}

export interface UmkmVisitDoc {
  id: number;
  umkmVisitId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export const getUmkmVisits = async (
  umkmId?: number
): Promise<UmkmVisit[]> => {
  try {
    const url = umkmId ? `${API_UMKM_VISIT}?umkmId=${umkmId}` : API_UMKM_VISIT;
    const json = await apiClient<ApiResponseList<UmkmVisit>>(url);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as UmkmVisit[];
  } catch (error) {
    throw error;
  }
};

export const getUmkmVisit = async (id: number | string): Promise<UmkmVisit> => {
  try {
    const json = await apiClient<ApiResponseSingle<UmkmVisit>>(
      `${API_UMKM_VISIT}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as UmkmVisit;
  } catch (error) {
    throw error;
  }
};

export const createUmkmVisit = async (fd: FormData) => {
  return await fetchWithAuth(API_UMKM_VISIT, {
    method: "POST",
    body: fd,
  });
};

export const updateUmkmVisit = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_UMKM_VISIT}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteUmkmVisit = async (id: number) => {
  try {
    return await deleteResource(`${API_UMKM_VISIT}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteUmkmVisitDocument = async (
  visitId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_UMKM_VISIT}/${visitId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};