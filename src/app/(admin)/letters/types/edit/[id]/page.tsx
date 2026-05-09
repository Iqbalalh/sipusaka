import LetterTypesForm from "@/modules/letterTypes/letterTypes.form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Template Surat",
};

export default async function LetterTypeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LetterTypesForm mode="edit" letterTypeId={id} />;
}
