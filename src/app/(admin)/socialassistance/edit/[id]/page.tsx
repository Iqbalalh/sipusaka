import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SocialAssistanceForm from "@/modules/socialassistance/socialassistance.form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Bantuan Sosial",
};

interface EditSocialAssistancePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSocialAssistancePage({ params }: EditSocialAssistancePageProps) {
  const { id } = await params;
  
  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Bantuan Sosial" />
      <div className="space-y-6">
        <ComponentCard title="Form Edit Bantuan Sosial">
          <SocialAssistanceForm id={id} />
        </ComponentCard>
      </div>
    </div>
  );
}
