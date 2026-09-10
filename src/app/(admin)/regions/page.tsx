import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import RegionsTable from "@/modules/regions/regions.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan Wilayah",
};

export default function RegionsPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Pengaturan Wilayah" />
      <div className="space-y-6">
        <ComponentCard title="Data Wilayah" header={false}>
          <RegionsTable />
        </ComponentCard>
      </div>
    </div>
  );
}
