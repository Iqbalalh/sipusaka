import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { ColumnsType } from "antd/es/table";

type ExportOptions<T> = {
  data: T[]; // Array of data to export
  columns: ColumnsType<T>; // Column definitions
  filename?: string; // Default filename
  sheetName?: string; // Default sheet name
  mergeColumns?: string[]; // Columns to merge same values
};

export async function exportTableToExcel<T>({
  data,
  columns,
  filename = "export",
  sheetName = "Sheet1",
  mergeColumns = [],
}: ExportOptions<T>) {
  if (!data || data.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // =========================
  // FILTER & SORT COLUMNS
  // =========================
  const filteredColumns = columns.filter(
    (col: any) => col.dataIndex && col.key !== "actions" && col.title !== "Aksi"
  ) as any[];

  const normalColumns = filteredColumns.filter(
    (col) => !String(col.dataIndex).toLowerCase().endsWith("pict")
  );

  const pictColumns = filteredColumns.filter((col) =>
    String(col.dataIndex).toLowerCase().endsWith("pict")
  );

  const validColumns = [...normalColumns, ...pictColumns];

  // =========================
  // HEADER
  // =========================
  worksheet.columns = validColumns.map((col) => {
    const isPict = String(col.dataIndex).toLowerCase().endsWith("pict");

    return {
      header: typeof col.title === "string" ? col.title : String(col.key),
      key: col.dataIndex,
      width: isPict ? 10 : 20,
    };
  });

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.border = fullBorder();
  });

  // =========================
  // DATA ROWS
  // =========================
  data.forEach((row: any, index) => {
    const record: Record<string, any> = {};

    validColumns.forEach((col) => {
      let value: any;

      if (typeof col.exportRender === "function") {
        value = col.exportRender(row[col.dataIndex], row, index);
      } else if (typeof col.render === "function") {
        const rendered = col.render(row[col.dataIndex], row, index);
        value =
          typeof rendered === "string" || typeof rendered === "number"
            ? rendered
            : row[col.dataIndex];
      } else {
        value = row[col.dataIndex];
      }

      if (typeof value === "boolean") {
        value = value ? "Ya" : "Tidak";
      }

      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        value = new Date(value).toLocaleDateString("id-ID");
      }

      record[col.dataIndex] = value ?? "-";
    });

    const excelRow = worksheet.addRow(record);

    if (index % 2 === 1) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      });
    }

    excelRow.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = fullBorder();
    });
  });

  // =========================
  // MERGE BY PARAM
  // =========================
  mergeColumns.forEach((columnKey) => {
    mergeSameValueCells(worksheet, columnKey);
  });

  // =========================
  // AUTO COLUMN WIDTH
  // =========================
  worksheet.columns?.forEach((column: any) => {
    if (!column || typeof column.eachCell !== "function") return;

    if (String(column.key).toLowerCase().endsWith("pict")) {
      column.width = 10;
      return;
    }

    let maxLength = 10;

    column.eachCell({ includeEmpty: true }, (cell: any) => {
      const value = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, value.length);
    });

    column.width = maxLength + 4;
  });

  // =========================
  // EXPORT FILE
  // =========================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${filename}.xlsx`);
}

// =========================
// HELPERS
// =========================
function fullBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
}

function mergeSameValueCells(worksheet: ExcelJS.Worksheet, columnKey: string) {
  const column = worksheet.getColumn(columnKey);
  if (!column) return;

  let startRow = 2;
  let prevValue: any = null;

  column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
    if (rowNumber === 1) return;

    const currentValue = cell.value;
    if (
      currentValue === null ||
      currentValue === undefined ||
      currentValue === "-" ||
      currentValue === ""
    ) {
      prevValue = null;
      startRow = rowNumber;
      return;
    }

    if (prevValue === null) {
      prevValue = currentValue;
      startRow = rowNumber;
      return;
    }

    if (currentValue !== prevValue) {
      if (rowNumber - startRow > 1) {
        worksheet.mergeCells(
          startRow,
          column.number,
          rowNumber - 1,
          column.number
        );
        worksheet.getCell(startRow, column.number).alignment = {
          vertical: "middle",
          horizontal: "left",
        };
      }
      startRow = rowNumber;
      prevValue = currentValue;
    }
  });

  const lastRow = worksheet.lastRow?.number ?? startRow;
  if (lastRow - startRow >= 1) {
    worksheet.mergeCells(startRow, column.number, lastRow, column.number);
    worksheet.getCell(startRow, column.number).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
  }
}
