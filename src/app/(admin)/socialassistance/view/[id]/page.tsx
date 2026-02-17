import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SocialAssistanceView from "@/modules/socialassistance/socialassistance.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Bantuan Sosial",
};

interface ViewSocialAssistancePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewSocialAssistancePage({ params }: ViewSocialAssistancePageProps) {
  const { id } = await params;
  
  return (
    <div>
      <PageBreadcrumb pageTitle="Detail Bantuan Sosial" />
      <div className="space-y-6">
        <ComponentCard title="Detail Data Bantuan Sosial">
          <SocialAssistanceView id={id} />
        </ComponentCard>
      </div>
    </div>
  );
}
