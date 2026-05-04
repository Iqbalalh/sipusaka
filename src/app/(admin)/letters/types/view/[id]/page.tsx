import LetterTypesView from "@/modules/letterTypes/letterTypes.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Template Surat",
};

export default function LetterTypeViewPage({ params }: { params: { id: string } }) {
  return <LetterTypesView letterTypeId={params.id} />;
}
