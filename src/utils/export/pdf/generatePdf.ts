import jsPDF from "jspdf";

/* ---------------- TYPES ---------------- */
type PdfField<T extends Record<string, any>> = {
  label: string;
  key: Extract<keyof T, string>;
  format?: (value: T[keyof T], data: T) => string;
};

interface GeneratePdfProps<T extends Record<string, any>> {
  title?: string;
  filename: string;
  data: T;
  fields: PdfField<T>[];
  header?: {
    image?: string | null;
    name?: string;
    subTitle?: string;
  };
}

/* ---------------- HELPERS ---------------- */
const textOrDash = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text === "" ? "-" : text;
};

const loadImageAsBase64 = (url?: string | null): Promise<string | null> =>
  new Promise((resolve) => {
    if (!url) return resolve(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };

    img.onerror = () => resolve(null);
  });

/* ---------------- MAIN ---------------- */
export async function generatePdf<T extends Record<string, any>>({
  title,
  filename,
  data,
  fields,
  header,
}: GeneratePdfProps<T>) {
  const doc = new jsPDF();

  /* ===== MARGIN CONFIG ===== */
  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = doc.internal.pageSize.getWidth();

  const labelX = marginLeft;
  const colonX = marginLeft + 50;
  const valueX = marginLeft + 55;
  const maxValueWidth = pageWidth - valueX - marginRight;

  let y = 20;

  /* ===== HEADER ===== */
  if (header) {
    const imgSize = 25;
    const img = await loadImageAsBase64(
      header.image || "/images/user/alt-user.png"
    );

    if (img) {
      doc.addImage(img, "JPEG", marginLeft, y, imgSize, imgSize);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(textOrDash(header.name), marginLeft + imgSize + 8, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        textOrDash(header.subTitle),
        marginLeft + imgSize + 8,
        y + 18
      );
      doc.setTextColor(0);

      y += imgSize + 10;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(textOrDash(header.name), marginLeft, y + 10);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(textOrDash(header.subTitle), marginLeft, y + 18);

      y += 30;
    }
  }

  /* ===== TITLE ===== */
  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 10;

  /* ===== CONTENT ===== */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  fields.forEach((field) => {
    const rawValue = data[field.key];

    const value = field.format
      ? field.format(rawValue, data)
      : textOrDash(rawValue);

    // Label
    doc.text(field.label, labelX, y);

    // Colon
    doc.text(":", colonX, y);

    // Value (wrap jika panjang)
    const wrapped = doc.splitTextToSize(value, maxValueWidth);
    doc.text(wrapped, valueX, y);

    y += wrapped.length * 7 + 2;

    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save(filename);
}
