"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Children } from "@/types/models/children";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteChildren,
  getChildrens,
} from "@/utils/services/children.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getChildrenColumns } from "./children.columns";

export default function ChildrenTable() {
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
  const columns = getChildrenColumns(regions);

  return (
    <DataTable<Children>
      fetchData={getChildrens}
      deleteItem={deleteChildren}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-anak-asuh",
        sheetName: "Anak Asuh",
      }}
      title="Jumlah Data"
      createPath="/children/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus data anak asuh ini?"
      deleteSuccessMessage="Data anak asuh berhasil dihapus"
    />
  );
}