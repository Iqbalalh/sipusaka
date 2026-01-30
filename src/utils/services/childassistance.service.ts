import { apiClient } from "../fetch/apiClient";
import { API_CHILD_ASSISTANCE } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface ChildAssistance {
  id: number;
  childrenId: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceProvider: string;
  assistanceAmount: number;
  educationLevel?: string | null;
  educationGrade?: string | null;
  schoolName?: string | null;
  age?: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  children?: {
    id: number;
    childrenName: string;
  };
  childAssistanceDocs?: ChildAssistanceDoc[];
}

export interface ChildAssistanceDoc {
  id: number;
  childAssistanceId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export const getChildAssistance = async (
  childrenId?: number
): Promise<ChildAssistance[]> => {
  try {
    const url = childrenId
      ? `${API_CHILD_ASSISTANCE}?childrenId=${childrenId}`
      : API_CHILD_ASSISTANCE;
    const json = await apiClient<ApiResponseList<ChildAssistance>>(url);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance[];
  } catch (error) {
    throw error;
  }
};

export const getChildAssistanceById = async (id: number | string): Promise<ChildAssistance> => {
  try {
    const json = await apiClient<ApiResponseSingle<ChildAssistance>>(
      `${API_CHILD_ASSISTANCE}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as ChildAssistance;
  } catch (error) {
    throw error;
  }
};

export const createChildAssistance = async (fd: FormData) => {
  return await fetchWithAuth(API_CHILD_ASSISTANCE, {
    method: "POST",
    body: fd,
  });
};

export const updateChildAssistance = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_CHILD_ASSISTANCE}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteChildAssistance = async (id: number) => {
  try {
    return await deleteResource(`${API_CHILD_ASSISTANCE}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const deleteChildAssistanceDocument = async (
  assistanceId: number,
  docId: number
) => {
  try {
    return await deleteResource(
      `${API_CHILD_ASSISTANCE}/${assistanceId}/documents/${docId}`
    );
  } catch (error) {
    throw error;
  }
};