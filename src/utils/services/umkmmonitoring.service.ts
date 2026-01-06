import { apiClient } from "../fetch/apiClient";
import { API_UMKM_MONITORING } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface UmkmMonitoring {
  id: number;
  umkmId: number;
  visitNumber: number;
  monitoringDate: string;
  surveyor: string;
  turnoverBefore: number | null;
  turnoverAfter: number | null;
  workersBefore: number | null;
  workersAfter: number | null;
  productionBefore: number | null;
  productionAfter: number | null;
  customersBefore: number | null;
  customersAfter: number | null;
  benefitLevel: string | null;
  challenges: string | null;
  developmentNeeds: string | null;
  otherNotes: string | null;
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
  umkmMonitoringDocs?: UmkmMonitoringDoc[];
}

export interface UmkmMonitoringDoc {
  id: number;
  umkmMonitoringId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export const getUmkmMonitoring = async (
  umkmId?: number
): Promise<UmkmMonitoring[]> => {
  try {
    const url = umkmId
      ? `${API_UMKM_MONITORING}?umkmId=${umkmId}`
      : API_UMKM_MONITORING;
    const json = await apiClient<ApiResponseList<UmkmMonitoring>>(url);
    return camelcaseKeys(json.data ?? json, {
      deep: true,
    }) as unknown as UmkmMonitoring[];
  } catch (error) {
    throw error;
  }
};

export const getUmkmMonitoringById = async (
  id: number | string
): Promise<UmkmMonitoring> => {
  try {
    const json = await apiClient<ApiResponseSingle<UmkmMonitoring>>(
      `${API_UMKM_MONITORING}/${id}`
    );
    return camelcaseKeys(json.data ?? json, {
      deep: true,
    }) as unknown as UmkmMonitoring;
  } catch (error) {
    throw error;
  }
};

export const createUmkmMonitoring = async (fd: FormData) => {
  return await fetchWithAuth(API_UMKM_MONITORING, {
    method: "POST",
    body: fd,
  });
};

export const updateUmkmMonitoring = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_UMKM_MONITORING}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteUmkmMonitoring = async (id: number) => {
  try {
    return await deleteResource(`${API_UMKM_MONITORING}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteUmkmMonitoringDocument = async (
  monitoringId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_UMKM_MONITORING}/${monitoringId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};