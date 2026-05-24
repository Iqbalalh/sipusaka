import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WaliTable from "@/modules/wali/wali.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wali",
};

export default function WaliTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Wali" />
      <div className="space-y-6">
        <ComponentCard title="Data Wali" header={false}>
          <Suspense>
            <WaliTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
