import { useState } from "react";
import { buildFormData } from "@/utils/form/buildFormData";
import { ApiError } from "@/types/generic/api-error";

export const useFormSubmit = (
  submitFn: (fd: FormData) => Promise<Response>,
  onSuccess?: (data?: any) => void
) => {
  const [loading, setLoading] = useState(false);

  const submit = async (data: Record<string, any>, extra?: FormData) => {
    setLoading(true);
    try {
      const fd = buildFormData(data);
      if (extra) {
        extra.forEach((value, key) => fd.append(key, value));
      }

      const res = await submitFn(fd);

      let result;
      try {
        result = await res.json();
      } catch {
        result = {};
      }

      if (!res.ok) {
        throw new ApiError(
          result.message || result.error || "Terjadi kesalahan pada server",
          res.status,
          result.data
        );
      }

      onSuccess?.(result);
      return { success: true, error: null };
    } catch (err: any) {
      const finalError =
        err instanceof ApiError
          ? err
          : new ApiError(err.message || "Unknown Error", 500);

      return { success: false, error: finalError };
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
};
