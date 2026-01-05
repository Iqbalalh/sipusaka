import { generatePdf } from "@/utils/export/pdf/generatePdf";
import { Employee } from "@/types/models/employee";

export const handlePrintEmployee = async (
  data: Employee | null,
  image?: string | null
) => {
  if (!data) return;

  await generatePdf<Employee>({
    filename: `Data - ${data.employeeName}.pdf`,
    data,
    header: {
      image: image || "/images/user/alt-user.png",
      name: data.employeeName,
      subTitle: `NIP/NIPP: ${data.nipNipp}`,
    },
    fields: [
      {
        label: "Jenis Kelamin",
        key: "employeeGender",
        format: (v) => (v === "M" ? "Laki-laki" : "Perempuan"),
      },
      {
        label: "Status",
        key: "isAccident",
        format: (v) => (v ? "Kecelakaan" : "Meninggal"),
      },
      { label: "Penyebab", key: "deathCause" },
      { label: "Posisi Terakhir", key: "lastPosition" },
      {
        label: "Wilayah",
        key: "regionName",
        format: (v) => v?.toString() || "-",
      },
      { label: "Catatan", key: "notes" },
    ],
  });
};
