import { useState, useEffect, useCallback } from "react";
import { validateImage } from "@/utils/validator/validateImage";

interface FileWithPreview {
  file: File;
  preview: string;
}

export const useMultipleFilePreview = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];

    for (const file of fileArray) {
      const error = validateImage(file, { maxSizeMB: 20, types: ["image/jpeg", "image/png", "image/webp"] });
      if (error) {
        console.warn(`File ${file.name} skipped: ${error}`);
        continue;
      }
      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
    return validFiles.length;
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index]) {
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
      }
      return newFiles;
    });
  }, []);

  const clearFiles = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  // Cleanup memory on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    hasFiles: files.length > 0,
    fileCount: files.length,
  };
};
