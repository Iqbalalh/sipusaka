"use client";

import { useEffect, useState } from "react";

// Components
import DataTable from "@/components/custom/table/DataTable";

// Types
import { Wali } from "@/types/models/wali";

// Utils
import {
  deleteWali,
  getWalis,
} from "@/utils/services/wali.service";
import { getWaliColumns } from "./wali.columns";

export default function WaliTable() {
  // Generate columns with delete handler
  const columns = getWaliColumns((id) => {
    // Delete is handled by DataTable component
    // This callback is passed to the columns for the delete button
  });

  return (
    <DataTable<Wali>
      fetchData={getWalis}
      deleteItem={deleteWali}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-wali",
        sheetName: "Wali",
      }}
      title="Jumlah Data"
      createPath="/wali/create"
      pageSize={50}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus data wali ini?"
      deleteSuccessMessage="Data wali berhasil dihapus"
    />
  );
}