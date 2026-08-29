import AdminGuard from "@/components/custom/AdminGuard";
import WaliForm from "@/components/custom/form/WaliForm";

export default function Children() {
  return (
    <AdminGuard>
      <div>
        <WaliForm mode="create" />
      </div>
    </AdminGuard>
  );
}
