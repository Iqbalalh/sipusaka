import camelcaseKeys from "camelcase-keys";
import { fetchWithAuth } from "./fetchWithAuth";

interface FetchDataParams<T> {
  url: string;
  onSuccess: (data: T) => void;
  setLoading?: (val: boolean) => void;
  errorMessage?: string;
  deepCamelcase?: boolean;

  onErrorPopup?: (message: string) => void;
}

export const fetchDataInfo = async <T>({
  url,
  onSuccess,
  setLoading,
  errorMessage = "Terjadi kesalahan saat mengambil data.",
  deepCamelcase = true,
  onErrorPopup,
}: FetchDataParams<T>) => {
  try {
    setLoading?.(true);

    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Fetch failed");

    const response = await res.json();
    const rawData = response?.data;

    if (!rawData) throw new Error("Empty response");

    const parsedData = deepCamelcase
      ? (camelcaseKeys(rawData, { deep: true }) as T)
      : (rawData as T);

    onSuccess(parsedData);
  } catch (error) {
    console.error(error);

    if (onErrorPopup) {
      onErrorPopup(errorMessage);
    }
  } finally {
    setLoading?.(false);
  }
};
