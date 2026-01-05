export const buildFormData = <T extends Record<string, any>>(data: T) => {
  const fd = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    let finalValue = value;

    if (typeof value === "boolean") {
      finalValue = value ? 1 : 0;
    }

    fd.append(key, String(finalValue));
  });

  return fd;
};
