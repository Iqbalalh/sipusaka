import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ChildrenTable from "@/modules/children/children.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anak",
};

export default function ChildrenTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Anak" />
      <div className="space-y-6">
        <ComponentCard title="Data Anak" header={false}>
          <Suspense>
            <ChildrenTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}