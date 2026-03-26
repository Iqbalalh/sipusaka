"use client";

import { useParams } from "next/navigation";
import LetterForm from "@/components/custom/form/LetterForm";

export default function EditLetter() {
  const { id } = useParams<{ id: string }>();
  return <LetterForm mode="edit" letterId={id} />;
}
