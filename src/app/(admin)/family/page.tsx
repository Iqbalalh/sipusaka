import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FamilyTable from "@/modules/family/family.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keluarga Asuh",
};

export default function FamilyTables() {
  return (
    <div>
        {" "}
        <PageBreadcrumb pageTitle="Keluarga Asuh" />
        <div className="space-y-6">
          <ComponentCard title="Data Keluarga Asuh" header={false}>
            <FamilyTable />
          </ComponentCard>
        </div>
    </div>
  );
}