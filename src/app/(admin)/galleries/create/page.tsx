import AdminGuard from "@/components/custom/AdminGuard";
import CreateGallery from "@/modules/galleries/galleries.create";

export default function Gallery() {
  return (
    <AdminGuard>
      <div>
        <CreateGallery />
      </div>
    </AdminGuard>
  );
}
