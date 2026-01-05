import { ApiError } from "@/types/generic/api-error";
import { fetchWithAuth } from "./fetchWithAuth";

type ApiOptions = RequestInit & {
  skipAuth?: boolean;
};

export const apiClient = async <T>(
  url: string,
  options?: ApiOptions
): Promise<T> => {
  const res = await fetchWithAuth(url, options);

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Ignore JSON parse errors
  }

  if (!res.ok) {
    throw new ApiError(
      json?.message || "Terjadi kesalahan pada server",
      res.status,
      json
    );
  }

  return json;
};
