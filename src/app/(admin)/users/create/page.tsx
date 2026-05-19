import AdminGuard from "@/components/custom/AdminGuard";
import UserForm from "@/components/custom/form/UserForm";

export default function CreateUserPage() {
  return (
    <AdminGuard>
      <UserForm mode="create" />
    </AdminGuard>
  );
}
