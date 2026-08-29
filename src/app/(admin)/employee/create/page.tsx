import AdminGuard from "@/components/custom/AdminGuard";
import EmployeeForm from "@/components/custom/form/EmployeeForm";

export default function Employee() {
  return (
    <AdminGuard>
      <div>
        <EmployeeForm mode="create" />
      </div>
    </AdminGuard>
  );
}
