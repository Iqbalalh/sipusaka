export const validateImage = (
  file: File,
  opts = {
    maxSizeMB: 5,
    types: ["image/jpeg", "image/png", "image/webp"],
  }
) => {
  if (!opts.types.includes(file.type)) {
    return "Format file tidak valid";
  }

  if (file.size > opts.maxSizeMB * 5120 * 5120) {
    return `Ukuran maksimal ${opts.maxSizeMB}MB`;
  }

  return null;
};
