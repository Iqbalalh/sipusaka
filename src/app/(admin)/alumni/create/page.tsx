import AdminGuard from "@/components/custom/AdminGuard";
import CreateAlumni from "@/modules/alumni/alumni.create";

export default function AlumniCreate() {
  return (
    <AdminGuard>
      <div>
        <CreateAlumni />
      </div>
    </AdminGuard>
  );
}
