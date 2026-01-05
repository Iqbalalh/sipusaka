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
      {" "}
      <PageBreadcrumb pageTitle="Anak Asuh" />
      <div className="space-y-6">
        <ComponentCard title="Jumlah Data" header={false}>
          <ChildrenTable />
        </ComponentCard>
      </div>
    </div>
  );
}