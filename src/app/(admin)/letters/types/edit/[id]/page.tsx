import LetterTypesForm from "@/modules/letterTypes/letterTypes.form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Template Surat",
};

export default function LetterTypeEditPage({ params }: { params: { id: string } }) {
  return <LetterTypesForm mode="edit" letterTypeId={params.id} />;
}
