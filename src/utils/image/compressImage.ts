// Client-side image compressor (canvas, no dependency).
// - Only touches raster images we can safely re-encode; everything else
//   (GIF, SVG, PDF, DOCX, …) passes through untouched.
// - Never throws — a failure returns the original file so uploads never break.
// - Never upsizes — if compression doesn't shrink the file, the original is kept.

const COMPRESSIBLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1 (JPEG)
}

export async function compressImage(
  file: File,
  { maxWidth = 1600, maxHeight = 1600, quality = 0.8 }: CompressOptions = {},
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!(file instanceof File) || !COMPRESSIBLE.has(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);

    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // White backing so transparency doesn't become black once flattened to JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file; // no gain → keep original

    const name = file.name.replace(/\.(png|webp|jpe?g)$/i, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function compressFiles(
  files: File[],
  opts?: CompressOptions,
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, opts)));
}
