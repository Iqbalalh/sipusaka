import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import LetterTypesTable from "@/modules/letterTypes/letterTypes.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template Surat",
};

export default function LetterTypesPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Template Surat" />
      <div className="space-y-6">
        <ComponentCard title="Data Template Surat" header={false}>
          <LetterTypesTable />
        </ComponentCard>
      </div>
    </div>
  );
}
