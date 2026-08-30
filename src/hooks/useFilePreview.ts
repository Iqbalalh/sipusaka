import { useState, useEffect, useCallback } from "react";
import { validateImage } from "@/utils/validator/validateImage";
import { compressImage } from "@/utils/image/compressImage";

export const useFilePreview = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const selectFile = useCallback(async (f: File) => {
    const error = validateImage(f);
    if (error) throw new Error(error);

    const compressed = await compressImage(f);

    if (preview) URL.revokeObjectURL(preview);

    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  }, [preview]);

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  }, [preview]);

  // Cleanup memori saat komponen di-unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return { file, preview, selectFile, clearFile };
};