import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ArchivesTable from "@/modules/letters/letters.archives-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arsip Surat",
};

export default function LetterArchivesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Arsip Surat" />
      <div className="space-y-6">
        <ComponentCard title="Arsip Surat" header={false}>
          <Suspense>
            <ArchivesTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
