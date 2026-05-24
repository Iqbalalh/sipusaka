import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ChildrenTable from "@/modules/children/children.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anak Asuh",
};

export default function ChildrenTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Anak Asuh" />
      <div className="space-y-6">
        <ComponentCard title="Data Anak Asuh" header={false}>
          <Suspense>
            <ChildrenTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}