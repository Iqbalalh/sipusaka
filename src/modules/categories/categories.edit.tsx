"use client";

import { useParams } from "next/navigation";
import CategoryForm from "@/components/custom/form/CategoryForm";

export default function EditCategory() {
  const { id } = useParams<{ id: string }>();
  return <CategoryForm mode="edit" categoryId={id} />;
}