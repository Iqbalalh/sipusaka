import AdminGuard from "@/components/custom/AdminGuard";
import CreateWali from "@/modules/wali/wali.create";

export default function Children() {
  return (
    <AdminGuard>
      <div>
        <CreateWali />
      </div>
    </AdminGuard>
  );
}
