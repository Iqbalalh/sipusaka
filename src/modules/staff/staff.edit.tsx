"use client";

import { useParams } from "next/navigation";
import StaffForm from "@/components/custom/form/StaffForm";

export default function EditStaff() {
  const { id } = useParams<{ id: string }>();
  return <StaffForm mode="edit" staffId={id} />;
}