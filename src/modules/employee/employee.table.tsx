"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Employee } from "@/types/models/employee";
import { Region } from "@/types/models/region";

// Utils
import {
  deleteEmployee,
  getEmployees,
} from "@/utils/services/employee.service";
import { getRegionsList } from "@/utils/services/region.service";
import { getEmployeeColumns } from "./employee.columns";

export default function EmployeeTable() {
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
  const columns = getEmployeeColumns(regions, (id) => {
    // Delete is handled by DataTable component
    // This callback is passed to the columns for the delete button
  });

  return (
    <DataTable<Employee>
      fetchData={getEmployees}
      deleteItem={deleteEmployee}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-pegawai",
        sheetName: "Pegawai",
      }}
      title="Jumlah Data"
      createPath="/employee/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus pegawai ini?"
      deleteSuccessMessage="Pegawai berhasil dihapus"
    />
  );
}
