"use client";

import { useParams } from "next/navigation";
import AlumniForm from "@/components/custom/form/AlumniForm";

export default function UpdateAlumni() {
  const { id } = useParams<{ id: string }>();
  return <AlumniForm mode="edit" alumniId={id} />;
}
