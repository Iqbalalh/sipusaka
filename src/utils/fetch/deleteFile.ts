import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_DELETE_FILE } from "@/constants/endpoint";
import { extractKeyFromUrl } from "../formatter/extractKey";

/**
 * Fungsi universal untuk menghapus file/foto dari server S3
 * @param url - URL lengkap file yang akan dihapus
 * @returns Promise<{success: boolean, error?: any}>
 */
export const hardDeleteFile = async (url: string) => {
  const keyObject = extractKeyFromUrl(url);
  if (!keyObject) {
    throw new Error("Gagal memproses URL file.");
  }

  const res = await fetchWithAuth(API_DELETE_FILE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyObject }),
  });

  if (!res.ok) {
    throw new Error("Gagal menghapus file dari server.");
  }

  return { success: true };
};