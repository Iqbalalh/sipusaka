import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FamilyTable from "@/modules/family/family.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keluarga",
};

export default function FamilyTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Keluarga" />
      <div className="space-y-6">
        <ComponentCard title="Data Keluarga" header={false}>
          <Suspense>
            <FamilyTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}