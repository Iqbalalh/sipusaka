import { generatePdf } from "@/utils/export/pdf/generatePdf";
import { Partner } from "@/types/models/partner";

export const handlePrintPartner = async (
  data: Partner | null,
  image?: string | null
) => {
  if (!data) return;

  await generatePdf<Partner>({
    filename: `Data Pasangan - ${data.partnerName}.pdf`,
    data,
    header: {
      image: image || "/images/user/alt-user.png",
      name: `${data.isAlive === false ? "Alm. " : ""}${data.partnerName}`,
      subTitle: data.isUmkm ? "UMKM" : "",
    },
    fields: [
      {
        label: "Pekerjaan",
        key: "partnerJob",
        format: (v) => v?.toString() || "Tidak Bekerja",
      },
      {
        label: "Status Aktif",
        key: "isActive",
        format: (v) => (v ? "Aktif" : "Tidak Aktif"),
      },
      {
        label: "Status Hidup",
        key: "isAlive",
        format: (v) => (v ? "Hidup" : "Meninggal"),
      },
      {
        label: "Alamat",
        key: "address",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "NIK",
        key: "partnerNik",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "Nomor Telepon",
        key: "phoneNumber",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "Nomor Telepon Alternatif",
        key: "phoneNumberAlt",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "Wilayah",
        key: "regionName",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "Kecamatan",
        key: "subdistrictName",
        format: (v) => v?.toString() || "-",
      },
      {
        label: "Koordinat Rumah",
        key: "homeCoordinate",
        format: (v) => v?.toString() || "-",
      },
    ],
  });
};
