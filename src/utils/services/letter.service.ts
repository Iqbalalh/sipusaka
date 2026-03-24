import { Letter, LetterListResponse, ApprovalActionData } from "@/types/models/letter";
import { apiClient } from "../fetch/apiClient";
import { API_LETTERS, API_USERS } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getLetters = async (): Promise<Letter[]> => {
  try {
    const json = await apiClient<ApiResponseList<Letter>>(API_LETTERS);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
  } catch (error) {
    throw error;
  }
};

export const getLettersByStatus = async (status: string): Promise<Letter[]> => {
  try {
    const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/status?status=${status}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
  } catch (error) {
    throw error;
  }
};

export const getDraftLetters = async (): Promise<Letter[]> => {
  try {
    const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/drafts`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
  } catch (error) {
    throw error;
  }
};

export const getPendingApprovals = async (): Promise<Letter[]> => {
  try {
    const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/pending`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
  } catch (error) {
    throw error;
  }
};

export const getLetter = async (id: string | number): Promise<Letter> => {
  try {
    const json = await apiClient<ApiResponseSingle<Letter>>(`${API_LETTERS}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter;
  } catch (error) {
    throw error;
  }
};

export const createLetter = async (fd: FormData) => {
  return await fetchWithAuth(API_LETTERS, {
    method: "POST",
    body: fd,
  });
};

export const updateLetter = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteLetter = async (id: number) => {
  try {
    return await deleteResource(`${API_LETTERS}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const submitLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/submit`, {
    method: "POST",
  });
};

export const approveLetter = async (id: string | number, data?: ApprovalActionData) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/approve`, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
    headers: data ? { "Content-Type": "application/json" } : undefined,
  });
};

export const rejectLetter = async (id: string | number, data: ApprovalActionData) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
};

export const cancelLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/cancel`, {
    method: "POST",
  });
};

export const publishLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/publish`, {
    method: "POST",
  });
};

export const getUsers = async () => {
  try {
    const json = await apiClient<ApiResponseList<{ id: number; name: string; email: string }>>(API_USERS);
    return camelcaseKeys(json.data ?? json, { deep: true });
  } catch (error) {
    throw error;
  }
};
