"use client";

import Link from "next/link";
import DataTable from "@/components/custom/table/DataTable";
import Button from "@/components/ui/button/Button";
import { Letter } from "@/types/models/letter";
import { getLetters } from "@/utils/services/letter.service";
import { getArchiveColumns } from "./letters.columns";
import { useSession } from "next-auth/react";
import { UploadOutlined } from "@ant-design/icons";

export default function ArchivesTable() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "admin" || role === "superadmin";

  return (
    <DataTable<Letter>
      fetchData={getLetters}
      columns={getArchiveColumns()}
      rowKey="id"
      title="Arsip Surat"
      headerActions={
        isAdmin ? (
          <Link href="/letters/archives/upload">
            <Button size="sm">
              <UploadOutlined className="mr-1" />
              Upload Arsip
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
}
