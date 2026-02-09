import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ChildAssistanceTable from "@/modules/childassistance/childassistance.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bantuan Anak",
};

export default function ChildAssistancePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bantuan Anak" />
      <div className="space-y-6">
        <ComponentCard title="Data Bantuan Anak" header={false}>
          <ChildAssistanceTable />
        </ComponentCard>
      </div>
    </div>
  );
}
