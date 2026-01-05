"use client";

import { useParams } from "next/navigation";
import PartnerForm from "@/components/custom/form/PartnerForm";

export default function UpdatePartner() {
  const { id } = useParams<{ id: string }>();
  return <PartnerForm mode="edit" partnerId={id} />;
}