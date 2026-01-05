"use client";

import { useParams } from "next/navigation";
import WaliForm from "@/components/custom/form/WaliForm";

export default function UpdateWali() {
  const { id } = useParams<{ id: string }>();
  return <WaliForm mode="edit" waliId={id} />;
}