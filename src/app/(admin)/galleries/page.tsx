import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import GalleriesTable from "@/modules/galleries/galleries.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri",
};

export default function GalleriesTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Galeri" />
      <div className="space-y-6">
        <ComponentCard title="Jumlah Data" header={false}>
          <Suspense>
            <GalleriesTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}