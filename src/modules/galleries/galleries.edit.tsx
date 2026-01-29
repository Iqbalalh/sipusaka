"use client";

import { useParams } from "next/navigation";
import GalleryForm from "@/components/custom/form/GalleryForm";

export default function EditGallery() {
  const { id } = useParams<{ id: string }>();
  return <GalleryForm mode="edit" galleryId={id} />;
}