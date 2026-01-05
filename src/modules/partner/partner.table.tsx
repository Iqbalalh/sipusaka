"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Partner } from "@/types/models/partner";
import { Region } from "@/types/models/region";

// Utils
import {
  deletePartner,
  getPartners,
} from "@/utils/services/partner.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getPartnerColumns } from "./partner.columns";

export default function PartnerTable() {
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

  // Generate columns with regions and delete handler
  const columns = getPartnerColumns(regions, (id) => {
    // Delete is handled by DataTable component
    // This callback is passed to the columns for the delete button
  });

  return (
    <DataTable<Partner>
      fetchData={getPartners}
      deleteItem={deletePartner}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-pasangan",
        sheetName: "Pasangan",
      }}
      title="Jumlah Data"
      createPath="/partner/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus pasangan ini?"
      deleteSuccessMessage="Pasangan berhasil dihapus"
    />
  );
}