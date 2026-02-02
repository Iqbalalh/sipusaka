import Button from "@/components/ui/button/Button";
import { Umkm } from "@/types/models/umkm";
import Link from "next/link";
import { formatDate } from "@/utils/formatter/formatDate";
import { GoogleMapsButton } from "@/components/ui/action-buttons/ActionButtons";

interface UmkmInfoProps {
  data: Umkm | null;
}

export default function UmkmInfo({ data }: UmkmInfoProps) {
  const infoItems = [
    { label: "Nama Usaha", value: data?.businessName || "-" },
    { label: "Nama Pemilik", value: data?.ownerName || "-" },
    { label: "Jenis Usaha", value: data?.businessType || "-" },
    { label: "Produk", value: data?.products || "-" },
    { label: "Alamat Usaha", value: data?.businessAddress || "-" },
    { label: "Kecamatan", value: data?.subdistrictName || "-" },
    { label: "Kode Pos", value: data?.postalCode || "-" },
    { label: "Koordinat", value: data?.umkmCoordinate || "-" },
    { label: "Wilayah", value: data?.regions.regionName || "-" },
    {
      label: "Dibuat Pada",
      value: data?.createdAt ? formatDate(data.createdAt) : "-",
    },
    {
      label: "Diperbarui Pada",
      value: data?.updatedAt ? formatDate(data.updatedAt) : "-",
    },
    {
      label: "Dibuat Oleh",
      value: data?.createdBy || "-",
    },
    {
      label: "Diedit Oleh",
      value: data?.editedBy || "-",
    },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-between mb-5">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Informasi UMKM
        </h4>
        <Link href={`/umkm/edit/${data?.id}`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {infoItems.map((item, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              {item.label}
            </span>
            {item.label === "Koordinat" && data?.umkmCoordinate ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                  {item.value}
                </span>
                <GoogleMapsButton coordinate={data.umkmCoordinate} />
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
