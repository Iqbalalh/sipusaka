import AdminGuard from "@/components/custom/AdminGuard";
import AlumniForm from "@/components/custom/form/AlumniForm";

export default function AlumniCreate() {
  return (
    <AdminGuard>
      <div>
        <AlumniForm mode="create" />
      </div>
    </AdminGuard>
  );
}
