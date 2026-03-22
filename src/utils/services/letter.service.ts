import { apiClient } from "../fetch/apiClient";
import {
  API_LETTERS,
  API_LETTERS_OPTIMIZED,
  API_LETTERS_DRAFTS,
  API_LETTERS_PENDING,
} from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

// ============================================================================
// TYPES
// ============================================================================

export type LetterType =
  | "BANTUAN_PENDIDIKAN"
  | "BANTUAN_SOSIAL"
  | "SURAT_UNDANGAN"
  | "SURAT_PERMOHONAN"
  | "SURAT_KEPUTUSAN";

export type LetterStatus =
  | "DRAFT"
  | "PENDING_1"
  | "PENDING_2"
  | "PENDING_3"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export interface Signer {
  userId: number;
  username: string;
  staffs: {
    staffName: string;
    position: string | null;
    signaturePath: string | null;
  } | null;
}

export interface LetterDoc {
  id: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}

export interface Letter {
  id: number;
  letterType: LetterType;
  letterNumber: string | null;
  attachments: string | null;
  subject: string;
  createdAt: string;
  destination: string;
  tembusan: string | null;
  content: string | null;
  status: LetterStatus;
  signer1Id: number | null;
  signer2Id: number | null;
  signer3Id: number | null;
  approved1At: string | null;
  approved2At: string | null;
  approved3At: string | null;
  rejectedById: number | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  generatedDocPath: string | null;
  verificationHash: string | null;
  createdBy: number | null;
  editedBy: number | null;
  updatedAt: string;
  signer1: Signer | null;
  signer2: Signer | null;
  signer3: Signer | null;
  rejectedBy: Signer | null;
  letterDocs: LetterDoc[];
  // QR Signature paths for each signer
  signer1QrPath: string | null;
  signer2QrPath: string | null;
  signer3QrPath: string | null;
}

export interface LetterFormData {
  letterType: LetterType;
  letterNumber?: string | null;
  subject: string;
  destination: string;
  tembusan?: string | null;
  content?: string | null;
  signer1Id: number | null;
  signer2Id?: number | null;
  signer3Id?: number | null;
}

export interface PaginationResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface LetterPaginatedResponse {
  data: Letter[];
  pagination: PaginationResponse;
}

// ============================================================================
// GET REQUESTS
// ============================================================================

/**
 * Get all letters
 */
export const getAllLetters = async (): Promise<Letter[]> => {
  try {
    const json = await apiClient<ApiResponseList<Letter>>(API_LETTERS);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
  } catch (error) {
    throw error;
  }
};

/**
 * Get all letters with pagination
 */
export const getAllLettersOptimized = async (
  page: number = 1,
  pageSize: number = 20,
  search: string = "",
  status?: LetterStatus
): Promise<LetterPaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (search.trim()) {
      params.append("search", search);
    }

    if (status) {
      params.append("status", status);
    }

    const url = `${API_LETTERS_OPTIMIZED}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<Letter> & { pagination: PaginationResponse }>(url);

    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
    const pagination = json.pagination;

    return {
      data: Array.isArray(data) ? data : [],
      pagination: pagination || {
        page: 1,
        pageSize: pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get letter by ID
 */
export const getLetterById = async (id: string | number): Promise<Letter> => {
  try {
    const json = await apiClient<ApiResponseSingle<Letter>>(
      `${API_LETTERS}/${id}`
    );
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter;
  } catch (error) {
    throw error;
  }
};

/**
 * Get draft letters
 */
export const getDraftLetters = async (
  page: number = 1,
  pageSize: number = 20
): Promise<LetterPaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const url = `${API_LETTERS_DRAFTS}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<Letter> & { pagination: PaginationResponse }>(url);

    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
    const pagination = json.pagination;

    return {
      data: Array.isArray(data) ? data : [],
      pagination: pagination || {
        page: 1,
        pageSize: pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get pending letters for current user
 */
export const getPendingLetters = async (
  page: number = 1,
  pageSize: number = 20
): Promise<LetterPaginatedResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const url = `${API_LETTERS_PENDING}?${params.toString()}`;
    const json = await apiClient<ApiResponseList<Letter> & { pagination: PaginationResponse }>(url);

    const data = camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Letter[];
    const pagination = json.pagination;

    return {
      data: Array.isArray(data) ? data : [],
      pagination: pagination || {
        page: 1,
        pageSize: pageSize,
        total: 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// CREATE REQUEST
// ============================================================================

/**
 * Create new letter
 */
export const createLetter = async (data: LetterFormData) => {
  return await fetchWithAuth(API_LETTERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// ============================================================================
// UPDATE REQUEST
// ============================================================================

/**
 * Update letter
 */
export const updateLetter = async (
  id: string | number,
  data: Partial<LetterFormData>
) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

// ============================================================================
// DELETE REQUEST
// ============================================================================

/**
 * Delete letter
 */
export const deleteLetter = async (id: number) => {
  try {
    return await deleteResource(`${API_LETTERS}/${id}`);
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// WORKFLOW ACTIONS
// ============================================================================

/**
 * Submit letter for approval
 */
export const submitLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Approve letter
 */
export const approveLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Reject letter
 */
export const rejectLetter = async (
  id: string | number,
  rejectionReason?: string
) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rejectionReason }),
  });
};

/**
 * Archive letter
 */
export const archiveLetter = async (id: string | number) => {
  return await fetchWithAuth(`${API_LETTERS}/${id}/archive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
};
