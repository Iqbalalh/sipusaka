import { generatePdf } from "@/utils/export/pdf/generatePdf";
import { Wali } from "@/types/models/wali";

export const handlePrintWali = async (
  data: Wali | null,
  image?: string | null
) => {
  if (!data) return;

  await generatePdf<Wali>({
    filename: `Data Wali - ${data.waliName ?? "Tanpa Nama"}.pdf`,
    data,
    header: {
      image: image ?? null, // jika null → generatePdf akan handle
      name: data.waliName ?? "-",
      subTitle: data.relation ?? "-",
    },
    fields: [
      {
        label: "NIK",
        key: "nik",
      },
      {
        label: "Nomor Telepon",
        key: "waliPhone",
      },
      {
        label: "Pekerjaan",
        key: "waliJob",
      },
      {
        label: "Hubungan",
        key: "relation",
      },
      {
        label: "Alamat",
        key: "waliAddress",
      },
      {
        label: "Koordinat Alamat",
        key: "addressCoordinate",
        format: (v) => (v ? String(v) : "-"),
      },
    ],
  });
};
