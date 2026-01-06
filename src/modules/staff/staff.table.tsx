"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Staff } from "@/utils/services/staff.service";

// Utils
import {
  deleteStaff,
  getStaffs,
} from "@/utils/services/staff.service";
import { getStaffColumns } from "./staff.columns";

export default function StaffTable() {
  // Generate columns
  const columns = getStaffColumns();

  return (
    <DataTable<Staff>
      fetchData={getStaffs}
      deleteItem={deleteStaff}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-staf",
        sheetName: "Staf",
      }}
      title="Jumlah Data"
      createPath="/staff/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus staf ini?"
      deleteSuccessMessage="Staf berhasil dihapus"
    />
  );
}