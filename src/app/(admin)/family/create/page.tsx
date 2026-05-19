import AdminGuard from "@/components/custom/AdminGuard";
import CreateFamily from "@/modules/family/family.create";

export default function Family() {
  return (
    <AdminGuard>
      <div>
        <CreateFamily />
      </div>
    </AdminGuard>
  );
}
