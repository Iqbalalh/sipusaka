import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SocialAssistanceTable from "@/modules/socialassistance/socialassistance.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bantuan Sosial",
};

export default function SocialAssistancePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Bantuan Sosial" />
      <div className="space-y-6">
        <ComponentCard title="Data Bantuan Sosial" header={false}>
          <Suspense>
            <SocialAssistanceTable />
          </Suspense>
        </ComponentCard>
      </div>
    </div>
  );
}
