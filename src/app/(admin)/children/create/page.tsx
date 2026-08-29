import AdminGuard from "@/components/custom/AdminGuard";
import ChildrenForm from "@/components/custom/form/ChildrenForm";

export default function Children() {
  return (
    <AdminGuard>
      <div>
        <ChildrenForm mode="create" />
      </div>
    </AdminGuard>
  );
}
