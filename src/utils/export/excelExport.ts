import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ChildAssistance } from "@/utils/services/childassistance.service";

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  status: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

export const exportChildAssistanceToExcel = async (
  data: ChildAssistance[],
  year: number,
  onProgress?: ProgressCallback,
): Promise<void> => {
  const total = data.length;

  // Update progress: Starting
  if (onProgress) {
    onProgress({
      current: 0,
      total,
      percentage: 0,
      status: "Memulai export...",
    });
  }

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIPUSAKA";
  workbook.created = new Date();

  // Add a worksheet
  const worksheet = workbook.addWorksheet(`Bantuan Anak ${year}`);

  // Define columns
  worksheet.columns = [
    { header: "Nama Anak", key: "childrenName", width: 30 },
    { header: "Bantuan ke-", key: "assistanceNumber", width: 15 },
    { header: "Tanggal Bantuan", key: "assistanceDate", width: 20 },
    { header: "Jumlah Bantuan", key: "assistanceAmount", width: 20 },
    { header: "Penyedia Bantuan", key: "assistanceProvider", width: 25 },
    { header: "Tingkat Pendidikan", key: "educationLevel", width: 20 },
    { header: "Kelas", key: "educationGrade", width: 15 },
    { header: "Nama Sekolah", key: "schoolName", width: 30 },
    { header: "Usia", key: "age", width: 10 },
    { header: "Catatan", key: "notes", width: 40 },
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Add data rows with progress tracking
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const row = worksheet.addRow({
      assistanceNumber: item.assistanceNumber || "",
      childrenName: item.children?.childrenName || "",
      assistanceDate: item.assistanceDate
        ? new Date(item.assistanceDate).toLocaleDateString("id-ID")
        : "",
      assistanceAmount: item.assistanceAmount || "",
      assistanceProvider: item.assistanceProvider || "",
      educationLevel: item.educationLevel || "",
      educationGrade: item.educationGrade || "",
      schoolName: item.schoolName || "",
      age: item.age ? `${item.age} tahun` : "",
      notes: item.notes || "",
    });

    // Alternate row colors
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
    }

    // Update progress
    if (onProgress && i % 10 === 0) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        status: `Menulis data ${i + 1} dari ${total}...`,
      });
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      status: "Menyimpan file...",
    });
  }

  // Set column alignment
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Add title row
  worksheet.insertRow(1, [`Laporan Bantuan Anak Tahun ${year}`]);
  const titleRow = worksheet.getRow(1);
  titleRow.font = { bold: true, size: 14, color: { argb: "FF000000" } };
  titleRow.alignment = { vertical: "middle", horizontal: "center" };
  titleRow.height = 30;
  worksheet.mergeCells("A1:J1");

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Create blob and download
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fileName = `Bantuan_Anak_${year}_${new Date().getTime()}.xlsx`;

  saveAs(blob, fileName);

  // Final progress update
  if (onProgress) {
    onProgress({
      current: total,
      total,
      percentage: 100,
      status: "Export selesai!",
    });
  }
};
