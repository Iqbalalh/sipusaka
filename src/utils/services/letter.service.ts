import { Letter } from "@/types/models/letter";
import { apiClient } from "../fetch/apiClient";
import { API_LETTERS } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

// Normalize letter response to handle different backend formats
const normalizeLetter = (raw: any): Letter => {
  const letter = camelcaseKeys(raw, { deep: true }) as any;

  // documentUrl: use documentUrl, or documentPath if it looks like a URL
  if (!letter.documentUrl && letter.documentPath && letter.documentPath.startsWith("http")) {
    letter.documentUrl = letter.documentPath;
  }

  // signedDocumentUrl: same pattern
  if (!letter.signedDocumentUrl && letter.signedDocumentPath && letter.signedDocumentPath.startsWith("http")) {
    letter.signedDocumentUrl = letter.signedDocumentPath;
  }

  // letterApprovals: handle "approvals" alias
  if (!letter.letterApprovals && letter.approvals) {
    letter.letterApprovals = letter.approvals;
  }

  // Normalize signer staffName: handle "name" alias
  for (const key of ["signer1", "signer2", "signer3"] as const) {
    if (letter[key] && !letter[key].staffName && letter[key].name) {
      letter[key].staffName = letter[key].name;
    }
  }

  return letter as Letter;
};

const normalizeLetters = (raw: any[]): Letter[] => raw.map(normalizeLetter);

export const getLetters = async (): Promise<Letter[]> => {
  const json = await apiClient<ApiResponseList<Letter>>(API_LETTERS);
  return normalizeLetters(json.data ?? json);
};

export const getLettersByStatus = async (status: string): Promise<Letter[]> => {
  const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/status?status=${status}`);
  return normalizeLetters(json.data ?? json);
};

export const getDraftLetters = async (): Promise<Letter[]> => {
  const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/drafts`);
  return normalizeLetters(json.data ?? json);
};

export const getPendingLetters = async (): Promise<Letter[]> => {
  const json = await apiClient<ApiResponseList<Letter>>(`${API_LETTERS}/pending`);
  return normalizeLetters(json.data ?? json);
};

export const getLetter = async (id: number | string): Promise<Letter> => {
  const json = await apiClient<ApiResponseSingle<Letter>>(`${API_LETTERS}/${id}`);
  return normalizeLetter(json.data ?? json);
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

export const submitLetter = async (id: number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/submit`, {
    method: "POST",
  });
};

export const approveLetter = async (
  id: number,
  placement?: { signaturePage: number; signatureX: number; signatureY: number }
) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/approve`, {
    method: "POST",
    body: placement ? (placement as any) : ({} as any),
  });
};

export const rejectLetter = async (id: number, actionNote: string) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/reject`, {
    method: "POST",
    body: { actionNote } as any,
  });
};

export const cancelLetter = async (id: number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/cancel`, {
    method: "POST",
  });
};

export const publishLetter = async (
  id: number,
  placement?: { qrPage: number; qrX: number; qrY: number }
) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/publish`, {
    method: "POST",
    body: placement ? (placement as any) : ({} as any),
  });
};

export const verifyLetterByToken = async (token: string) => {
  const res = await fetch(`${API_LETTERS}/verify/${token}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Surat tidak ditemukan");
  return json;
};
