import { useState, useEffect, useCallback } from "react";
import { validateImage } from "@/utils/validator/validateImage";

export const useFilePreview = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const selectFile = useCallback((f: File) => {
    const error = validateImage(f);
    if (error) throw new Error(error);

    if (preview) URL.revokeObjectURL(preview);

    setFile(f);
    setPreview(URL.createObjectURL(f));
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