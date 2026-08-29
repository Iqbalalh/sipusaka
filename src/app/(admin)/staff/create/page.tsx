import AdminGuard from "@/components/custom/AdminGuard";
import StaffForm from "@/components/custom/form/StaffForm";

export default function Staff() {
  return (
    <AdminGuard>
      <div>
        <StaffForm mode="create" />
      </div>
    </AdminGuard>
  );
}
