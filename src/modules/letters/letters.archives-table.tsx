"use client";

import Link from "next/link";
import DataTable from "@/components/custom/table/DataTable";
import Button from "@/components/ui/button/Button";
import { Letter } from "@/types/models/letter";
import { getLetters, deleteLetter } from "@/utils/services/letter.service";
import { getArchiveColumns } from "./letters.columns";
import { useSession } from "next-auth/react";
import { UploadOutlined } from "@ant-design/icons";

export default function ArchivesTable() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Link href="/letters/archives/upload">
            <Button size="sm">
              <UploadOutlined className="mr-1" />
              Upload Arsip
            </Button>
          </Link>
        </div>
      )}
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
    </div>
  );
}
