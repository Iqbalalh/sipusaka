import AdminGuard from "@/components/custom/AdminGuard";
import CategoryForm from "@/components/custom/form/CategoryForm";

export default function Category() {
  return (
    <AdminGuard>
      <div>
        <CategoryForm mode="create" />
      </div>
    </AdminGuard>
  );
}
