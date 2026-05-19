import AdminGuard from "@/components/custom/AdminGuard";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import SocialAssistanceForm from "@/modules/socialassistance/socialassistance.form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Bantuan Sosial",
};

export default function CreateSocialAssistancePage() {
  return (
    <AdminGuard>
      <div>
        <PageBreadcrumb pageTitle="Tambah Bantuan Sosial" />
        <div className="space-y-6">
          <ComponentCard title="Form Tambah Bantuan Sosial">
            <SocialAssistanceForm />
          </ComponentCard>
        </div>
      </div>
    </AdminGuard>
  );
}
