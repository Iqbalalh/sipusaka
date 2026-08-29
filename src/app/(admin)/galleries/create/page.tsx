import AdminGuard from "@/components/custom/AdminGuard";
import GalleryForm from "@/components/custom/form/GalleryForm";

export default function Gallery() {
  return (
    <AdminGuard>
      <div>
        <GalleryForm mode="create" />
      </div>
    </AdminGuard>
  );
}
