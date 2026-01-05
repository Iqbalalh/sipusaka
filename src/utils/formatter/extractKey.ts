export const extractKeyFromUrl = (url: string) => {
  try {
    const path = new URL(url).pathname; 

    const objectKey = path.split("/").slice(2).join("/"); 

    return `/database/${objectKey}`;
  } catch (err) {
    console.error("URL parse error:", err);
    return null;
  }
};
