import AdminGuard from "@/components/custom/AdminGuard";
import FamilyForm from "@/components/custom/form/FamilyForm";

export default function Family() {
  return (
    <AdminGuard>
      <div>
        <FamilyForm mode="create" />
      </div>
    </AdminGuard>
  );
}
