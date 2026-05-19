import AdminGuard from "@/components/custom/AdminGuard";
import CreateEmployee from "@/modules/employee/employee.create";

export default function Employee() {
  return (
    <AdminGuard>
      <div>
        <CreateEmployee />
      </div>
    </AdminGuard>
  );
}
