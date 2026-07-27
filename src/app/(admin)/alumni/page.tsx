import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AlumniTable from "@/modules/alumni/alumni.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alumni",
};

export default function AlumniTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Alumni" />
      <div className="space-y-6">
        <ComponentCard title="Data Alumni" header={false}>
          <Suspense>
            <AlumniTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
