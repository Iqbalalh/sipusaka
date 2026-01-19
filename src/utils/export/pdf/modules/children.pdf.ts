import { generatePdf } from "@/utils/export/pdf/generatePdf";
import { Children } from "@/types/models/children";

export const handlePrintChildren = async (
  data: Children | null,
  image?: string | null
) => {
  if (!data) return;

  await generatePdf<Children>({
    filename: `Data Anak - ${data.childrenName}.pdf`,
    data,
    header: {
      image: image || "/images/user/alt-user.png",
      name: data.childrenName,
      subTitle: `NIK: ${data.nik ?? "-"}`,
    },
    fields: [
      {
        label: "Jenis Kelamin",
        key: "childrenGender",
        format: (v) =>
          v === "M" ? "Laki-laki" : v === "F" ? "Perempuan" : "-",
      },
      {
        label: "Status",
        key: "isActive",
        format: (v) => (v ? "Aktif" : "Tidak Aktif"),
      },
      {
        label: "Kondisi",
        key: "isCondition",
        format: (v) => (v ? "Normal" : "ABK"),
      },
      {
        label: "Tanggal Lahir",
        key: "childrenBirthdate",
        format: (v) => String(v ?? "-"),
      },
      {
        label: "Pekerjaan",
        key: "childrenJob",
        format: (v) => String(v ?? "-"),
      },
      {
        label: "Alamat",
        key: "childrenAddress",
        format: (v) => String(v ?? "-"),
      },
      {
        label: "Nomor Telepon",
        key: "childrenPhone",
        format: (v) => String(v ?? "-"),
      },
      {
        label: "Nama Orangtua",
        key: "childrenName",
        format: (_, row) =>
          `${row.homes?.employees?.employeeName ?? "-"} - ${row.homes?.partners?.partnerName ?? "-"}`,
      },
      {
        label: "Nama Wali",
        key: "childrenGender",
        format: (_, row) => String(row.homes?.wali?.waliName ?? "-"),
      },
      {
        label: "Anak Ke",
        key: "index",
        format: (v) => (v !== null && v !== undefined ? String(v) : "-"),
      },
      {
        label: "Catatan",
        key: "notes",
        format: (v) => String(v ?? "-"),
      },
    ],
  });
};
