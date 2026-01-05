export const toSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
