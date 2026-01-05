"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Umkm } from "@/types/models/umkm";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteUmkm,
  getUmkmList,
} from "@/utils/services/umkm.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getUmkmColumns } from "./umkm.columns";

export default function UmkmTable() {
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
  const columns = getUmkmColumns(regions);

  return (
    <DataTable<Umkm>
      fetchData={getUmkmList}
      deleteItem={deleteUmkm}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-umkm",
        sheetName: "UMKM",
      }}
      title="Jumlah Data"
      createPath="/umkm/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus data UMKM ini?"
      deleteSuccessMessage="Data UMKM berhasil dihapus"
    />
  );
}