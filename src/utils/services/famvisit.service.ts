import { apiClient } from "../fetch/apiClient";
import { API_FAMILY_VISIT } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface FamilyVisit {
  id: number;
  homeId: number;
  visitDate: string;
  visitNumber: number;
  officer: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  homes?: {
    id: number;
    employees?: {
      id: number;
      employeeName: string;
      nipNipp: string;
    };
    partners?: {
      id: number;
      partnerName: string;
    };
  };
  familyVisitDocs?: FamilyVisitDoc[];
}

export interface FamilyVisitDoc {
  id: number;
  familyVisitId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export const getFamilyVisits = async (
  homeId?: number
): Promise<FamilyVisit[]> => {
  try {
    const url = homeId ? `${API_FAMILY_VISIT}?homeId=${homeId}` : API_FAMILY_VISIT;
    const json = await apiClient<ApiResponseList<FamilyVisit>>(url);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as FamilyVisit[];
  } catch (error) {
    throw error;
  }
};

export const getFamilyVisit = async (id: number | string): Promise<FamilyVisit> => {
  try {
    const json = await apiClient<ApiResponseSingle<FamilyVisit>>(
      `${API_FAMILY_VISIT}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as FamilyVisit;
  } catch (error) {
    throw error;
  }
};

export const createFamilyVisit = async (fd: FormData) => {
  return await fetchWithAuth(API_FAMILY_VISIT, {
    method: "POST",
    body: fd,
  });
};

export const updateFamilyVisit = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_FAMILY_VISIT}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteFamilyVisit = async (id: number) => {
  try {
    return await deleteResource(`${API_FAMILY_VISIT}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteFamilyVisitDocument = async (
  visitId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_FAMILY_VISIT}/${visitId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};