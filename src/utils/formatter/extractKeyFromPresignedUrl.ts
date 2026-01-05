export const extractKeyFromPresignedUrl = (url?: string | null) => {
  if (!url) return null;

  const u = new URL(url);
  return u.pathname.replace(/^\/+/, "");
};