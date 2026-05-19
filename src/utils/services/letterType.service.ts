import { LetterType } from "@/types/models/letterType";
import { apiClient } from "../fetch/apiClient";
import { API_LETTER_TYPES } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import { ApiResponseList, ApiResponseSingle } from "@/types/generic/api-response";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

const normalizeLetterType = (raw: any): LetterType => {
  const lt = camelcaseKeys(raw, { deep: true }) as any;
  if (!Array.isArray(lt.templateFields)) lt.templateFields = [];
  return lt as LetterType;
};

const normalizeLetterTypes = (raw: any[]): LetterType[] => raw.map(normalizeLetterType);

export const getLetterTypes = async (): Promise<LetterType[]> => {
  const json = await apiClient<ApiResponseList<LetterType>>(API_LETTER_TYPES);
  return normalizeLetterTypes(json.data ?? json);
};

export const getActiveLetterTypes = async (): Promise<LetterType[]> => {
  const json = await apiClient<ApiResponseList<LetterType>>(`${API_LETTER_TYPES}/active`);
  return normalizeLetterTypes(json.data ?? json);
};

export const getLetterType = async (id: number | string): Promise<LetterType> => {
  if (!id || id === "undefined" || isNaN(Number(id))) throw new Error("ID Template Surat tidak valid");
  const json = await apiClient<ApiResponseSingle<LetterType>>(`${API_LETTER_TYPES}/${id}`);
  return normalizeLetterType(json.data ?? json);
};

export const createLetterType = async (fd: FormData) => {
  return await fetchWithAuth(API_LETTER_TYPES, { method: "POST", body: fd });
};

export const updateLetterType = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_LETTER_TYPES}/${id}`, { method: "PATCH", body: fd });
};

export const updateLetterTypeCounter = async (id: string | number, currentCounter: number) => {
  return await fetchWithAuth(`${API_LETTER_TYPES}/${id}/counter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentCounter }),
  });
};

export const deleteLetterType = async (id: number) => {
  return await fetchWithAuth(`${API_LETTER_TYPES}/${id}`, { method: "DELETE" });
};

export const generatePreview = async (
  id: number | string,
  fields: Record<string, string>,
  letterDate?: string
): Promise<Blob> => {
  // Bypass fetchWithAuth auto-snakecasing so template field keys are preserved as-is
  const payload: Record<string, any> = { fields };
  if (letterDate) payload.letter_date = letterDate;
  const res = await fetchWithAuth(`${API_LETTER_TYPES}/${id}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload) as any,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Gagal membuat pratinjau dokumen");
  }
  return await res.blob();
};
