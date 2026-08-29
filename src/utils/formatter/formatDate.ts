/** dd/mm/yyyy — en-GB is already that format. */
export const formatDate = (dateString?: string | number | undefined | null) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB");
};
