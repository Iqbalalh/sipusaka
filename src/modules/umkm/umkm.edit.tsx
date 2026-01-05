"use client";

import { useParams } from "next/navigation";
import UmkmForm from "@/components/custom/form/UmkmForm";

export default function UpdateUmkm() {
  const { id } = useParams<{ id: string }>();
  return <UmkmForm mode="edit" umkmId={id} />;
}