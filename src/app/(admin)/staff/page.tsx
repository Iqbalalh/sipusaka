import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import StaffTable from "@/modules/staff/staff.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staf",
};

export default function StaffTables() {
  return (
    <div>
        {" "}
        <PageBreadcrumb pageTitle="Staf" />
        <div className="space-y-6">
          <ComponentCard title="Data Staf" header={false}>
            <StaffTable />
          </ComponentCard>
        </div>
    </div>
  );
}