import AdminGuard from "@/components/custom/AdminGuard";
import CreateChildren from "@/modules/children/children.create";

export default function Children() {
  return (
    <AdminGuard>
      <div>
        <CreateChildren />
      </div>
    </AdminGuard>
  );
}
