"use client";

import DataTable from "@/components/custom/table/DataTable";
import { Letter } from "@/types/models/letter";
import { getLetters } from "@/utils/services/letter.service";
import { getArchiveColumns } from "./letters.columns";

export default function ArchivesTable() {
  return (
    <DataTable<Letter>
      fetchData={getLetters}
      columns={getArchiveColumns()}
      rowKey="id"
      title="Arsip Surat"
    />
  );
}
