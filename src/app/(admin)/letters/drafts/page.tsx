import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DraftsTable from "@/modules/letters/letters.drafts-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft Surat",
};

export default function LetterDraftsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Draft Surat" />
      <div className="space-y-6">
        <ComponentCard title="Draft Surat" header={false}>
          <Suspense>
            <DraftsTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
