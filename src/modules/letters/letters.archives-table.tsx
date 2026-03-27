"use client";

import DataTable from "@/components/custom/table/DataTable";
import { Letter } from "@/types/models/letter";
import { getLetters, deleteLetter } from "@/utils/services/letter.service";
import { getArchiveColumns } from "./letters.columns";
import { useSession } from "next-auth/react";

export default function ArchivesTable() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <DataTable<Letter>
      fetchData={getLetters}
      deleteItem={isAdmin ? deleteLetter : undefined}
      columns={getArchiveColumns(true, role)}
      rowKey="id"
      title="Arsip Surat"
      deleteConfirmTitle="Hapus Surat"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus surat ini? Semua data dan dokumen terkait akan dihapus permanen."
      deleteSuccessMessage="Surat berhasil dihapus"
    />
  );
}
