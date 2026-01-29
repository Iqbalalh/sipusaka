"use client";

import { useEffect, useState } from "react";

import DataTable from "@/components/custom/table/DataTable";
import { Gallery } from "@/types/models/gallery";
import { Region } from "@/types/models/region";
import { getGalleries, deleteGallery } from "@/utils/services/gallery.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getGalleryColumns } from "./galleries.columns";

export default function GalleriesTable() {
  // State for regions (needed for column filters)
  const [regions, setRegions] = useState<Region[]>([]);

  // Fetch regions for column filters
  useEffect(() => {
    const init = async () => {
      try {
        const regionList = await getRegionsList();
        setRegions(regionList);
      } catch (err) {
        console.error("Failed to fetch regions:", err);
      }
    };

    init();
  }, []);

  // Generate columns with regions
  const columns = getGalleryColumns(regions);

  return (
    <DataTable<Gallery>
      fetchData={getGalleries}
      deleteItem={deleteGallery}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-galeri",
        sheetName: "Galeri",
      }}
      title="Jumlah Data"
      createPath="/galleries/create"
      pageSize={20}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus data galeri ini?"
      deleteSuccessMessage="Data galeri berhasil dihapus"
    />
  );
}