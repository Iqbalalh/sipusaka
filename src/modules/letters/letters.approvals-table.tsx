"use client";

import DataTable from "@/components/custom/table/DataTable";
import { Letter } from "@/types/models/letter";
import { getPendingLetters } from "@/utils/services/letter.service";
import { getApprovalColumns } from "./letters.columns";

export default function ApprovalsTable() {
  return (
    <DataTable<Letter>
      fetchData={getPendingLetters}
      columns={getApprovalColumns()}
      rowKey="id"
      title="Surat Menunggu Persetujuan"
    />
  );
}
