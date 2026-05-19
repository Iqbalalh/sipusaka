import AdminGuard from "@/components/custom/AdminGuard";
import CreatePartner from "@/modules/partner/partner.create";

export default function Partner() {
  return (
    <AdminGuard>
      <div>
        <CreatePartner />
      </div>
    </AdminGuard>
  );
}
