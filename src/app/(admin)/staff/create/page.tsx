import AdminGuard from "@/components/custom/AdminGuard";
import CreateStaff from "@/modules/staff/staff.create";

export default function Staff() {
  return (
    <AdminGuard>
      <div>
        <CreateStaff />
      </div>
    </AdminGuard>
  );
}
