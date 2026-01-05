import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PartnerTable from "@/modules/partner/partner.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pasangan",
};

export default function PartnerTables() {
  return (
    <div>
        {" "}
        <PageBreadcrumb pageTitle="Pasangan" />
        <div className="space-y-6">
          <ComponentCard title="Data Pasangan" header={false}>
            <PartnerTable />
          </ComponentCard>
        </div>
    </div>
  );
}