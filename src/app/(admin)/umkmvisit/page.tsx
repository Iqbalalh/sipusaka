import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UmkmVisitTable from "@/modules/umkmvisit/umkmvisit.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bantuan UMKM",
};

export default function UmkmVisitPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bantuan UMKM" />
      <div className="space-y-6">
        <ComponentCard title="Data Bantuan UMKM" header={false}>
          <UmkmVisitTable />
        </ComponentCard>
      </div>
    </div>
  );
}