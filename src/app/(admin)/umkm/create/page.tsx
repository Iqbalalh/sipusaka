import AdminGuard from "@/components/custom/AdminGuard";
import UmkmForm from "@/components/custom/form/UmkmForm";

export default function Umkm() {
  return (
    <AdminGuard>
      <div>
        <UmkmForm mode="create" />
      </div>
    </AdminGuard>
  );
}
