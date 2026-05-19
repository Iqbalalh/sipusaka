import AdminGuard from "@/components/custom/AdminGuard";
import CreateUmkm from "@/modules/umkm/umkm.create";

export default function Umkm() {
  return (
    <AdminGuard>
      <div>
        <CreateUmkm />
      </div>
    </AdminGuard>
  );
}
