import AdminGuard from "@/components/custom/AdminGuard";
import PartnerForm from "@/components/custom/form/PartnerForm";

export default function Partner() {
  return (
    <AdminGuard>
      <div>
        <PartnerForm mode="create" />
      </div>
    </AdminGuard>
  );
}
