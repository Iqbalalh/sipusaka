export const validateImage = (
  file: File,
  opts = {
    maxSizeMB: 1,
    types: ["image/jpeg", "image/png", "image/webp"],
  }
) => {
  if (!opts.types.includes(file.type)) {
    return "Format file tidak valid";
  }

  if (file.size > opts.maxSizeMB * 1024 * 1024) {
    return `Ukuran maksimal ${opts.maxSizeMB}MB`;
  }

  return null;
};
