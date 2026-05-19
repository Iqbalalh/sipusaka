import AdminGuard from "@/components/custom/AdminGuard";
import CreateCategory from "@/modules/categories/categories.create";

export default function Category() {
  return (
    <AdminGuard>
      <div>
        <CreateCategory />
      </div>
    </AdminGuard>
  );
}
