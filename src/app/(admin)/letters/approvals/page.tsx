import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ApprovalsTable from "@/modules/letters/letters.approvals-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Persetujuan Surat",
};

export default function LetterApprovalsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Persetujuan Surat" />
      <div className="space-y-6">
        <ComponentCard title="Persetujuan Surat" header={false}>
          <Suspense>
            <ApprovalsTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
