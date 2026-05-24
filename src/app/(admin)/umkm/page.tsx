import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UmkmTable from "@/modules/umkm/umkm.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "UMKM",
};

export default function UmkmTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="UMKM" />
      <div className="space-y-6">
        <ComponentCard title="Data UMKM" header={false}>
          <Suspense>
            <UmkmTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}